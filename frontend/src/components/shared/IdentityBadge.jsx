import { V } from '../../constants/theme';

export default function IdentityBadge({ viewer }) {
  if (viewer.status === "identified") {
    return (
      <span style={{ background: V.greenLight, color: V.green, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}>
        ✓ Identified
      </span>
    );
  }
  return (
    <span style={{ background: V.bg, color: V.textMuted, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, border: `1px solid ${V.border}` }}>
      Anonymous
    </span>
  );
}
