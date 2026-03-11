import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { V } from '../../constants/theme';
import SectionHeader from '../shared/SectionHeader';

const RETENTION_DATA = [
  { t: "0:00", existing: 100, deep: 100 },
  { t: "1:00", existing: 65, deep: 84 },
  { t: "2:00", existing: 58, deep: 74 },
  { t: "3:00", existing: 52, deep: 68 },
  { t: "4:00", existing: 48, deep: 55 },
  { t: "5:00", existing: 44, deep: 48 },
  { t: "6:00", existing: 40, deep: 39 },
  { t: "7:00", existing: 38, deep: 32 },
  { t: "8:00", existing: 35, deep: 26 },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: V.tableHeaderBg, border: `1px solid ${V.border}`, borderRadius: 6, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
      <div style={{ color: V.textMuted, marginBottom: 4, fontSize: 11 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || V.teal, fontWeight: 600 }}>{p.name}: {p.value}%</div>
      ))}
    </div>
  );
}

export default function RetentionChart() {
  return (
    <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, padding: "20px 24px" }}>
      <SectionHeader title="Viewer retention" sub="Standard estimate vs Deep Analytics actual" />
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={RETENTION_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="deepGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={V.teal} stopOpacity={0.15} />
              <stop offset="100%" stopColor={V.teal} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={V.borderLight} vertical={false} />
          <XAxis dataKey="t" tick={{ fill: V.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: V.textLight, fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="existing" name="Standard" stroke={V.textLight} strokeWidth={1.5} fill="none" dot={false} strokeDasharray="4 3" />
          <Area type="monotone" dataKey="deep" name="Deep Analytics" stroke={V.teal} strokeWidth={2.5} fill="url(#deepGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
