import { useState } from 'react';
import { V, fmtSecs } from '../../constants/theme';

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
      { type: "play", time: "0:00", playhead: 0, icon: "\u25B6", color: "#1ab7ea", label: "Started playback" },
      { type: "qualitychange", time: "0:08", playhead: 8, icon: "\u2699", color: "#f59e0b", label: "Quality changed to 1080p" },
      { type: "timeupdate", time: "2:14", playhead: 134, icon: "\u00B7", color: "#efefed", label: "Watching\u2026" },
      { type: "pause", time: "2:14", playhead: 134, icon: "\u23F8", color: "#767676", label: "Paused (45 seconds)" },
      { type: "play", time: "2:59", playhead: 134, icon: "\u25B6", color: "#1ab7ea", label: "Resumed" },
      { type: "timeupdate", time: "3:12", playhead: 192, icon: "\u00B7", color: "#efefed", label: "Watching\u2026" },
      { type: "seeked", time: "3:12", playhead: 330, icon: "\u23ED", color: "#8b5cf6", label: "Skipped forward \u2192 5:30" },
      { type: "timeupdate", time: "6:45", playhead: 405, icon: "\u00B7", color: "#efefed", label: "Watching\u2026" },
      { type: "texttrackchange", time: "6:45", playhead: 405, icon: "CC", color: "#30a46c", label: "Captions turned on (English)" },
      { type: "timeupdate", time: "9:20", playhead: 560, icon: "\u00B7", color: "#efefed", label: "Watching\u2026" },
      { type: "seeked", time: "9:20", playhead: 490, icon: "\u23EE", color: "#8b5cf6", label: "Rewound \u2192 8:10 (replayed section)" },
      { type: "timeupdate", time: "12:34", playhead: 754, icon: "\u00B7", color: "#efefed", label: "Watching\u2026" },
      { type: "timeupdate", time: "13:37", playhead: 817, icon: "\u00B7", color: "#efefed", label: "Watching\u2026" },
      { type: "ended", time: "13:41", playhead: 821, icon: "\u2713", color: "#30a46c", label: "Session ended \u2014 74% watched" },
    ],
    watchedSegments: [
      { from: 0, to: 19.4, type: "watched" },
      { from: 19.4, to: 19.4, type: "pause" },
      { from: 19.4, to: 29.9, type: "watched" },
      { from: 29.9, to: 50.0, type: "skipped" },
      { from: 50.0, to: 74.0, type: "watched" },
      { from: 74.0, to: 63.5, type: "rewind" },
      { from: 63.5, to: 74.5, type: "rewatched" },
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
      { type: "play", time: "0:00", playhead: 0, icon: "\u25B6", color: "#1ab7ea", label: "Started playback" },
      { type: "bufferstart", time: "1:12", playhead: 72, icon: "\u29D7", color: "#e5484d", label: "Buffering started" },
      { type: "bufferend", time: "1:15", playhead: 72, icon: "\u25B6", color: "#1ab7ea", label: "Buffering ended (3s)" },
      { type: "seeked", time: "4:30", playhead: 600, icon: "\u23ED", color: "#8b5cf6", label: "Skipped forward \u2192 10:00" },
      { type: "timeupdate", time: "14:22", playhead: 862, icon: "\u00B7", color: "#efefed", label: "Watching\u2026" },
      { type: "ended", time: "18:22", playhead: 1102, icon: "\u2713", color: "#30a46c", label: "Completed \u2014 100% watched" },
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
      { type: "play", time: "0:00", playhead: 0, icon: "\u25B6", color: "#1ab7ea", label: "Started playback" },
      { type: "texttrackchange", time: "0:04", playhead: 4, icon: "CC", color: "#30a46c", label: "Captions turned on (Spanish)" },
      { type: "qualitychange", time: "0:12", playhead: 12, icon: "\u2699", color: "#f59e0b", label: "Quality changed to 720p (auto)" },
      { type: "bufferstart", time: "0:45", playhead: 45, icon: "\u29D7", color: "#e5484d", label: "Buffering (8s)" },
      { type: "bufferend", time: "0:53", playhead: 45, icon: "\u25B6", color: "#1ab7ea", label: "Resumed" },
      { type: "qualitychange", time: "1:02", playhead: 62, icon: "\u2699", color: "#f59e0b", label: "Quality dropped to 540p" },
      { type: "bufferstart", time: "1:34", playhead: 94, icon: "\u29D7", color: "#e5484d", label: "Buffering (12s)" },
      { type: "bufferend", time: "1:46", playhead: 94, icon: "\u25B6", color: "#1ab7ea", label: "Resumed" },
      { type: "bufferstart", time: "2:41", playhead: 161, icon: "\u29D7", color: "#e5484d", label: "Buffering (6s)" },
      { type: "pause", time: "3:20", playhead: 200, icon: "\u23F8", color: "#767676", label: "Paused \u2014 session abandoned" },
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
      { type: "play", time: "0:00", playhead: 0, icon: "\u25B6", color: "#1ab7ea", label: "Started playback" },
      { type: "seeked", time: "0:18", playhead: 38, icon: "\u23ED", color: "#8b5cf6", label: "Skipped forward \u2192 0:38" },
      { type: "seeked", time: "1:02", playhead: 45, icon: "\u23EE", color: "#8b5cf6", label: "Rewound \u2192 0:45" },
      { type: "ended", time: "1:17", playhead: 77, icon: "\u2713", color: "#30a46c", label: "Session ended \u2014 91% watched" },
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

export { SESSIONS };

export default function SessionList({ onSelect }) {
  const [filterVideo, setFilterVideo] = useState("all");
  const filtered = filterVideo === "all" ? SESSIONS : SESSIONS.filter(s => s.videoId === filterVideo);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: V.textMuted }}>{filtered.length} sessions \u00B7 click any row to view full replay</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["all", "All videos"], ["v003", "Security Training"], ["v001", "AWS Marketplace"]].map(([val, label]) => (
            <div
              key={val}
              onClick={() => setFilterVideo(val)}
              style={{
                padding: "5px 12px",
                borderRadius: 5,
                fontSize: 12,
                cursor: "pointer",
                background: filterVideo === val ? V.teal : V.white,
                color: filterVideo === val ? V.white : V.textMid,
                border: `1px solid ${filterVideo === val ? V.teal : V.border}`,
                fontWeight: filterVideo === val ? 600 : 400,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: V.bg }}>
              {["Session", "Video", "Date", "Source", "Watched", "Captions", "Seeks", "Buffers", ""].map(h => (
                <th key={h} style={{
                  padding: "10px 14px",
                  textAlign: h === "" ? "center" : "left",
                  fontWeight: 500,
                  fontSize: 11,
                  color: V.textMuted,
                  borderBottom: `1px solid ${V.border}`,
                  whiteSpace: "nowrap",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr
                key={s.id}
                onClick={() => onSelect(s)}
                style={{ borderBottom: `1px solid ${V.borderLight}`, cursor: "pointer", transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = V.bg}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
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
                  <span style={{
                    background: s.source === "embed" ? V.tealLight : V.purpleLight,
                    color: s.source === "embed" ? V.teal : V.purple,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 7px",
                    borderRadius: 4,
                  }}>
                    {s.source}
                  </span>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 50, height: 5, background: V.borderLight, borderRadius: 99, overflow: "hidden" }}>
                      <div style={{
                        width: `${s.watchedPct}%`,
                        height: "100%",
                        background: s.watchedPct >= 80 ? V.green : s.watchedPct >= 40 ? V.teal : V.amber,
                        borderRadius: 99,
                      }} />
                    </div>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: s.watchedPct >= 80 ? V.green : s.watchedPct >= 40 ? V.textMid : V.amber,
                    }}>
                      {s.watchedPct}%
                    </span>
                    {s.completed && <span style={{ fontSize: 10, color: V.green }}>\u2713</span>}
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
                  <span style={{ color: s.buffers > 0 ? V.red : V.textLight, fontWeight: s.buffers > 0 ? 600 : 400 }}>
                    {s.buffers > 0 ? s.buffers : "\u2014"}
                  </span>
                </td>
                <td style={{ padding: "12px 14px", textAlign: "center" }}>
                  <span style={{ color: V.teal, fontSize: 16 }}>\u203A</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
