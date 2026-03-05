import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { V } from '../../constants/theme';
import SectionHeader from '../shared/SectionHeader';

const QUALITY_DATA = [
  { quality: "1080p", sessions: 312, color: V.teal },
  { quality: "720p", sessions: 198, color: V.tealMid },
  { quality: "540p", sessions: 87, color: V.amber },
  { quality: "360p", sessions: 23, color: V.red },
  { quality: "auto", sessions: 227, color: V.textLight },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 6, padding: "8px 12px", fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
      <div style={{ color: V.textMuted, marginBottom: 4, fontSize: 11 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: V.teal, fontWeight: 600 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
}

export default function QualityDistribution() {
  return (
    <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, padding: "20px 24px" }}>
      <SectionHeader title="Quality distribution" sub="Playback quality across all sessions" />
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={QUALITY_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={V.borderLight} vertical={false} />
          <XAxis dataKey="quality" tick={{ fill: V.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: V.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="sessions" name="Sessions" radius={[3, 3, 0, 0]}>
            {QUALITY_DATA.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
