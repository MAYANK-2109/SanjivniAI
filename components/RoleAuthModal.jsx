'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Ambulance, Building2, Stethoscope, HeartPulse, KeyRound, UserPlus, X, CheckCircle2, Lock } from 'lucide-react';
import { setStoredUser } from '@/lib/auth';

/* ─── Role config ──────────────────────────────────────────── */
const ROLES = {
  ambulance: {
    label: 'Ambulance',
    icon: <Ambulance size={24} />,
    color: 'red',
    accent: '#EF4444',
    bgActive: 'bg-red-500/15 border-red-500/50 text-red-300',
    bgInactive: 'text-slate-400 hover:text-red-300',
    badge: 'bg-red-500/15 text-red-400',
    desc: 'Paramedic & dispatch console — GPS navigation, pre-arrival ER alerts, telemetry.',
  },
  hospital: {
    label: 'Hospital',
    icon: <Building2 size={24} />,
    color: 'emerald',
    accent: '#10B981',
    bgActive: 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300',
    bgInactive: 'text-slate-400 hover:text-emerald-300',
    badge: 'bg-emerald-500/15 text-emerald-400',
    desc: 'ER & ICU capacity desk — manage beds, incoming ambulances, intake diversion.',
  },
  doctor: {
    label: 'Doctor',
    icon: <Stethoscope size={24} />,
    color: 'blue',
    accent: '#3B82F6',
    bgActive: 'bg-blue-500/15 border-blue-500/50 text-blue-300',
    bgInactive: 'text-slate-400 hover:text-blue-300',
    badge: 'bg-blue-500/15 text-blue-400',
    desc: 'Clinical triage & telehealth — AI diagnostics, video consultations, digital prescriptions.',
  },
};

/* ─── Field definitions per role ───────────────────────────── */
const REGISTER_FIELDS = {
  ambulance: [
    { id: 'org_name',    label: 'Organization / Service Name', placeholder: 'e.g. Delhi Emergency Services', type: 'text' },
    { id: 'vehicle_reg', label: 'Vehicle Registration No.',    placeholder: 'e.g. DL-01-AB-1234',           type: 'text' },
    { id: 'driver_name', label: "Driver / Paramedic's Name",   placeholder: 'e.g. Ramesh Kumar',            type: 'text' },
    { id: 'phone',       label: 'Contact Number',              placeholder: '+91 XXXXXXXXXX',               type: 'tel'  },
    { id: 'email',       label: 'Email Address',               placeholder: 'dispatch@example.com',         type: 'email'},
    { id: 'service_area',label: 'Service Area / Region',       placeholder: 'e.g. South Delhi',             type: 'text' },
    { id: 'password',    label: 'Password',                    placeholder: '••••••••',                     type: 'password'},
    { id: 'confirm_pw',  label: 'Confirm Password',            placeholder: '••••••••',                     type: 'password'},
  ],
  hospital: [
    { id: 'hospital_name',label: 'Hospital Name',              placeholder: 'e.g. AIIMS New Delhi',         type: 'text' },
    { id: 'reg_no',       label: 'Hospital Registration No.',  placeholder: 'e.g. MCI-XXXX-YYYY',           type: 'text' },
    { id: 'type',         label: 'Hospital Type',              placeholder: 'Government / Private / NGO',   type: 'text' },
    { id: 'address',      label: 'Full Address',               placeholder: 'Street, Area, Landmark',       type: 'text' },
    { id: 'city',         label: 'City',                       placeholder: 'e.g. Mumbai',                  type: 'text' },
    { id: 'state',        label: 'State',                      placeholder: 'e.g. Maharashtra',             type: 'text' },
    { id: 'phone',        label: 'Hospital Contact Number',    placeholder: '+91 XXXXXXXXXX',               type: 'tel'  },
    { id: 'email',        label: 'Official Email',             placeholder: 'admin@hospital.in',            type: 'email'},
    { id: 'password',     label: 'Password',                   placeholder: '••••••••',                     type: 'password'},
    { id: 'confirm_pw',   label: 'Confirm Password',           placeholder: '••••••••',                     type: 'password'},
  ],
  doctor: [
    { id: 'full_name',   label: 'Full Name',                   placeholder: 'Dr. Priya Sharma',             type: 'text' },
    { id: 'med_reg',     label: 'Medical Registration No.',    placeholder: 'e.g. MCI-12345-A',             type: 'text' },
    { id: 'specialization', label: 'Specialization',           placeholder: 'e.g. General Physician',       type: 'text' },
    { id: 'affiliation', label: 'Hospital / Clinic',           placeholder: 'e.g. Apollo Hospitals',        type: 'text' },
    { id: 'phone',       label: 'Mobile Number',               placeholder: '+91 XXXXXXXXXX',               type: 'tel'  },
    { id: 'email',       label: 'Email Address',               placeholder: 'doctor@example.com',           type: 'email'},
    { id: 'password',    label: 'Password',                    placeholder: '••••••••',                     type: 'password'},
    { id: 'confirm_pw',  label: 'Confirm Password',            placeholder: '••••••••',                     type: 'password'},
  ],
};

/* ─── Shared input style ────────────────────────────────────── */
const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-slate-200 text-[13px] placeholder:text-slate-600 focus:outline-none focus:border-mint-500/60 focus:bg-white/8 transition-all font-mono';

export default function RoleAuthModal({ isOpen, onClose }) {
  const router = useRouter();
  const [role, setRole]   = useState('ambulance');
  const [mode, setMode]   = useState('login');   // 'login' | 'register'
  const [form, setForm]   = useState({});
  const [done, setDone]   = useState(false);

  if (!isOpen) return null;

  const cfg = ROLES[role];

  function handleField(id, val) {
    setForm((p) => ({ ...p, [id]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setDone(true);
    try {
      const res = await fetch('/api/auth/profiles');
      const data = await res.json();
      if (data.profiles) {
        // Find the profile matching the selected role for now
        // In a real app, you'd match email/password here.
        const profile = data.profiles.find(p => p.role === role);
        if (profile) {
          setStoredUser(profile);
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }

    setTimeout(() => {
      setDone(false);
      onClose();
      router.push(`/dashboard/${role}`);
    }, 1000);
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0d0f14] shadow-2xl"
          initial={{ scale: 0.92, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Top gradient accent bar ── */}
          <div className="h-[3px] w-full"
            style={{ background: `linear-gradient(90deg, #EF4444, #3B82F6, #10B981)` }} />

          {/* ── Modal header ── */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-100">
                <HeartPulse size={20} />
              </div>
              <div>
                <h2 className="font-display text-[17px] font-bold text-slate-100">Login / Signup</h2>
                <p className="text-[12px] text-slate-500 font-mono">Sanjeevani Health Portal</p>
              </div>
            </div>
            <button onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all">
              <X size={16} />
            </button>
          </div>

          {/* ── Role selector ── */}
          <div className="px-6 pt-4">
            <p className="mono-tag text-slate-500 mb-2">Select your role</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(ROLES).map(([key, r]) => (
                <button
                  key={key}
                  onClick={() => { setRole(key); setForm({}); }}
                  className={`role-tab flex flex-col items-center gap-2 rounded-xl border py-3 px-2 font-display text-[12px] font-semibold transition-all ${
                    role === key ? r.bgActive : `border-white/8 bg-white/3 ${r.bgInactive}`
                  }`}
                >
                  <span className="text-xl">{r.icon}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>

            {/* Role description banner */}
            <AnimatePresence mode="wait">
              <motion.div
                key={role}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="mt-3 rounded-xl border px-4 py-3"
                style={{ borderColor: `${cfg.accent}30`, background: `${cfg.accent}0D` }}
              >
                <p className="text-[12px] leading-relaxed flex items-start gap-2" style={{ color: cfg.accent }}>
                  <span className="mt-0.5">{cfg.icon}</span>
                  <span>
                    <span className="font-semibold font-display block mb-0.5">{cfg.label} Portal</span>
                    {cfg.desc}
                  </span>
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Login / Register tab switch ── */}
          <div className="px-6 mt-4">
            <div className="flex rounded-xl border border-white/8 bg-white/4 p-1 gap-1">
              {['login', 'register'].map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setForm({}); }}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-display text-[12px] font-semibold capitalize transition-all ${
                    mode === m
                      ? 'bg-white/12 text-slate-100 shadow-sm'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {m === 'login' ? <><KeyRound size={14} /> Sign In</> : <><UserPlus size={14} /> Register Free</>}
                </button>
              ))}
            </div>
          </div>

          {/* ── Form body (scrollable) ── */}
          <div className="px-6 pb-6 mt-4 max-h-[52vh] overflow-y-auto custom-scroll">
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-10 gap-4"
                >
                  <div className="text-emerald-400">
                    <CheckCircle2 size={48} />
                  </div>
                  <p className="font-display text-[15px] font-bold text-slate-100">
                    {mode === 'login' ? 'Login Successful!' : 'Account Created!'}
                  </p>
                  <p className="text-[12px] text-slate-500 font-mono">Redirecting to your dashboard…</p>
                </motion.div>
              ) : (
                <motion.form
                  key={`${role}-${mode}`}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSubmit}
                  className="space-y-3"
                >
                  {mode === 'login' ? (
                    /* ── LOGIN fields ── */
                    <>
                      <div>
                        <label className="mono-tag text-slate-500 block mb-1.5">Email / Phone</label>
                        <input
                          id={`${role}-login-email`}
                          type="text"
                          placeholder={
                            role === 'hospital'  ? 'admin@hospital.in' :
                            role === 'ambulance' ? 'dispatch@ems.in' :
                                                   'doctor@example.com'
                          }
                          value={form.email ?? ''}
                          onChange={(e) => handleField('email', e.target.value)}
                          className={inputCls}
                          required
                        />
                      </div>
                      <div>
                        <label className="mono-tag text-slate-500 block mb-1.5">Password</label>
                        <input
                          id={`${role}-login-password`}
                          type="password"
                          placeholder="••••••••"
                          value={form.password ?? ''}
                          onChange={(e) => handleField('password', e.target.value)}
                          className={inputCls}
                          required
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="rounded border-white/20 bg-white/5 accent-mint-500" />
                          <span className="text-[12px] text-slate-400">Remember me</span>
                        </label>
                        <button type="button" className="text-[12px] text-mint-400 hover:text-mint-300 transition-colors">
                          Forgot password?
                        </button>
                      </div>
                    </>
                  ) : (
                    /* ── REGISTER fields per role ── */
                    <div className={`grid gap-3 ${role === 'ambulance' || role === 'doctor' ? 'grid-cols-2' : 'grid-cols-2'}`}>
                      {REGISTER_FIELDS[role].map((f) => (
                        <div
                          key={f.id}
                          className={
                            f.type === 'password' || f.id === 'address' || f.id === 'org_name' || f.id === 'hospital_name'
                              ? 'col-span-2'
                              : ''
                          }
                        >
                          <label className="mono-tag text-slate-500 block mb-1.5">{f.label}</label>
                          <input
                            id={`${role}-reg-${f.id}`}
                            type={f.type}
                            placeholder={f.placeholder}
                            value={form[f.id] ?? ''}
                            onChange={(e) => handleField(f.id, e.target.value)}
                            className={inputCls}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Submit ── */}
                  <button
                    id={`${role}-auth-submit`}
                    type="submit"
                    className="mt-2 w-full flex justify-center items-center gap-2 rounded-xl py-3 font-display text-[14px] font-bold text-white shadow-lg transition-all active:scale-[0.98] hover:brightness-110"
                    style={{ background: cfg.accent, boxShadow: `0 4px 20px ${cfg.accent}40` }}
                  >
                    {cfg.icon}
                    {mode === 'login'
                      ? `Sign in as ${cfg.label}`
                      : `Register as ${cfg.label}`}
                  </button>

                  <p className="text-center text-[12px] text-slate-500 pt-1">
                    {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
                    <button
                      type="button"
                      className="text-mint-400 hover:text-mint-300 font-semibold transition-colors flex items-center justify-center gap-1 mx-auto mt-1"
                      onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setForm({}); }}
                    >
                      {mode === 'login' ? 'Register free →' : 'Sign in →'}
                    </button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* ── Footer ── */}
          <div className="border-t border-white/6 px-6 py-3 text-center">
            <p className="font-mono text-[11px] text-slate-600 flex items-center justify-center gap-1.5">
              <Lock size={12} /> Secured · Sanjeevani MedGemma-27B Health Network
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

