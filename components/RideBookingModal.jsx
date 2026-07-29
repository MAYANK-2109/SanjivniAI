'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Phone, MapPin, Star, Shield, Clock, ChevronRight,
  CheckCircle, XCircle, Navigation, AlertTriangle, Activity,
  Ambulance, Heart, Zap, Siren, Helicopter
} from 'lucide-react';

/* ─── Mock Data ───────────────────────────────────────────────────── */
const AMBULANCE_TIERS = [
  {
    id: 'bls',
    label: 'Basic Life Support',
    short: 'BLS',
    icon: Ambulance,
    desc: 'First responder, basic equipment',
    price: 650,
    eta: '4–6 min',
    features: ['Oxygen supply', 'Basic stretcher', 'AED available'],
    color: '#10B981',
    borderColor: 'rgba(16,185,129,0.4)',
  },
  {
    id: 'als',
    label: 'Advanced Life Support',
    short: 'ALS',
    icon: Siren,
    desc: 'Paramedic + advanced equipment',
    price: 1350,
    eta: '6–10 min',
    features: ['ICU-grade monitor', 'IV medications', 'Ventilator support'],
    color: '#F59E0B',
    borderColor: 'rgba(245,158,11,0.4)',
  },
  {
    id: 'air',
    label: 'Air Ambulance',
    short: 'AIR',
    icon: Helicopter,
    desc: 'Helicopter + full trauma team',
    price: 12500,
    eta: '15–25 min',
    features: ['MD on board', 'Trauma kit', 'Landing pad dispatch'],
    color: '#EF4444',
    borderColor: 'rgba(239,68,68,0.4)',
  },
];

// Removed MOCK_DRIVERS; we now fetch live from MongoDB

/* ─── State Machine ──────────────────────────────────────────────── */
// CLOSED → SEARCHING → SELECT_TIER → FINDING_DRIVER → DRIVER_FOUND → ACCEPTED → EN_ROUTE → DECLINED

function RadarPulse() {
  return (
    <div className="relative mx-auto w-40 h-40 flex items-center justify-center">
      {[1, 2, 3].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-red-500/60"
          style={{ width: i * 40 + 40, height: i * 40 + 40 }}
          initial={{ opacity: 0.8, scale: 0.7 }}
          animate={{ opacity: 0, scale: 1.4 }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
        />
      ))}
      <div className="z-10 flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-2xl shadow-red-900/60 animate-pulse">
        <Ambulance size={28} />
      </div>
    </div>
  );
}

export default function RideBookingModal({ isOpen, onClose, patientLocation = null }) {
  const [step, setStep] = useState('SEARCHING');
  const [selectedTier, setSelectedTier] = useState(null);
  const [driver, setDriver] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [etaSeconds, setEtaSeconds] = useState(290);
  const [driverDeclineReason, setDriverDeclineReason] = useState(null);
  const [activeRideId, setActiveRideId] = useState(null);
  const timerRef = useRef(null);
  const etaRef = useRef(null);

  // Auto-advance from SEARCHING → SELECT_TIER
  useEffect(() => {
    if (step === 'SEARCHING') {
      const t = setTimeout(() => setStep('SELECT_TIER'), 2800);
      return () => clearTimeout(t);
    }
  }, [step]);

  // Poll for ride status during FINDING_DRIVER
  useEffect(() => {
    let pollInterval;
    if (step === 'FINDING_DRIVER' && activeRideId) {
      setCountdown(45); // Max 45s wait
      
      const pollStatus = async () => {
        try {
          const res = await fetch(`/api/rides/status?id=${activeRideId}`);
          const data = await res.json();
          if (data.success && data.ride) {
            if (data.ride.status === 'accepted' && data.ride.driver) {
              setDriver(data.ride.driver);
              setStep('DRIVER_FOUND');
            }
          }
        } catch (err) {
          console.error(err);
        }
      };

      // Poll every 3 seconds
      pollInterval = setInterval(pollStatus, 3000);

      // Timeout countdown
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(pollInterval);
            clearInterval(timerRef.current);
            setDriverDeclineReason('No ambulances accepted your request in time.');
            setTimeout(() => setStep('SEARCHING'), 3000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      clearInterval(pollInterval);
      clearInterval(timerRef.current);
    };
  }, [step, activeRideId]);

  const [rideStatus, setRideStatus] = useState('accepted');

  // ETA countdown and polling once EN_ROUTE
  useEffect(() => {
    let pollInterval;
    if (step === 'EN_ROUTE' && activeRideId) {
      const initialEta = selectedTier?.id === 'bls' ? 290 : selectedTier?.id === 'als' ? 490 : 1200;
      setEtaSeconds(initialEta);
      etaRef.current = setInterval(() => {
        setEtaSeconds(prev => {
          if (prev <= 0) { clearInterval(etaRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);

      // Poll for ride status updates (e.g. arrived, transporting, completed)
      const pollStatus = async () => {
        try {
          const res = await fetch(`/api/rides/status?id=${activeRideId}`);
          const data = await res.json();
          if (data.success && data.ride) {
            setRideStatus(data.ride.status);
            if (data.ride.status === 'completed') {
              // Ride is done! Auto close after a bit
              setTimeout(() => handleClose(), 4000);
            }
          }
        } catch (err) {
          console.error(err);
        }
      };
      pollInterval = setInterval(pollStatus, 3000);

      return () => {
        clearInterval(etaRef.current);
        clearInterval(pollInterval);
      };
    }
  }, [step, selectedTier, activeRideId]);

  async function handleSelectTier(tier) {
    setSelectedTier(tier);
    setStep('FINDING_DRIVER');
    
    // Create the real ride request in MongoDB
    try {
      const res = await fetch('/api/rides/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: tier,
          patient: {
            name: 'Patient',
            location: patientLocation || 'Current Location',
            condition: 'Emergency — Medical Triage',
          },
          fare: tier.price
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveRideId(data.rideId);
      }
    } catch (err) {
      console.error(err);
      setDriverDeclineReason('Network error. Failed to request ride.');
      setTimeout(() => setStep('SEARCHING'), 3000);
    }
  }

  function handleAccept() {
    setStep('EN_ROUTE');
  }

  function handleDecline() {
    setDriverDeclineReason('Looking for another ambulance...');
    setDriver(null);
    setStep('FINDING_DRIVER');
    setTimeout(() => setDriverDeclineReason(null), 2000);
  }

  function handleClose() {
    setStep('SEARCHING');
    setSelectedTier(null);
    setDriver(null);
    setCountdown(null);
    onClose();
  }

  function formatEta(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const tier = selectedTier || AMBULANCE_TIERS[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Bottom-sheet card */}
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl"
            style={{ background: '#0D1016', border: '1px solid rgba(255,255,255,0.1)' }}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="mx-auto mt-3 mb-0 h-1 w-12 rounded-full bg-white/20" />

            {/* Top header stripe */}
            <div
              className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-white/5"
              style={{ background: 'rgba(239,68,68,0.08)' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600">
                  <Ambulance size={16} className="text-white" />
                </div>
                <div>
                  <p className="font-display text-[14px] font-bold text-white">Book Ambulance</p>
                  <p className="font-mono text-[10px] text-red-400 uppercase tracking-wider">Emergency Ride Service</p>
                </div>
              </div>
              <button onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                <X size={16} />
              </button>
            </div>

            {/* ── Step: SEARCHING ─────────────────────────────────── */}
            <AnimatePresence mode="wait">
              {step === 'SEARCHING' && (
                <motion.div
                  key="searching"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-8 flex flex-col items-center gap-5"
                >
                  <RadarPulse />
                  <div className="text-center">
                    <p className="font-display text-[17px] font-bold text-white">Locating Ambulances Nearby</p>
                    <p className="text-[13px] text-slate-400 mt-1">Scanning within 10km of your location...</p>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE GPS SCAN ACTIVE
                  </div>
                </motion.div>
              )}

              {/* ── Step: SELECT_TIER ──────────────────────────────── */}
              {step === 'SELECT_TIER' && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="p-5 flex flex-col gap-3"
                >
                  <p className="font-display text-[15px] font-bold text-white">Choose Ambulance Type</p>
                  <p className="text-[12px] text-slate-400 -mt-1">3 vehicles found nearby</p>
                  {AMBULANCE_TIERS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTier(t)}
                      className="w-full text-left rounded-2xl border p-4 transition-all hover:scale-[1.01] active:scale-[0.99]"
                      style={{ borderColor: t.borderColor, background: `${t.color}08` }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl"><t.icon size={24} color={t.color} /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-display text-[14px] font-bold text-white">{t.label}</p>
                            <p className="font-display text-[16px] font-black" style={{ color: t.color }}>₹{t.price.toLocaleString()}</p>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{t.desc}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="flex items-center gap-1 text-[11px]" style={{ color: t.color }}>
                              <Clock size={11} /> {t.eta}
                            </span>
                            {t.features.slice(0, 2).map(f => (
                              <span key={f} className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{f}</span>
                            ))}
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-500 shrink-0 mt-0.5" />
                      </div>
                    </button>
                  ))}
                  <p className="text-center text-[11px] text-slate-600 font-mono mt-1">Inclusive of taxes · No surge pricing in emergencies</p>
                </motion.div>
              )}

              {/* ── Step: FINDING_DRIVER ───────────────────────────── */}
              {step === 'FINDING_DRIVER' && (
                <motion.div
                  key="finding"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-8 flex flex-col items-center gap-5"
                >
                  <div className="relative flex h-20 w-20 items-center justify-center">
                    <motion.div
                      className="absolute h-20 w-20 rounded-full"
                      style={{ border: `2px solid ${tier.color}` }}
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <tier.icon size={36} color={tier.color} />
                  </div>
                  <div className="text-center">
                    <p className="font-display text-[16px] font-bold text-white">Connecting to Driver</p>
                    <p className="text-[13px] text-slate-400 mt-1">{tier.label} · Arriving in {tier.eta}</p>
                  </div>
                  <div
                    className="w-16 h-16 rounded-full border-4 border-slate-700 flex items-center justify-center font-display text-3xl font-black"
                    style={{ borderTopColor: tier.color }}
                  >
                    <motion.span
                      key={countdown}
                      initial={{ scale: 1.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-white"
                    >
                      {countdown}
                    </motion.span>
                  </div>
                  {driverDeclineReason && (
                    <p className="text-[12px] text-amber-400 font-mono">{driverDeclineReason}</p>
                  )}
                </motion.div>
              )}

              {/* ── Step: DRIVER_FOUND ────────────────────────────── */}
              {step === 'DRIVER_FOUND' && driver && (
                <motion.div
                  key="driver"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-5 flex flex-col gap-4"
                >
                  {/* Match banner */}
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5">
                    <CheckCircle size={16} className="text-emerald-400" />
                    <p className="font-display text-[13px] font-semibold text-emerald-300">Ambulance matched! Review and accept.</p>
                  </div>

                  {/* Driver card */}
                  <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
                    <div className="flex items-center gap-3 mb-4">
                      {/* Avatar */}
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white font-display text-xl font-bold"
                        style={{ background: `linear-gradient(135deg, ${driver.color}, ${driver.color}99)` }}>
                        {driver.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-[15px] font-bold text-white">{driver.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-1">
                            <Star size={12} fill="#F59E0B" className="text-amber-400" />
                            <span className="font-mono text-[12px] text-amber-400">{driver.rating}</span>
                          </div>
                          <span className="text-slate-600">·</span>
                          <span className="text-[11px] text-slate-400">{driver.trips} trips</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-[11px] text-slate-400">{driver.experience} exp</span>
                        </div>
                      </div>
                      <a href={`tel:${driver.phone}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all">
                        <Phone size={16} />
                      </a>
                    </div>

                    {/* Vehicle & badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-[11px] font-mono text-slate-300">
                        <Ambulance size={12} /> {driver.vehicle}
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-[11px] font-mono text-slate-400">
                        {driver.model}
                      </span>
                      <span className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 text-[11px] font-mono text-emerald-400">
                        <Shield size={10} /> Verified
                      </span>
                    </div>

                    {/* Fare details */}
                    <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-mono text-[10px] text-slate-500 uppercase tracking-wide">Fare Estimate</p>
                        <p className="font-display text-[18px] font-black text-white">₹{selectedTier?.price.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        {[
                          ['Base fare', `₹${(selectedTier?.price * 0.6).toFixed(0)}`],
                          ['Distance (~3.2 km)', `₹${(selectedTier?.price * 0.25).toFixed(0)}`],
                          ['Night surcharge', `₹${(selectedTier?.price * 0.15).toFixed(0)}`],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between text-[11px]">
                            <span className="text-slate-500">{k}</span>
                            <span className="text-slate-400 font-mono">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ETA row */}
                    <div className="flex items-center gap-2 mt-3">
                      <MapPin size={13} className="text-red-400" />
                      <p className="text-[12px] text-slate-300">
                        Arriving in <span className="font-semibold text-white">{selectedTier?.eta}</span> · 3.2 km away
                      </p>
                    </div>
                  </div>

                  {/* Accept / Decline */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleDecline}
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 font-display text-[13px] font-semibold text-slate-300 hover:bg-white/10 transition-all active:scale-95"
                    >
                      <XCircle size={16} className="text-slate-400" />
                      Decline
                    </button>
                    <button
                      onClick={handleAccept}
                      className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 font-display text-[14px] font-bold text-white shadow-lg shadow-emerald-900/40 hover:bg-emerald-500 transition-all active:scale-95"
                    >
                      <CheckCircle size={16} />
                      Accept Ride — ₹{selectedTier?.price.toLocaleString()}
                    </button>
                  </div>

                  <p className="text-center text-[11px] text-slate-600 font-mono">
                    No cancellation fee within 2 min of booking
                  </p>
                </motion.div>
              )}

              {/* ── Step: EN_ROUTE ─────────────────────────────────── */}
              {step === 'EN_ROUTE' && driver && (
                <motion.div
                  key="enroute"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-5 flex flex-col gap-4"
                >
                  {/* Big ETA timer */}
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-5 text-center">
                    <p className="font-mono text-[11px] text-emerald-400 uppercase tracking-wider mb-2">
                      {rideStatus === 'heading' || rideStatus === 'accepted' ? <><Ambulance size={14} className="inline mr-1" /> Ambulance En Route</> :
                       rideStatus === 'arrived' ? <><MapPin size={14} className="inline mr-1" /> Ambulance Arrived</> :
                       rideStatus === 'transporting' ? <><Zap size={14} className="inline mr-1" /> Transporting to ER</> : <><CheckCircle size={14} className="inline mr-1" /> Completed</>}
                    </p>
                    {(rideStatus === 'heading' || rideStatus === 'accepted') ? (
                      <>
                        <div className="font-display text-5xl font-black text-white mb-1">
                          {formatEta(etaSeconds)}
                        </div>
                        <p className="text-[13px] text-emerald-300">Estimated arrival time</p>
                      </>
                    ) : (
                      <div className="font-display text-4xl font-black text-white mb-1 py-2">
                        {rideStatus === 'arrived' ? 'Outside' :
                         rideStatus === 'transporting' ? 'En Route ER' : 'Done'}
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <Activity size={14} className="text-emerald-400 animate-pulse" />
                      <span className="font-mono text-[11px] text-emerald-400">
                        {rideStatus === 'heading' || rideStatus === 'accepted' ? 'DRIVER IS ON THE WAY' :
                         rideStatus === 'arrived' ? 'MEET DRIVER OUTSIDE' :
                         rideStatus === 'transporting' ? 'MONITORING VITALS' : 'RIDE FINISHED'}
                      </span>
                    </div>
                  </div>

                  {/* Driver mini-card */}
                  <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white font-display font-bold text-[14px]"
                      style={{ background: `linear-gradient(135deg, ${driver.color}, ${driver.color}80)` }}>
                      {driver.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-[13px] font-semibold text-white truncate">{driver.name}</p>
                      <p className="font-mono text-[11px] text-slate-400">{driver.vehicle} · {driver.model}</p>
                    </div>
                    <div className="flex gap-2">
                      <a href={`tel:${driver.phone}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all">
                        <Phone size={15} />
                      </a>
                    </div>
                  </div>

                  {/* Booking ID */}
                  <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-mono text-[10px] text-slate-500 uppercase">Booking ID</p>
                      <p className="font-mono text-[13px] text-white font-semibold">
                        {activeRideId ? `SJ-${activeRideId.slice(-6).toUpperCase()}` : 'PENDING'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[10px] text-slate-500 uppercase">Fare</p>
                      <p className="font-display text-[16px] font-black text-white">₹{selectedTier?.price.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleClose}
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-950/30 py-2.5 font-display text-[12px] font-semibold text-red-400 hover:bg-red-900/40 transition-all"
                    >
                      <XCircle size={14} />
                      Cancel Ride
                    </button>
                    <button
                      onClick={() => window.open('https://www.google.com/maps/dir/?api=1', '_blank')}
                      className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-white/8 border border-white/10 py-2.5 font-display text-[13px] font-semibold text-white hover:bg-white/12 transition-all"
                    >
                      <Navigation size={14} className="text-cyan-400" />
                      Track on Map
                    </button>
                  </div>

                  {/* Emergency escalation */}
                  <a href="tel:112" className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 font-display text-[14px] font-bold text-white shadow-lg shadow-red-900/40 hover:bg-red-500 transition-all active:scale-95">
                    <Phone size={15} />
                    Call 112 for Immediate Emergency
                  </a>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom safe area */}
            <div className="h-4" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
