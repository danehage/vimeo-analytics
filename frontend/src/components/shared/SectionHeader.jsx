import { V } from '../../constants/theme';

export default function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: V.text }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: V.textMuted, marginTop: 2 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}
