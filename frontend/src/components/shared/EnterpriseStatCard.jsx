import { V } from '../../constants/theme';

export default function EnterpriseStatCard({ label, value, sub, accent = V.teal, isNew }) {
  return (
    <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, padding: "20px 24px", flex: 1, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent }} />
      {isNew && <div style={{ position: "absolute", top: 10, right: 10, background: V.tealLight, color: V.teal, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, letterSpacing: 0.5 }}>NEW</div>}
      <div style={{ fontSize: 12, color: V.textMuted, fontWeight: 500, marginBottom: 6, marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color: accent !== V.teal ? accent : V.text, lineHeight: 1, marginBottom: sub ? 4 : 0 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: V.textMuted }}>{sub}</div>}
    </div>
  );
}
