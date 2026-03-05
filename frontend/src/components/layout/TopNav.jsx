import { V } from '../../constants/theme';

function VimeoLogo() {
  return (
    <svg width="80" height="22" viewBox="0 0 80 22" fill="none">
      <text x="0" y="17" fontFamily="Georgia, serif" fontSize="20" fontWeight="700" fill="#1a1a1a" letterSpacing="-0.5">vimeo</text>
    </svg>
  );
}

function SearchBar() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: V.bg, border: `1px solid ${V.border}`, borderRadius: 6, padding: "6px 12px", width: 220 }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="6.5" cy="6.5" r="5" stroke={V.textMuted} strokeWidth="1.5"/>
        <path d="M10.5 10.5L14 14" stroke={V.textMuted} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <span style={{ fontSize: 13, color: V.textMuted }}>Search Library</span>
    </div>
  );
}

export default function TopNav() {
  return (
    <div style={{ background: V.white, borderBottom: `1px solid ${V.border}`, padding: "0 20px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, zIndex: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <VimeoLogo />
        <SearchBar />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ background: V.text, color: V.white, borderRadius: 6, padding: "6px 14px", fontSize: 13, fontWeight: 600 }}>+ Create</div>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#e0e0e0" }} />
      </div>
    </div>
  );
}
