'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Panel from './Panel';

function Chip({ children, delay = 0, tone = 'cerulean' }) {
  const styles = {
    cerulean: 'border-cerulean-500/30 bg-cerulean-950/40 text-cerulean-300',
    red:      'border-red-500/40 bg-red-950/40 text-red-300',
    mint:     'border-mint-500/30 bg-mint-950/40 text-mint-300',
    slate:    'border-white/10 bg-white/5 text-slate-400',
  };
  const dots = { cerulean: 'bg-cerulean-400', red: 'bg-red-400', mint: 'bg-mint-400', slate: 'bg-slate-500' };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.82 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3, ease: 'easeOut' }}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] font-medium ${styles[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dots[tone]}`} />
      {children}
    </motion.span>
  );
}

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="mono-tag text-slate-600 mb-1">{label}</p>
      <p className="font-display text-[14px] font-medium text-slate-200">{value}</p>
    </div>
  );
}

export default function EntityPanel({ result, isProcessing }) {
  const hasData = !!result;

  return (
    <Panel eyebrow="Panel 02" title="Clinical Entity Extraction" statusDot="#4DA6D9" accentColor="#4DA6D9" className="h-full">

      {!hasData && !isProcessing && (
        <p className="text-[13px] leading-relaxed text-slate-500">
          Awaiting patient narrative — extracted symptoms, duration, pain level, and red flags will populate here after triage.
        </p>
      )}

      {isProcessing && (
        <div className="space-y-4 mt-1">
          <div className="space-y-2">
            <div className="h-3 w-28 rounded skeleton" />
            <div className="flex gap-2 flex-wrap">
              {[80, 64, 96, 72].map((w, i) => (
                <div key={i} className="h-7 rounded-full skeleton" style={{ width: w }} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-14 rounded-xl skeleton" />
            <div className="h-14 rounded-xl skeleton" />
          </div>
        </div>
      )}

      <AnimatePresence>
        {hasData && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
            className="space-y-5 mt-1"
          >
            {/* Symptoms */}
            {result.Extracted_Symptoms?.length > 0 && (
              <div>
                <p className="mono-tag text-slate-500 mb-2">Symptoms Detected</p>
                <div className="flex flex-wrap gap-2">
                  {result.Extracted_Symptoms.map((s, i) => (
                    <Chip key={s} delay={i * 0.08} tone="cerulean">{s}</Chip>
                  ))}
                </div>
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/5 bg-white/3 p-4">
              <InfoRow label="Duration" value={result.Estimated_Duration} />
              <InfoRow
                label="Pain Level"
                value={result.Pain_Level_Estimate > 0 ? `${result.Pain_Level_Estimate} / 10` : 'Not reported'}
              />
            </div>

            {/* Red flags */}
            {result.Red_Flags_Detected?.length > 0 && (
              <div>
                <p className="mono-tag text-red-500/80 mb-2">⚑ Red Flags</p>
                <div className="flex flex-wrap gap-2">
                  {result.Red_Flags_Detected.map((f, i) => (
                    <Chip key={f} tone="red" delay={i * 0.1}>{f}</Chip>
                  ))}
                </div>
              </div>
            )}

            {/* Clinical reasoning (collapsible) */}
            {result.Clinical_Reasoning && (
              <details className="group">
                <summary className="mono-tag text-slate-500 cursor-pointer hover:text-slate-300 transition-colors list-none flex items-center gap-1.5">
                  <svg className="h-3 w-3 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="currentColor"><path d="M9 18l6-6-6-6"/></svg>
                  Clinical Reasoning (AI Internal)
                </summary>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-500 border-l-2 border-white/10 pl-3 font-mono">
                  {result.Clinical_Reasoning}
                </p>
              </details>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Panel>
  );
}
