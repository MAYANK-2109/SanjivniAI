'use client';

export default function Panel({ title, eyebrow, statusDot, className = '', accentColor, children }) {
  return (
    <div className={`glass-card relative ${className}`} style={{ padding: '16px' }}>
      {/* Accent line at top */}
      {accentColor && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[16px]"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
        />
      )}

      {/* Header */}
      <div className="mb-3 flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
        <div>
          {eyebrow && (
            <p className="mono-tag mb-1" style={{ color: 'var(--text-3)' }}>{eyebrow}</p>
          )}
          <h2 className="font-display text-[14px] font-semibold" style={{ color: 'var(--text-1)', margin: 0 }}>
            {title}
          </h2>
        </div>
        {statusDot && (
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40"
              style={{ backgroundColor: statusDot }} />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: statusDot }} />
          </span>
        )}
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
