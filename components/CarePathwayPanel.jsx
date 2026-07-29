'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Panel from './Panel';
import { getSevConfig } from '@/lib/acuity';

export default function CarePathwayPanel({ result, isProcessing }) {
  const hasData = !!result;
  const sev = result ? getSevConfig(result.Severity_Color) : null;

  return (
    <Panel eyebrow="Panel 04" title="Care Pathway" statusDot="#34C98E" accentColor="#34C98E" className="h-full">

      {!hasData && !isProcessing && (
        <p className="text-[13px] leading-relaxed text-slate-500">
          Recommended care pathway, specialization routing, and immediate action steps will appear after triage is complete.
        </p>
      )}

      {isProcessing && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl skeleton shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded skeleton" />
              <div className="h-3 w-1/2 rounded skeleton" />
            </div>
          </div>
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-3 rounded skeleton" style={{ width: `${90 - i*12}%` }} />)}
          </div>
        </div>
      )}

      <AnimatePresence>
        {hasData && sev && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {/* Directive header */}
            <div className={`flex items-start gap-3 rounded-2xl border p-4 ${sev.bg} ${sev.border}`}>
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                style={{ background: `${sev.color}20`, border: `1px solid ${sev.color}40` }}
              >
                {sev.emoji}
              </div>
              <div>
                <h3 className={`font-display text-[16px] font-bold ${sev.textStrong}`}>
                  {sev.action}
                </h3>
                <p className={`mt-0.5 text-[12px] font-mono ${sev.text}`}>
                  {result.Severity_Color} — {result.Required_Specialization}
                </p>
              </div>
            </div>

            {/* Recommended action */}
            <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
              <p className="mono-tag text-slate-500 mb-1.5">Recommended Action</p>
              <p className="text-[14px] text-slate-200 font-medium">{result.Recommended_Action}</p>
            </div>

            {/* Immediate steps */}
            {result.Immediate_Actions?.length > 0 && (
              <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
                <p className="mono-tag text-slate-500 mb-3">Immediate Steps</p>
                <ul className="space-y-2">
                  {result.Immediate_Actions.map((action, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-2.5 text-[13px] text-slate-300"
                    >
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: sev.color }}
                      />
                      {action}
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Panel>
  );
}
