/**
 * app/api/triage/route.js
 * Core triage API — MedGemma-27B via HF Inference (chat completions) → Gemini fallback → Mock data fallback.
 *
 * Fixes applied:
 *  1. Uses HF /v1/chat/completions endpoint (correct for instruction-tuned models)
 *  2. Tries multiple Gemini model names (gemini-1.5-flash, gemini-2.0-flash, gemini-pro)
 *  3. Logs all errors verbosely to console so server logs show exactly what failed
 *  4. env var loading verified at request time (not module scope) for Next.js compatibility
 */

import { NextResponse } from 'next/server';
import { SANJEEVANI_SYSTEM_PROMPT } from '@/lib/systemPrompt';
import { getDatabase } from '@/lib/mongodb';

// ── Emergency keyword detection (force RED) ────────────────────────
const EMERGENCY_PATTERNS = [
  /chest\s*pain/i,
  /heart\s*attack/i, /dil\s*ka\s*daura/i, /dil\s*mein\s*dard/i,
  /stroke/i, /brain\s*attack/i,
  /unconscious/i, /behosh/i, /hosh\s*nahi/i,
  /not\s*breathing/i, /saans\s*nahi/i,
  /severe\s*bleed/i, /bahut\s*khoon/i,
  /difficulty\s*breathing/i, /saans\s*lene\s*mein\s*takleef/i,
  /respiratory\s*distress/i,
  /unresponsive/i,
  /paralysis/i, /lakwa/i,
  /severe\s*head(ache)?/i, /sar\s*mein\s*bahut\s*tez\s*dard/i,
];

function detectEmergency(text) {
  return EMERGENCY_PATTERNS.some((re) => re.test(text));
}

// ── Build the user message from inputs ─────────────────────────────
function buildUserMessage({ narrative, language, biometrics, bodyRegion }) {
  let msg = `Patient complaint (language: ${language || 'auto-detect'}):\n${narrative}`;

  if (biometrics) {
    const b = biometrics;
    const bLines = [];
    if (b.spo2)        bLines.push(`SpO2: ${b.spo2}%`);
    if (b.bpm)         bLines.push(`Heart Rate: ${b.bpm} BPM`);
    if (b.bpSystolic && b.bpDiastolic)
                       bLines.push(`Blood Pressure: ${b.bpSystolic}/${b.bpDiastolic} mmHg`);
    if (b.temperature) bLines.push(`Temperature: ${b.temperature}°F`);
    if (bLines.length) msg += `\n\nVital Signs:\n${bLines.join('\n')}`;
  }

  if (bodyRegion) {
    msg += `\n\nAffected body region reported by patient: ${bodyRegion}`;
  }

  msg += '\n\nRespond ONLY with a valid JSON object matching the schema exactly. No markdown, no prose outside the JSON.';
  return msg;
}

// ── MedGemma via HF Inference Chat Completions API ────────────────
// Uses /v1/chat/completions — correct endpoint for instruction-tuned models
async function callMedGemma(userMessage) {
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) throw new Error('HF_TOKEN not set in environment');

  console.log('[Sanjeevani] Attempting HF MedGemma-27B call...');

  const response = await fetch(
    'https://api-inference.huggingface.co/models/yuxinlu1/gemma-4-12B-agentic-fable5-composer2.5-v2-3.5x-tau2-GGUF/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'yuxinlu1/gemma-4-12B-agentic-fable5-composer2.5-v2-3.5x-tau2-GGUF',
        messages: [
          { role: 'system', content: SANJEEVANI_SYSTEM_PROMPT },
          { role: 'user',   content: userMessage },
        ],
        max_tokens: 1200,
        temperature: 0.2,
        stream: false,
      }),
      signal: AbortSignal.timeout(60000), // 60s — 27B text model can be slow on cold start
    }
  );

  const responseText = await response.text();
  console.log(`[Sanjeevani] HF response status: ${response.status}`);

  if (!response.ok) {
    throw new Error(`HF API error ${response.status}: ${responseText.slice(0, 300)}`);
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(`HF API returned non-JSON: ${responseText.slice(0, 200)}`);
  }

  // OpenAI-compatible response format
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error(`HF returned empty content. Full response: ${JSON.stringify(data).slice(0, 300)}`);

  console.log('[Sanjeevani] HF gemma-4-12B-agentic response received ✓');
  return content;
}

// ── Gemini fallback — tries multiple model names ───────────────────
const GEMINI_MODELS_TO_TRY = [
  'gemini-2.5-flash',          // Primary: user-specified
  'gemini-2.5-flash-preview-05-20', // Alias fallback
  'gemini-1.5-flash',          // Stable fallback
  'gemini-1.5-flash-latest',   // Latest stable
];

async function callGemini(userMessage) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new Error('GEMINI_API_KEY not set in environment');

  // Basic key format validation — Gemini keys start with AIza
  if (!geminiKey.startsWith('AIza')) {
    throw new Error(
      `GEMINI_API_KEY appears invalid (should start with "AIza", got "${geminiKey.slice(0, 8)}..."). ` +
      'Get a valid key at https://aistudio.google.com/app/apikey'
    );
  }

  console.log('[Sanjeevani] Attempting Gemini fallback...');

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(geminiKey);

  let lastErr = null;
  for (const modelName of GEMINI_MODELS_TO_TRY) {
    try {
      console.log(`[Sanjeevani] Trying Gemini model: ${modelName}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SANJEEVANI_SYSTEM_PROMPT,
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      });

      const result = await model.generateContent(userMessage);
      const text = result.response.text();
      console.log(`[Sanjeevani] Gemini ${modelName} response received ✓`);
      return { text, model: modelName };
    } catch (err) {
      console.warn(`[Sanjeevani] Gemini ${modelName} failed: ${err.message}`);
      lastErr = err;

      // If it's a quota/rate-limit error on this model, try the next
      const isQuota = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED');
      if (!isQuota) throw err; // non-quota errors propagate immediately
    }
  }

  throw lastErr ?? new Error('All Gemini models exhausted');
}

// ── Parse JSON from model output ───────────────────────────────────
function parseTriageJSON(raw) {
  // Strip markdown code fences if model wrapped in ```json ... ```
  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`No JSON object found in model output. Raw: ${raw.slice(0, 200)}`);
  return JSON.parse(match[0]);
}

// ── Mock fallback data ─────────────────────────────────────────────
function getMockData(narrative, isEmergency) {
  if (isEmergency) {
    return {
      Severity_Color: 'RED',
      Recommended_Action: 'Hospital+Ambulance',
      Required_Specialization: 'Emergency Medicine / Cardiologist',
      Clinical_Reasoning: 'Emergency keywords detected. Forced RED triage per safety protocol. Note: AI models are currently offline.',
      Patient_Communication: 'Aapki halat bahut gambhir lag rahi hai. Abhi turant ambulance bulao — 112 pe call karo. \n\n[WARNING: AI is currently unavailable. This is an automated safety alert.]',
      Immediate_Actions: ['Abhi 112 call karein', 'Seedha let jao'],
      Red_Flags_Detected: ['Emergency symptom detected'],
      Extracted_Symptoms: ['Critical symptom'],
      Estimated_Duration: 'Unknown',
      Pain_Level_Estimate: 8,
      _source: 'mock_emergency',
    };
  }
  return {
    Severity_Color: 'YELLOW',
    Recommended_Action: 'Doctor Only',
    Required_Specialization: 'General Physician',
    Clinical_Reasoning: 'AI models are currently unavailable due to high traffic or connectivity issues.',
    Patient_Communication: '⚠️ Warning: AI triage is currently unavailable. Please connect to available doctors from the options below for a live consultation.',
    Immediate_Actions: ['Connect with an available doctor below'],
    Red_Flags_Detected: [],
    Extracted_Symptoms: narrative.split(' ').slice(0, 3),
    Estimated_Duration: 'Unknown',
    Pain_Level_Estimate: 3,
    _source: 'ai_unavailable_warning',
  };
}

// ── Main handler ───────────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const { narrative, language, biometrics, bodyRegion } = body;

    if (!narrative?.trim()) {
      return NextResponse.json({ error: 'Narrative is required.' }, { status: 400 });
    }

    // Log env var presence (not values) for debugging
    const hfPresent = !!process.env.HF_TOKEN;
    const geminiPresent = !!process.env.GEMINI_API_KEY;
    console.log(`[Sanjeevani] Env: HF_TOKEN=${hfPresent} | GEMINI_API_KEY=${geminiPresent}`);
    console.log(`[Sanjeevani] Models: HF=yuxinlu1/gemma-4-12B-agentic-fable5-composer2.5-v2-3.5x-tau2-GGUF | Gemini=gemini-2.5-flash`);

    const isEmergency = detectEmergency(narrative);

    // Check critical biometrics
    const bm = biometrics || {};
    const bioCritical =
      (bm.spo2 && Number(bm.spo2) < 90) ||
      (bm.bpm  && (Number(bm.bpm) > 130 || Number(bm.bpm) < 40)) ||
      (bm.bpSystolic && (Number(bm.bpSystolic) > 180 || Number(bm.bpSystolic) < 90));

    const forceRed = isEmergency || bioCritical;

    const userMessage = buildUserMessage({ narrative, language, biometrics, bodyRegion });
    let raw = null;
    let source = 'unknown';
    let geminiModel = null;

    // 1. Try MedGemma via HF
    try {
      raw = await callMedGemma(userMessage);
      source = 'medgemma-27b';
    } catch (hfErr) {
      console.warn('[Sanjeevani] ❌ HF MedGemma failed:', hfErr.message);

      // 2. Try Gemini fallback
      try {
        const geminiResult = await callGemini(userMessage);
        raw = geminiResult.text;
        geminiModel = geminiResult.model;
        source = `gemini/${geminiModel}`;
      } catch (geminiErr) {
        console.warn('[Sanjeevani] ❌ All Gemini models failed:', geminiErr.message);

        // 3. Mock fallback
        const mock = getMockData(narrative, forceRed);
        return NextResponse.json({
          ...mock,
          ambulance_triggered: forceRed,
          _debug: {
            hf_error: hfErr.message.slice(0, 200),
            gemini_error: geminiErr.message.slice(0, 200),
          },
        });
      }
    }

    let parsed;
    try {
      parsed = parseTriageJSON(raw);
    } catch (parseErr) {
      console.warn('[Sanjeevani] ❌ JSON parse failed:', parseErr.message, '| Raw:', raw?.slice(0, 300));
      const mock = getMockData(narrative, forceRed);
      return NextResponse.json({ ...mock, ambulance_triggered: forceRed });
    }

    // Safety override: emergency always stays RED
    if (forceRed) {
      parsed.Severity_Color = 'RED';
      parsed.Recommended_Action = 'Hospital+Ambulance';
    }

    const finalResult = {
      ...parsed,
      _source: source,
      ambulance_triggered: parsed.Severity_Color === 'RED',
    };

    // Asynchronously save to MongoDB
    getDatabase().then(db => {
      if (db) {
        db.collection('triage_history').insertOne({
          timestamp: new Date(),
          request: { narrative, language, biometrics, bodyRegion },
          result: finalResult
        }).catch(e => console.warn('MongoDB insert failed:', e.message));
      }
    }).catch(e => console.warn('MongoDB connection failed:', e.message));

    return NextResponse.json(finalResult);
  } catch (err) {
    console.error('[Sanjeevani] Triage API fatal error:', err);
    return NextResponse.json({ error: 'Internal server error.', detail: err.message }, { status: 500 });
  }
}
