import { V } from '../../constants/theme';

export default function MiniBar({ percent, width = 50, height = 5 }) {
  const color = percent >= 80 ? V.green : percent >= 40 ? V.teal : V.amber;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width, height, background: V.borderLight, borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${percent}%`, height: "100%", background: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: percent >= 80 ? V.green : percent >= 40 ? V.textMid : V.amber }}>{percent}%</span>
    </div>
  );
}
