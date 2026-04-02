import { useState, useRef, useEffect } from 'react';
import { V } from '../../constants/theme';

function formatLabel(from, to) {
  if (!from && !to) return 'All time';

  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  // Check preset matches
  if (to === today || !to) {
    if (from) {
      const diffMs = now - new Date(from);
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 7) return 'Last 7 days';
      if (diffDays === 30) return 'Last 30 days';
      if (diffDays === 90) return 'Last 90 days';
    }
  }

  const fmt = (d) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (from && to) return `${fmt(from)} – ${fmt(to)}`;
  if (from) return `From ${fmt(from)}`;
  return `Until ${fmt(to)}`;
}

export default function DateRangePicker({ dateRange, onDateRangeChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const { from, to } = dateRange;
  const label = formatLabel(from, to);

  const setPreset = (days) => {
    if (days === null) {
      onDateRangeChange({ from: null, to: null });
    } else {
      const now = new Date();
      const toDate = now.toISOString().slice(0, 10);
      const fromDate = new Date(now - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      onDateRangeChange({ from: fromDate, to: toDate });
    }
    setOpen(false);
  };

  const isPreset = (days) => {
    if (days === null) return !from && !to;
    const now = new Date();
    const toDate = now.toISOString().slice(0, 10);
    const fromDate = new Date(now - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return from === fromDate && to === toDate;
  };

  const presets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'All time', days: null },
  ];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          background: V.tableHeaderBg,
          border: `1px solid ${V.border}`,
          borderRadius: 6,
          padding: '6px 12px',
          fontSize: 13,
          color: V.textMid,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <rect x="1" y="3" width="14" height="12" rx="2" stroke={V.textMuted} strokeWidth="1.3" fill="none" />
          <path d="M1 7h14" stroke={V.textMuted} strokeWidth="1.3" />
          <path d="M5 1v4M11 1v4" stroke={V.textMuted} strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        {label} <span style={{ fontSize: 10, color: V.textLight }}>&#9662;</span>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 4,
          background: V.white,
          border: `1px solid ${V.border}`,
          borderRadius: 8,
          padding: 12,
          width: 280,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          zIndex: 100,
        }}>
          {/* Presets */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {presets.map(p => (
              <div
                key={p.label}
                onClick={() => setPreset(p.days)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 5,
                  fontSize: 12,
                  cursor: 'pointer',
                  background: isPreset(p.days) ? V.teal : V.tableHeaderBg,
                  color: isPreset(p.days) ? '#0e1216' : V.textMid,
                  border: `1px solid ${isPreset(p.days) ? V.teal : V.border}`,
                  fontWeight: isPreset(p.days) ? 600 : 400,
                }}
              >
                {p.label}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: V.border, marginBottom: 12 }} />

          {/* Custom date inputs */}
          <div style={{ fontSize: 11, color: V.textMuted, marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Custom range
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: V.textLight, display: 'block', marginBottom: 4 }}>From</label>
              <input
                type="date"
                value={from || ''}
                max={to || undefined}
                onChange={(e) => {
                  const val = e.target.value || null;
                  onDateRangeChange({ from: val, to: to || new Date().toISOString().slice(0, 10) });
                }}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: 5,
                  border: `1px solid ${V.border}`,
                  background: V.tableHeaderBg,
                  color: V.text,
                  fontSize: 12,
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                  colorScheme: 'dark',
                }}
              />
            </div>
            <span style={{ color: V.textLight, fontSize: 12, marginTop: 16 }}>–</span>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: V.textLight, display: 'block', marginBottom: 4 }}>To</label>
              <input
                type="date"
                value={to || ''}
                min={from || undefined}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => {
                  const val = e.target.value || null;
                  onDateRangeChange({ from: from || '', to: val });
                }}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: 5,
                  border: `1px solid ${V.border}`,
                  background: V.tableHeaderBg,
                  color: V.text,
                  fontSize: 12,
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                  colorScheme: 'dark',
                }}
              />
            </div>
          </div>

          {/* Clear custom */}
          {(from || to) && (
            <div
              onClick={() => { onDateRangeChange({ from: null, to: null }); setOpen(false); }}
              style={{
                marginTop: 10,
                fontSize: 12,
                color: V.teal,
                cursor: 'pointer',
                fontWeight: 500,
                textAlign: 'center',
              }}
            >
              Clear date filter
            </div>
          )}
        </div>
      )}
    </div>
  );
}
