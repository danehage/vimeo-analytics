import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { V } from '../../constants/theme';
import SectionHeader from '../shared/SectionHeader';

const SEEK_HEATMAP = [
  { segment: "0\u20131 min", replays: 23 },
  { segment: "1\u20132 min", replays: 41 },
  { segment: "2\u20133 min", replays: 89 },
  { segment: "3\u20134 min", replays: 134 },
  { segment: "4\u20135 min", replays: 178 },
  { segment: "5\u20136 min", replays: 112 },
  { segment: "6\u20137 min", replays: 67 },
  { segment: "7\u20138 min", replays: 34 },
  { segment: "8+ min", replays: 19 },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: V.tableHeaderBg, border: `1px solid ${V.border}`, borderRadius: 6, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
      <div style={{ color: V.textMuted, marginBottom: 4, fontSize: 11 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || V.teal, fontWeight: 600 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
}

export default function SeekHeatmap() {
  return (
    <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, padding: "20px 24px" }}>
      <SectionHeader title="Most replayed sections" sub="Security Training Module 3" />
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={SEEK_HEATMAP} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={V.borderLight} vertical={false} />
          <XAxis dataKey="segment" tick={{ fill: V.textLight, fontSize: 9 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: V.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="replays" name="Seek events" radius={[3, 3, 0, 0]}>
            {SEEK_HEATMAP.map((entry, i) => (
              <Cell key={i} fill={entry.replays > 100 ? V.teal : entry.replays > 50 ? V.tealMid : "rgba(114,130,163,0.2)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
