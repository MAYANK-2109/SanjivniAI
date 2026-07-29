'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, X, CheckCircle2, CalendarCheck, User, Phone, Clock
} from 'lucide-react';
import { apiUrl } from '@/lib/apiClient';

const TIME_SLOTS = [
  '09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM'
];

export default function BookSlotModal({ doctor, onClose }) {
  const [form, setForm] = useState({
    patientName: '', age: '', gender: 'Male', phone: '',
    symptoms: '', medicalHistory: '', date: '', time: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(apiUrl('/api/appointments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          doctorId: String(doctor.id),
          doctorName: doctor.name,
          doctorSpec: doctor.spec,
          hospital: doctor.hospital,
          role: 'doctor',
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to book');
      setDone(true);
      setTimeout(onClose, 2500);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-lg bg-[#0d0f16] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto"
          initial={{ scale: 0.93, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 320 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Top bar */}
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500" />

          <div className="p-6">
            {done ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="flex justify-center mb-4 text-emerald-400">
                  <CheckCircle2 size={52} />
                </div>
                <h3 className="font-bold text-xl text-slate-100">Appointment Booked!</h3>
                <p className="text-slate-400 text-sm mt-2">
                  Your slot with <span className="text-emerald-400 font-semibold">{doctor.name}</span> has been sent.<br />
                  The doctor will confirm it shortly.
                </p>
              </motion.div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="font-bold text-lg text-slate-100">Book Appointment</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-blue-400 font-semibold">{doctor.name}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-xs text-slate-500">{doctor.spec}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{doctor.hospital}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-all flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Full Name */}
                    <div className="col-span-2">
                      <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          required value={form.patientName} onChange={set('patientName')}
                          placeholder="Your full name"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-all"
                        />
                      </div>
                    </div>

                    {/* Age */}
                    <div>
                      <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">
                        Age *
                      </label>
                      <input
                        required type="number" min="1" max="120" value={form.age} onChange={set('age')}
                        placeholder="30"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-all"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">
                        Gender
                      </label>
                      <select
                        value={form.gender} onChange={set('gender')}
                        className="w-full bg-[#0d0f16] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60 transition-all"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Phone */}
                    <div className="col-span-2">
                      <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          required value={form.phone} onChange={set('phone')}
                          placeholder="+91 XXXXXXXXXX"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-all"
                        />
                      </div>
                    </div>

                    {/* Date */}
                    <div>
                      <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">
                        Date *
                      </label>
                      <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          required type="date" value={form.date}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={set('date')}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60 transition-all"
                        />
                      </div>
                    </div>

                    {/* Time Slot */}
                    <div>
                      <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">
                        Time Slot *
                      </label>
                      <div className="relative">
                        <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <select
                          required value={form.time} onChange={set('time')}
                          className="w-full bg-[#0d0f16] border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60 transition-all appearance-none"
                        >
                          <option value="">Select time</option>
                          {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Symptoms */}
                    <div className="col-span-2">
                      <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">
                        Chief Symptoms *
                      </label>
                      <textarea
                        required value={form.symptoms} onChange={set('symptoms')}
                        placeholder="Describe your main symptoms..."
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-all resize-none"
                      />
                    </div>

                    {/* Medical History */}
                    <div className="col-span-2">
                      <label className="text-[11px] text-slate-500 uppercase tracking-wide font-mono block mb-1.5">
                        Medical History <span className="text-slate-600 normal-case">(optional)</span>
                      </label>
                      <textarea
                        value={form.medicalHistory} onChange={set('medicalHistory')}
                        placeholder="Diabetes, hypertension, allergies, current medications..."
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-all resize-none"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  )}

                  <button
                    type="submit" disabled={submitting}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
                  >
                    <CalendarCheck size={16} />
                    {submitting ? 'Booking…' : 'Confirm Appointment'}
                  </button>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
