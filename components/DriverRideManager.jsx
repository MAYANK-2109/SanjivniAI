'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ambulance, MapPin, Phone, CheckCircle, XCircle,
  Clock, Activity, Heart, Navigation, User, Zap
} from 'lucide-react';

const CONDITION_COLORS = {
  RED: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', text: '#EF4444', label: 'CRITICAL' },
  YELLOW: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', text: '#F59E0B', label: 'URGENT' },
  GREEN: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', text: '#10B981', label: 'STABLE' },
};

function DriverRideNotification({ ride, onAccept, onDecline }) {
  const [timeLeft, setTimeLeft] = useState(45); // 45s to respond
  const condColor = CONDITION_COLORS.RED;

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(t);
          onDecline('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [onDecline]);

  const urgencyPct = (timeLeft / 45) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="fixed top-4 right-4 z-[80] w-80 overflow-hidden rounded-2xl shadow-2xl"
      style={{ background: '#0D1016', border: `1px solid ${condColor.border}` }}
    >
      {/* Urgency progress bar */}
      <div className="h-1 w-full bg-white/5">
        <motion.div
          className="h-full bg-red-500"
          animate={{ width: `${urgencyPct}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: condColor.bg, borderBottom: `1px solid ${condColor.border}` }}>
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600"
          >
            <Ambulance size={14} className="text-white" />
          </motion.div>
          <div>
            <p className="font-display text-[13px] font-bold text-white">New Ride Request</p>
            <p className="font-mono text-[9px] uppercase tracking-wider" style={{ color: condColor.text }}>{condColor.label} PATIENT</p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-[20px] font-black text-white">{timeLeft}s</div>
          <p className="font-mono text-[9px] text-slate-500">to respond</p>
        </div>
      </div>

      {/* Ride details */}
      <div className="p-4 space-y-3">
        {/* Patient */}
        <div className="flex items-center gap-2">
          <User size={13} className="text-slate-400 shrink-0" />
          <div>
            <p className="font-display text-[13px] font-semibold text-white">{ride.patient.name}</p>
            <p className="text-[11px] text-slate-400">{ride.patient.condition}</p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2">
          <MapPin size={13} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-[12px] text-slate-300">{ride.patient.location || 'Current GPS Location'}</p>
        </div>

        {/* Ride meta */}
        <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 flex justify-between items-center">
          <div>
            <p className="font-mono text-[9px] text-slate-500 uppercase">Tier</p>
            <p className="font-display text-[13px] font-bold text-white">{ride.tier.short} · {ride.tier.label}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[9px] text-slate-500 uppercase">Fare</p>
            <p className="font-display text-[18px] font-black text-white">₹{ride.fare.toLocaleString()}</p>
          </div>
        </div>

        {/* Accept / Decline */}
        <div className="flex gap-2">
          <button
            onClick={() => onDecline('manual')}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 font-display text-[12px] font-semibold text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all active:scale-95"
          >
            <XCircle size={14} />
            Decline
          </button>
          <button
            onClick={onAccept}
            className="flex-[2] flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 font-display text-[13px] font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/40 transition-all active:scale-95"
          >
            <CheckCircle size={14} />
            Accept
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ActiveRidePanel({ ride, onComplete }) {
  const [elapsed, setElapsed] = useState(0);
  const [rideStatus, setRideStatus] = useState('heading_to_patient'); // heading_to_patient | arrived | trip_started | completed

  const STATUS_STEPS = [
    { key: 'heading_to_patient', label: 'En Route to Patient', icon: <Navigation size={14} />, color: '#F59E0B', action: "I've Arrived" },
    { key: 'arrived', label: 'Arrived at Location', icon: <MapPin size={14} />, color: '#06B6D4', action: 'Start Trip' },
    { key: 'trip_started', label: 'Trip in Progress', icon: <Activity size={14} />, color: '#EF4444', action: 'Complete Trip' },
    { key: 'completed', label: 'Trip Completed', icon: <CheckCircle size={14} />, color: '#10B981', action: null },
  ];

  const statusOrder = STATUS_STEPS.map(s => s.key);
  const currentIdx = statusOrder.indexOf(rideStatus);
  const current = STATUS_STEPS[currentIdx];

  useEffect(() => {
    const t = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  function formatElapsed(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function advanceStatus() {
    const next = statusOrder[currentIdx + 1];
    if (next) setRideStatus(next);
    if (next === 'completed') setTimeout(() => onComplete(), 1500);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/3 overflow-hidden">
      {/* Status banner */}
      <div className="px-4 py-3 flex items-center gap-2.5" style={{ background: `${current.color}18`, borderBottom: `1px solid ${current.color}30` }}>
        <span style={{ color: current.color }}>{current.icon}</span>
        <p className="font-display text-[13px] font-semibold" style={{ color: current.color }}>{current.label}</p>
        <div className="ml-auto flex items-center font-mono text-[12px] text-slate-400">
          <Clock size={12} className="mr-1" /> {formatElapsed(elapsed)}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Progress stepper */}
        <div className="flex items-center gap-0">
          {STATUS_STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center flex-1">
              <div className={`h-2 w-2 rounded-full flex-shrink-0 transition-all ${i <= currentIdx ? 'scale-125' : 'opacity-30'}`}
                style={{ background: i <= currentIdx ? s.color : '#fff' }} />
              {i < STATUS_STEPS.length - 1 && (
                <div className="flex-1 h-px mx-1 transition-all" style={{ background: i < currentIdx ? '#10B981' : 'rgba(255,255,255,0.1)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Patient details mini-card */}
        <div className="flex items-center gap-3 rounded-xl bg-black/20 border border-white/5 px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600/20 text-red-400">
            <Heart size={16} />
          </div>
          <div className="flex-1">
            <p className="font-display text-[13px] font-semibold text-white">{ride.patient.name}</p>
            <p className="text-[11px] text-slate-400">{ride.patient.condition}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] text-slate-500">Fare</p>
            <p className="font-display text-[15px] font-black text-white">₹{ride.fare.toLocaleString()}</p>
          </div>
        </div>

        {/* Action button */}
        {current.action && (
          <button
            onClick={advanceStatus}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-display text-[14px] font-bold text-white transition-all active:scale-95 shadow-lg"
            style={{ background: current.color, boxShadow: `0 4px 20px ${current.color}40` }}
          >
            {current.action}
          </button>
        )}
        {rideStatus === 'completed' && (
          <div className="text-center py-2">
            <p className="font-display text-[14px] font-semibold text-emerald-400 flex items-center justify-center gap-1.5"><CheckCircle size={16} /> Trip Completed! Well done.</p>
            <p className="text-[11px] text-slate-400 mt-1">Fare of ₹{ride.fare.toLocaleString()} will be credited within 24h</p>
          </div>
        )}

        {/* Emergency contact */}
        <a href="tel:112" className="flex items-center justify-center gap-2 text-[12px] text-slate-500 hover:text-red-400 transition-colors py-1">
          <Phone size={13} />
          Emergency: Call 112
        </a>
      </div>
    </div>
  );
}

/**
 * DriverRideManager — drop this anywhere on the driver dashboard.
 * Listens to localStorage events from the patient booking flow.
 */
export default function DriverRideManager({ onActiveRideChange }) {
  const [incomingRide, setIncomingRide] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [lastCompletedId, setLastCompletedId] = useState(null);

  // Expose active ride to parent dashboard with mapped dashboard properties
  useEffect(() => {
    if (onActiveRideChange) {
      if (!activeRide) {
        onActiveRideChange(null);
      } else {
        onActiveRideChange({
          ...activeRide,
          caseId: activeRide._id ? `CAS-${activeRide._id.substring(18, 24).toUpperCase()}` : 'CAS-9921',
          patientName: activeRide.patient?.name || 'Unknown Patient',
          age: 45,
          gender: 'Male',
          condition: activeRide.patient?.condition || 'Medical Emergency',
          acuityScore: activeRide.tier?.id === 'als' ? 88 : 45,
          severity: activeRide.tier?.id === 'als' ? 'RED' : 'YELLOW',
          vitals: { hr: 110, bp: '140/90', spo2: 92, temp: '37.5°C' },
          destination: 'Apex City Emergency & Trauma Center',
          etaMinutes: 7
        });
      }
    }
  }, [activeRide, onActiveRideChange]);

  // Poll for incoming rides from DB
  useEffect(() => {
    let pollInterval;
    if (!activeRide && !incomingRide) {
      const pollDB = async () => {
        try {
          const res = await fetch('/api/rides/driver?tier=als'); // Just hardcoding ALS tier for demo driver
          const data = await res.json();
          if (data.success && data.ride) {
             if (data.ride._id === lastCompletedId) return;
             setIncomingRide(data.ride);
          }
        } catch (err) {
          console.error(err);
        }
      };
      pollInterval = setInterval(pollDB, 5000); // Poll every 5s
    }
    return () => clearInterval(pollInterval);
  }, [activeRide, incomingRide, lastCompletedId]);

  async function handleAccept() {
    try {
      const res = await fetch('/api/rides/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId: incomingRide._id, driverId: 'amb-1', action: 'accept' })
      });
      const data = await res.json();
      if (data.success) {
        setActiveRide(data.ride);
      }
    } catch (err) {
      console.error(err);
    }
    setIncomingRide(null);
  }

  async function handleDecline(reason) {
    try {
      await fetch('/api/rides/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId: incomingRide._id, driverId: 'amb-1', action: 'decline' })
      });
    } catch (err) {
      console.error(err);
    }
    setIncomingRide(null);
  }

  function handleComplete() {
    setLastCompletedId(activeRide?._id);
    setActiveRide(null);
  }

  return (
    <>
      {/* Floating incoming ride toast */}
      <AnimatePresence>
        {incomingRide && (
          <DriverRideNotification
            ride={incomingRide}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        )}
      </AnimatePresence>

      {/* Active ride panel embedded into dashboard */}
      <AnimatePresence>
        {activeRide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-1.5"><Zap size={12} /> Active Ride</p>
              <ActiveRidePanel ride={activeRide} onComplete={handleComplete} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
