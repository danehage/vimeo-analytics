import { V } from '../../constants/theme';

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "reports", label: "Reports" },
  { id: "video", label: "Video" },
  { id: "region", label: "Region" },
  { id: "source", label: "Source" },
  { id: "device", label: "Device" },
  { id: "date", label: "Date" },
  { id: "team", label: "Team" },
  { id: "social", label: "Social Video" },
  { id: "platform", label: "Social Platform" },
  { id: "bandwidth", label: "Bandwidth" },
  { id: "deep", label: "Deep Analytics", isNew: true },
];

export default function Sidebar({ activeNav, onNavChange }) {
  return (
    <div style={{ width: 160, background: V.sidebar, borderRight: `1px solid ${V.border}`, padding: "16px 0", flexShrink: 0, overflowY: "auto" }}>
      <div style={{ padding: "0 12px 16px", borderBottom: `1px solid ${V.borderLight}`, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: V.textMuted, fontSize: 12, cursor: "pointer" }}>
          ← Back to home
        </div>
      </div>
      {NAV_ITEMS.map(item => (
        <div key={item.id} onClick={() => onNavChange(item.id)}
          style={{
            padding: "8px 12px", margin: "1px 8px", borderRadius: 6, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: activeNav === item.id ? V.active : "transparent",
            color: activeNav === item.id ? V.text : item.id === "deep" ? V.teal : V.textMid,
            fontWeight: activeNav === item.id ? 600 : item.id === "deep" ? 600 : 400,
            fontSize: 13,
          }}>
          <span>{item.label}</span>
          {item.isNew && <span style={{ background: V.teal, color: V.white, fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3 }}>NEW</span>}
        </div>
      ))}
    </div>
  );
}
