import { useState } from 'react';
import { V, EVENT_COLORS } from '../constants/theme';
import { usePolling } from '../hooks/usePolling';

function fmtPlayhead(s) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function extractDomain(url) {
  if (!url) return "";
  return url.replace(/^https?:\/\//, "").split("/")[0];
}

export default function EventFeed() {
  const [visible, setVisible] = useState(false);
  const { data, loading, error } = usePolling('/api/analytics/recent-events', 3000);
  const displayEvents = (Array.isArray(data) ? data : []).slice(0, 20);
  const emptyMessage = loading ? "Connecting…" : error ? `Can't reach the event API (${error}). Retrying…` : "No events yet. Play a video on an instrumented page.";

  return (
    <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 100 }}>
      {/* Toggle button */}
      <div
        onClick={() => setVisible(!visible)}
        style={{
          background: V.teal,
          color: "#0e1216",
          borderRadius: 99,
          padding: "8px 16px",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 2px 12px rgba(3,193,235,0.3)",
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
          background: V.tableHeaderBg,
          border: `1px solid ${V.border}`,
          borderRadius: V.cardRadius,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${V.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: V.green }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: V.text }}>Live Event Feed</span>
            </div>
            <span style={{ fontSize: 11, color: V.textLight }}>Polling every 3s</span>
          </div>
          <div style={{ padding: 0 }}>
            {displayEvents.length === 0 && (
              <div style={{ padding: "16px", fontSize: 12, color: V.textLight }}>{emptyMessage}</div>
            )}
            {displayEvents.map((ev, i) => {
              const color = EVENT_COLORS[ev.event_type] || V.textMuted;
              return (
                <div key={ev.event_id || i} style={{
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
