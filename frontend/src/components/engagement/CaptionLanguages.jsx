import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { V } from '../../constants/theme';
import SectionHeader from '../shared/SectionHeader';
import { usePolling } from '../../hooks/usePolling';

const LANG_COLORS = {
  en: V.teal,
  es: V.amber,
  fr: V.purple,
  de: V.green,
  pt: V.red,
  ja: V.tealMid,
  zh: V.tealMid,
  ko: V.tealMid,
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: V.tableHeaderBg, border: `1px solid ${V.border}`, borderRadius: 6, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
      <div style={{ color: V.textMuted, marginBottom: 4, fontSize: 11 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: V.teal, fontWeight: 600 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
}

export default function CaptionLanguages() {
  const { data } = usePolling('/api/analytics/caption-languages', 30000);

  const chartData = (data || []).map(row => ({
    language: row.label || row.language,
    sessions: row.sessions,
    color: LANG_COLORS[row.language] || V.textMuted,
  }));

  return (
    <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, padding: "20px 24px" }}>
      <SectionHeader title="Caption usage by language" sub="Sessions where captions were enabled, by language" />
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={V.borderLight} vertical={false} />
            <XAxis dataKey="language" tick={{ fill: V.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: V.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="sessions" name="Sessions" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: V.textLight, fontSize: 13 }}>
          No caption language data yet
        </div>
      )}
    </div>
  );
}
