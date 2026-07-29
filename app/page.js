'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import IntakeConsole   from '@/components/IntakeConsole';
import TriageResult    from '@/components/TriageResult';
import AmbulanceModal  from '@/components/AmbulanceModal';
import RideBookingModal from '@/components/RideBookingModal';
import NearbyFacilities from '@/components/NearbyFacilities';
import RoleAuthModal   from '@/components/RoleAuthModal';
import ReferredDoctors from '@/components/ReferredDoctors';
import { Moon, Sun, User, Phone, Ambulance } from 'lucide-react';
import { getStoredTheme, applyTheme } from '@/lib/theme';


/* ── Tiny sparkline helper ─────────────────────────────── */
function Sparkline({ points, color = '#10B981' }) {
  const w = 80, h = 28, pad = 2;
  const max = Math.max(...points), min = Math.min(...points);
  const range = max - min || 1;
  const pts = points.map((v, i) => {
    const x = pad + (i / (points.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Feature icon cards ─────────────────────────────────── */
const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    title: 'WHO-Aligned Triage',
    desc: 'Follows international triage standards',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: 'Multilingual AI',
    desc: 'Understands 5+ Indian languages',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    title: 'Emergency SOS',
    desc: 'Instant alerts for critical cases',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Biometric Inputs',
    desc: 'Secure patient identification',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    title: 'ASHA/PHC Routing',
    desc: 'Works in low or no connectivity',
  },
];

/* ── Role buttons config ────────────────────────────────── */
const ROLES_BTN = [
  { label: 'Ambulance', color: 'border-red-400 text-red-500 hover:bg-red-50 dark-hover:hover:bg-red-500/10',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M10 17l-5-5 5-5"/><path d="M20 18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8l4 4v10z"/><path d="M16 1v4h4"/></svg> },
  { label: 'Doctor', color: 'border-emerald-400 text-emerald-600 hover:bg-emerald-50 dark-hover:hover:bg-emerald-500/10',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
  { label: 'Hospital', color: 'border-teal-400 text-teal-600 hover:bg-teal-50 dark-hover:hover:bg-teal-500/10',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
];

/* ── Stats ──────────────────────────────────────────────── */
const STATS = [
  { val: '27B', label: 'MODEL PARAMS', color: '#10B981', lightColor: '#047857', points: [3,5,4,7,6,9,8,11,10,13] },
  { val: '5+',  label: 'LANGUAGES',   color: '#06B6D4', lightColor: '#0369A1', points: [2,4,3,6,5,8,7,9,8,11] },
  { val: '<3s', label: 'AVG. TRIAGE', color: '#F59E0B', lightColor: '#B45309', points: [8,6,9,5,7,4,8,6,9,5] },
];

/* ── Main Component ─────────────────────────────────────── */
export default function HomePage() {
  const [result, setResult]             = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sosOpen, setSosOpen]           = useState(false);
  const [bookAmbulanceOpen, setBookAmbulanceOpen] = useState(false);
  const [careType, setCareType]         = useState(null);
  const [careTrigger, setCareTrigger]   = useState(0);
  const [showTelehealth, setShowTelehealth] = useState(false);
  const [bodyRegion, setBodyRegion]     = useState(null);
  const [authOpen, setAuthOpen]         = useState(false);
  const [theme, setTheme] = useState('dark'); // will sync from localStorage in effect
  const [chatMessages, setChatMessages] = useState([
    { id: 1, from: 'ai', text: 'Hello! Type your symptoms or a health question below. Press Enter to chat, or tap "Run Triage" for a full assessment.', time: '—' },
  ]);
  const chatEndRef = useRef(null);

  // On mount: read saved theme from localStorage
  useEffect(() => {
    const saved = getStoredTheme();
    setTheme(saved);
    applyTheme(saved);
  }, []);

  // When theme changes (toggle): save + apply
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  function getFormattedNow() {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }


  async function handleTriage(inputs) {
    setIsProcessing(true);
    setResult(null);
    setCareType(null);
    setShowTelehealth(false);
    setChatMessages(p => [...p, { id: Date.now(), from: 'user', text: inputs.narrative.slice(0, 100) + (inputs.narrative.length > 100 ? '…' : ''), time: getFormattedNow() }]);
    try {
      const res = await fetch('/api/triage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...inputs, bodyRegion }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Triage failed');
      setResult(data);
      setChatMessages(p => [...p, { id: Date.now() + 1, from: 'ai', text: `Severity: ${data.Severity_Color ?? 'Unknown'} · ${data.Recommended_Action ?? 'See report below.'}`, time: getFormattedNow() }]);
      if (data.Severity_Color === 'RED' || data.ambulance_triggered) setSosOpen(true);
    } catch (err) {
      console.error(err);
      setChatMessages(p => [...p, { id: Date.now() + 2, from: 'ai', text: 'Triage failed. Check connection and try again.', time: getFormattedNow() }]);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleFindCare(type) { setCareType(type); setCareTrigger(p => p + 1); }

  const isDark = theme === 'dark';

  return (
    <div className={`app-root ${isDark ? 'is-dark' : 'is-light'}`}>

      <AmbulanceModal isOpen={sosOpen} onClose={() => setSosOpen(false)} severityColor={result?.Severity_Color} />
      <RideBookingModal isOpen={bookAmbulanceOpen} onClose={() => setBookAmbulanceOpen(false)} />
      <RoleAuthModal  isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {/* ══ NAVBAR ══════════════════════════════════════════ */}
      <header className="app-nav">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="brand-icon">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div>
            <div className="brand-name">SANJEEVANI</div>
            <div className="brand-sub">AI TRIAGE</div>
          </div>
        </div>

        {/* Right nav actions */}
        <div className="nav-actions">
          {/* Live badge */}
          <div className="live-badge nav-live-badge">
            <span className="live-dot" />
            MEDGEMMA · LIVE
          </div>
          {/* Theme */}
          <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className="icon-btn" title="Toggle theme">
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          {/* SOS */}
          <a href="tel:112" className="sos-btn">
            <Phone size={14} />
            <span className="sos-label">SOS</span>
          </a>
          {/* Book Ambulance */}
          <button onClick={() => setBookAmbulanceOpen(true)} className="login-btn book-amb-btn !bg-red-500/10 !text-red-500 !border-red-500/30 hover:!bg-red-500/20">
            <Ambulance size={15} /> <span className="nav-btn-label">Book Ambulance</span>
          </button>
          {/* Login */}
          <button onClick={() => setAuthOpen(true)} className="login-btn">
            <User size={15} /> <span className="nav-btn-label">Login</span>
          </button>
        </div>
      </header>

      {/* ══ SPLIT LAYOUT ════════════════════════════════════ */}
      <div className="split-wrap">

        {/* ══ LEFT PANEL ══════════════════════════════════ */}
        <motion.aside className="left-col" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>

          {/* Status pill */}
          <div className="status-pill">
            <span className="status-dot" />
            RURAL HEALTH TRIAGE · ACTIVE
          </div>

          {/* Headline */}
          <h1 className="headline">
            Language should<br />never delay <span className="headline-accent">care</span>.
          </h1>

          {/* Body */}
          <p className="body-text">
            Speak or type in <strong>Hindi, Bhojpuri, Marathi</strong> or Chhattisgarhi. MedGemma-27B normalizes symptoms into clinical terms, scores severity against{' '}
            <a href="https://www.who.int" className="link-accent" target="_blank" rel="noopener noreferrer">WHO triage guidelines</a>, and routes you to the right care — instantly.
          </p>
          <p className="body-text mt-2">
            Designed for <strong>rural & semi-urban India</strong> — covering areas with limited healthcare access and multilingual populations.
          </p>

          {/* Feature grid */}
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <p className="feature-title">{f.title}</p>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Role buttons */}
          <div className="role-btns">
            {ROLES_BTN.map((r) => (
              <button key={r.label} onClick={() => setAuthOpen(true)} className={`role-btn ${r.color}`}>
                {r.icon}
                {r.label}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="stats-row">
            {STATS.map((s) => {
              const statColor = isDark ? s.color : (s.lightColor || s.color);
              return (
                <div key={s.label} className="stat-box">
                  <div className="stat-val" style={{ color: statColor }}>{s.val}</div>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-spark">
                    <Sparkline points={s.points} color={statColor} />
                  </div>
                </div>
              );
            })}
          </div>

        </motion.aside>

        {/* ══ RIGHT PANEL ═════════════════════════════════ */}
        <div className="right-col">

          {/* Console header */}
          <div className="console-header">
            <div className="flex items-center gap-2.5">
              <div className="console-icon">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                </svg>
              </div>
              <div>
                <p className="console-title">Symptom Triage Console</p>
                <p className="console-sub">AI-powered · Real-time analysis</p>
              </div>
            </div>
            <div className="console-live">
              <span className="live-dot-sm" /> LIVE
            </div>
          </div>

          {/* Chat + results scroll area */}
          <div className="console-body" id="chat-scroll-area">

            {/* Chat messages */}
            <div className="chat-list">
              {chatMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className={`chat-row ${msg.from === 'user' ? 'chat-row-user' : 'chat-row-ai'}`}
                >
                  {msg.from === 'ai' && (
                    <div className="chat-avatar-ai">
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                      </svg>
                    </div>
                  )}
                  <div className={`chat-bubble ${msg.from === 'ai' ? 'bubble-ai' : 'bubble-user'}`}>
                    <p className="bubble-text">{msg.text}</p>
                    <p className="bubble-time">{msg.time}</p>
                  </div>
                  {msg.from === 'user' && (
                    <div className="chat-avatar-user">
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Triage result */}
            <TriageResult
              result={result}
              isProcessing={isProcessing}
              onSOS={() => { setSosOpen(true); }}
              onFindCare={handleFindCare}
              onTelehealth={() => setShowTelehealth(true)}
              onBookAmbulance={() => setBookAmbulanceOpen(true)}
            />

            {/* Referred doctors */}
            {!isProcessing && result && (
              <div className="mt-3">
                <ReferredDoctors specialization={result.Required_Specialization} />
              </div>
            )}

            {/* Nearby facilities */}
            {careType && (
              <div className="mt-3">
                <NearbyFacilities facilityType={careType} trigger={careTrigger} />
              </div>
            )}
            
            {/* Invisible div to ensure we always scroll to the very bottom of all content */}
            <div ref={chatEndRef} className="h-4 shrink-0" />
          </div>

          {/* Console bottom — single unified IntakeConsole */}
          <div className="console-bottom">
            <IntakeConsole
              onSubmit={handleTriage}
              isProcessing={isProcessing}
              onChat={(text) => {
                setChatMessages(p => [...p, { id: Date.now(), from: 'user', text, time: getFormattedNow() }]);
                setTimeout(() => {
                  setChatMessages(p => [...p, {
                    id: Date.now() + 1, from: 'ai',
                    text: 'Got it — describe your symptoms in detail and tap "Run Triage" for a full clinical assessment. For emergencies call 112.',
                    time: getFormattedNow(),
                  }]);
                }, 700);
              }}
            />
          </div>

        </div>
      </div>

      {/* ══ SOS FOOTER ══════════════════════════════════════ */}
      <footer className="sos-footer">
        <a href="tel:112" className="sos-footer-cta">
          <div className="sos-footer-circle">
            <Phone size={18} />
          </div>
          <div>
            <p className="sos-footer-title">Emergency SOS – CALL 112</p>
            <p className="sos-footer-sub">Instant priority response for life-threatening situations</p>
          </div>
        </a>
        <div className="sos-footer-right">
          &copy; 2024 SANJEEVANI AI TRIAGE | MEDGEMMA-27B<br />
          <span>Designed for Rural & Semi-Urban India</span>
        </div>
      </footer>

    </div>
  );
}
