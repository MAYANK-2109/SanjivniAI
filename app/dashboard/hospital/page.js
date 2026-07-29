'use client';
import { apiUrl } from '@/lib/apiClient';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredUser, clearStoredUser } from '@/lib/auth';
import { CheckCircle2, AlertTriangle, CalendarCheck, Building2, Inbox, Calendar, Clock, Check, X } from 'lucide-react';
import { getStoredTheme, applyTheme } from '@/lib/theme';

function AppointmentModal({ onClose, hospitalId, hospitalName }) {
  const [form, setForm] = useState({
    patientName: '', age: '', gender: 'Male', phone: '',
    department: '', reason: '', medicalHistory: '', date: '', time: '',
    emergency: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const departments = ['Emergency (ER)','Cardiology','Orthopedics','Neurology','Pediatrics','General Surgery','ICU','Radiology','Oncology','Gynecology'];
  const times = ['08:00 AM','09:00 AM','10:00 AM','11:00 AM','12:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM'];

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch(apiUrl('/api/appointments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, hospitalId, hospitalName, role: 'hospital' }),
      });
      setDone(true);
      setTimeout(onClose, 2000);
    } catch { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-[#0d0f16] border border-white/12 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <div className="p-6">
          {done ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4 text-emerald-400"><CheckCircle2 size={48} /></div>
              <h3 className="font-bold text-lg text-slate-100">Appointment Submitted!</h3>
              <p className="text-slate-400 text-sm mt-1">Sent to {hospitalName}'s dashboard</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-lg text-slate-100">Book Hospital Appointment</h3>
                  <p className="text-sm text-slate-500">{hospitalName}</p>
                </div>
                <button onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white flex items-center justify-center">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Emergency toggle */}
                <label className="flex items-center gap-3 p-3.5 rounded-xl border border-red-500/30 bg-red-500/8 cursor-pointer">
                  <input type="checkbox" checked={form.emergency} onChange={e => setForm(p=>({...p,emergency:e.target.checked}))}
                    className="accent-red-500 h-4 w-4" />
                  <div>
                    <p className="text-sm font-semibold text-red-300 flex items-center gap-1.5"><AlertTriangle size={16} /> This is an Emergency</p>
                    <p className="text-[11px] text-red-400/70">Mark for priority handling</p>
                  </div>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">Patient Name *</label>
                    <input required value={form.patientName} onChange={e=>setForm(p=>({...p,patientName:e.target.value}))}
                      placeholder="Full name" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 transition-all" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">Age *</label>
                    <input required type="number" value={form.age} onChange={e=>setForm(p=>({...p,age:e.target.value}))}
                      placeholder="30" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 transition-all" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">Gender</label>
                    <select value={form.gender} onChange={e=>setForm(p=>({...p,gender:e.target.value}))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/60 transition-all">
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">Phone *</label>
                    <input required value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}
                      placeholder="+91 XXXXXXXXXX" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 transition-all" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">Department *</label>
                    <select required value={form.department} onChange={e=>setForm(p=>({...p,department:e.target.value}))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/60 transition-all">
                      <option value="">Select department</option>
                      {departments.map(d=><option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">Preferred Date *</label>
                    <input required type="date" value={form.date} min={new Date().toISOString().split('T')[0]}
                      onChange={e=>setForm(p=>({...p,date:e.target.value}))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/60 transition-all" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">Time Slot *</label>
                    <select required value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/60 transition-all">
                      <option value="">Select time</option>
                      {times.map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">Reason for Visit *</label>
                    <textarea required value={form.reason} onChange={e=>setForm(p=>({...p,reason:e.target.value}))}
                      placeholder="Describe the symptoms or reason..." rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 resize-none transition-all" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">Medical History (optional)</label>
                    <textarea value={form.medicalHistory} onChange={e=>setForm(p=>({...p,medicalHistory:e.target.value}))}
                      placeholder="Existing conditions, allergies, current medications..." rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 resize-none transition-all" />
                  </div>
                </div>
                <button type="submit" disabled={submitting}
                  className={`w-full py-3 rounded-xl font-semibold text-sm text-white transition-all shadow-lg ${form.emergency ? 'bg-red-600 hover:bg-red-500 shadow-red-900/30' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'}`}>
                  {submitting ? 'Submitting...' : form.emergency ? <><AlertTriangle size={14} className="inline mr-1" /> Submit Emergency Request</> : <><CalendarCheck size={14} className="inline mr-1" /> Book Appointment</>}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function HospitalDashboard() {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [capacity, setCapacity] = useState({ icuTotal:20,icuFree:3, erBedsTotal:45,erBedsFree:8, ventilatorsTotal:15,ventilatorsFree:2, traumaBaysTotal:6,traumaBaysFree:1 });
  const [erStatus, setErStatus] = useState('NORMAL_INTAKE');
  const [showBookModal, setShowBookModal] = useState(false);
  const [activeTab, setActiveTab] = useState('appointments');
  const [saveMsg, setSaveMsg] = useState('');

  const STATUS_CONFIG = {
    NORMAL_INTAKE:    { label: 'Normal Intake',    color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/40' },
    HIGH_LOAD:        { label: 'High Load',        color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/40' },
    CRITICAL_LOAD:    { label: 'Critical Load',    color: 'text-red-400',     bg: 'bg-red-500/15 border-red-500/40' },
    DIVERT_REQUESTED: { label: 'Divert Requested', color: 'text-red-300',     bg: 'bg-red-500/20 border-red-500/50' },
  };

  useEffect(() => {
    // Restore theme from localStorage on every page load
    applyTheme(getStoredTheme());
    const stored = getStoredUser();
    if (!stored || stored.role !== 'hospital') { window.location.href = '/'; return; }
    setUser(stored);
  }, []);

  useEffect(() => {
    if (!user) return;
    loadAppointments();
    loadCapacity();
    const interval = setInterval(loadAppointments, 15000);
    return () => clearInterval(interval);
  }, [user]);

  async function loadAppointments() {
    try {
      const res = await fetch(apiUrl(`/api/appointments?role=hospital&targetId=${user?.id || ')'}`);
      const data = await res.json();
      if (data.success) setAppointments(data.appointments);
    } catch {}
  }

  async function loadCapacity() {
    try {
      const res = await fetch(apiUrl('/api/hospital'));
      const data = await res.json();
      if (data.success && data.hospital?.capacity) setCapacity(data.hospital.capacity);
      if (data.success && data.hospital?.erStatus) setErStatus(data.hospital.erStatus);
    } catch {}
  }

  async function adjustBed(key, delta) {
    const totalKey = key.replace('Free', 'Total');
    const newVal = Math.max(0, Math.min(capacity[totalKey] || 99, capacity[key] + delta));
    const updated = { ...capacity, [key]: newVal };
    setCapacity(updated);
    try {
      await fetch(apiUrl('/api/hospital'), { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({capacity:updated, erStatus}) });
      setSaveMsg('Synced ✓'); setTimeout(()=>setSaveMsg(''), 2000);
    } catch {}
  }

  async function handleErStatus(status) {
    setErStatus(status);
    try {
      await fetch(apiUrl('/api/hospital'), { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({capacity, erStatus:status}) });
    } catch {}
  }

  async function handleApptAction(id, status) {
    try {
      await fetch(apiUrl('/api/appointments'), { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id,status}) });
      setAppointments(prev => prev.map(a => a._id?.toString()===id ? {...a,status} : a));
      if (selectedAppt?._id?.toString() === id) setSelectedAppt(prev=>({...prev,status}));
    } catch {}
  }

  if (!user) return <div className="min-h-screen bg-[#07080c] text-white flex items-center justify-center text-sm">Loading...</div>;

  const pending = appointments.filter(a => a.status === 'pending');
  const emergencies = appointments.filter(a => a.emergency);
  const statusCfg = STATUS_CONFIG[erStatus];
  const totalFree = capacity.icuFree + capacity.erBedsFree + capacity.ventilatorsFree + capacity.traumaBaysFree;

  return (
    <div className="min-h-screen bg-[#07080c] text-slate-100" style={{ fontFamily: 'var(--font-body)' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[500px] h-[350px] bg-emerald-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-blue-500/4 rounded-full blur-[90px]" />
      </div>

      {/* Navbar */}
      <header className="relative z-30 border-b border-white/8 bg-[#07080c]/90 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400"><Building2 size={18} /></div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-100">SANJEEVANI</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono">HOSPITAL</span>
              </div>
              <p className="text-[11px] text-slate-500">{user.name}</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-mono ${statusCfg.bg} ${statusCfg.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.color.replace('text-','bg-')} ${erStatus !== 'NORMAL_INTAKE' ? 'animate-pulse' : ''}`} />
              {statusCfg.label}
            </div>
            {saveMsg && <span className="text-xs text-emerald-400 font-mono">{saveMsg}</span>}
            <button onClick={() => setShowBookModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all">
              <CalendarCheck size={14} /> Book Appointment
            </button>
            <Link href="/" onClick={clearStoredUser}
              className="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-300 transition-all">
              Logout
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label:'ICU Free', value:capacity.icuFree, total:capacity.icuTotal, color:'text-sky-400' },
            { label:'ER Beds Free', value:capacity.erBedsFree, total:capacity.erBedsTotal, color:'text-emerald-400' },
            { label:'Ventilators', value:capacity.ventilatorsFree, total:capacity.ventilatorsTotal, color:'text-purple-400' },
            { label:'Trauma Bays', value:capacity.traumaBaysFree, total:capacity.traumaBaysTotal, color:'text-amber-400' },
          ].map(({label,value,total,color}) => {
            const pct = total > 0 ? Math.round(((total-value)/total)*100) : 0;
            return (
              <div key={label} className={`rounded-2xl border p-4 ${pct >= 90 ? 'bg-red-500/8 border-red-500/25' : 'bg-[#0d0f16] border-white/8'}`}>
                <p className="text-[10px] text-slate-500 font-mono uppercase mb-1">{label}</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-bold font-mono ${pct >= 90 ? 'text-red-400' : color}`}>{value}</span>
                  <span className="text-xs text-slate-500">/ {total}</span>
                </div>
                <div className="h-1 bg-white/8 rounded-full overflow-hidden mt-2">
                  <div className={`h-full rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{width:`${pct}%`}} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: ER Controls + Appointments */}
          <div className="lg:col-span-7 space-y-5">
            {/* ER Status */}
            <div className="rounded-2xl bg-[#0d0f16] border border-white/8 p-5 shadow-xl">
              <h3 className="font-semibold text-sm text-slate-200 mb-3">ER Intake Status</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(STATUS_CONFIG).map(([key,cfg]) => (
                  <button key={key} onClick={() => handleErStatus(key)}
                    className={`py-2.5 px-3 rounded-xl text-[11px] font-bold border transition-all ${erStatus===key ? `${cfg.bg} ${cfg.color}` : 'bg-white/4 border-white/8 text-slate-400 hover:bg-white/8'}`}>
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bed Management */}
            <div className="rounded-2xl bg-[#0d0f16] border border-white/8 overflow-hidden shadow-xl">
              <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-200">Bed Management</h3>
                <span className="text-[10px] text-slate-500 font-mono">{totalFree} total free</span>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {label:'ICU Beds', fk:'icuFree', total:capacity.icuTotal, free:capacity.icuFree, color:'text-sky-400'},
                  {label:'ER Beds', fk:'erBedsFree', total:capacity.erBedsTotal, free:capacity.erBedsFree, color:'text-emerald-400'},
                  {label:'Ventilators', fk:'ventilatorsFree', total:capacity.ventilatorsTotal, free:capacity.ventilatorsFree, color:'text-purple-400'},
                  {label:'Trauma Bays', fk:'traumaBaysFree', total:capacity.traumaBaysTotal, free:capacity.traumaBaysFree, color:'text-amber-400'},
                ].map(({label,fk,total,free,color}) => {
                  const pct = total > 0 ? Math.round(((total-free)/total)*100) : 0;
                  const crit = pct >= 85;
                  return (
                    <div key={label} className={`rounded-xl border p-4 ${crit ? 'bg-red-500/8 border-red-500/25' : 'bg-white/4 border-white/8'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-300">{label}</span>
                        {crit && <span className="text-[10px] font-mono text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full border border-red-500/30">CRITICAL</span>}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xl font-bold font-mono ${crit ? 'text-red-400' : color}`}>{free}<span className="text-xs text-slate-500 ml-1">/ {total}</span></span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => adjustBed(fk, -1)} disabled={free<=0}
                            className="h-7 w-7 rounded-lg bg-white/8 hover:bg-red-500/20 border border-white/10 text-slate-300 hover:text-red-300 flex items-center justify-center font-bold transition-all disabled:opacity-30">−</button>
                          <button onClick={() => adjustBed(fk, 1)} disabled={free>=total}
                            className="h-7 w-7 rounded-lg bg-white/8 hover:bg-emerald-500/20 border border-white/10 text-slate-300 hover:text-emerald-300 flex items-center justify-center font-bold transition-all disabled:opacity-30">+</button>
                        </div>
                      </div>
                      <div className="h-1 bg-white/8 rounded-full overflow-hidden mt-2">
                        <div className={`h-full rounded-full transition-all ${crit ? 'bg-red-500' : 'bg-emerald-500'}`} style={{width:`${pct}%`}} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Appointments */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl bg-[#0d0f16] border border-white/8 overflow-hidden shadow-xl">
              <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-200">Incoming Appointments</h3>
                <div className="flex items-center gap-2">
                  {emergencies.length > 0 && <span className="text-[10px] font-mono text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full border border-red-500/30 animate-pulse">{emergencies.length} EMERGENCY</span>}
                  <span className="text-[10px] font-mono text-slate-500">{pending.length} pending</span>
                </div>
              </div>
              <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
                {appointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                    <Inbox size={36} className="mb-2 text-slate-500" />
                    <p className="text-sm">No appointments yet</p>
                  </div>
                ) : (
                  appointments.map(appt => {
                    const isSelected = selectedAppt?._id?.toString() === appt._id?.toString();
                    return (
                      <div key={appt._id?.toString()} onClick={() => setSelectedAppt(appt)}
                        className={`p-4 cursor-pointer hover:bg-white/4 transition-all ${isSelected ? 'bg-emerald-500/8 border-l-2 border-emerald-500' : ''} ${appt.emergency ? 'border-l-2 border-red-500' : ''}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-slate-100 flex items-center">{appt.patientName} {appt.emergency && <span className="text-red-400 ml-1"><AlertTriangle size={14} /></span>}</span>
                          <span className={`text-[10px] font-mono font-bold ${appt.status==='confirmed' ? 'text-emerald-400' : appt.status==='cancelled' ? 'text-red-400' : 'text-amber-400'}`}>{appt.status?.toUpperCase()}</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-1">{appt.department} · {appt.reason?.substring(0,40)}...</p>
                        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                          <span><Calendar size={12} className="inline mr-1" /> {appt.date}</span><span><Clock size={12} className="inline mr-1" /> {appt.time}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Selected Appointment Detail */}
            {selectedAppt && (
              <motion.div key={selectedAppt._id?.toString()} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                className="rounded-2xl bg-[#0d0f16] border border-white/10 p-5 shadow-xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-base text-slate-100">{selectedAppt.patientName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedAppt.age}y · {selectedAppt.gender} · {selectedAppt.phone}</p>
                  </div>
                  {selectedAppt.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApptAction(selectedAppt._id?.toString(), 'confirmed')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all"><Check size={14} className="inline mr-1" /> Admit</button>
                      <button onClick={() => handleApptAction(selectedAppt._id?.toString(), 'cancelled')}
                        className="px-3 py-1.5 rounded-lg bg-red-600/30 border border-red-500/40 text-red-300 hover:bg-red-600 hover:text-white text-xs font-semibold transition-all"><X size={14} className="inline mr-1" /> Decline</button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white/4 border border-white/8"><span className="text-slate-500">Dept: </span><span className="text-slate-200 font-semibold">{selectedAppt.department}</span></div>
                  <div className="p-2.5 rounded-lg bg-white/4 border border-white/8"><span className="text-slate-500">Slot: </span><span className="text-slate-200 font-semibold">{selectedAppt.date} {selectedAppt.time}</span></div>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/8 border border-amber-500/20">
                  <p className="text-[10px] text-amber-400 font-mono uppercase mb-1">Reason</p>
                  <p className="text-sm text-slate-200">{selectedAppt.reason}</p>
                </div>
                {selectedAppt.medicalHistory && (
                  <div className="p-3 rounded-lg bg-white/4 border border-white/8">
                    <p className="text-[10px] text-slate-500 font-mono uppercase mb-1">Medical History</p>
                    <p className="text-sm text-slate-300">{selectedAppt.medicalHistory}</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showBookModal && (
          <AppointmentModal onClose={() => setShowBookModal(false)} hospitalId={user.id} hospitalName={user.name} />
        )}
      </AnimatePresence>
    </div>
  );
}
