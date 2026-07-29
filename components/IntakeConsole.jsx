'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Siren, Mic } from 'lucide-react';

const LANGUAGES = [
  { code: 'hi',  label: 'हिंदी',       name: 'Hindi' },
  { code: 'hne', label: 'छत्तीसगढ़ी',  name: 'Chhattisgarhi' },
  { code: 'bho', label: 'भोजपुरी',      name: 'Bhojpuri' },
  { code: 'mr',  label: 'मराठी',        name: 'Marathi' },
  { code: 'en',  label: 'English',      name: 'English' },
];

const SAMPLE_NARRATIVES = [
  { lang: 'hi', text: 'Mere seene mein bahut tez dard ho raha hai, saans lene mein bhi takleef ho rahi hai. Yeh 2 ghante se ho raha hai, bahut ghabra raha hoon.' },
  { lang: 'hi', text: 'Do din se halka bukhar hai, 99-100 degree. Naak beh rahi hai, khansi bhi hai. Baaki thik hoon.' },
  { lang: 'hi', text: 'Meri bacchi ko 3 din se ulti ho rahi hai aur pet mein dard hai. Kuch kha nahi pa rahi. Umar 5 saal hai.' },
  { lang: 'en', text: 'I have a severe headache for the past 6 hours, along with blurred vision and I feel dizzy when I stand up.' },
];

const EMERGENCY_WORDS = [
  'chest pain', 'seene mein dard', 'heart attack', 'dil ka daura',
  'saans nahi', 'behosh', 'unconscious', 'stroke', 'khoon',
  'breathing', 'unresponsive', 'paralysis',
];

function detectLocalEmergency(text) {
  const lower = text.toLowerCase();
  return EMERGENCY_WORDS.some((w) => lower.includes(w));
}

export default function IntakeConsole({ onSubmit, isProcessing }) {
  const [narrative, setNarrative]           = useState('');
  const [language, setLanguage]             = useState('hi');
  const [isListening, setIsListening]       = useState(false);
  const [showBiometrics, setShowBiometrics] = useState(false);
  const [biometrics, setBiometrics]         = useState({ spo2: '', bpm: '', bpSystolic: '', bpDiastolic: '', temperature: '' });
  const [emergencyFlash, setEmergencyFlash] = useState(false);
  const recognitionRef = useRef(null);

  const isEmergency = detectLocalEmergency(narrative);

  function handleNarrativeChange(val) {
    setNarrative(val);
    if (detectLocalEmergency(val)) {
      setEmergencyFlash(true);
      setTimeout(() => setEmergencyFlash(false), 3000);
    }
  }

  function handleBiometric(key, val) {
    setBiometrics((p) => ({ ...p, [key]: val }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!narrative.trim() || isProcessing) return;
    const bm = Object.fromEntries(Object.entries(biometrics).filter(([, v]) => v !== ''));
    onSubmit({
      narrative: narrative.trim(),
      language,
      biometrics: Object.keys(bm).length ? bm : undefined,
    });
  }

  function loadSample() {
    const langSamples = SAMPLE_NARRATIVES.filter((s) => s.lang === language);
    const pool = langSamples.length ? langSamples : SAMPLE_NARRATIVES;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setNarrative(pick.text);
    setLanguage(pick.lang);
  }

  function toggleVoice() {
    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) { loadSample(); return; }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const rec = new SR();
    rec.lang = language === 'en' ? 'en-IN' : 'hi-IN';
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (e) => {
      let t = '';
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      handleNarrativeChange(t);
    };
    rec.onend  = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  }

  const inputCls = 'w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 text-[12px] placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-all font-mono';

  return (
    <div className="intake-form-wrapper">

      {/* Emergency flash banner */}
      <AnimatePresence>
        {emergencyFlash && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-3 flex items-center gap-2.5 rounded-xl border border-red-500/40 bg-red-950/60 px-3.5 py-2.5"
          >
            <div className="shrink-0 text-red-400">
              <Siren size={20} />
            </div>
            <div>
              <p className="font-display text-[12px] font-bold text-red-300">Emergency keyword detected</p>
              <p className="text-[11px] text-red-400/80">Triage will be auto-set to RED. Confirm narrative is correct.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language pills */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLanguage(l.code)}
            className={`rounded-full border px-3 py-1 font-display text-[11px] font-semibold transition-all ${
              language === l.code
                ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold'
                : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-400 hover:border-emerald-500/30 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Narrative textarea */}
        <div className="relative">
          <textarea
            id="narrative-input"
            value={narrative}
            onChange={(e) => handleNarrativeChange(e.target.value)}
            placeholder="Bolein ya type karein... (e.g. Mere seene mein dard ho raha hai)"
            rows={3}
            className={`w-full resize-none rounded-xl border px-4 py-3 font-mono text-[13px] font-medium leading-relaxed transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-0 ${
              isEmergency
                ? 'border-red-500/50 bg-red-50 dark:bg-red-950/30 text-red-950 dark:text-slate-100 focus:border-red-500'
                : 'border-black/15 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/8 shadow-sm'
            }`}
          />
          {!narrative && (
            <span className="clinical-caret pointer-events-none absolute left-4 top-3.5 font-mono text-[13px]" />
          )}
        </div>

        {/* Vitals toggle */}
        <button
          type="button"
          onClick={() => setShowBiometrics((p) => !p)}
          className="flex items-center gap-1.5 self-start rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-1 font-display text-[11px] font-medium text-slate-700 dark:text-slate-400 hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-300 transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          {showBiometrics ? 'Hide' : 'Add'} Vitals (SpO₂, BPM, BP, Temp)
        </button>

        {/* Biometric inputs */}
        <AnimatePresence>
          {showBiometrics && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-3 gap-2 overflow-hidden"
            >
              {[
                { key: 'spo2',        label: 'SpO₂ (%)',  placeholder: '97' },
                { key: 'bpm',         label: 'Heart Rate', placeholder: '78' },
                { key: 'bpSystolic',  label: 'BP Sys',    placeholder: '120' },
                { key: 'bpDiastolic', label: 'BP Dia',    placeholder: '80' },
                { key: 'temperature', label: 'Temp °F',   placeholder: '98.6' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="mono-tag text-slate-600 dark:text-slate-500 block mb-1">{label}</label>
                  <input
                    type="number"
                    step={key === 'temperature' ? '0.1' : '1'}
                    value={biometrics[key]}
                    onChange={(e) => handleBiometric(key, e.target.value)}
                    placeholder={placeholder}
                    className={inputCls}
                  />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleVoice}
            id="voice-input-btn"
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 font-display text-[12px] font-medium transition-all ${
              isListening
                ? 'border-red-500/40 bg-red-950/50 text-red-300'
                : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-400 hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-300'
            }`}
          >
            <span className={`h-2 w-2 rounded-full shrink-0 ${isListening ? 'bg-red-400 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'}`} />
            {isListening ? 'Listening…' : <><Mic size={14} /> Voice</>}
          </button>

          <button
            type="button"
            onClick={loadSample}
            id="load-sample-btn"
            className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-2 font-display text-[12px] font-medium text-slate-700 dark:text-slate-400 hover:border-black/20 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            Sample
          </button>

          <button
            type="submit"
            id="run-triage-btn"
            disabled={isProcessing || !narrative.trim()}
            className={`ml-auto flex items-center gap-2 rounded-lg border px-5 py-2 font-display text-[13px] font-semibold text-white shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
              isEmergency
                ? 'border-red-500 bg-red-600 shadow-red-900/40 hover:bg-red-500'
                : 'border-mint-500/70 bg-mint-600 shadow-mint-900/30 hover:bg-mint-500'
            }`}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
                </svg>
                Analyzing…
              </>
            ) : isEmergency ? <><Siren size={14} /> Emergency →</> : 'Run Triage →'}
          </button>
        </div>
      </form>
    </div>
  );
}
