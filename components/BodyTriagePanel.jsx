'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const HumanBody3D = dynamic(() => import('./HumanBody3D'), { ssr: false });

const REGION_LABELS = {
  head:    'Head / Neck',
  chest:   'Chest / Torso',
  abdomen: 'Abdomen / Back',
  arms:    'Arms / Hands',
  hands:   'Hands / Wrists',
  legs:    'Legs / Feet',
};

export default function BodyTriagePanel({ onRegionConfirm }) {
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  function handleConfirm() {
    if (!selected) return;
    onRegionConfirm?.(selected);
    setStep((s) => Math.min(s + 1, totalSteps));
  }

  function handleSelect(regionId) {
    setSelected(regionId);
  }

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* 3D Body Canvas */}
      <div className="relative rounded-[32px] overflow-hidden body-canvas-wrap bg-white/50">
        <div className="absolute inset-0 body-canvas-bg" />
        <div className="relative h-[400px] lg:h-[460px]">
          <HumanBody3D selectedRegion={selected} onRegionSelect={handleSelect} />
        </div>
        <div className="absolute bottom-4 right-4 pointer-events-none">
          <span className="font-mono text-[10px] tracking-widest uppercase text-slate-400">
            Soft 3D interactive mannequin ┬╖ Body region selection
          </span>
        </div>
      </div>

      {/* Step Card (Claymorphism style) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="clay-card px-7 py-6 relative"
      >
        {/* Pulsing breathing circle micro-animation */}
        <div className="absolute top-6 right-6 flex items-center gap-2.5">
          <span className="font-mono text-[11px] font-medium text-slate-500 tracking-widest uppercase">
            Step {step} of {totalSteps}
          </span>
          <span className="relative flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint-500 opacity-30" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-mint-500" />
          </span>
        </div>

        <h2 className="mt-1 font-display text-[26px] font-semibold text-slate-800 leading-snug">
          Where are you feeling<br />discomfort today?
        </h2>

        {/* Selected region badge */}
        <div className="mt-2 h-7">
          <AnimatePresence>
            {selected && (
              <motion.div
                key={selected}
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.22 }}
                className="inline-flex items-center gap-2 rounded-full border border-mint-200 bg-mint-50 px-3 py-1"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-mint-500 animate-pulse" />
                <span className="font-mono text-[11px] font-medium text-mint-600 uppercase tracking-wider">
                  {REGION_LABELS[selected]} selected
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Choice buttons */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {Object.entries(REGION_LABELS).map(([id, label], i) => (
            <motion.button
              key={id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.35 }}
              onClick={() => setSelected(id === selected ? null : id)}
              className={`
                min-h-[52px] rounded-[16px] border-[1.5px] px-4 py-3
                font-body text-[15px] font-medium transition-all duration-200
                text-center shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-400
                ${id === selected
                  ? 'border-mint-500 bg-mint-50 text-mint-600 shadow-[0_4px_16px_rgba(52,201,142,0.15)]'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-mint-300 hover:bg-slate-50 hover:text-mint-500 hover:-translate-y-[1px]'
                }
              `}
            >
              {label}
            </motion.button>
          ))}
        </div>

        {/* Confirm button */}
        <AnimatePresence>
          {selected && (
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              onClick={handleConfirm}
              className="mt-5 w-full rounded-[14px] bg-mint-500 py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(52,201,142,0.3)] transition-all hover:bg-mint-600 hover:shadow-[0_6px_20px_rgba(52,201,142,0.4)] active:scale-[0.98]"
            >
              Confirm Region ΓåÆ
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
