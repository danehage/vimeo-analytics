import { V } from '../../constants/theme';

export default function FingerprintBadge({ id }) {
  return (
    <span style={{ fontFamily: "monospace", fontSize: 11, background: V.tableHeaderBg, border: `1px solid ${V.border}`, borderRadius: 4, padding: "2px 6px", color: V.textMuted, letterSpacing: 0.3 }}>{id}</span>
  );
}
