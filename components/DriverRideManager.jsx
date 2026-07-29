'use client';
import { apiUrl } from '@/lib/apiClient';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ambulance, MapPin, Phone, CheckCircle, XCircle,
  Clock, Activity, Heart, Navigation, User, Zap,
  AlertTriangle, Locate
} from 'lucide-react';

/* ── Mock driver profile (used when driver logs in) ─────────────────────────── */
const DRIVER_PROFILE = {
  name: 'Rajesh Kumar',
  initials: 'RK',
  color: '#EF4444',
  rating: '4.9',
  trips: 1240,
  experience: '8 yrs',
  phone: '+919876543210',
  vehicle: 'DL-01-AB-1234',
  model: 'Tata Winger ALS',
  driver_id: 'DRV-001',
};

const CONDITION_COLORS = {
  RED:    { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)',  text: '#EF4444', label: 'CRITICAL' },
  YELLOW: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', text: '#F59E0B', label: 'URGENT' },
  GREEN:  { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', text: '#10B981', label: 'STABLE' },
};

/* ── Incoming ride notification (Rapido-style) ───────────────────────────────── */
function DriverRideNotification({ ride, driverCoords, onAccept, onDecline }) {
  const [timeLeft, setTimeLeft] = useState(30); // 30s to respond
  const condColor = CONDITION_COLORS.RED;

  const patLat = ride.patient?.lat;
  const patLng = ride.patient?.lng;
  const distKm  = ride._distanceKm ? `${ride._distanceKm} km away` : (patLat && driverCoords
    ? `${haversineKm(driverCoords.lat, driverCoords.lng, patLat, patLng).toFixed(1)} km away`
    : null);

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); onDecline('timeout'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [onDecline]);

  const urgencyPct = (timeLeft / 30) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: 120 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 120 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      className="fixed top-4 right-4 z-[80] w-80 overflow-hidden rounded-2xl shadow-2xl"
      style={{ background: '#0D1016', border: `1px solid ${condColor.border}` }}
    >
      {/* Urgency bar */}
      <div className="h-1 w-full bg-white/5">
        <motion.div
          className="h-full"
          style={{ background: timeLeft > 10 ? '#EF4444' : '#F59E0B' }}
          animate={{ width: `${urgencyPct}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ background: condColor.bg, borderBottom: `1px solid ${condColor.border}` }}>
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
            <p className="font-mono text-[9px] uppercase tracking-wider" style={{ color: condColor.text }}>
              {condColor.label} PATIENT
            </p>
          </div>
        </div>
        <div className="text-right">
          <div
            className="font-display text-[22px] font-black"
            style={{ color: timeLeft <= 10 ? '#F59E0B' : '#ffffff' }}
          >
            {timeLeft}s
          </div>
          <p className="font-mono text-[9px] text-slate-500">to respond</p>
        </div>
      </div>

      {/* Ride details */}
      <div className="p-4 space-y-3">
        {/* Patient */}
        <div className="flex items-center gap-2">
          <User size={13} className="text-slate-400 shrink-0" />
          <div>
            <p className="font-display text-[13px] font-semibold text-white">{ride.patient?.name}</p>
            <p className="text-[11px] text-slate-400">{ride.patient?.condition}</p>
          </div>
        </div>

        {/* Location + distance */}
        <div className="flex items-start gap-2">
          <MapPin size={13} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] text-slate-300">{ride.patient?.location || 'Current GPS Location'}</p>
            {distKm && <p className="text-[11px] text-emerald-400 font-mono mt-0.5">📍 {distKm}</p>}
          </div>
        </div>

        {/* Fare + tier */}
        <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 flex justify-between items-center">
          <div>
            <p className="font-mono text-[9px] text-slate-500 uppercase">Tier</p>
            <p className="font-display text-[13px] font-bold text-white">
              {ride.tier?.short} · {ride.tier?.label}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[9px] text-slate-500 uppercase">Fare</p>
            <p className="font-display text-[18px] font-black text-white">₹{ride.fare?.toLocaleString()}</p>
          </div>
        </div>

        {/* Navigate shortcut */}
        {patLat && patLng && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${patLat},${patLng}&travelmode=driving`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/25 bg-cyan-500/8 py-2 font-display text-[12px] font-semibold text-cyan-400 hover:bg-cyan-500/15 transition-all"
          >
            <Navigation size={13} /> Preview Route
          </a>
        )}

        {/* Accept / Decline */}
        <div className="flex gap-2">
          <button
            onClick={() => onDecline('manual')}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 font-display text-[12px] font-semibold text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all active:scale-95"
          >
            <XCircle size={14} /> Decline
          </button>
          <button
            onClick={onAccept}
            className="flex-[2] flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 font-display text-[13px] font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/40 transition-all active:scale-95"
          >
            <CheckCircle size={14} /> Accept ₹{ride.fare?.toLocaleString()}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Active ride panel ───────────────────────────────────────────────────────── */
function ActiveRidePanel({ ride, onComplete, onStatusUpdate, onCancel }) {
  const [elapsed, setElapsed]     = useState(0);
  const [rideStatus, setRideStatus] = useState('heading_to_patient');

  const STATUS_STEPS = [
    { key: 'heading_to_patient', label: 'En Route to Patient',  icon: <Navigation size={14} />, color: '#F59E0B', action: "I've Arrived" },
    { key: 'arrived',           label: 'Arrived at Location',   icon: <MapPin size={14} />,     color: '#06B6D4', action: 'Start Trip' },
    { key: 'trip_started',      label: 'Trip in Progress',       icon: <Activity size={14} />,   color: '#EF4444', action: 'Complete Trip' },
    { key: 'completed',         label: 'Trip Completed',         icon: <CheckCircle size={14} />,color: '#10B981', action: null },
  ];

  const statusOrder = STATUS_STEPS.map(s => s.key);
  const currentIdx  = statusOrder.indexOf(rideStatus);
  const current     = STATUS_STEPS[currentIdx];

  useEffect(() => {
    const t = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  function formatElapsed(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  async function advanceStatus() {
    const next = statusOrder[currentIdx + 1];
    if (!next) return;
    setRideStatus(next);
    if (onStatusUpdate) await onStatusUpdate(next);
    if (next === 'completed') setTimeout(() => onComplete(), 2000);
  }

  const patLat = ride.patient?.lat;
  const patLng = ride.patient?.lng;

  // Google Maps Directions URL — opens turn-by-turn nav to patient
  const mapsNavUrl = patLat && patLng
    ? `https://www.google.com/maps/dir/?api=1&destination=${patLat},${patLng}&travelmode=driving`
    : ride.patient?.location
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ride.patient.location)}&travelmode=driving`
    : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/3 overflow-hidden">
      {/* Status banner */}
      <div className="px-4 py-3 flex items-center gap-2.5"
        style={{ background: `${current.color}18`, borderBottom: `1px solid ${current.color}30` }}>
        <span style={{ color: current.color }}>{current.icon}</span>
        <p className="font-display text-[13px] font-semibold" style={{ color: current.color }}>
          {current.label}
        </p>
        <div className="ml-auto flex items-center font-mono text-[12px] text-slate-400">
          <Clock size={12} className="mr-1" /> {formatElapsed(elapsed)}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Progress stepper */}
        <div className="flex items-center">
          {STATUS_STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center flex-1">
              <div
                className={`h-2.5 w-2.5 rounded-full flex-shrink-0 transition-all ${i <= currentIdx ? 'scale-125' : 'opacity-30'}`}
                style={{ background: i <= currentIdx ? s.color : '#fff' }}
              />
              {i < STATUS_STEPS.length - 1 && (
                <div className="flex-1 h-px mx-1 transition-all"
                  style={{ background: i < currentIdx ? '#10B981' : 'rgba(255,255,255,0.1)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Patient card */}
        <div className="flex items-center gap-3 rounded-xl bg-black/20 border border-white/5 px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600/20 text-red-400">
            <Heart size={16} />
          </div>
          <div className="flex-1">
            <p className="font-display text-[13px] font-semibold text-white">{ride.patient?.name}</p>
            <p className="text-[11px] text-slate-400">{ride.patient?.condition}</p>
            {ride.patient?.location && (
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">📍 {ride.patient.location}</p>
            )}
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] text-slate-500">Fare</p>
            <p className="font-display text-[15px] font-black text-white">₹{ride.fare?.toLocaleString()}</p>
          </div>
        </div>

        {/* Primary action */}
        {current.action && (
          <button
            onClick={advanceStatus}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-display text-[14px] font-bold text-white transition-all active:scale-95 shadow-lg"
            style={{ background: current.color, boxShadow: `0 4px 20px ${current.color}40` }}
          >
            {current.action}
          </button>
        )}

        {/* Secondary actions row */}
        <div className="flex gap-2">
          {/* Navigate to patient — real Google Maps directions */}
          {mapsNavUrl && rideStatus !== 'completed' && (
            <a
              href={mapsNavUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/25 bg-cyan-500/8 py-2.5 font-display text-[12px] font-semibold text-cyan-400 hover:bg-cyan-500/18 transition-all active:scale-95"
            >
              <Navigation size={14} /> Navigate
            </a>
          )}

          {/* Call patient */}
          {ride.patient?.phone && (
            <a
              href={`tel:${ride.patient.phone}`}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 font-display text-[12px] font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <Phone size={14} />
            </a>
          )}

          {/* Cancel */}
          {rideStatus !== 'completed' && (
            <button
              onClick={() => onCancel && onCancel()}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-950/20 py-2.5 font-display text-[12px] font-semibold text-red-400 hover:bg-red-500/15 transition-all active:scale-95"
            >
              <XCircle size={14} /> Cancel
            </button>
          )}
        </div>

        {/* Completed state */}
        {rideStatus === 'completed' && (
          <div className="text-center py-2">
            <p className="font-display text-[14px] font-semibold text-emerald-400 flex items-center justify-center gap-1.5">
              <CheckCircle size={16} /> Trip Completed! Well done.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              ₹{ride.fare?.toLocaleString()} will be credited within 24h
            </p>
          </div>
        )}

        {/* Emergency */}
        <a href="tel:112"
          className="flex items-center justify-center gap-2 text-[12px] text-slate-500 hover:text-red-400 transition-colors py-1">
          <Phone size={13} /> Emergency: Call 112
        </a>
      </div>
    </div>
  );
}

/* ── Haversine (client-side, for display only) ───────────────────────────────── */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── Main export ─────────────────────────────────────────────────────────────── */
export default function DriverRideManager({ onActiveRideChange }) {
  const [incomingRide, setIncomingRide]   = useState(null);
  const [activeRide, setActiveRide]       = useState(null);
  const [lastCompletedId, setLastCompletedId] = useState(null);
  const [driverCoords, setDriverCoords]   = useState(null);
  const [locationStatus, setLocationStatus] = useState('requesting'); // 'requesting' | 'granted' | 'denied'
  const pollRef = useRef(null);

  // ── Request driver geolocation on mount ──────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setDriverCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('granted');
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // ── Propagate active ride to parent dashboard ────────────────────────────────
  useEffect(() => {
    if (!onActiveRideChange) return;
    if (!activeRide) {
      onActiveRideChange(null);
      return;
    }
    onActiveRideChange({
      ...activeRide,
      caseId:      activeRide._id ? `CAS-${activeRide._id.substring(18, 24).toUpperCase()}` : 'CAS-9921',
      patientName: activeRide.patient?.name || 'Unknown Patient',
      age: 45, gender: 'Male',
      condition:   activeRide.patient?.condition || 'Medical Emergency',
      acuityScore: activeRide.tier?.id === 'als' ? 88 : 45,
      severity:    activeRide.tier?.id === 'als' ? 'RED' : 'YELLOW',
      vitals:      { hr: 110, bp: '140/90', spo2: 92, temp: '37.5°C' },
      destination: 'Apex City Emergency & Trauma Center',
      etaMinutes: 7,
    });
  }, [activeRide, onActiveRideChange]);

  // ── Poll for pending rides (only when idle) ───────────────────────────────────
  const pollForRide = useCallback(async () => {
    if (activeRide || incomingRide) return;
    try {
      let url = '/api/rides/driver';
      if (driverCoords) url += `?lat=${driverCoords.lat}&lng=${driverCoords.lng}`;
      const res  = await fetch(apiUrl(url));
      const data = await res.json();
      if (data.success && data.ride) {
        if (data.ride._id === lastCompletedId) return;
        // Don't re-show a ride we already have
        setIncomingRide(prev => (prev?._id === data.ride._id ? prev : data.ride));
      }
    } catch (err) {
      console.error('[DriverRideManager] poll error:', err);
    }
  }, [activeRide, incomingRide, driverCoords, lastCompletedId]);

  useEffect(() => {
    pollRef.current = setInterval(pollForRide, 4000);
    return () => clearInterval(pollRef.current);
  }, [pollForRide]);

  // ── Driver accepts the ride ───────────────────────────────────────────────────
  async function handleAccept() {
    if (!incomingRide) return;
    try {
      const res = await fetch(apiUrl('/api/rides/driver'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId:        incomingRide._id,
          driverId:      DRIVER_PROFILE.driver_id,
          driverProfile: DRIVER_PROFILE,   // embed full profile so patient gets it
          action:        'accept',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveRide(data.ride || incomingRide);
      }
    } catch (err) {
      console.error('[DriverRideManager] accept error:', err);
    }
    setIncomingRide(null);
  }

  // ── Driver declines ───────────────────────────────────────────────────────────
  async function handleDecline(reason) {
    if (!incomingRide) return;
    try {
      await fetch(apiUrl('/api/rides/driver'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId: incomingRide._id, driverId: DRIVER_PROFILE.driver_id, action: 'decline' }),
      });
    } catch {}
    setIncomingRide(null);
  }

  // ── Status updates (arrived / trip_started / completed) ──────────────────────
  async function handleStatusUpdate(status) {
    if (!activeRide) return;
    try {
      await fetch(apiUrl('/api/rides/driver'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId: activeRide._id, driverId: DRIVER_PROFILE.driver_id, action: 'update_status', status }),
      });
    } catch (err) {
      console.error('[DriverRideManager] status update error:', err);
    }
  }

  function handleComplete() {
    setLastCompletedId(activeRide?._id);
    setActiveRide(null);
  }

  async function handleCancelActiveRide() {
    if (!activeRide) return;
    try {
      await fetch(apiUrl('/api/rides/driver'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId: activeRide._id, driverId: DRIVER_PROFILE.driver_id, action: 'update_status', status: 'cancelled' }),
      });
    } catch {}
    setActiveRide(null);
  }

  return (
    <>
      {/* ── Location status banner ─────────────────────────────────────────── */}
      <AnimatePresence>
        {locationStatus === 'denied' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-2.5"
          >
            <AlertTriangle size={14} className="text-amber-400 shrink-0" />
            <p className="text-[12px] text-amber-300">
              Location access denied. Rides within 10km won't be filtered — you'll see all pending rides.
            </p>
          </motion.div>
        )}
        {locationStatus === 'granted' && driverCoords && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-4 py-2"
          >
            <Locate size={13} className="text-emerald-400 shrink-0" />
            <p className="text-[11px] text-emerald-400 font-mono">
              GPS Active · {driverCoords.lat.toFixed(4)}, {driverCoords.lng.toFixed(4)} · Rides within 10km
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Incoming ride toast (floating) ─────────────────────────────────── */}
      <AnimatePresence>
        {incomingRide && (
          <DriverRideNotification
            ride={incomingRide}
            driverCoords={driverCoords}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        )}
      </AnimatePresence>

      {/* ── Active ride panel (embedded) ───────────────────────────────────── */}
      <AnimatePresence>
        {activeRide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-1.5">
                <Zap size={12} /> Active Ride
              </p>
              <ActiveRidePanel
                ride={activeRide}
                onComplete={handleComplete}
                onStatusUpdate={handleStatusUpdate}
                onCancel={handleCancelActiveRide}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
