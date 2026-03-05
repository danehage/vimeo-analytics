import { useState } from 'react';
import { V, EVENT_COLORS } from '../constants/theme';
import { usePolling } from '../hooks/usePolling';

const MOCK_EVENTS = [
  { event_type: "play", video_id: "v003", playhead: 0, timestamp: "2026-03-05T16:14:02Z", embed_url: "intranet.corp.com/learning/security" },
  { event_type: "timeupdate", video_id: "v003", playhead: 5, timestamp: "2026-03-05T16:14:07Z", embed_url: "intranet.corp.com/learning/security" },
  { event_type: "seeked", video_id: "v003", playhead: 330, timestamp: "2026-03-05T16:17:14Z", embed_url: "intranet.corp.com/learning/security" },
  { event_type: "texttrackchange", video_id: "v003", playhead: 405, timestamp: "2026-03-05T16:20:47Z", embed_url: "intranet.corp.com/learning/security" },
  { event_type: "pause", video_id: "v003", playhead: 560, timestamp: "2026-03-05T16:23:22Z", embed_url: "intranet.corp.com/learning/security" },
  { event_type: "play", video_id: "v001", playhead: 0, timestamp: "2026-03-05T16:30:00Z", embed_url: "sharepoint.corp.com/marketing/videos" },
  { event_type: "seeked", video_id: "v001", playhead: 38, timestamp: "2026-03-05T16:30:18Z", embed_url: "sharepoint.corp.com/marketing/videos" },
  { event_type: "qualitychange", video_id: "v001", playhead: 38, timestamp: "2026-03-05T16:30:20Z", embed_url: "sharepoint.corp.com/marketing/videos" },
  { event_type: "ended", video_id: "v001", playhead: 77, timestamp: "2026-03-05T16:31:17Z", embed_url: "sharepoint.corp.com/marketing/videos" },
  { event_type: "play", video_id: "v003", playhead: 0, timestamp: "2026-03-05T16:35:01Z", embed_url: "intranet.corp.com/learning/security" },
  { event_type: "bufferstart", video_id: "v003", playhead: 45, timestamp: "2026-03-05T16:35:46Z", embed_url: "intranet.corp.com/learning/security" },
  { event_type: "bufferend", video_id: "v003", playhead: 45, timestamp: "2026-03-05T16:35:54Z", embed_url: "intranet.corp.com/learning/security" },
  { event_type: "qualitychange", video_id: "v003", playhead: 62, timestamp: "2026-03-05T16:36:03Z", embed_url: "intranet.corp.com/learning/security" },
  { event_type: "pause", video_id: "v003", playhead: 200, timestamp: "2026-03-05T16:39:21Z", embed_url: "intranet.corp.com/learning/security" },
  { event_type: "volumechange", video_id: "v003", playhead: 200, timestamp: "2026-03-05T16:39:23Z", embed_url: "intranet.corp.com/learning/security" },
  { event_type: "play", video_id: "v003", playhead: 200, timestamp: "2026-03-05T16:40:05Z", embed_url: "intranet.corp.com/learning/security" },
  { event_type: "seeked", video_id: "v003", playhead: 490, timestamp: "2026-03-05T16:43:22Z", embed_url: "intranet.corp.com/learning/security" },
  { event_type: "texttrackchange", video_id: "v003", playhead: 490, timestamp: "2026-03-05T16:43:24Z", embed_url: "intranet.corp.com/learning/security" },
  { event_type: "ended", video_id: "v003", playhead: 821, timestamp: "2026-03-05T16:49:43Z", embed_url: "intranet.corp.com/learning/security" },
  { event_type: "play", video_id: "v001", playhead: 0, timestamp: "2026-03-05T16:52:10Z", embed_url: "sharepoint.corp.com/marketing/videos" },
];

function fmtPlayhead(s) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function extractDomain(url) {
  if (!url) return "";
  return url.replace(/^https?:\/\//, "").split("/")[0];
}

export default function EventFeed() {
  const [visible, setVisible] = useState(false);
  const { data } = usePolling('/api/analytics/recent-events', 3000);
  const events = data || MOCK_EVENTS;
  const displayEvents = events.slice(0, 20);

  return (
    <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 100 }}>
      {/* Toggle button */}
      <div
        onClick={() => setVisible(!visible)}
        style={{
          background: V.teal,
          color: V.white,
          borderRadius: 99,
          padding: "8px 16px",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 2px 12px rgba(26,183,234,0.3)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginLeft: "auto",
          width: "fit-content",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7ee787", animation: "pulse 2s infinite" }} />
        {visible ? "Hide" : "Live"} Event Feed
      </div>

      {/* Event list */}
      {visible && (
        <div style={{
          position: "absolute",
          bottom: 44,
          right: 0,
          width: 420,
          maxHeight: 480,
          overflowY: "auto",
          background: V.white,
          border: `1px solid ${V.border}`,
          borderRadius: 8,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${V.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: V.green }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: V.text }}>Live Event Feed</span>
            </div>
            <span style={{ fontSize: 11, color: V.textLight }}>Polling every 3s</span>
          </div>
          <div style={{ padding: 0 }}>
            {displayEvents.map((ev, i) => {
              const color = EVENT_COLORS[ev.event_type] || V.textMuted;
              return (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 16px",
                  borderBottom: `1px solid ${V.borderLight}`,
                  fontSize: 12,
                }}>
                  {/* Type badge */}
                  <span style={{
                    background: color + "18",
                    color: color,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 3,
                    fontFamily: "monospace",
                    minWidth: 70,
                    textAlign: "center",
                    flexShrink: 0,
                    border: `1px solid ${color}30`,
                  }}>
                    {ev.event_type}
                  </span>
                  {/* Video ID */}
                  <span style={{ fontFamily: "monospace", color: V.textMuted, fontSize: 11, flexShrink: 0 }}>{ev.video_id}</span>
                  {/* Playhead */}
                  <span style={{ color: V.textLight, fontSize: 11, flexShrink: 0 }}>{fmtPlayhead(ev.playhead)}</span>
                  {/* Domain */}
                  <span style={{ color: V.textLight, fontSize: 10, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {extractDomain(ev.embed_url)}
                  </span>
                  {/* Time ago */}
                  <span style={{ color: V.textLight, fontSize: 10, flexShrink: 0, whiteSpace: "nowrap" }}>{timeAgo(ev.timestamp)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
