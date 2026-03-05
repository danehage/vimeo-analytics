import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, LineChart, Line, Cell
} from "recharts";

// ─── VIMEO DESIGN TOKENS ─────────────────────────────────────────────────────
const V = {
  bg:               "#f2f2f0",
  white:            "#ffffff",
  sidebar:          "#ffffff",
  border:           "#e5e5e3",
  borderLight:      "#efefed",
  teal:             "#1ab7ea",
  tealLight:        "#e8f8fd",
  tealMid:          "#b3e8f7",
  text:             "#1a1a1a",
  textMid:          "#444444",
  textMuted:        "#767676",
  textLight:        "#999999",
  active:           "#f0f0ee",
  red:              "#e5484d",
  redLight:         "#fff0f0",
  green:            "#30a46c",
  greenLight:       "#f0fdf4",
  amber:            "#f59e0b",
  amberLight:       "#fffbeb",
  purple:           "#8b5cf6",
  purpleLight:      "#f5f3ff",
  enterpriseBg:     "#faf7ff",
  enterpriseBorder: "#ddd0f7",
  enterpriseText:   "#6d28d9",
};

// ─── SESSION DATA ─────────────────────────────────────────────────────────────
const SESSIONS = [
  {
    id: "a3f9b2", shortId: "#a3f9b2",
    video: "Security Training Module 3",
    videoId: "v003", duration: 1102,
    date: "Mar 4, 2026", time: "9:14 AM",
    source: "embed", embedUrl: "intranet.corp.com/learning/security",
    watchedPct: 74, completed: false,
    captionsEnabled: true, qualityChanges: 1, seeks: 3, buffers: 0,
    events: [
      { type: "play",             time: "0:00", playhead: 0,    icon: "▶", color: V.teal,   label: "Started playback" },
      { type: "qualitychange",    time: "0:08", playhead: 8,    icon: "⚙", color: V.amber,  label: "Quality changed to 1080p" },
      { type: "timeupdate",       time: "2:14", playhead: 134,  icon: "·", color: V.borderLight, label: "Watching…" },
      { type: "pause",            time: "2:14", playhead: 134,  icon: "⏸", color: V.textMuted, label: "Paused (45 seconds)" },
      { type: "play",             time: "2:59", playhead: 134,  icon: "▶", color: V.teal,   label: "Resumed" },
      { type: "timeupdate",       time: "3:12", playhead: 192,  icon: "·", color: V.borderLight, label: "Watching…" },
      { type: "seeked",           time: "3:12", playhead: 330,  icon: "⏭", color: V.purple, label: "Skipped forward → 5:30" },
      { type: "timeupdate",       time: "6:45", playhead: 405,  icon: "·", color: V.borderLight, label: "Watching…" },
      { type: "texttrackchange",  time: "6:45", playhead: 405,  icon: "CC", color: V.green,  label: "Captions turned on (English)" },
      { type: "timeupdate",       time: "9:20", playhead: 560,  icon: "·", color: V.borderLight, label: "Watching…" },
      { type: "seeked",           time: "9:20", playhead: 490,  icon: "⏮", color: V.purple, label: "Rewound → 8:10 (replayed section)" },
      { type: "timeupdate",       time: "12:34", playhead: 754, icon: "·", color: V.borderLight, label: "Watching…" },
      { type: "timeupdate",       time: "13:37", playhead: 817, icon: "·", color: V.borderLight, label: "Watching…" },
      { type: "ended",            time: "13:41", playhead: 821, icon: "✓", color: V.green,  label: "Session ended — 74% watched" },
    ],
    // Scrubber segments: each is { from, to, type } where from/to are 0–100%
    watchedSegments: [
      { from: 0, to: 19.4, type: "watched" },          // 0:00 – 2:14
      { from: 19.4, to: 19.4, type: "pause" },          // paused
      { from: 19.4, to: 29.9, type: "watched" },        // resume – skip
      { from: 29.9, to: 50.0, type: "skipped" },        // 3:12 skip to 5:30
      { from: 50.0, to: 74.0, type: "watched" },        // 5:30 – 9:20
      { from: 74.0, to: 63.5, type: "rewind" },         // rewind to 8:10
      { from: 63.5, to: 74.5, type: "rewatched" },      // 8:10 – 12:34
      { from: 74.5, to: 74.5, type: "ended" },
    ],
  },
  {
    id: "c82e41", shortId: "#c82e41",
    video: "Security Training Module 3",
    videoId: "v003", duration: 1102,
    date: "Mar 4, 2026", time: "10:02 AM",
    source: "embed", embedUrl: "intranet.corp.com/learning/security",
    watchedPct: 100, completed: true,
    captionsEnabled: false, qualityChanges: 0, seeks: 1, buffers: 1,
    events: [
      { type: "play",         time: "0:00",  playhead: 0,    icon: "▶",  color: V.teal,     label: "Started playback" },
      { type: "bufferstart",  time: "1:12",  playhead: 72,   icon: "⧗",  color: V.red,      label: "Buffering started" },
      { type: "bufferend",    time: "1:15",  playhead: 72,   icon: "▶",  color: V.teal,     label: "Buffering ended (3s)" },
      { type: "seeked",       time: "4:30",  playhead: 600,  icon: "⏭",  color: V.purple,   label: "Skipped forward → 10:00" },
      { type: "timeupdate",   time: "14:22", playhead: 862,  icon: "·",  color: V.borderLight, label: "Watching…" },
      { type: "ended",        time: "18:22", playhead: 1102, icon: "✓",  color: V.green,    label: "Completed — 100% watched" },
    ],
    watchedSegments: [
      { from: 0, to: 40.8, type: "watched" },
      { from: 40.8, to: 90.7, type: "skipped" },
      { from: 90.7, to: 100, type: "watched" },
    ],
  },
  {
    id: "f17d93", shortId: "#f17d93",
    video: "Security Training Module 3",
    videoId: "v003", duration: 1102,
    date: "Mar 3, 2026", time: "2:45 PM",
    source: "embed", embedUrl: "intranet.corp.com/learning/security",
    watchedPct: 18, completed: false,
    captionsEnabled: true, qualityChanges: 2, seeks: 0, buffers: 3,
    events: [
      { type: "play",            time: "0:00", playhead: 0,   icon: "▶",  color: V.teal,    label: "Started playback" },
      { type: "texttrackchange", time: "0:04", playhead: 4,   icon: "CC", color: V.green,   label: "Captions turned on (Spanish)" },
      { type: "qualitychange",   time: "0:12", playhead: 12,  icon: "⚙",  color: V.amber,   label: "Quality changed to 720p (auto)" },
      { type: "bufferstart",     time: "0:45", playhead: 45,  icon: "⧗",  color: V.red,     label: "Buffering (8s)" },
      { type: "bufferend",       time: "0:53", playhead: 45,  icon: "▶",  color: V.teal,    label: "Resumed" },
      { type: "qualitychange",   time: "1:02", playhead: 62,  icon: "⚙",  color: V.amber,   label: "Quality dropped to 540p" },
      { type: "bufferstart",     time: "1:34", playhead: 94,  icon: "⧗",  color: V.red,     label: "Buffering (12s)" },
      { type: "bufferend",       time: "1:46", playhead: 94,  icon: "▶",  color: V.teal,    label: "Resumed" },
      { type: "bufferstart",     time: "2:41", playhead: 161, icon: "⧗",  color: V.red,     label: "Buffering (6s)" },
      { type: "pause",           time: "3:20", playhead: 200, icon: "⏸",  color: V.textMuted, label: "Paused — session abandoned" },
    ],
    watchedSegments: [
      { from: 0, to: 18, type: "watched" },
    ],
  },
  {
    id: "b55a07", shortId: "#b55a07",
    video: "AWS Marketplace Global Expansion",
    videoId: "v001", duration: 83,
    date: "Mar 5, 2026", time: "8:30 AM",
    source: "embed", embedUrl: "sharepoint.corp.com/marketing/videos",
    watchedPct: 91, completed: false,
    captionsEnabled: false, qualityChanges: 0, seeks: 2, buffers: 0,
    events: [
      { type: "play",    time: "0:00", playhead: 0,  icon: "▶",  color: V.teal,   label: "Started playback" },
      { type: "seeked",  time: "0:18", playhead: 38, icon: "⏭",  color: V.purple, label: "Skipped forward → 0:38" },
      { type: "seeked",  time: "1:02", playhead: 45, icon: "⏮",  color: V.purple, label: "Rewound → 0:45" },
      { type: "ended",   time: "1:17", playhead: 77, icon: "✓",  color: V.green,  label: "Session ended — 91% watched" },
    ],
    watchedSegments: [
      { from: 0, to: 21.7, type: "watched" },
      { from: 21.7, to: 45.8, type: "skipped" },
      { from: 45.8, to: 54.2, type: "watched" },
      { from: 54.2, to: 45.8, type: "rewind" },
      { from: 45.8, to: 91, type: "watched" },
    ],
  },
];

// ─── VIEWER DATA ──────────────────────────────────────────────────────────────
const VIEWERS = [
  {
    fingerprintId: "fp_a3c8e1",
    identifiedAs: "j.smith@corp.com",
    identifiedOn: "Mar 5, 2026",
    identifiedVia: "SSO login on intranet.corp.com",
    status: "identified",
    firstSeen: "Feb 19, 2026",
    lastSeen: "Mar 5, 2026",
    totalSessions: 7,
    totalVideos: 3,
    totalWatchMins: 94,
    avgWatchPct: 81,
    captionsAlwaysOn: true,
    preferredQuality: "1080p",
    sessions: [
      { id: "#a3f9b2", video: "Security Training Module 3", date: "Mar 4, 2026", watchedPct: 74, completed: false },
      { id: "#c82e41", video: "Security Training Module 3", date: "Mar 4, 2026", watchedPct: 100, completed: true },
      { id: "#d91b33", video: "Onboarding: Company Culture", date: "Feb 28, 2026", watchedPct: 100, completed: true },
      { id: "#e74f22", video: "AWS Marketplace Global Expansion", date: "Feb 19, 2026", watchedPct: 91, completed: false },
      { id: "#f00c11", video: "Security Training Module 3", date: "Feb 19, 2026", watchedPct: 42, completed: false },
    ],
    videos: [
      { title: "Security Training Module 3", sessions: 3, avgPct: 72, completed: true, lastWatched: "Mar 4, 2026" },
      { title: "Onboarding: Company Culture", sessions: 2, avgPct: 100, completed: true, lastWatched: "Feb 28, 2026" },
      { title: "AWS Marketplace Global Expansion", sessions: 2, avgPct: 74, completed: false, lastWatched: "Feb 19, 2026" },
    ],
    timeline: [
      { date: "Feb 19", sessions: 2 }, { date: "Feb 23", sessions: 0 }, { date: "Feb 28", sessions: 1 },
      { date: "Mar 1", sessions: 0 }, { date: "Mar 4", sessions: 2 }, { date: "Mar 5", sessions: 2 },
    ],
  },
  {
    fingerprintId: "fp_b7d2f9",
    identifiedAs: null,
    identifiedOn: null,
    identifiedVia: null,
    status: "anonymous",
    firstSeen: "Mar 3, 2026",
    lastSeen: "Mar 5, 2026",
    totalSessions: 3,
    totalVideos: 2,
    totalWatchMins: 12,
    avgWatchPct: 31,
    captionsAlwaysOn: true,
    preferredQuality: "540p",
    sessions: [
      { id: "#f17d93", video: "Security Training Module 3", date: "Mar 3, 2026", watchedPct: 18, completed: false },
      { id: "#g22a18", video: "Security Training Module 3", date: "Mar 4, 2026", watchedPct: 24, completed: false },
      { id: "#h91c04", video: "Benefits Overview 2026", date: "Mar 5, 2026", watchedPct: 51, completed: false },
    ],
    videos: [
      { title: "Security Training Module 3", sessions: 2, avgPct: 21, completed: false, lastWatched: "Mar 4, 2026" },
      { title: "Benefits Overview 2026", sessions: 1, avgPct: 51, completed: false, lastWatched: "Mar 5, 2026" },
    ],
    timeline: [
      { date: "Mar 3", sessions: 1 }, { date: "Mar 4", sessions: 1 }, { date: "Mar 5", sessions: 1 },
    ],
    insight: "This viewer has attempted Security Training Module 3 twice and abandoned both times under 25%. Combined with consistent Spanish captions and repeated quality drops, they may be on a poor connection or a non-English speaker struggling with the content.",
  },
  {
    fingerprintId: "fp_c1e5a3",
    identifiedAs: "m.chen@corp.com",
    identifiedOn: "Mar 1, 2026",
    identifiedVia: "Form submission on hr.corp.com",
    status: "identified",
    firstSeen: "Feb 24, 2026",
    lastSeen: "Mar 4, 2026",
    totalSessions: 4,
    totalVideos: 2,
    totalWatchMins: 67,
    avgWatchPct: 68,
    captionsAlwaysOn: false,
    preferredQuality: "720p",
    sessions: [
      { id: "#i44d91", video: "Benefits Overview 2026", date: "Mar 4, 2026", watchedPct: 88, completed: false },
      { id: "#j83b72", video: "Benefits Overview 2026", date: "Mar 1, 2026", watchedPct: 51, completed: false },
      { id: "#k12c55", video: "CEO Town Hall - Jan 2026", date: "Feb 28, 2026", watchedPct: 61, completed: false },
      { id: "#l90a34", video: "CEO Town Hall - Jan 2026", date: "Feb 24, 2026", watchedPct: 71, completed: false },
    ],
    videos: [
      { title: "Benefits Overview 2026", sessions: 2, avgPct: 70, completed: false, lastWatched: "Mar 4, 2026" },
      { title: "CEO Town Hall - Jan 2026", sessions: 2, avgPct: 66, completed: false, lastWatched: "Feb 28, 2026" },
    ],
    timeline: [
      { date: "Feb 24", sessions: 1 }, { date: "Feb 28", sessions: 1 },
      { date: "Mar 1", sessions: 1 }, { date: "Mar 4", sessions: 1 },
    ],
  },
  {
    fingerprintId: "fp_d9f3b8",
    identifiedAs: null,
    identifiedOn: null,
    identifiedVia: null,
    status: "anonymous",
    firstSeen: "Mar 5, 2026",
    lastSeen: "Mar 5, 2026",
    totalSessions: 1,
    totalVideos: 1,
    totalWatchMins: 1,
    avgWatchPct: 91,
    captionsAlwaysOn: false,
    preferredQuality: "1080p",
    sessions: [
      { id: "#b55a07", video: "AWS Marketplace Global Expansion", date: "Mar 5, 2026", watchedPct: 91, completed: false },
    ],
    videos: [
      { title: "AWS Marketplace Global Expansion", sessions: 1, avgPct: 91, completed: false, lastWatched: "Mar 5, 2026" },
    ],
    timeline: [{ date: "Mar 5", sessions: 1 }],
  },
];

// ─── OTHER DATA ───────────────────────────────────────────────────────────────
const OVERVIEW_TREND = [
  { date: "Feb 3", views: 1 }, { date: "Feb 7", views: 1 }, { date: "Feb 11", views: 1 },
  { date: "Feb 15", views: 2 }, { date: "Feb 19", views: 12 }, { date: "Feb 23", views: 1 },
  { date: "Feb 27", views: 0 }, { date: "Mar 1", views: 1 }, { date: "Mar 5", views: 0 },
];
const RETENTION_DATA = [
  { t: "0:00", existing: 100, deep: 100 }, { t: "1:00", existing: 65, deep: 84 },
  { t: "2:00", existing: 58, deep: 74 }, { t: "3:00", existing: 52, deep: 68 },
  { t: "4:00", existing: 48, deep: 55 }, { t: "5:00", existing: 44, deep: 48 },
  { t: "6:00", existing: 40, deep: 39 }, { t: "7:00", existing: 38, deep: 32 },
  { t: "8:00", existing: 35, deep: 26 },
];
const EVENT_BREAKDOWN = [
  { event: "play", count: 847, color: V.teal }, { event: "pause", count: 623, color: V.textLight },
  { event: "seeked", count: 412, color: V.purple }, { event: "texttrackchange", count: 198, color: V.green },
  { event: "qualitychange", count: 89, color: V.amber }, { event: "volumechange", count: 67, color: V.textMuted },
  { event: "bufferstart", count: 34, color: V.red },
];
const VIDEOS_TABLE = [
  { thumb: "🎬", title: "AWS Marketplace Global Expansion", duration: "1:23", uploaded: "Jan 23, 2026", views: 11, uniqueViewers: 4, avgPct: 58, finishes: 4, captionPct: 36, seekEvents: 23, bufferRate: 1.2, source: "embed" },
  { thumb: "🏙️", title: "Florence", duration: "0:15", uploaded: "Jan 13, 2026", views: 3, uniqueViewers: 1, avgPct: 68, finishes: 2, captionPct: 0, seekEvents: 1, bufferRate: 0, source: "vimeo.com" },
  { thumb: "📋", title: "Security Training Module 3", duration: "18:22", uploaded: "Dec 1, 2025", views: 847, uniqueViewers: 312, avgPct: 74, finishes: 634, captionPct: 67, seekEvents: 189, bufferRate: 1.8, source: "embed" },
];
const SEEK_HEATMAP = [
  { segment: "0–1 min", replays: 23 }, { segment: "1–2 min", replays: 41 },
  { segment: "2–3 min", replays: 89 }, { segment: "3–4 min", replays: 134 },
  { segment: "4–5 min", replays: 178 }, { segment: "5–6 min", replays: 112 },
  { segment: "6–7 min", replays: 67 }, { segment: "7–8 min", replays: 34 },
  { segment: "8+ min", replays: 19 },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtSecs = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const EVENT_COLORS = {
  play: V.teal, pause: V.textMuted, seeked: V.purple,
  texttrackchange: V.green, qualitychange: V.amber,
  volumechange: V.textMuted, bufferstart: V.red, bufferend: V.teal,
  ended: V.green, timeupdate: V.borderLight,
};

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const VimeoLogo = () => (
  <svg width="80" height="22" viewBox="0 0 80 22" fill="none">
    <text x="0" y="17" fontFamily="Georgia, serif" fontSize="20" fontWeight="700" fill="#1a1a1a" letterSpacing="-0.5">vimeo</text>
  </svg>
);
const SearchBar = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, background: V.bg, border: `1px solid ${V.border}`, borderRadius: 6, padding: "6px 12px", width: 220 }}>
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke={V.textMuted} strokeWidth="1.5"/><path d="M10.5 10.5L14 14" stroke={V.textMuted} strokeWidth="1.5" strokeLinecap="round"/></svg>
    <span style={{ fontSize: 13, color: V.textMuted }}>Search Library</span>
  </div>
);
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 6, padding: "8px 12px", fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
      <div style={{ color: V.textMuted, marginBottom: 4, fontSize: 11 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color || V.teal, fontWeight: 600 }}>{p.name}: {p.value}</div>)}
    </div>
  );
};
const StatCard = ({ label, value }) => (
  <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, padding: "20px 24px", flex: 1 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
      <span style={{ fontSize: 13, color: V.textMid, fontWeight: 500 }}>{label}</span>
    </div>
    <div style={{ fontSize: 32, fontWeight: 700, color: V.text, lineHeight: 1 }}>{value}</div>
  </div>
);
const EnterpriseStatCard = ({ label, value, sub, accent = V.teal, isNew }) => (
  <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, padding: "20px 24px", flex: 1, position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent }} />
    {isNew && <div style={{ position: "absolute", top: 10, right: 10, background: V.tealLight, color: V.teal, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, letterSpacing: 0.5 }}>NEW</div>}
    <div style={{ fontSize: 12, color: V.textMuted, fontWeight: 500, marginBottom: 6, marginTop: 4 }}>{label}</div>
    <div style={{ fontSize: 30, fontWeight: 700, color: accent !== V.teal ? accent : V.text, lineHeight: 1, marginBottom: sub ? 4 : 0 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: V.textMuted }}>{sub}</div>}
  </div>
);
const SectionHeader = ({ title, sub, action }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
    <div>
      <div style={{ fontSize: 15, fontWeight: 600, color: V.text }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: V.textMuted, marginTop: 2 }}>{sub}</div>}
    </div>
    {action}
  </div>
);

// ─── SESSION SCRUBBER ─────────────────────────────────────────────────────────
const SessionScrubber = ({ session }) => {
  const SEGMENT_COLORS = {
    watched: V.teal, rewatched: "#0a6d8f", skipped: V.borderLight,
    rewind: V.purple, pause: V.amber, ended: V.green,
  };
  const SEGMENT_LABELS = {
    watched: "Watched", rewatched: "Rewatched", skipped: "Skipped",
    rewind: "Rewound", pause: "Paused",
  };

  // Build a simplified linear watch map across 100 buckets
  const buckets = Array(100).fill("unwatched");
  session.events.forEach(ev => {
    if (ev.type === "timeupdate" || ev.type === "play" || ev.type === "ended") {
      const pct = Math.round((ev.playhead / session.duration) * 100);
      if (pct >= 0 && pct < 100) buckets[pct] = "watched";
    }
    if (ev.type === "seeked") {
      const pct = Math.round((ev.playhead / session.duration) * 100);
      if (pct >= 0 && pct < 100) buckets[pct] = "seeked";
    }
  });

  return (
    <div>
      {/* Timeline bar */}
      <div style={{ position: "relative", marginBottom: 8 }}>
        <div style={{ display: "flex", height: 20, borderRadius: 4, overflow: "hidden", border: `1px solid ${V.border}` }}>
          {buckets.map((type, i) => (
            <div key={i} style={{
              flex: 1,
              background: type === "watched" ? V.teal : type === "seeked" ? V.purple : V.borderLight,
              borderRight: i % 10 === 9 ? `1px solid ${V.bg}` : "none",
            }} />
          ))}
        </div>
        {/* Event markers */}
        {session.events.filter(e => e.type !== "timeupdate").map((ev, i) => {
          const left = (ev.playhead / session.duration) * 100;
          return (
            <div key={i} title={ev.label} style={{
              position: "absolute", top: -6,
              left: `${Math.min(left, 98)}%`,
              width: 2, height: 32,
              background: ev.color === V.borderLight ? "transparent" : ev.color,
              opacity: 0.9,
            }} />
          );
        })}
      </div>
      {/* Time labels */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: V.textLight }}>
        <span>0:00</span>
        <span>{fmtSecs(session.duration * 0.25)}</span>
        <span>{fmtSecs(session.duration * 0.5)}</span>
        <span>{fmtSecs(session.duration * 0.75)}</span>
        <span>{fmtSecs(session.duration)}</span>
      </div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
        {[[V.teal, "Watched"], [V.purple, "Seek point"], [V.borderLight, "Not watched"]].map(([c, l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: V.textMuted }}>
            <div style={{ width: 12, height: 6, background: c, borderRadius: 2, border: `1px solid ${V.border}` }} />
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── SESSION DETAIL VIEW ──────────────────────────────────────────────────────
const SessionDetail = ({ session, onBack }) => {
  const nonTimeUpdates = session.events.filter(e => e.type !== "timeupdate");
  const hasCaptions = session.events.some(e => e.type === "texttrackchange");
  const hasBuffer = session.events.some(e => e.type === "bufferstart");
  const seekCount = session.events.filter(e => e.type === "seeked").length;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: V.textMuted }}>
        <span onClick={onBack} style={{ cursor: "pointer", color: V.teal, fontWeight: 500 }}>← Sessions</span>
        <span>›</span>
        <span style={{ color: V.text }}>Session {session.shortId}</span>
      </div>

      {/* Session header */}
      <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, padding: "20px 24px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: V.text }}>Session {session.shortId}</span>
              <span style={{ background: session.source === "embed" ? V.tealLight : V.purpleLight, color: session.source === "embed" ? V.teal : V.purple, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4 }}>{session.source}</span>
              {session.completed && <span style={{ background: V.greenLight, color: V.green, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4 }}>✓ Completed</span>}
              {!session.completed && <span style={{ background: "#fff8f0", color: V.amber, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4 }}>{session.watchedPct}% watched</span>}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: V.textMid, marginBottom: 2 }}>{session.video}</div>
            <div style={{ fontSize: 12, color: V.textLight }}>{session.date} at {session.time} · {session.embedUrl}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {hasCaptions && (
              <div style={{ background: V.tealLight, border: `1px solid ${V.tealMid}`, borderRadius: 6, padding: "6px 10px", fontSize: 12, color: V.teal, fontWeight: 600 }}>CC On</div>
            )}
            {hasBuffer && (
              <div style={{ background: V.redLight, border: `1px solid #fecaca`, borderRadius: 6, padding: "6px 10px", fontSize: 12, color: V.red, fontWeight: 600 }}>⧗ Buffered</div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: "flex", gap: 24, paddingTop: 16, borderTop: `1px solid ${V.borderLight}` }}>
          {[
            ["Duration watched", fmtSecs(Math.round(session.duration * session.watchedPct / 100)), V.text],
            ["Total video length", fmtSecs(session.duration), V.textMuted],
            ["Seek events", session.seeks, seekCount > 2 ? V.purple : V.textMid],
            ["Quality changes", session.qualityChanges, session.qualityChanges > 1 ? V.amber : V.textMid],
            ["Captions enabled", session.captionsEnabled ? "Yes" : "No", session.captionsEnabled ? V.green : V.textMuted],
            ["Buffer events", session.buffers, session.buffers > 0 ? V.red : V.green],
          ].map(([label, val, color]) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: V.textLight, marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scrubber */}
      <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, padding: "20px 24px", marginBottom: 16 }}>
        <SectionHeader title="Watch map" sub="Visual reconstruction of what was watched, skipped, and rewound" />
        <SessionScrubber session={session} />
      </div>

      {/* Event timeline */}
      <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, padding: "20px 24px" }}>
        <SectionHeader title="Event timeline" sub={`${nonTimeUpdates.length} significant events captured`} />
        <div style={{ position: "relative" }}>
          {/* Vertical line */}
          <div style={{ position: "absolute", left: 15, top: 8, bottom: 8, width: 1, background: V.borderLight }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {session.events.filter(e => e.type !== "timeupdate").map((ev, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "10px 0", position: "relative" }}>
                {/* Icon */}
                <div style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                  background: ev.color === V.borderLight ? V.bg : ev.color + "18",
                  border: `1.5px solid ${ev.color === V.borderLight ? V.border : ev.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: ev.icon.length > 1 ? 8 : 12, fontWeight: 700,
                  color: ev.color === V.borderLight ? V.textLight : ev.color,
                  zIndex: 1,
                }}>
                  {ev.icon}
                </div>
                {/* Content */}
                <div style={{ flex: 1, paddingTop: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: V.text }}>{ev.label}</span>
                    <span style={{ fontSize: 11, color: V.textLight, fontFamily: "monospace" }}>{ev.time}</span>
                    {ev.type === "seeked" && (
                      <span style={{ background: V.purpleLight, color: V.purple, fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 3 }}>seek</span>
                    )}
                    {ev.type === "bufferstart" && (
                      <span style={{ background: V.redLight, color: V.red, fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 3 }}>buffer</span>
                    )}
                    {ev.type === "texttrackchange" && (
                      <span style={{ background: V.tealLight, color: V.green, fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 3 }}>accessibility</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: V.textLight }}>
                    Playhead: {fmtSecs(ev.playhead)} / {fmtSecs(session.duration)}
                    <span style={{ display: "inline-block", width: 80, height: 3, background: V.borderLight, borderRadius: 99, margin: "0 8px -1px", overflow: "hidden" }}>
                      <span style={{ display: "block", width: `${(ev.playhead / session.duration) * 100}%`, height: "100%", background: V.teal, borderRadius: 99 }} />
                    </span>
                    {Math.round((ev.playhead / session.duration) * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insight callout — only show for sessions with interesting patterns */}
        {session.id === "a3f9b2" && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: "#faf5ff", border: "1px solid #ddd0f7", borderRadius: 8, fontSize: 12, color: V.enterpriseText, lineHeight: 1.6 }}>
            💡 <strong>This viewer rewound to 8:10 after reaching 9:20.</strong> Combined with turning captions on at 6:45, they may have had difficulty understanding the content in that section. Consider reviewing the 8–9 minute segment for clarity.
          </div>
        )}
        {session.id === "f17d93" && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: V.redLight, border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, color: "#991b1b", lineHeight: 1.6 }}>
            ⚠ <strong>This session had 3 buffer events and was abandoned at 18%.</strong> The viewer dropped their quality twice before stopping. This may indicate a network issue on the embed page — compare with buffer rates from other sessions on the same URL.
          </div>
        )}
      </div>
    </div>
  );
};

// ─── SESSION LIST ─────────────────────────────────────────────────────────────
const SessionList = ({ onSelect }) => {
  const [filterVideo, setFilterVideo] = useState("all");
  const filtered = filterVideo === "all" ? SESSIONS : SESSIONS.filter(s => s.videoId === filterVideo);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: V.textMuted }}>{filtered.length} sessions · click any row to view full replay</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["all", "All videos"], ["v003", "Security Training"], ["v001", "AWS Marketplace"]].map(([val, label]) => (
            <div key={val} onClick={() => setFilterVideo(val)} style={{
              padding: "5px 12px", borderRadius: 5, fontSize: 12, cursor: "pointer",
              background: filterVideo === val ? V.teal : V.white,
              color: filterVideo === val ? V.white : V.textMid,
              border: `1px solid ${filterVideo === val ? V.teal : V.border}`,
              fontWeight: filterVideo === val ? 600 : 400,
            }}>{label}</div>
          ))}
        </div>
      </div>

      <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: V.bg }}>
              {["Session", "Video", "Date", "Source", "Watched", "Captions", "Seeks", "Buffers", ""].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: h === "" ? "center" : "left", fontWeight: 500, fontSize: 11, color: V.textMuted, borderBottom: `1px solid ${V.border}`, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id}
                onClick={() => onSelect(s)}
                style={{ borderBottom: `1px solid ${V.borderLight}`, cursor: "pointer", transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = V.bg}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "12px 14px" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: V.teal, fontWeight: 600 }}>{s.shortId}</span>
                </td>
                <td style={{ padding: "12px 14px", maxWidth: 180 }}>
                  <div style={{ fontWeight: 500, color: V.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>{s.video}</div>
                  <div style={{ fontSize: 11, color: V.textLight }}>{fmtSecs(s.duration)}</div>
                </td>
                <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                  <div style={{ color: V.textMid }}>{s.date}</div>
                  <div style={{ fontSize: 11, color: V.textLight }}>{s.time}</div>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <span style={{ background: s.source === "embed" ? V.tealLight : V.purpleLight, color: s.source === "embed" ? V.teal : V.purple, fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 4 }}>{s.source}</span>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 50, height: 5, background: V.borderLight, borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${s.watchedPct}%`, height: "100%", background: s.watchedPct >= 80 ? V.green : s.watchedPct >= 40 ? V.teal : V.amber, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: s.watchedPct >= 80 ? V.green : s.watchedPct >= 40 ? V.textMid : V.amber }}>{s.watchedPct}%</span>
                    {s.completed && <span style={{ fontSize: 10, color: V.green }}>✓</span>}
                  </div>
                </td>
                <td style={{ padding: "12px 14px", textAlign: "left" }}>
                  {s.captionsEnabled
                    ? <span style={{ color: V.green, fontWeight: 600, fontSize: 12 }}>On</span>
                    : <span style={{ color: V.textLight, fontSize: 12 }}>Off</span>}
                </td>
                <td style={{ padding: "12px 14px", textAlign: "left" }}>
                  <span style={{ color: s.seeks > 2 ? V.purple : V.textMid, fontWeight: s.seeks > 2 ? 600 : 400 }}>{s.seeks}</span>
                </td>
                <td style={{ padding: "12px 14px", textAlign: "left" }}>
                  <span style={{ color: s.buffers > 0 ? V.red : V.textLight, fontWeight: s.buffers > 0 ? 600 : 400 }}>{s.buffers > 0 ? s.buffers : "—"}</span>
                </td>
                <td style={{ padding: "12px 14px", textAlign: "center" }}>
                  <span style={{ color: V.teal, fontSize: 16 }}>›</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── VIEWER COMPONENTS ───────────────────────────────────────────────────────

const FingerprintBadge = ({ id }) => (
  <span style={{ fontFamily: "monospace", fontSize: 11, background: V.bg, border: `1px solid ${V.border}`, borderRadius: 4, padding: "2px 6px", color: V.textMuted, letterSpacing: 0.3 }}>{id}</span>
);

const IdentityBadge = ({ viewer }) => {
  if (viewer.status === "identified") return (
    <span style={{ background: V.greenLight, color: V.green, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}>
      ✓ Identified
    </span>
  );
  return (
    <span style={{ background: V.bg, color: V.textMuted, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, border: `1px solid ${V.border}` }}>
      Anonymous
    </span>
  );
};

const ViewerDetail = ({ viewer, onBack }) => {
  const identified = viewer.status === "identified";
  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: V.textMuted }}>
        <span onClick={onBack} style={{ cursor: "pointer", color: V.teal, fontWeight: 500 }}>← Viewers</span>
        <span>›</span>
        <span style={{ color: V.text }}>{identified ? viewer.identifiedAs : `Anonymous · ${viewer.fingerprintId}`}</span>
      </div>

      {/* Identity card */}
      <div style={{ background: V.white, border: `1px solid ${identified ? "#bbf7d0" : V.border}`, borderRadius: 8, padding: "20px 24px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
        {identified && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${V.green}, ${V.teal})` }} />}
        {!identified && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: V.border }} />}

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Avatar */}
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: identified ? `linear-gradient(135deg, ${V.teal}, ${V.green})` : V.borderLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: identified ? 18 : 20, color: identified ? V.white : V.textLight, fontWeight: 700, flexShrink: 0 }}>
              {identified ? viewer.identifiedAs.split(".")[0][0].toUpperCase() : "?"}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                {identified
                  ? <span style={{ fontSize: 18, fontWeight: 700, color: V.text }}>{viewer.identifiedAs}</span>
                  : <span style={{ fontSize: 15, fontWeight: 600, color: V.textMid }}>Anonymous Viewer</span>
                }
                <IdentityBadge viewer={viewer} />
              </div>
              <div style={{ display: "flex", align: "center", gap: 8, flexWrap: "wrap" }}>
                <FingerprintBadge id={viewer.fingerprintId} />
                <span style={{ fontSize: 12, color: V.textLight }}>First seen {viewer.firstSeen} · Last seen {viewer.lastSeen}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Identity resolution story */}
        {identified ? (
          <div style={{ padding: "12px 16px", background: V.greenLight, border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 12, color: "#166534", lineHeight: 1.6 }}>
            <strong>Identity resolved on {viewer.identifiedOn}</strong> via {viewer.identifiedVia}.<br/>
            All {viewer.totalSessions} prior anonymous sessions from fingerprint <code style={{ background: "#dcfce7", padding: "1px 4px", borderRadius: 3, fontFamily: "monospace" }}>{viewer.fingerprintId}</code> have been retroactively attributed to this user.
          </div>
        ) : (
          <div style={{ padding: "12px 16px", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 8, fontSize: 12, color: V.textMid, lineHeight: 1.6 }}>
            <strong>Not yet identified.</strong> This viewer's sessions are tracked by browser fingerprint only. If they log in or submit a form on an instrumented page, their identity will be retroactively linked to all sessions under <code style={{ fontFamily: "monospace" }}>{viewer.fingerprintId}</code>.
          </div>
        )}

        {/* Quick stats */}
        <div style={{ display: "flex", gap: 28, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${V.borderLight}`, flexWrap: "wrap" }}>
          {[
            ["Sessions", viewer.totalSessions, V.text],
            ["Videos watched", viewer.totalVideos, V.text],
            ["Total watch time", `${viewer.totalWatchMins}m`, V.text],
            ["Avg engagement", `${viewer.avgWatchPct}%`, viewer.avgWatchPct >= 70 ? V.green : viewer.avgWatchPct >= 40 ? V.textMid : V.amber],
            ["Captions", viewer.captionsAlwaysOn ? "Always on" : "Off", viewer.captionsAlwaysOn ? V.teal : V.textLight],
            ["Preferred quality", viewer.preferredQuality, V.textMid],
          ].map(([label, val, color]) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: V.textLight, marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Insight callout for anonymous viewer with pattern */}
      {viewer.insight && (
        <div style={{ padding: "14px 18px", background: V.amberLight, border: `1px solid #fde68a`, borderRadius: 8, marginBottom: 16, fontSize: 12, color: "#92400e", lineHeight: 1.6 }}>
          💡 <strong>Behavioral insight:</strong> {viewer.insight}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Videos watched */}
        <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, padding: "20px 24px" }}>
          <SectionHeader title="Videos watched" sub={`${viewer.videos.length} unique videos`} />
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {viewer.videos.map((v, i) => (
              <div key={v.title} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: i < viewer.videos.length - 1 ? `1px solid ${V.borderLight}` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: V.text, marginBottom: 2 }}>{v.title}</div>
                    <div style={{ fontSize: 11, color: V.textLight }}>{v.sessions} session{v.sessions > 1 ? "s" : ""} · last watched {v.lastWatched}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {v.completed && <span style={{ fontSize: 10, background: V.greenLight, color: V.green, fontWeight: 700, padding: "1px 6px", borderRadius: 3 }}>✓ Done</span>}
                    <span style={{ fontSize: 13, fontWeight: 700, color: v.avgPct >= 70 ? V.green : v.avgPct >= 40 ? V.textMid : V.amber }}>{v.avgPct}%</span>
                  </div>
                </div>
                <div style={{ background: V.bg, borderRadius: 99, height: 5, overflow: "hidden" }}>
                  <div style={{ width: `${v.avgPct}%`, height: "100%", background: v.avgPct >= 70 ? V.green : v.avgPct >= 40 ? V.teal : V.amber, borderRadius: 99, transition: "width 0.5s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Session history */}
        <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, padding: "20px 24px" }}>
          <SectionHeader title="Session history" sub={`${viewer.sessions.length} sessions`} />
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {viewer.sessions.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < viewer.sessions.length - 1 ? `1px solid ${V.borderLight}` : "none" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.completed ? V.green : s.watchedPct >= 50 ? V.teal : V.amber, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: V.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.video}</div>
                  <div style={{ fontSize: 11, color: V.textLight }}>{s.date}</div>
                </div>
                <div style={{ display: "flex", align: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: s.completed ? V.green : s.watchedPct >= 50 ? V.textMid : V.amber }}>{s.completed ? "✓ 100%" : `${s.watchedPct}%`}</span>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: V.teal }}>{s.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ViewerList = ({ onSelect }) => {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? VIEWERS
    : filter === "identified" ? VIEWERS.filter(v => v.status === "identified")
    : VIEWERS.filter(v => v.status === "anonymous");

  return (
    <div>
      {/* Header stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          ["Total viewers", VIEWERS.length, V.text],
          ["Identified", VIEWERS.filter(v => v.status === "identified").length, V.green],
          ["Anonymous", VIEWERS.filter(v => v.status === "anonymous").length, V.textMuted],
          ["Avg engagement", "68%", V.teal],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, padding: "14px 20px", flex: 1 }}>
            <div style={{ fontSize: 11, color: V.textMuted, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* How it works banner */}
      <div style={{ background: V.enterpriseBg, border: `1px solid ${V.enterpriseBorder}`, borderRadius: 8, padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>✦</span>
        <div style={{ fontSize: 12, color: V.enterpriseText, lineHeight: 1.7 }}>
          <strong>How viewer identity works:</strong> Every session starts anonymous, tracked by browser fingerprint. When a viewer logs in or submits a form on an instrumented page, their identity is resolved and <em>all prior anonymous sessions</em> from that fingerprint are retroactively attributed to them — no data is lost.
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["all", "All viewers"], ["identified", "Identified only"], ["anonymous", "Anonymous only"]].map(([val, label]) => (
          <div key={val} onClick={() => setFilter(val)} style={{ padding: "5px 14px", borderRadius: 5, fontSize: 12, cursor: "pointer", background: filter === val ? V.teal : V.white, color: filter === val ? V.white : V.textMid, border: `1px solid ${filter === val ? V.teal : V.border}`, fontWeight: filter === val ? 600 : 400 }}>{label}</div>
        ))}
      </div>

      {/* Viewer table */}
      <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: V.bg }}>
              {["Viewer", "Status", "Sessions", "Videos", "Avg engagement", "Captions", "Last seen", ""].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 500, fontSize: 11, color: V.textMuted, borderBottom: `1px solid ${V.border}`, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((viewer, i) => (
              <tr key={viewer.fingerprintId}
                onClick={() => onSelect(viewer)}
                style={{ borderBottom: `1px solid ${V.borderLight}`, cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = V.bg}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: viewer.status === "identified" ? `linear-gradient(135deg, ${V.teal}, ${V.green})` : V.borderLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: viewer.status === "identified" ? 13 : 16, color: viewer.status === "identified" ? V.white : V.textLight, fontWeight: 700, flexShrink: 0 }}>
                      {viewer.status === "identified" ? viewer.identifiedAs.split(".")[0][0].toUpperCase() : "?"}
                    </div>
                    <div>
                      {viewer.status === "identified"
                        ? <div style={{ fontWeight: 600, color: V.text }}>{viewer.identifiedAs}</div>
                        : <div style={{ fontWeight: 500, color: V.textMuted }}>Anonymous viewer</div>}
                      <FingerprintBadge id={viewer.fingerprintId} />
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 14px" }}><IdentityBadge viewer={viewer} /></td>
                <td style={{ padding: "12px 14px", color: V.textMid, fontWeight: 500 }}>{viewer.totalSessions}</td>
                <td style={{ padding: "12px 14px", color: V.textMid }}>{viewer.totalVideos}</td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 48, height: 4, background: V.borderLight, borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${viewer.avgWatchPct}%`, height: "100%", background: viewer.avgWatchPct >= 70 ? V.green : viewer.avgWatchPct >= 40 ? V.teal : V.amber, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: viewer.avgWatchPct >= 70 ? V.green : viewer.avgWatchPct >= 40 ? V.textMid : V.amber }}>{viewer.avgWatchPct}%</span>
                  </div>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  {viewer.captionsAlwaysOn
                    ? <span style={{ color: V.teal, fontSize: 12, fontWeight: 600 }}>On</span>
                    : <span style={{ color: V.textLight, fontSize: 12 }}>Off</span>}
                </td>
                <td style={{ padding: "12px 14px", color: V.textMuted, fontSize: 12 }}>{viewer.lastSeen}</td>
                <td style={{ padding: "12px 14px", textAlign: "center" }}>
                  <span style={{ color: V.teal, fontSize: 16 }}>›</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeNav, setActiveNav] = useState("deep");
  const [activeTab, setActiveTab] = useState("viewers");
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedViewer, setSelectedViewer] = useState(null);
  const [sortCol, setSortCol] = useState("views");
  const [sortDir, setSortDir] = useState("desc");

  const navItems = [
    { id: "dashboard", label: "Dashboard" }, { id: "reports", label: "Reports" },
    { id: "video", label: "Video" }, { id: "region", label: "Region" },
    { id: "source", label: "Source" }, { id: "device", label: "Device" },
    { id: "date", label: "Date" }, { id: "team", label: "Team" },
    { id: "social", label: "Social Video" }, { id: "platform", label: "Social Platform" },
    { id: "bandwidth", label: "Bandwidth" },
    { id: "deep", label: "Deep Analytics", isNew: true },
  ];

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortCol(col); setSortDir("desc"); }
  };
  const sorted = [...VIDEOS_TABLE].sort((a, b) => {
    const mult = sortDir === "desc" ? -1 : 1;
    return typeof a[sortCol] === "number" ? (a[sortCol] - b[sortCol]) * mult : a[sortCol].localeCompare(b[sortCol]) * mult;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'Aktiv Grotesk', 'Nunito Sans', 'DM Sans', -apple-system, sans-serif", background: V.bg }}>

      {/* ── TOP NAV ── */}
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

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ── SIDEBAR ── */}
        <div style={{ width: 160, background: V.sidebar, borderRight: `1px solid ${V.border}`, padding: "16px 0", flexShrink: 0, overflowY: "auto" }}>
          <div style={{ padding: "0 12px 16px", borderBottom: `1px solid ${V.borderLight}`, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: V.textMuted, fontSize: 12, cursor: "pointer" }}>
              ← Back to home
            </div>
          </div>
          {navItems.map(item => (
            <div key={item.id} onClick={() => { setActiveNav(item.id); setSelectedSession(null); setSelectedViewer(null); }}
              style={{ padding: "8px 12px", margin: "1px 8px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", background: activeNav === item.id ? V.active : "transparent", color: activeNav === item.id ? V.text : item.id === "deep" ? V.teal : V.textMid, fontWeight: activeNav === item.id ? 600 : item.id === "deep" ? 600 : 400, fontSize: 13 }}>
              <span>{item.label}</span>
              {item.isNew && <span style={{ background: V.teal, color: V.white, fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3 }}>NEW</span>}
            </div>
          ))}
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>

          {/* EXISTING DASHBOARD */}
          {activeNav !== "deep" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: V.text, margin: 0 }}>Dashboard</h1>
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <StatCard label="Views" value="20" />
                <StatCard label="Unique viewers" value="5" />
                <StatCard label="Total time watched" value="10:00" />
              </div>
              <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, padding: "20px 24px", marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Overview</div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={OVERVIEW_TREND} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={V.borderLight} vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: V.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: V.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="views" stroke={V.teal} strokeWidth={2} dot={{ fill: V.teal, r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: "linear-gradient(135deg, #f0f9ff, #faf7ff)", border: `1px solid ${V.tealMid}`, borderRadius: 8, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: V.text, marginBottom: 2 }}>Deep Analytics now available</div>
                  <div style={{ fontSize: 12, color: V.textMuted }}>See caption adoption, seek heatmaps, buffer events, and individual session replays.</div>
                </div>
                <div onClick={() => setActiveNav("deep")} style={{ background: V.teal, color: V.white, borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                  View Deep Analytics →
                </div>
              </div>
            </div>
          )}

          {/* DEEP ANALYTICS */}
          {activeNav === "deep" && (
            <div>
              {/* Page header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: V.text, margin: 0 }}>Deep Analytics</h1>
                    <span style={{ background: V.teal, color: V.white, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, letterSpacing: 0.5 }}>ENTERPRISE</span>
                  </div>
                  <div style={{ fontSize: 13, color: V.textMuted }}>Player event telemetry from embedded players and vimeo.com views</div>
                </div>
                <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 6, padding: "6px 12px", fontSize: 13, color: V.textMid, cursor: "pointer" }}>
                  Feb 3, 2026 – Mar 5, 2026 ▾
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: `1px solid ${V.border}` }}>
                {[["overview", "Overview"], ["videos", "By Video"], ["sessions", "Sessions"], ["viewers", "Viewers"], ["engagement", "Engagement"]].map(([tab, label]) => (
                  <div key={tab} onClick={() => { setActiveTab(tab); setSelectedSession(null); setSelectedViewer(null); }} style={{ padding: "10px 20px", fontSize: 13, fontWeight: activeTab === tab ? 600 : 400, color: activeTab === tab ? V.text : V.textMuted, cursor: "pointer", borderBottom: activeTab === tab ? `2px solid ${V.teal}` : "2px solid transparent", marginBottom: -1, display: "flex", alignItems: "center", gap: 6 }}>
                    {label}
                    {(tab === "sessions" || tab === "viewers") && <span style={{ background: V.tealLight, color: V.teal, fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 3 }}>NEW</span>}
                  </div>
                ))}
              </div>

              {/* ── OVERVIEW TAB ── */}
              {activeTab === "overview" && (
                <>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: V.textLight, marginBottom: 10 }}>Standard metrics</div>
                    <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                      <StatCard label="Views" value="847" />
                      <StatCard label="Unique viewers" value="312" />
                      <StatCard label="Total time watched" value="94:12" />
                      <StatCard label="Avg. % watched" value="58%" />
                    </div>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: V.teal, marginBottom: 10 }}>Deep analytics — new</div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <EnterpriseStatCard label="Caption adoption" value="34%" sub="of sessions" accent={V.teal} isNew />
                      <EnterpriseStatCard label="Seek events" value="8,923" sub="scrubs & replays" accent={V.purple} isNew />
                      <EnterpriseStatCard label="Buffer incidents" value="3.8%" sub="of sessions" accent={V.red} isNew />
                      <EnterpriseStatCard label="Quality changes" value="1,204" sub="manual switches" accent={V.amber} isNew />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
                    <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, padding: "20px 24px" }}>
                      <SectionHeader title="Viewer retention" sub="Standard estimate vs Deep Analytics actual" />
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={RETENTION_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                          <defs>
                            <linearGradient id="deepGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={V.teal} stopOpacity={0.15} />
                              <stop offset="100%" stopColor={V.teal} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={V.borderLight} vertical={false} />
                          <XAxis dataKey="t" tick={{ fill: V.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: V.textLight, fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="existing" name="Standard" stroke={V.textLight} strokeWidth={1.5} fill="none" dot={false} strokeDasharray="4 3" />
                          <Area type="monotone" dataKey="deep" name="Deep Analytics" stroke={V.teal} strokeWidth={2.5} fill="url(#deepGrad)" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, padding: "20px 24px" }}>
                      <SectionHeader title="Event breakdown" />
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {EVENT_BREAKDOWN.map(({ event, count, color }) => (
                          <div key={event}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
                                <span style={{ fontSize: 12, color: V.textMid, fontFamily: "monospace" }}>{event}</span>
                              </div>
                              <span style={{ fontSize: 12, color: V.textMuted }}>{count.toLocaleString()}</span>
                            </div>
                            <div style={{ background: V.bg, borderRadius: 99, height: 4 }}>
                              <div style={{ width: `${(count / 847) * 100}%`, height: "100%", background: color, borderRadius: 99 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── SESSIONS TAB ── */}
              {activeTab === "sessions" && (
                selectedSession
                  ? <SessionDetail session={selectedSession} onBack={() => setSelectedSession(null)} />
                  : <SessionList onSelect={setSelectedSession} />
              )}

              {/* ── VIEWERS TAB ── */}
              {activeTab === "viewers" && (
                selectedViewer
                  ? <ViewerDetail viewer={selectedViewer} onBack={() => setSelectedViewer(null)} />
                  : <ViewerList onSelect={setSelectedViewer} />
              )}

              {/* ── VIDEOS TAB ── */}
              {activeTab === "videos" && (
                <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: V.bg }}>
                        <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 500, color: V.textMuted, fontSize: 11, borderBottom: `1px solid ${V.border}` }}>Video</th>
                        {[["views","Views"],["uniqueViewers","Unique viewers"],["avgPct","Avg. % watched"],["finishes","Finishes"],["captionPct","Caption adoption"],["seekEvents","Seek events"],["bufferRate","Buffer rate"]].map(([col, label]) => (
                          <th key={col} onClick={() => handleSort(col)} style={{ padding: "10px 14px", textAlign: "right", fontWeight: 500, fontSize: 11, borderBottom: `1px solid ${V.border}`, cursor: "pointer", color: sortCol === col ? V.teal : V.textMuted, whiteSpace: "nowrap" }}>
                            {label} {sortCol === col ? (sortDir === "desc" ? "↓" : "↑") : ""}
                            {["captionPct","seekEvents","bufferRate"].includes(col) && <span style={{ background: V.tealLight, color: V.teal, fontSize: 8, fontWeight: 700, padding: "1px 4px", borderRadius: 3, marginLeft: 4 }}>NEW</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map(v => (
                        <tr key={v.title} style={{ borderBottom: `1px solid ${V.borderLight}`, cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.background = V.bg}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 40, height: 28, background: V.borderLight, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{v.thumb}</div>
                              <div>
                                <div style={{ fontWeight: 500, color: V.text }}>{v.title}</div>
                                <div style={{ fontSize: 11, color: V.textLight }}>Uploaded {v.uploaded}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right", color: V.textMid }}>{v.views.toLocaleString()}</td>
                          <td style={{ padding: "12px 14px", textAlign: "right", color: V.textMid }}>{v.uniqueViewers}</td>
                          <td style={{ padding: "12px 14px", textAlign: "right" }}><span style={{ color: v.avgPct >= 60 ? V.green : V.textMid, fontWeight: 600 }}>{v.avgPct}%</span></td>
                          <td style={{ padding: "12px 14px", textAlign: "right", color: V.textMid }}>{v.finishes}</td>
                          <td style={{ padding: "12px 14px", textAlign: "right" }}><span style={{ color: v.captionPct >= 50 ? V.teal : v.captionPct > 0 ? V.textMid : V.textLight }}>{v.captionPct > 0 ? `${v.captionPct}%` : "—"}</span></td>
                          <td style={{ padding: "12px 14px", textAlign: "right", color: V.textMid }}>{v.seekEvents || "—"}</td>
                          <td style={{ padding: "12px 14px", textAlign: "right" }}><span style={{ color: v.bufferRate > 3 ? V.red : v.bufferRate > 0 ? V.amber : V.textLight }}>{v.bufferRate > 0 ? `${v.bufferRate}%` : "—"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── ENGAGEMENT TAB ── */}
              {activeTab === "engagement" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, padding: "20px 24px" }}>
                    <SectionHeader title="Most replayed sections" sub="Security Training Module 3" />
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={SEEK_HEATMAP} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={V.borderLight} vertical={false} />
                        <XAxis dataKey="segment" tick={{ fill: V.textLight, fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: V.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="replays" name="Seek events" radius={[3, 3, 0, 0]}>
                          {SEEK_HEATMAP.map((entry, i) => (
                            <Cell key={i} fill={entry.replays > 100 ? V.teal : entry.replays > 50 ? V.tealMid : V.borderLight} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, padding: "20px 24px" }}>
                    <SectionHeader title="Caption adoption by video" sub="% of sessions with captions enabled" />
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {VIDEOS_TABLE.filter(v => v.captionPct > 0).map(v => (
                        <div key={v.title}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 13, color: V.textMid }}>{v.title.length > 30 ? v.title.slice(0, 30) + "…" : v.title}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: v.captionPct >= 50 ? V.teal : V.textMid }}>{v.captionPct}%</span>
                          </div>
                          <div style={{ background: V.bg, borderRadius: 99, height: 6 }}>
                            <div style={{ width: `${v.captionPct}%`, height: "100%", background: v.captionPct >= 50 ? V.teal : V.tealMid, borderRadius: 99 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${V.border}`, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: V.textLight }}>Player event data via Vimeo's embedded tracking · vimeo.com views included for opted-in accounts</span>
                <span style={{ fontSize: 11, color: V.teal, cursor: "pointer", fontWeight: 500 }}>Export raw event data →</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
