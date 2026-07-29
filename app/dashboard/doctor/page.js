'use client';
import { apiUrl } from '@/lib/apiClient';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredUser, clearStoredUser } from '@/lib/auth';
import { CheckCircle2, CalendarCheck, Stethoscope, AlertTriangle, Inbox, Calendar, Clock, Phone, Check, X, Save, MousePointerClick } from 'lucide-react';
import { getStoredTheme, applyTheme } from '@/lib/theme';

const SEV = {
  RED:    { bg: 'bg-red-500/15',     border: 'border-red-500/40',    text: 'text-red-400',    dot: 'bg-red-500'    },
  ORANGE: { bg: 'bg-amber-500/15',   border: 'border-amber-500/35',  text: 'text-amber-400',  dot: 'bg-amber-500'  },
  YELLOW: { bg: 'bg-yellow-500/12',  border: 'border-yellow-500/30', text: 'text-yellow-400', dot: 'bg-yellow-500' },
  GREEN:  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/25',text: 'text-emerald-400',dot: 'bg-emerald-500'},
};

function AppointmentModal({ onClose, doctorId, doctorName }) {
  const [form, setForm] = useState({
    patientName: '', age: '', gender: 'Male', phone: '',
    symptoms: '', medicalHistory: '', date: '', time: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const times = ['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
                  '02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM'];

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch(apiUrl('/api/appointments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, doctorId, doctorName, role: 'doctor' }),
      });
      setDone(true);
      setTimeout(onClose, 2000);
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-[#0d0f16] border border-white/12 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500" />
        <div className="p-6">
          {done ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4 text-emerald-400"><CheckCircle2 size={48} /></div>
              <h3 className="font-bold text-lg text-slate-100">Appointment Booked!</h3>
              <p className="text-slate-400 text-sm mt-1">Sent to Dr. {doctorName}'s dashboard</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-lg text-slate-100">Book Appointment</h3>
                  <p className="text-sm text-slate-500">with Dr. {doctorName}</p>
                </div>
                <button onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white flex items-center justify-center transition-all">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">Full Name *</label>
                    <input required value={form.patientName} onChange={e => setForm(p=>({...p,patientName:e.target.value}))}
                      placeholder="Your full name" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-all" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">Age *</label>
                    <input required type="number" value={form.age} onChange={e => setForm(p=>({...p,age:e.target.value}))}
                      placeholder="30" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-all" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">Gender</label>
                    <select value={form.gender} onChange={e => setForm(p=>({...p,gender:e.target.value}))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60 transition-all">
                      <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">Phone Number *</label>
                    <input required value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))}
                      placeholder="+91 XXXXXXXXXX" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-all" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">Preferred Date *</label>
                    <input required type="date" value={form.date} min={new Date().toISOString().split('T')[0]}
                      onChange={e => setForm(p=>({...p,date:e.target.value}))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60 transition-all" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">Time Slot *</label>
                    <select required value={form.time} onChange={e => setForm(p=>({...p,time:e.target.value}))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60 transition-all">
                      <option value="">Select time</option>
                      {times.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">Chief Symptoms *</label>
                    <textarea required value={form.symptoms} onChange={e => setForm(p=>({...p,symptoms:e.target.value}))}
                      placeholder="Describe your main symptoms..." rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-all resize-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">Medical History (optional)</label>
                    <textarea value={form.medicalHistory} onChange={e => setForm(p=>({...p,medicalHistory:e.target.value}))}
                      placeholder="Diabetes, hypertension, allergies, current medications..." rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-all resize-none" />
                  </div>
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-900/30">
                  {submitting ? 'Booking...' : <><CalendarCheck size={14} className="inline mr-1" /> Confirm Appointment</>}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function DoctorDashboard() {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [todaysAppointments, setTodaysAppointments] = useState([]);
  const [triageQueue, setTriageQueue] = useState([]);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' | 'triage'

  useEffect(() => {
    // Restore theme from localStorage on every page load
    applyTheme(getStoredTheme());
    const stored = getStoredUser();
    if (!stored || stored.role !== 'doctor') { window.location.href = '/'; return; }
    setUser(stored);
  }, []);

  useEffect(() => {
    if (!user) return;
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [user]);

  async function loadData() {
    try {
      const apptRes = await fetch(apiUrl(`/api/appointments?role=doctor&targetId=${user?.id || ''}`));
      const apptData = await apptRes.json();
      if (apptData.success) {
        const all = apptData.appointments;
        setAppointments(all);
        // Filter for today's date locally (from ISO date string)
        const todayStr = new Date().toISOString().split('T')[0];
        setTodaysAppointments(all.filter(a => a.date === todayStr));
      }
    } catch {}

    try {
      // Load triage queue
      const triRes = await fetch(apiUrl('/api/triage/history'));
      const triData = await triRes.json();
      if (triData.success && triData.history) {
        setTriageQueue(triData.history.map(d => ({
          id: d._id,
          name: d.request?.name || 'Anonymous',
          age: d.request?.age || '--',
          gender: d.request?.gender || '--',
          severity: d.result?.Severity_Color || 'GREEN',
          complaint: d.request?.narrative || 'N/A',
          vitals: `HR ${d.request?.biometrics?.bpm || '--'} · SpO₂ ${d.request?.biometrics?.spo2 || '--'}%`,
          flags: d.result?.Red_Flags_Detected || [],
          time: new Date(d.createdAt || Date.now()).toLocaleTimeString(),
        })));
      }
    } catch {}
  }

  async function handleApptAction(id, status) {
    try {
      await fetch(apiUrl('/api/appointments'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      setAppointments(prev => prev.map(a => a._id === id || a._id?.toString() === id ? { ...a, status } : a));
      if (selectedAppt?._id === id || selectedAppt?._id?.toString() === id) {
        setSelectedAppt(prev => ({ ...prev, status }));
      }
    } catch {}
  }

  async function handleSaveNotes() {
    if (!selectedAppt) return;
    try {
      await fetch(apiUrl('/api/appointments'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedAppt._id, status: selectedAppt.status, doctorNotes: notes }),
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 3000);
    } catch {}
  }

  if (!user) return <div className="min-h-screen bg-[#07080c] text-white flex items-center justify-center text-sm">Loading...</div>;

  const pendingAppts = appointments.filter(a => a.status === 'pending');
  const confirmedAppts = appointments.filter(a => a.status === 'confirmed');
  const sevConfig = selectedAppt ? (SEV[selectedAppt?.severity] || SEV.GREEN) : null;

  return (
    <div className="min-h-screen bg-[#07080c] text-slate-100" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-blue-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[300px] bg-emerald-500/4 rounded-full blur-[90px]" />
      </div>

      {/* Navbar */}
      <header className="relative z-30 border-b border-white/8 bg-[#07080c]/90 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0 text-blue-400"><Stethoscope size={18} /></div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-100">SANJEEVANI</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-500/30 text-blue-400 font-mono">DOCTOR</span>
              </div>
              <p className="text-[11px] text-slate-500">{user.name} · {user.specialization || 'General Physician'}</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowBookModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all">
              <CalendarCheck size={14} /> Book Appointment
            </button>
            <Link href="/" onClick={clearStoredUser}
              className="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-300 transition-all">
              Logout
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Today's Appointments Banner */}
        {todaysAppointments.length > 0 && (
          <div className="mb-5 rounded-2xl border border-blue-500/25 bg-blue-500/8 p-4">
            <p className="text-[11px] font-mono uppercase text-blue-400 tracking-widest mb-3 flex items-center gap-2">
              <Calendar size={12} /> Today's Schedule — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <div className="flex flex-wrap gap-2">
              {todaysAppointments.map(a => (
                <button
                  key={a._id?.toString()}
                  onClick={() => { setSelectedAppt(a); setNotes(a.doctorNotes || ''); setActiveTab('appointments'); }}
                  className="flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 hover:bg-blue-500/20 transition-all text-left"
                >
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${a.status === 'confirmed' ? 'bg-emerald-400' : a.status === 'cancelled' ? 'bg-red-400' : 'bg-amber-400'}`} />
                  <div>
                    <p className="text-[13px] font-semibold text-slate-100">{a.patientName}</p>
                    <p className="text-[11px] text-blue-400 font-mono">{a.time}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Pending Appointments', value: pendingAppts.length, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            { label: 'Confirmed Today', value: confirmedAppts.length, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Triage Alerts', value: triageQueue.filter(t => t.severity === 'RED').length, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-2xl border p-4 ${bg}`}>
              <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-white/4 border border-white/8 rounded-xl p-1 mb-5 w-fit">
          {[{id: 'appointments', label: 'Appointments', icon: <CalendarCheck size={14} className="inline mr-1" />}, {id: 'triage', label: 'Triage Queue', icon: <AlertTriangle size={14} className="inline mr-1" />}].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab===tab.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: List */}
          <div className="lg:col-span-5 space-y-3">
            {activeTab === 'appointments' ? (
              appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 border border-white/6 bg-white/3 rounded-2xl text-slate-500">
                  <Inbox size={36} className="mb-3 text-slate-500" />
                  <p className="text-sm">No appointments yet</p>
                  <p className="text-xs mt-1">Patients can book via the "Book Appointment" button</p>
                </div>
              ) : (
                appointments.map((appt, i) => {
                  const isSelected = selectedAppt?._id?.toString() === appt._id?.toString();
                  const statusColor = appt.status === 'confirmed' ? 'text-emerald-400' : appt.status === 'cancelled' ? 'text-red-400' : 'text-amber-400';
                  return (
                    <motion.button key={appt._id?.toString()} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                      onClick={() => { setSelectedAppt(appt); setNotes(appt.doctorNotes || ''); }}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${isSelected ? 'bg-blue-500/10 border-blue-500/35' : 'bg-[#0d0f16] border-white/8 hover:border-white/16'}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-sm text-slate-100">{appt.patientName}</span>
                        <span className={`text-[10px] font-bold font-mono uppercase ${statusColor}`}>{appt.status}</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-1">{appt.symptoms?.substring(0,60)}...</p>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                        <span><Calendar size={12} className="inline mr-1" />{appt.date}</span><span><Clock size={12} className="inline mr-1" />{appt.time}</span><span>{appt.gender} · {appt.age}y</span>
                      </div>
                    </motion.button>
                  );
                })
              )
            ) : (
              triageQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 border border-white/6 bg-white/3 rounded-2xl text-slate-500">
                  <CheckCircle2 size={36} className="mb-3 text-slate-500" /><p className="text-sm">No triage alerts</p>
                </div>
              ) : (
                triageQueue.map((t, i) => {
                  const s = SEV[t.severity] || SEV.GREEN;
                  return (
                    <motion.div key={t.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                      className={`p-4 rounded-2xl border ${s.bg} ${s.border}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm text-slate-100">{t.name}</span>
                        <span className={`text-[10px] font-bold font-mono ${s.text}`}>{t.severity}</span>
                      </div>
                      <p className="text-xs text-slate-300 mb-1">{t.complaint}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{t.vitals} · {t.time}</p>
                      {t.flags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {t.flags.slice(0,3).map(f => <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/25">{f}</span>)}
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )
            )}
          </div>

          {/* Right: Detail panel */}
          <div className="lg:col-span-7">
            {selectedAppt && activeTab === 'appointments' ? (
              <motion.div key={selectedAppt._id?.toString()} initial={{opacity:0,x:12}} animate={{opacity:1,x:0}}
                className="rounded-2xl bg-[#0d0f16] border border-white/10 shadow-xl overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500" />
                <div className="p-6 space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-bold text-xl text-slate-100">{selectedAppt.patientName}</h2>
                      <p className="text-sm text-slate-400 mt-0.5">{selectedAppt.age} yrs · {selectedAppt.gender} · <Phone size={12} className="inline mx-1" />{selectedAppt.phone}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {selectedAppt.status === 'pending' && (
                        <>
                          <button onClick={() => handleApptAction(selectedAppt._id?.toString(), 'confirmed')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all">
                            <Check size={14} className="inline mr-1" /> Confirm
                          </button>
                          <button onClick={() => handleApptAction(selectedAppt._id?.toString(), 'cancelled')}
                            className="px-3 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600 border border-red-500/40 text-red-300 hover:text-white text-xs font-semibold transition-all">
                            <X size={14} className="inline mr-1" /> Cancel
                          </button>
                        </>
                      )}
                      {selectedAppt.status === 'confirmed' && (
                        <button onClick={() => handleApptAction(selectedAppt._id?.toString(), 'completed')}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all">
                          <Check size={14} className="inline mr-1" /> Mark Complete
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
                      <p className="text-[10px] text-slate-500 font-mono uppercase mb-1">Date & Time</p>
                      <p className="text-sm font-semibold text-slate-200">{selectedAppt.date} · {selectedAppt.time}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
                      <p className="text-[10px] text-slate-500 font-mono uppercase mb-1">Status</p>
                      <p className={`text-sm font-bold capitalize ${selectedAppt.status === 'confirmed' ? 'text-emerald-400' : selectedAppt.status === 'cancelled' ? 'text-red-400' : 'text-amber-400'}`}>{selectedAppt.status}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-500/8 border border-amber-500/20">
                    <p className="text-[10px] text-amber-400 font-mono uppercase mb-1.5">Chief Symptoms</p>
                    <p className="text-sm text-slate-200">{selectedAppt.symptoms}</p>
                  </div>

                  {selectedAppt.medicalHistory && (
                    <div className="p-4 rounded-xl bg-white/4 border border-white/8">
                      <p className="text-[10px] text-slate-500 font-mono uppercase mb-1.5">Medical History</p>
                      <p className="text-sm text-slate-300">{selectedAppt.medicalHistory}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-[11px] text-slate-500 font-mono uppercase mb-2">Doctor's Notes / Prescription</p>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                      placeholder="Write prescription, follow-up plan, test recommendations..."
                      className="w-full bg-white/4 border border-white/10 rounded-xl px-3.5 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 resize-none transition-all" />
                    <div className="flex items-center justify-between mt-2">
                      <button onClick={handleSaveNotes}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5">
                        <Save size={14} /> Save Notes
                      </button>
                      {notesSaved && <span className="text-emerald-400 text-xs font-mono flex items-center gap-1"><Check size={12} /> Saved</span>}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 border border-white/6 bg-white/3 rounded-2xl text-slate-500">
                <MousePointerClick size={48} className="mb-3 text-slate-500" />
                <p className="text-sm">{activeTab === 'appointments' ? 'Select an appointment to review' : 'Triage cases shown on the left'}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Book Appointment Modal — opens for demo even though the doctor is booking for themselves */}
      <AnimatePresence>
        {showBookModal && (
          <AppointmentModal
            onClose={() => setShowBookModal(false)}
            doctorId={user.id}
            doctorName={user.name}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
