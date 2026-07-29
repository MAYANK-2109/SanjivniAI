'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AmbulanceModal({ isOpen, onClose, severityColor }) {
  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="sos-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-red-500/40 bg-obsidian-card shadow-2xl shadow-red-900/30"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Red pulsing top bar */}
            <div className="h-1.5 w-full animate-sev-pulse-red" style={{ background: 'linear-gradient(90deg, #7f1d1d, #ef4444, #7f1d1d)' }} />

            <div className="p-6">
              {/* Header */}
              <div className="mb-5 flex items-center gap-4">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-red-500 bg-red-950 sev-ring-red">
                  <span className="text-3xl">🚑</span>
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-red-300">Emergency SOS</h2>
                  <p className="text-[13px] text-red-400/70">Severity: {severityColor ?? 'RED'} — Critical</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="mb-5 rounded-xl border border-red-500/20 bg-red-950/30 p-4 space-y-2">
                <p className="font-display text-[15px] font-semibold text-slate-100">Do this RIGHT NOW:</p>
                <ul className="space-y-2 text-[13px] text-slate-300">
                  {[
                    '📞 Call 112 (National Emergency) immediately',
                    '🛏 Lie down flat — do not move unnecessarily',
                    '🧥 Loosen tight clothing around chest/neck',
                    '❌ Do not eat or drink anything',
                    '👥 Send someone to wait outside for the ambulance',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0 text-[16px]">{step.split(' ')[0]}</span>
                      <span>{step.slice(step.indexOf(' ') + 1)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-3">
                <a
                  href="tel:112"
                  id="call-112-btn"
                  className="flex items-center justify-center gap-3 rounded-xl border border-red-500 bg-red-600 py-3 font-display text-base font-bold text-white shadow-lg shadow-red-900/50 hover:bg-red-500 active:scale-95 transition-all"
                >
                  📞 Call 112 — National Emergency
                </a>
                <a
                  href="tel:108"
                  id="call-108-btn"
                  className="flex items-center justify-center gap-3 rounded-xl border border-red-400/40 bg-red-950/40 py-2.5 font-display text-[14px] font-semibold text-red-300 hover:bg-red-900/40 active:scale-95 transition-all"
                >
                  🚑 Call 108 — Ambulance Service
                </a>
                <button
                  onClick={onClose}
                  id="close-sos-modal-btn"
                  className="rounded-xl border border-white/10 py-2.5 font-display text-[13px] text-slate-500 hover:text-slate-300 hover:border-white/20 transition-all"
                >
                  Close
                </button>
              </div>

              {/* Disclaimer */}
              <p className="mt-4 text-[11px] text-center text-slate-600 font-mono leading-relaxed">
                Sanjeevani is an AI triage assistant — not a substitute for emergency services.<br/>
                In any life-threatening situation, call emergency services immediately.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
