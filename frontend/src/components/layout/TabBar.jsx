import { V } from '../../constants/theme';

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "videos", label: "By Video" },
  { id: "sessions", label: "Sessions", isNew: true },
  { id: "viewers", label: "Viewers", isNew: true },
  { id: "engagement", label: "Engagement" },
];

export default function TabBar({ activeTab, onTabChange }) {
  return (
    <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: `1px solid ${V.border}` }}>
      {TABS.map(({ id, label, isNew }) => (
        <div key={id} onClick={() => onTabChange(id)} style={{
          padding: "10px 20px", fontSize: 13,
          fontWeight: activeTab === id ? 600 : 400,
          color: activeTab === id ? V.text : V.textMuted,
          cursor: "pointer",
          borderBottom: activeTab === id ? `2px solid ${V.teal}` : "2px solid transparent",
          marginBottom: -1,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          {label}
          {isNew && <span style={{ background: V.tealLight, color: V.teal, fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3 }}>NEW</span>}
        </div>
      ))}
    </div>
  );
}
