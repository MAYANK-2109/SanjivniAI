/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          50:  '#F0FDF4',
          100: '#DCFCE7',
          200: '#A7F3D0',
          300: '#6EE7B7',
          500: '#34C98E',
          600: '#2A9A6D',
          700: '#1E7A55',
        },
        cerulean: {
          50:  '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          500: '#4DA6D9',
          600: '#3A83AD',
          700: '#2D6688',
        },
        sand: {
          50:  '#F4F7F6',
          100: '#F8FAFC',
        },
        // Severity colours — mapped to triage levels
        sev: {
          red:    '#EF4444',  // RED  – Emergency/Critical
          yellow: '#F59E0B',  // YELLOW – Urgent
          green:  '#22C55E',  // GREEN  – Standard Care
          blue:   '#3B82F6',  // BLUE  – Routine/Minor
        },
        obsidian: {
          DEFAULT: '#0B0C10',
          soft:    '#111318',
          panel:   '#14161C',
          card:    '#1A1D27',
        },
        cyan: {
          signal: '#66FCF1',
        },
        amber: {
          signal: '#FFC107',
        },
        crimson: {
          signal: '#EF4444',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body:    ['var(--font-body)',    'sans-serif'],
        mono:    ['var(--font-mono)',    'monospace'],
      },
      boxShadow: {
        'glow-cyan':    '0 0 24px 0 rgba(102,252,241,0.25)',
        'glow-amber':   '0 0 24px 0 rgba(255,193,7,0.28)',
        'glow-crimson': '0 0 28px 0 rgba(239,68,68,0.32)',
        'glow-mint':    '0 0 24px 0 rgba(52,201,142,0.28)',
        'glow-blue':    '0 0 24px 0 rgba(59,130,246,0.28)',
        'clay':         '0 8px 32px rgba(52,201,142,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        'clay-hover':   '0 12px 36px rgba(52,201,142,0.18), 0 4px 12px rgba(0,0,0,0.08)',
        'glass':        '0 4px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      backgroundImage: {
        'grid-fade': 'radial-gradient(circle at 50% 0%, rgba(102,252,241,0.08), transparent 60%)',
        'hero-gradient': 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(52,201,142,0.08), transparent 70%)',
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow':    'ping 2.4s cubic-bezier(0,0,0.2,1) infinite',
        'scan':         'scan 2.4s linear infinite',
        'sev-pulse-red':    'sevPulseRed 1.2s ease-in-out infinite',
        'sev-pulse-yellow': 'sevPulseYellow 1.6s ease-in-out infinite',
        'float':        'float 4s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        sevPulseRed: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.4)' },
          '50%':     { boxShadow: '0 0 0 16px rgba(239,68,68,0)' },
        },
        sevPulseYellow: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(245,158,11,0.4)' },
          '50%':     { boxShadow: '0 0 0 12px rgba(245,158,11,0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};
