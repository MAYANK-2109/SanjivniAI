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
    bgActive: 'role-tab-active-red',
    bgInactive: 'role-tab-inactive',
    desc: 'Paramedic & dispatch console — GPS navigation, pre-arrival ER alerts, telemetry.',
  },
  hospital: {
    label: 'Hospital',
    icon: <Building2 size={24} />,
    color: 'emerald',
    accent: '#10B981',
    bgActive: 'role-tab-active-emerald',
    bgInactive: 'role-tab-inactive',
    desc: 'ER & ICU capacity desk — manage beds, incoming ambulances, intake diversion.',
  },
  doctor: {
    label: 'Doctor',
    icon: <Stethoscope size={24} />,
    color: 'blue',
    accent: '#3B82F6',
    bgActive: 'role-tab-active-blue',
    bgInactive: 'role-tab-inactive',
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

export default function RoleAuthModal({ isOpen, onClose }) {
  const router = useRouter();
  const [role, setRole]       = useState('ambulance');
  const [mode, setMode]       = useState('login');   // 'login' | 'register'
  const [form, setForm]       = useState({});
  const [done, setDone]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  if (!isOpen) return null;

  const cfg = ROLES[role];

  function handleField(id, val) {
    setError(null);
    setForm((p) => ({ ...p, [id]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const emailOrPhone = (form.email || '').trim();
    const password = form.password || '';

    // Validation 1: Email or Phone required
    if (!emailOrPhone) {
      setError('Please enter your Email Address or Phone Number.');
      return;
    }

    // Validation 2: Email or Phone format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[+\d][\d\s\-()]{7,15}$/;

    if (!emailRegex.test(emailOrPhone) && !phoneRegex.test(emailOrPhone)) {
      setError('Invalid identifier format. Enter a valid email (e.g. name@domain.com) or phone number (e.g. +91 9876543210).');
      return;
    }

    // Validation 3: Password minimum length
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    // Registration specific validations
    if (mode === 'register') {
      if (form.confirm_pw !== undefined && password !== form.confirm_pw) {
        setError('Password and Confirm Password do not match.');
        return;
      }

      if (role === 'ambulance') {
        if (!form.org_name?.trim() || !form.driver_name?.trim() || !form.vehicle_reg?.trim()) {
          setError('Organization name, Driver name, and Vehicle registration number are required.');
          return;
        }
      } else if (role === 'doctor') {
        if (!form.full_name?.trim() || !form.med_reg?.trim() || !form.specialization?.trim()) {
          setError('Full name, Medical Registration number, and Specialization are required.');
          return;
        }
      } else if (role === 'hospital') {
        if (!form.hospital_name?.trim() || !form.reg_no?.trim() || !form.city?.trim()) {
          setError('Hospital name, Registration number, and City are required.');
          return;
        }
      }
    }

    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload  = { ...form, email: emailOrPhone, role };

      const res  = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      // Persist the profile + token in localStorage
      setStoredUser({ ...data.profile, token: data.token });
      setDone(true);

      setTimeout(() => {
        setDone(false);
        setLoading(false);
        onClose();
        router.push(`/dashboard/${role}`);
      }, 1200);
    } catch (err) {
      console.error('Auth error:', err);
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="auth-modal-box"
          initial={{ scale: 0.92, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Top gradient accent bar ── */}
          <div className="auth-modal-bar" />

          {/* ── Modal header ── */}
          <div className="auth-modal-header">
            <div className="flex items-center gap-3">
              <div className="auth-modal-icon">
                <HeartPulse size={20} />
              </div>
              <div>
                <h2 className="auth-modal-title">Login / Signup</h2>
                <p className="auth-modal-sub">Sanjeevani Health Portal</p>
              </div>
            </div>
            <button onClick={onClose} className="auth-close-btn">
              <X size={16} />
            </button>
          </div>

          {/* ── Role selector ── */}
          <div className="auth-role-section">
            <p className="auth-section-label">Select your role</p>
            <div className="auth-role-grid">
              {Object.entries(ROLES).map(([key, r]) => (
                <button
                  key={key}
                  onClick={() => { setRole(key); setForm({}); }}
                  className={`auth-role-tab ${role === key ? r.bgActive : r.bgInactive}`}
                  style={role === key ? { borderColor: `${r.accent}60`, background: `${r.accent}15`, color: r.accent } : {}}
                >
                  <span className="auth-role-icon">{r.icon}</span>
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
                className="auth-role-desc"
                style={{ borderColor: `${cfg.accent}30`, background: `${cfg.accent}0D` }}
              >
                <p className="auth-role-desc-text" style={{ color: cfg.accent }}>
                  <span className="auth-role-desc-icon">{cfg.icon}</span>
                  <span>
                    <span className="auth-role-desc-name">{cfg.label} Portal</span>
                    {cfg.desc}
                  </span>
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Login / Register tab switch ── */}
          <div className="auth-tab-switch">
            <div className="auth-tab-row">
              {['login', 'register'].map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setForm({}); }}
                  className={`auth-tab-btn ${mode === m ? 'auth-tab-active' : 'auth-tab-inactive'}`}
                >
                  {m === 'login' ? <><KeyRound size={14} /> Sign In</> : <><UserPlus size={14} /> Register Free</>}
                </button>
              ))}
            </div>
          </div>

          {/* ── Form body (scrollable) ── */}
          <div className="auth-form-body">
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="auth-done-state"
                >
                  <div style={{ color: '#10B981' }}>
                    <CheckCircle2 size={48} />
                  </div>
                  <p className="auth-done-title">
                    {mode === 'login' ? 'Login Successful!' : 'Account Created!'}
                  </p>
                  <p className="auth-done-sub">Redirecting to your dashboard…</p>
                </motion.div>
              ) : (
                <motion.form
                  key={`${role}-${mode}`}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSubmit}
                  className="auth-form-fields"
                >
                  {mode === 'login' ? (
                    /* ── LOGIN fields ── */
                    <>
                      <div>
                        <label className="auth-field-label">Email / Phone</label>
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
                          className="auth-input"
                          required
                        />
                      </div>
                      <div>
                        <label className="auth-field-label">Password</label>
                        <input
                          id={`${role}-login-password`}
                          type="password"
                          placeholder="••••••••"
                          value={form.password ?? ''}
                          onChange={(e) => handleField('password', e.target.value)}
                          className="auth-input"
                          required
                        />
                      </div>
                      <div className="auth-remember-row">
                        <label className="auth-remember-label">
                          <input type="checkbox" className="auth-checkbox" />
                          <span>Remember me</span>
                        </label>
                        <button type="button" className="auth-forgot-btn">
                          Forgot password?
                        </button>
                      </div>
                    </>
                  ) : (
                    /* ── REGISTER fields per role ── */
                    <div className="auth-reg-grid">
                      {REGISTER_FIELDS[role].map((f) => (
                        <div
                          key={f.id}
                          className={
                            f.type === 'password' || f.id === 'address' || f.id === 'org_name' || f.id === 'hospital_name'
                              ? 'auth-field-full'
                              : ''
                          }
                        >
                          <label className="auth-field-label">{f.label}</label>
                          <input
                            id={`${role}-reg-${f.id}`}
                            type={f.type}
                            placeholder={f.placeholder}
                            value={form[f.id] ?? ''}
                            onChange={(e) => handleField(f.id, e.target.value)}
                            className="auth-input"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Error banner ── */}
                  {error && (
                    <div className="auth-error-banner">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {error}
                    </div>
                  )}

                  {/* ── Submit ── */}
                  <button
                    id={`${role}-auth-submit`}
                    type="submit"
                    disabled={loading}
                    className="auth-submit-btn"
                    style={{ background: cfg.accent, boxShadow: `0 4px 20px ${cfg.accent}40`, opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? (
                      <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4"/>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : cfg.icon}
                    {loading
                      ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                      : (mode === 'login' ? `Sign in as ${cfg.label}` : `Register as ${cfg.label}`)}
                  </button>

                  <p className="auth-switch-text">
                    {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
                    <button
                      type="button"
                      className="auth-switch-btn"
                      style={{ color: '#10B981' }}
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
