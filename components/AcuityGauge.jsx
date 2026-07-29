'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Panel from './Panel';
import { getSevConfig } from '@/lib/acuity';

export default function AcuityGauge({ result, isProcessing }) {
  const hasData = !!result;
  const sev = result ? getSevConfig(result.Severity_Color) : null;

  // Map severity to arc fill percentage
  const fillMap = { RED: 1.0, YELLOW: 0.75, GREEN: 0.5, BLUE: 0.25 };
  const fill = result ? (fillMap[result.Severity_Color] ?? 0.25) : 0;
  const circumference = 2 * Math.PI * 56; // r=56
  const dashOffset = circumference * (1 - fill);

  return (
    <Panel
      eyebrow="Panel 03"
      title="Severity Index"
      statusDot={sev?.color ?? '#34C98E'}
      accentColor={sev?.color}
      className="h-full"
    >
      {!hasData && !isProcessing && (
        <p className="text-[13px] leading-relaxed text-slate-500">
          MedGemma will assign a severity level (RED/YELLOW/GREEN/BLUE) based on extracted symptoms and vital signs.
        </p>
      )}

      {isProcessing && (
        <div className="flex flex-col items-center justify-center py-6 gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="h-12 w-12 rounded-full border-4 border-white/5 border-t-mint-400"
          />
          <p className="mono-tag text-slate-600">Analyzing…</p>
        </div>
      )}

      <AnimatePresence>
        {hasData && sev && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center py-2"
          >
            {/* Arc gauge */}
            <div className="relative flex items-center justify-center mb-4">
              <svg className="w-36 h-36 transform -rotate-90">
                <circle cx="72" cy="72" r="56" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                <motion.circle
                  cx="72" cy="72" r="56"
                  fill="none"
                  stroke={sev.color}
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference}
                  animate={{ strokeDashoffset: dashOffset }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <sev.icon size={32} strokeWidth={1.5} />
                <span className="font-mono text-[11px] font-bold tracking-widest mt-1" style={{ color: sev.color }}>
                  {result.Severity_Color}
                </span>
              </div>
            </div>

            {/* Label */}
            <h3 className={`font-display text-lg font-bold text-center ${sev.textStrong}`}>
              {sev.label}
            </h3>
            <p className="mt-1.5 text-[12px] text-center text-slate-500 leading-relaxed">
              {sev.description}
            </p>

            {/* Severity scale */}
            <div className="mt-5 w-full grid grid-cols-4 gap-1.5">
              {['RED','YELLOW','GREEN','BLUE'].map((c) => {
                const cs = getSevConfig(c);
                const isActive = c === result.Severity_Color;
                return (
                  <div
                    key={c}
                    className={`flex flex-col items-center gap-1 rounded-xl border py-2 transition-all ${
                      isActive ? `${cs.border} ${cs.bg}` : 'border-white/5 bg-white/3'
                    }`}
                  >
                    <cs.icon size={20} strokeWidth={1.5} />
                    <span className={`mono-tag ${isActive ? cs.text : 'text-slate-700'}`}>{c}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Panel>
  );
}
