'use client';
import { apiUrl } from '@/lib/apiClient';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredUser, clearStoredUser } from '@/lib/auth';
import { getStoredTheme, applyTheme } from '@/lib/theme';
import DriverRideManager from '@/components/DriverRideManager';
import { Ambulance, MapPin, Zap, CheckCircle2, Map, Radio, Bell, Phone } from 'lucide-react';

// Live OpenStreetMap component using Leaflet (loaded dynamically)
function LiveMap({ patientLocation, destination }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || mapInstanceRef.current) return;

    // Dynamically load Leaflet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      try {
        const L = window.L;
        if (!mapRef.current || mapInstanceRef.current) return;

        // Default to Delhi if no coords given
        const center = patientLocation || [28.6139, 77.2090];

        const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false }).setView(center, 14);
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        // Ambulance marker
        const ambIcon = L.divIcon({
          html: '<div style="color:#ef4444; filter:drop-shadow(0 2px 6px rgba(239,68,68,0.8))"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10H6"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.384 8H14"/><circle cx="8" cy="19" r="2"/><circle cx="17" cy="19" r="2"/></svg></div>',
          className: '',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        // Hospital marker
        const hospIcon = L.divIcon({
          html: '<div style="color:#10b981; filter:drop-shadow(0 2px 6px rgba(16,185,129,0.8))"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 10h8"/><path d="M12 6v8"/></svg></div>',
          className: '',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const ambMarker = L.marker(center, { icon: ambIcon }).addTo(map).bindPopup('Your Ambulance').openPopup();

        // Target destination (default ~2km away if not provided)
        const destCoords = destination || [center[0] + 0.015, center[1] - 0.0025];
        const hospMarker = L.marker(destCoords, { icon: hospIcon }).addTo(map).bindPopup('Destination ER');

        // Draw static route line between ambulance and destination
        L.polyline([center, destCoords], {
          color: '#EF4444', weight: 4, opacity: 0.7, dashArray: '10,6',
        }).addTo(map);

        // Adjust map to fit both markers
        map.fitBounds([center, destCoords], { padding: [40, 40] });
      } catch (e) {
        setMapError(true);
      }
    };
    script.onerror = () => setMapError(true);
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        clearInterval(mapInstanceRef.current._moveInterval);
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  if (mapError) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-[#08090d] rounded-xl">
        <Map size={36} className="mb-2 text-slate-500" />
        <p className="text-sm">Map unavailable</p>
        <p className="text-xs mt-1">Check network connection</p>
      </div>
    );
  }

  return <div ref={mapRef} className="h-full w-full rounded-xl z-10" />;
}

function VitalCard({ label, unit, value, subtext, colorClass, bgClass, borderClass }) {
  return (
    <div className={`rounded-2xl p-4 border ${bgClass} ${borderClass}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${colorClass}`}>{label}</span>
        <span className={`text-[9px] font-mono ${colorClass} opacity-70`}>{unit}</span>
      </div>
      <div className={`text-2xl font-bold font-mono ${colorClass}`}>{value}</div>
      <div className={`text-[11px] mt-1 ${colorClass} opacity-70`}>{subtext}</div>
    </div>
  );
}

export default function AmbulanceDashboard() {
  const [user, setUser] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [alertLog, setAlertLog] = useState([]);
  const [erAlertSent, setErAlertSent] = useState(false);
  const [callStatus, setCallStatus] = useState('heading'); // heading | arrived | transporting | completed
  const [mapKey, setMapKey] = useState(0);

  const STATUS_STEPS = [
    { key: 'heading',     label: 'En Route to Patient',  icon: <Ambulance size={14} />, color: 'text-amber-400',   action: "Mark Arrived at Patient" },
    { key: 'arrived',     label: 'At Patient Location',  icon: <MapPin size={14} />, color: 'text-blue-400',    action: 'Start Transport to Hospital' },
    { key: 'transporting',label: 'Transporting to ER',   icon: <Zap size={14} />, color: 'text-red-400',     action: 'Mark Arrived at ER' },
    { key: 'completed',   label: 'Case Completed',        icon: <CheckCircle2 size={14} />, color: 'text-emerald-400', action: null },
  ];

  const currentStep = STATUS_STEPS.find(s => s.key === callStatus) || STATUS_STEPS[0];
  const stepIdx = STATUS_STEPS.findIndex(s => s.key === callStatus);

  useEffect(() => {
    // Restore theme from localStorage on every page load
    applyTheme(getStoredTheme());
    const stored = getStoredUser();
    if (!stored || stored.role !== 'ambulance') { window.location.href = '/'; return; }
    setUser(stored);
  }, []);

  function addLog(msg, type = 'info') {
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setAlertLog(prev => [{ time, msg, type }, ...prev.slice(0, 19)]);
  }

  function handleActiveRideChange(ride) {
    setActiveCall(ride);
    if (ride && !activeCall) {
      addLog('New dispatch received — ride accepted', 'success');
      setCallStatus('heading');
      setMapKey(k => k + 1); // remount map for new ride
    }
    if (!ride && activeCall) {
      addLog('Dispatch cleared', 'info');
    }
  }

  async function handleNextStatus() {
    const nextIdx = stepIdx + 1;
    if (nextIdx >= STATUS_STEPS.length) return;
    const nextKey = STATUS_STEPS[nextIdx].key;
    setCallStatus(nextKey);
    addLog(`Status updated: ${STATUS_STEPS[nextIdx].label}`, nextKey === 'completed' ? 'success' : 'info');

    if (activeCall?._id) {
      try {
        await fetch(apiUrl('/api/rides/driver'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rideId: activeCall._id,
            driverId: user?.driver_id || user?.id || 'amb-1',
            action: 'update_status',
            status: nextKey
          })
        });
      } catch (e) {
        console.error('Failed to update status', e);
      }
    }

    if (nextKey === 'completed') {
      // Clear ride after short delay
      setTimeout(() => setActiveCall(null), 2000);
    }
  }

  async function handleSendAlert() {
    setErAlertSent(true);
    addLog('🔔 Pre-arrival trauma alert sent to ER', 'warn');
    if (activeCall?._id) {
      try {
        await fetch(apiUrl('/api/ambulance'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rideId: activeCall._id, erNotified: true }),
        });
      } catch {}
    }
    setTimeout(() => setErAlertSent(false), 4000);
  }

  function handleCallER() {
    addLog('📞 Initiating call to ER Trauma Line...', 'info');
    window.open('tel:+911', '_self');
  }

  if (!user) return (
    <div className="min-h-screen bg-[#07080c] text-white flex items-center justify-center">Loading...</div>
  );

  const VITALS_THRESHOLDS = { hr: { danger: 120 }, spo2: { danger: 90 } };
  const hrDanger = activeCall?.vitals?.hr > VITALS_THRESHOLDS.hr.danger;
  const spo2Danger = activeCall?.vitals?.spo2 < VITALS_THRESHOLDS.spo2.danger;

  return (
    <div className="min-h-screen bg-[#07080c] text-slate-100" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-red-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-amber-500/4 rounded-full blur-[100px]" />
      </div>

      {/* DriverRideManager — handles incoming ride popups */}
      <DriverRideManager onActiveRideChange={handleActiveRideChange} />

      {/* Navbar */}
      <header className="relative z-30 border-b border-white/8 bg-[#07080c]/90 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0 text-red-400"><Ambulance size={18} /></div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-100">SANJEEVANI</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 font-mono">AMBULANCE</span>
              </div>
              <p className="text-[11px] text-slate-500">{user.name || 'Paramedic'} · {user.vehicle || 'Unit'}</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {/* Live status badge */}
            {activeCall ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                {currentStep.label}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Available
              </div>
            )}
            <Link href="/" onClick={clearStoredUser}
              className="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-300 transition-all">
              Logout
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Active dispatch / idle state */}
        <div className="lg:col-span-8 space-y-5">

          {!activeCall ? (
            /* ── Idle state ── */
            <div className="flex flex-col items-center justify-center h-72 border border-white/6 bg-white/3 rounded-2xl text-slate-500 space-y-3">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <Radio size={48} className="text-slate-500" />
              </motion.div>
              <div className="text-center">
                <p className="font-semibold text-slate-300">Awaiting Dispatch</p>
                <p className="text-sm mt-1">Ride requests will appear as a notification when a patient books an ambulance</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                System polling every 5s for new rides
              </div>
            </div>
          ) : (
            <>
              {/* ── Active Call Card ── */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-[#0d0f16] border border-red-500/35 overflow-hidden shadow-2xl shadow-red-500/10">
                <div className="h-1 w-full bg-gradient-to-r from-red-500 via-amber-500 to-red-500 animate-pulse" />
                <div className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                      </span>
                      <span className="font-mono text-xs font-bold text-red-400 uppercase tracking-widest">Active Dispatch</span>
                    </div>
                    <span className={`text-xs font-bold font-mono px-3 py-1 rounded-full border ${currentStep.color} bg-white/5 border-white/10`}>
                      {currentStep.icon} {currentStep.label}
                    </span>
                  </div>

                  {/* Patient info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/6">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-mono mb-1">Patient</p>
                      <p className="font-semibold text-slate-100 text-sm">{activeCall.patientName || activeCall.patient?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{activeCall.patient?.condition || 'Medical Emergency'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-mono mb-1">Pickup</p>
                      <p className="font-semibold text-amber-300 text-sm leading-snug">{activeCall.patient?.location || 'Current GPS Location'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-mono mb-1">Service Tier</p>
                      <p className="font-semibold text-emerald-400 text-sm">{activeCall.tier?.label || 'ALS'}</p>
                      <p className="text-[11px] text-slate-500 font-mono">₹{activeCall.fare?.toLocaleString() || '--'}</p>
                    </div>
                  </div>

                  {/* Vitals (only if we have data) */}
                  {activeCall.vitals && (
                    <>
                      <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Live Vitals</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <VitalCard label="Heart Rate" unit="BPM" value={activeCall.vitals.hr}
                          subtext={hrDanger ? '⚠ High' : 'Elevated'}
                          colorClass={hrDanger ? 'text-red-400' : 'text-red-300'}
                          bgClass={hrDanger ? 'bg-red-500/15' : 'bg-red-500/8'}
                          borderClass={hrDanger ? 'border-red-500/40' : 'border-red-500/20'} />
                        <VitalCard label="Blood Pressure" unit="mmHg" value={activeCall.vitals.bp || '--'}
                          subtext="Systolic" colorClass="text-amber-400" bgClass="bg-amber-500/8" borderClass="border-amber-500/20" />
                        <VitalCard label="SpO₂" unit="%" value={`${activeCall.vitals.spo2}%`}
                          subtext={spo2Danger ? '⚠ Low O₂' : 'O₂ OK'}
                          colorClass={spo2Danger ? 'text-sky-300' : 'text-sky-400'}
                          bgClass={spo2Danger ? 'bg-sky-500/15' : 'bg-sky-500/8'}
                          borderClass={spo2Danger ? 'border-sky-500/40' : 'border-sky-500/20'} />
                        <VitalCard label="Body Temp" unit="°C" value={activeCall.vitals.temp || '--'}
                          subtext="Normal" colorClass="text-purple-400" bgClass="bg-purple-500/8" borderClass="border-purple-500/20" />
                      </div>
                    </>
                  )}

                  {/* Status progression + action buttons */}
                  {/* Progress steps */}
                  <div className="flex items-center gap-1 my-1">
                    {STATUS_STEPS.map((s, i) => (
                      <div key={s.key} className="flex items-center flex-1">
                        <div className={`h-2 flex-1 rounded-full transition-all ${i <= stepIdx ? 'bg-red-500' : 'bg-white/10'}`} />
                        {i < STATUS_STEPS.length - 1 && <div className="w-1.5" />}
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-3">
                    {currentStep.action && (
                      <button onClick={handleNextStatus}
                        className="flex-1 min-w-[160px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2">
                        {currentStep.icon} {currentStep.action}
                      </button>
                    )}
                    <button onClick={handleSendAlert}
                      className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all border flex items-center gap-2 ${erAlertSent ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-red-600 hover:bg-red-500 text-white border-transparent shadow-lg shadow-red-900/20'}`}>
                      <Bell size={16} /> {erAlertSent ? 'Alert Sent!' : 'Alert ER'}
                    </button>
                    <button onClick={handleCallER}
                      className="py-2.5 px-4 rounded-xl bg-white/8 hover:bg-white/12 border border-white/15 text-slate-200 text-sm font-semibold transition-all flex items-center gap-2">
                      <Phone size={16} /> Call ER
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* ── Live Map ── */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="rounded-2xl bg-[#0d0f16] border border-white/8 overflow-hidden shadow-xl">
                <div className="px-5 py-3.5 border-b border-white/6 flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2"><Map size={16} /> Live GPS Tracking</h3>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> OpenStreetMap Live
                  </span>
                </div>
                <div className="h-56 p-3">
                  <LiveMap key={mapKey} />
                </div>
              </motion.div>
            </>
          )}
        </div>

        {/* Right sidebar */}
        <div className="lg:col-span-4 space-y-5">

          {/* Unit Info */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl bg-[#0d0f16] border border-white/8 p-5 shadow-xl">
            <h3 className="font-semibold text-sm text-slate-200 mb-4">Unit Details</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Driver', value: user.driver_name || user.name || 'Rajesh Kumar' },
                { label: 'Vehicle', value: user.vehicle || 'Type III ALS Ambulance' },
                { label: 'Unit ID', value: user.id || 'AMB-001' },
                { label: 'Service Area', value: user.service_area || 'Delhi NCR' },
                { label: 'Current Status', value: activeCall ? currentStep.label : 'Available', highlight: true },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className={`text-xs font-semibold ${highlight && activeCall ? 'text-amber-400' : highlight ? 'text-emerald-400' : 'text-slate-200'}`}>{value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Dispatch Log */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl bg-[#0d0f16] border border-white/8 overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-200">Dispatch Log</h3>
              <span className="text-[10px] font-mono text-slate-500">{alertLog.length} events</span>
            </div>
            <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
              {alertLog.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-4">No events yet</p>
              ) : (
                alertLog.map((log, i) => (
                  <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg text-xs border ${
                    log.type === 'warn' ? 'bg-amber-500/10 border-amber-500/20' :
                    log.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
                    'bg-white/4 border-white/8'
                  }`}>
                    <span className="font-mono text-[9px] text-slate-500 shrink-0 mt-0.5">{log.time}</span>
                    <span className={log.type === 'warn' ? 'text-amber-300' : log.type === 'success' ? 'text-emerald-300' : 'text-slate-300'}>{log.msg}</span>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Quick Emergency Numbers */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="rounded-2xl bg-[#0d0f16] border border-white/8 p-5 shadow-xl">
            <h3 className="font-semibold text-sm text-slate-200 mb-3">Quick Contacts</h3>
            <div className="space-y-2">
              {[
                { label: 'National Emergency', number: '112', color: 'bg-red-600 hover:bg-red-500' },
                { label: 'AIIMS Trauma ER', number: '011-26593308', color: 'bg-blue-600 hover:bg-blue-500' },
                { label: 'Poison Control', number: '1800-11-6117', color: 'bg-purple-600 hover:bg-purple-500' },
              ].map(({ label, number, color }) => (
                <button key={label} onClick={() => window.open(`tel:${number}`, '_self')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-white text-xs font-semibold transition-all ${color}`}>
                  <span className="flex items-center gap-1.5"><Phone size={14} /> {label}</span>
                  <span className="font-mono text-[11px] opacity-80">{number}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
