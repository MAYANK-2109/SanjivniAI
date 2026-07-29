'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Ambulance, Building2, Stethoscope, Smartphone, HeartPulse, Phone } from 'lucide-react';
import { getSevConfig } from '@/lib/acuity';

export default function TriageResult({ result, isProcessing, onSOS, onFindCare, onTelehealth, onBookAmbulance }) {
  if (!result && !isProcessing) return null;

  const sev = result ? getSevConfig(result.Severity_Color) : null;

  return (
    <AnimatePresence>
      {(result || isProcessing) && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="w-full mt-2 mb-4"
        >
          {isProcessing && !result && (
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/5">
              <div className="relative shrink-0">
                <div className="h-10 w-10 rounded-full bg-white/10 skeleton" />
              </div>
              <div className="flex-1 space-y-2.5">
                <div className="h-3 w-1/3 rounded bg-white/10 skeleton" />
                <div className="h-2 w-3/4 rounded bg-white/10 skeleton" />
              </div>
            </div>
          )}

          {result && sev && (
            <div 
              className="relative overflow-hidden rounded-2xl border"
              style={{ 
                borderColor: sev.color,
                background: `linear-gradient(180deg, ${sev.color}15 0%, var(--bg-card) 100%)`
              }}
            >
              {/* Header row */}
              <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: `${sev.color}30`, background: `${sev.color}10` }}>
                <div 
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 shadow-sm ${sev.bg}`}
                >
                  <sev.icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-[15px] font-bold leading-tight" style={{ color: sev.color }}>
                    {sev.action}
                  </h3>
                  <p className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: sev.color, opacity: 0.8 }}>
                    SEVERITY: {result.Severity_Color}
                  </p>
                </div>
                {result.Severity_Color === 'RED' && (
                  <div className="shrink-0 text-red-500 animate-pulse">
                    <HeartPulse size={18} />
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-4 space-y-4">
                
                {/* Specialization */}
                <div className="flex items-center gap-2">
                  <Stethoscope size={14} className="text-slate-400" />
                  <p className="text-[12.5px] text-slate-300">
                    Routing to: <span className="font-semibold text-slate-100">{result.Required_Specialization}</span>
                  </p>
                </div>

                {/* Patient Communication */}
                <div className="rounded-xl border border-white/5 bg-black/20 p-4 shadow-inner relative">
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                     <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                     <span className="text-[9px] font-mono font-bold text-blue-400 uppercase tracking-wider">MedGemma 27B</span>
                  </div>
                  <p className="font-mono text-[10px] text-slate-500 mb-2 uppercase tracking-wide">
                    Clinical Advice
                  </p>
                  <p className="text-[13.5px] leading-relaxed text-slate-200 font-medium whitespace-pre-wrap">
                    {result.Patient_Communication}
                  </p>
                </div>

                {/* Immediate Actions */}
                {result.Immediate_Actions?.length > 0 && (
                  <div>
                    <p className="font-mono text-[10px] text-slate-500 mb-2 uppercase tracking-wide">Next Steps</p>
                    <ul className="space-y-1.5">
                      {result.Immediate_Actions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12.5px] text-slate-300">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: sev.color }} />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                  {result.Severity_Color === 'RED' && (
                    <>
                      <button
                        onClick={onSOS}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-display text-[13px] font-bold text-white hover:bg-red-500 transition-all shadow-lg shadow-red-900/30"
                      >
                        <Phone size={15} /> Call 112 SOS
                      </button>
                      <button
                        onClick={onBookAmbulance}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 font-display text-[13px] font-bold text-white hover:bg-orange-500 transition-all shadow-lg shadow-orange-900/30"
                      >
                        <Ambulance size={15} /> Book Ambulance
                      </button>
                    </>
                  )}
                  {(result.Severity_Color === 'RED' || result.Severity_Color === 'YELLOW') && (
                    <button
                      onClick={() => onFindCare('hospital')}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 font-display text-[13px] font-semibold text-white transition-all ${sev.ctaClass}`}
                    >
                      <Building2 size={15} /> Find Hospital
                    </button>
                  )}
                  {(result.Severity_Color === 'GREEN' || result.Severity_Color === 'BLUE') && (
                    <>
                      <button
                        onClick={() => onFindCare('clinic')}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 font-display text-[13px] font-semibold text-white transition-all ${sev.ctaClass}`}
                      >
                        <Stethoscope size={15} /> Find Specialist
                      </button>
                      <button
                        onClick={onTelehealth}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-display text-[13px] font-semibold text-slate-300 hover:bg-white/10 transition-all"
                      >
                        <Smartphone size={15} /> Telehealth
                      </button>
                    </>
                  )}
                </div>
                
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
