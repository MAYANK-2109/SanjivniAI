'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Stethoscope, Star, MapPin, Phone, Calendar,
  Clock, CheckCircle, XCircle, Search, Filter
} from 'lucide-react';
import { getDoctorsBySpec, ALL_DOCTORS } from '@/lib/doctors';

/* ── Doctor Card ─────────────────────────────────────── */
function DoctorCard({ doc, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="group relative flex flex-col rounded-2xl border border-white/8 bg-white/3 hover:bg-white/5 hover:border-white/15 transition-all overflow-hidden"
    >
      {/* Availability strip */}
      <div className={`h-1 w-full ${doc.available ? 'bg-emerald-500' : 'bg-slate-600'}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/20 text-blue-400">
            <Stethoscope size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-[15px] font-bold text-slate-100 truncate">{doc.name}</h3>
            <p className="text-[12px] font-semibold text-blue-400 mt-0.5">{doc.spec}</p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{doc.hospital}</p>
          </div>
          <div className={`shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
            doc.available
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-slate-700/50 text-slate-500'
          }`}>
            {doc.available ? <CheckCircle size={10} /> : <XCircle size={10} />}
            {doc.available ? 'Available' : 'Busy'}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-4 text-[12px]">
          <span className="flex items-center gap-1 text-amber-400 font-semibold">
            <Star size={12} fill="currentColor" /> {doc.rating}
            <span className="text-slate-500 font-normal">({doc.reviews})</span>
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <MapPin size={12} /> {doc.distance}
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <Clock size={12} /> {doc.exp}
          </span>
        </div>

        {/* Slot */}
        <div className="flex items-center gap-2 rounded-xl border border-white/6 bg-white/3 px-3 py-2 mb-4">
          <Calendar size={13} className="text-emerald-400 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">Next Available</p>
            <p className="text-[12px] font-semibold text-slate-200">{doc.availableSlot}</p>
          </div>
        </div>

        {/* Specialization tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {doc.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-white/5 border border-white/8 px-2.5 py-0.5 text-[11px] text-slate-400">
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <a
            href={`tel:${doc.phone}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/15 py-2.5 font-display text-[12px] font-semibold text-blue-300 hover:bg-blue-500/25 transition-all"
          >
            <Phone size={14} /> Call
          </a>
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 font-display text-[12px] font-bold text-white hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-900/30"
          >
            <Calendar size={14} /> Book Slot
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main Page Content ───────────────────────────────── */
function SpecialistsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const specParam = searchParams.get('spec') || '';

  const [search, setSearch] = useState('');
  const [filterSpec, setFilterSpec] = useState(specParam);
  const [doctors, setDoctors] = useState([]);

  // Unique specializations for the filter bar
  const allSpecs = [...new Set(ALL_DOCTORS.map((d) => d.spec))];

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  useEffect(() => {
    const kw = filterSpec || search;
    setDoctors(getDoctorsBySpec(kw));
  }, [filterSpec, search]);

  return (
    <div className="min-h-screen bg-[#0B0C10]" data-theme="dark">
      {/* Fixed Header */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0B0C10]/90 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 flex items-center gap-4 h-14">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[13px] font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="flex-1">
            <h1 className="font-display text-[15px] font-bold text-slate-100">
              {specParam ? `${specParam} Specialists` : 'All Specialists'}
            </h1>
            <p className="text-[11px] text-slate-500 font-mono">
              {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-emerald-400 uppercase tracking-wider">Live · MedGemma</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        {/* Search + Filter */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name or condition..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setFilterSpec(''); }}
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-[13px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all font-mono"
            />
          </div>

          {/* Spec pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter size={14} className="text-slate-500 shrink-0" />
            <button
              onClick={() => { setFilterSpec(''); setSearch(''); }}
              className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold transition-all border ${
                filterSpec === '' && search === ''
                  ? 'border-blue-500/50 bg-blue-500/15 text-blue-300'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            {allSpecs.map((s) => (
              <button
                key={s}
                onClick={() => { setFilterSpec(s); setSearch(''); }}
                className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold transition-all border ${
                  filterSpec === s
                    ? 'border-blue-500/50 bg-blue-500/15 text-blue-300'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Triage recommendation banner */}
        {specParam && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 rounded-xl border border-blue-500/25 bg-blue-500/8 px-4 py-3"
          >
            <Stethoscope size={18} className="text-blue-400 shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-blue-300">AI Triage Recommendation</p>
              <p className="text-[12px] text-blue-400/70">
                Based on your symptoms, a <span className="font-bold text-blue-300">{specParam}</span> is recommended.
                Doctors below are matched to this specialization.
              </p>
            </div>
          </motion.div>
        )}

        {/* Doctor grid */}
        {doctors.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doc, i) => (
              <DoctorCard key={doc.id} doc={doc} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Stethoscope size={48} className="text-slate-700 mb-4" />
            <p className="font-display text-[16px] font-bold text-slate-400">No specialists found</p>
            <p className="text-[13px] text-slate-600 mt-1">Try a different search or clear the filter</p>
            <button
              onClick={() => { setFilterSpec(''); setSearch(''); }}
              className="mt-4 rounded-xl border border-white/10 px-4 py-2 text-[13px] text-slate-400 hover:text-slate-200 transition-all"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

/* ── Page export with Suspense (required for useSearchParams) ── */
export default function SpecialistsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Stethoscope size={24} className="animate-pulse" />
          <span className="font-display text-sm">Loading specialists…</span>
        </div>
      </div>
    }>
      <SpecialistsContent />
    </Suspense>
  );
}
