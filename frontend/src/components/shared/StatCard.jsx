import { V } from '../../constants/theme';

export default function StatCard({ label, value }) {
  return (
    <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, padding: "20px 24px", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: V.textMid, fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: V.text, lineHeight: 1 }}>{value}</div>
    </div>
  );
}
