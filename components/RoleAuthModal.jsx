'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Ambulance, Building2, Stethoscope, HeartPulse, KeyRound, UserPlus, X, CheckCircle2 } from 'lucide-react';
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

                  {/* ── Submit ── */}
                  <button
                    id={`${role}-auth-submit`}
                    type="submit"
                    className="auth-submit-btn"
                    style={{ background: cfg.accent, boxShadow: `0 4px 20px ${cfg.accent}40` }}
                  >
                    {cfg.icon}
                    {mode === 'login'
                      ? `Sign in as ${cfg.label}`
                      : `Register as ${cfg.label}`}
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
          <div className="auth-modal-footer">
            <p className="auth-modal-footer-text">
              🔒 Secured · Sanjeevani MedGemma-27B Health Network
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
