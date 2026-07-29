'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, Star, MapPin, Phone, ArrowRight, CheckCircle, CalendarCheck, X } from 'lucide-react';

function QuickBookModal({ doctor, onClose }) {
  const [form, setForm] = useState({ patientName: '', phone: '', symptoms: '', date: '', time: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const times = ['09:00 AM','10:00 AM','11:00 AM','02:00 PM','03:00 PM','04:00 PM'];

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, doctorId: doctor.id, doctorName: doctor.name, role: 'doctor' }),
      });
      setDone(true);
      setTimeout(onClose, 2200);
    } catch { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-[#0d0f16] border border-blue-500/25 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-cyan-500" />
        <div className="p-5">
          {done ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-semibold text-slate-100">Appointment Requested!</p>
              <p className="text-sm text-slate-400 mt-1">Sent to Dr. {doctor.name}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-slate-100">{doctor.name}</p>
                  <p className="text-xs text-blue-400">{doctor.spec}</p>
                </div>
                <button onClick={onClose} className="h-7 w-7 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center"><X size={14} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input required value={form.patientName} onChange={e => setForm(p=>({...p,patientName:e.target.value}))}
                  placeholder="Your full name *" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all" />
                <input required value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))}
                  placeholder="Phone number *" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all" />
                <div className="grid grid-cols-2 gap-2">
                  <input required type="date" value={form.date} min={new Date().toISOString().split('T')[0]}
                    onChange={e => setForm(p=>({...p,date:e.target.value}))}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all" />
                  <select required value={form.time} onChange={e => setForm(p=>({...p,time:e.target.value}))}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all">
                    <option value="">Time slot</option>
                    {times.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <textarea required value={form.symptoms} onChange={e => setForm(p=>({...p,symptoms:e.target.value}))}
                  placeholder="Brief symptom description *" rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all resize-none" />
                <button type="submit" disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold text-sm transition-all">
                  {submitting ? 'Booking...' : '📅 Book Appointment'}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}


export default function ReferredDoctors({ specialization }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [bookingDoctor, setBookingDoctor] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/doctors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ specialization })
        });
        const data = await res.json();
        if (active && data.doctors) {
          setDoctors(data.doctors.slice(0, 2));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchDoctors();
    return () => { active = false; };
  }, [specialization]);

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-blue-500/15">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
            <Stethoscope size={15} />
          </div>
          <div>
            <p className="font-display text-[13px] font-bold text-blue-300">Recommended Specialists</p>
            {specialization && (
              <p className="text-[11px] text-blue-400/60 font-mono">{specialization}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => router.push(`/specialists?spec=${encodeURIComponent(specialization || '')}`)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30 px-3 py-1.5 text-[11px] font-semibold text-blue-300 hover:bg-blue-500/30 transition-all"
        >
          See All <ArrowRight size={12} />
        </button>
      </div>

      {/* Body */}
      <div className="divide-y divide-blue-500/10">
        {loading ? (
          /* Skeleton */
          [0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
              <div className="h-9 w-9 rounded-full bg-white/5 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/5 rounded bg-white/5" />
                <div className="h-2 w-3/5 rounded bg-white/5" />
              </div>
              <div className="h-7 w-7 rounded-full bg-white/5" />
            </div>
          ))
          ) : doctors.length === 0 ? (
            <div className="py-8 px-4 text-center">
              <p className="text-[12px] text-blue-400/60">No available specialists found in your area at the moment.</p>
            </div>
          ) : (
          doctors.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 px-4 py-3"
            >
              {/* Avatar */}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/20 shrink-0">
                <Stethoscope size={15} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-display text-[13px] font-semibold text-slate-200 truncate">{doc.name}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                  <span className="text-blue-400 font-medium">{doc.spec}</span>
                  <span className="text-slate-600">·</span>
                  <span className="flex items-center gap-0.5 text-amber-400">
                    <Star size={10} fill="currentColor" /> {doc.rating}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="flex items-center gap-0.5 text-slate-500">
                    <MapPin size={10} /> {doc.distance}
                  </span>
                </div>
                {doc.available && (
                  <p className="flex items-center gap-1 text-[10px] text-emerald-400 mt-0.5">
                    <CheckCircle size={9} /> {doc.availableSlot}
                  </p>
                )}
              </div>

      {/* Call + Book buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`tel:${doc.phone}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-blue-500/20 hover:border-blue-500/30 hover:text-blue-300 transition-all"
                >
                  <Phone size={13} />
                </a>
                <button
                  onClick={() => setBookingDoctor(doc)}
                  className="flex h-8 items-center justify-center gap-1 rounded-full px-3 bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600 hover:text-white text-[11px] font-semibold transition-all"
                >
                  <CalendarCheck size={12} />
                  Book
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {bookingDoctor && <QuickBookModal doctor={bookingDoctor} onClose={() => setBookingDoctor(null)} />}
      </AnimatePresence>
    </div>
  );
}
