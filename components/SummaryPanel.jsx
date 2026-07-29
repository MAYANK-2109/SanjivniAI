'use client';

import { motion } from 'framer-motion';
import { Languages, FileText } from 'lucide-react';
import Panel from './Panel';

export default function SummaryPanel({ result, isProcessing }) {
  const hasData = !!result;

  // Build a simple bilingual summary from the triage result fields
  const englishSummary = result
    ? [
        `Severity: ${result.Severity_Color} (${result.Recommended_Action}).`,
        `Specialization: ${result.Required_Specialization}.`,
        result.Extracted_Symptoms?.length
          ? `Reported symptoms: ${result.Extracted_Symptoms.join(', ')}.`
          : '',
        result.Estimated_Duration && result.Estimated_Duration !== 'Unknown'
          ? `Duration: ${result.Estimated_Duration}.`
          : '',
        result.Red_Flags_Detected?.length
          ? `Red flags: ${result.Red_Flags_Detected.join(', ')}.`
          : '',
        `Clinical note: ${result.Clinical_Reasoning}`,
      ]
        .filter(Boolean)
        .join(' ')
    : '';

  const localSummary = result?.Patient_Communication ?? '';

  return (
    <Panel eyebrow="Panel 05" title="Bilingual Clinical Summary" statusDot="#4DA6D9" accentColor="#4DA6D9" className="h-full">

      {!hasData && !isProcessing && (
        <p className="text-[13px] leading-relaxed text-slate-500">
          After triage, a bilingual clinical summary for the provider (English) and patient (regional language) will appear here.
        </p>
      )}

      {isProcessing && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-2 rounded-2xl border border-white/5 bg-white/3 p-4">
              <div className="h-3 w-24 rounded skeleton" />
              <div className="h-3 w-full rounded skeleton" />
              <div className="h-3 w-5/6 rounded skeleton" />
              <div className="h-3 w-4/6 rounded skeleton" />
            </div>
          ))}
        </div>
      )}

      {hasData && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {/* English */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
            <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-2">
              <span className="text-slate-400"><FileText size={16} /></span>
              <span className="font-display text-[13px] font-semibold text-slate-200">English Clinical Summary</span>
            </div>
            <p className="font-body text-[13px] leading-relaxed text-slate-400 whitespace-pre-wrap">
              {englishSummary || '—'}
            </p>
          </div>

          {/* Local language */}
          <div className="rounded-2xl border border-cerulean-500/20 bg-cerulean-950/20 p-5">
            <div className="mb-3 flex items-center gap-2 border-b border-cerulean-500/15 pb-2">
              <span className="text-cerulean-400"><Languages size={16} /></span>
              <span className="font-display text-[13px] font-semibold text-cerulean-300">Patient Language (Regional)</span>
            </div>
            <p className="font-body text-[14px] leading-relaxed text-slate-200 whitespace-pre-wrap font-medium">
              {localSummary || '—'}
            </p>
          </div>
        </motion.div>
      )}
    </Panel>
  );
}
