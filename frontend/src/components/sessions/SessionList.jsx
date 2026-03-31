import { useState } from 'react';
import { V, fmtSecs } from '../../constants/theme';
import { usePolling } from '../../hooks/usePolling';
import ErrorMessage from '../shared/ErrorMessage';

export default function SessionList({ onSelect }) {
  const [filterVideo, setFilterVideo] = useState("all");
  const { data, loading, error, refetch } = usePolling('/api/analytics/sessions');

  const sessions = (data?.sessions || []).map(s => ({
    id: s.session_id?.slice(0, 6) || '—',
    session_id: s.session_id,
    shortId: '#' + (s.session_id?.slice(0, 6) || '—'),
    video: s.video_title || s.video_id,
    videoId: s.video_id,
    viewerId: s.viewer_id || null,
    fingerprintId: s.fingerprint_id || null,
    duration: s.video_duration || 0,
    date: s.started_at ? new Date(s.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
    time: s.started_at ? new Date(s.started_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
    source: s.embed_url ? 'embed' : 'direct',
    embedUrl: s.embed_url || '',
    watchedPct: Math.round(s.percent_watched || 0),
    completed: !!s.completed,
    captionsEnabled: (s.caption_events || 0) > 0,
    qualityChanges: 0,
    seeks: s.seek_events || 0,
    buffers: s.buffer_events || 0,
    isLive: s.embed_url?.includes('vidharbor.com'),
  }));

  // Build filter options dynamically from data
  const videoIds = [...new Set(sessions.map(s => s.videoId))];
  const filterOptions = [["all", "All videos"], ...videoIds.map(id => {
    const s = sessions.find(s => s.videoId === id);
    const label = s?.video?.length > 25 ? s.video.slice(0, 25) + '…' : (s?.video || id);
    return [id, label];
  })];

  const filtered = filterVideo === "all" ? sessions : sessions.filter(s => s.videoId === filterVideo);

  if (error) {
    return <ErrorMessage error={error} onRetry={refetch} />;
  }

  if (loading && sessions.length === 0) {
    return <div style={{ fontSize: 13, color: V.textMuted, padding: 20 }}>Loading sessions...</div>;
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: V.textMuted }}>{filtered.length} sessions · click any row to view full replay</div>
        <div style={{ display: "flex", gap: 8 }}>
          {filterOptions.map(([val, label]) => (
            <div
              key={val}
              onClick={() => setFilterVideo(val)}
              style={{
                padding: "5px 12px",
                borderRadius: 5,
                fontSize: 12,
                cursor: "pointer",
                background: filterVideo === val ? V.teal : V.tableHeaderBg,
                color: filterVideo === val ? "#0e1216" : V.textMid,
                border: `1px solid ${filterVideo === val ? V.teal : V.border}`,
                fontWeight: filterVideo === val ? 600 : 400,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: V.tableHeaderBg }}>
              {["Session", "Viewer", "Video", "Date", "Source", "Watched", "Captions", "Seeks", "Buffers", ""].map(h => (
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
                key={s.session_id}
                onClick={() => onSelect(s)}
                style={{ borderBottom: `1px solid ${V.borderLight}`, cursor: "pointer", transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = V.active}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "12px 14px" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: V.teal, fontWeight: 600 }}>{s.shortId}</span>
                </td>
                <td style={{ padding: "12px 14px", maxWidth: 160 }}>
                  {s.viewerId ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: V.green, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: V.text, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>{s.viewerId}</span>
                    </div>
                  ) : (
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: V.textLight }}>{s.fingerprintId || '—'}</span>
                  )}
                </td>
                <td style={{ padding: "12px 14px", maxWidth: 180 }}>
                  <div style={{ fontWeight: 500, color: V.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>{s.video}</div>
                  {s.duration > 0 && <div style={{ fontSize: 11, color: V.textLight }}>{fmtSecs(s.duration)}</div>}
                </td>
                <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                  <div style={{ color: V.textMid }}>{s.date}</div>
                  <div style={{ fontSize: 11, color: V.textLight }}>{s.time}</div>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
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
                    {s.isLive && (
                      <span style={{
                        background: V.greenLight,
                        color: V.green,
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}>
                        live
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 50, height: 5, background: "rgba(114,130,163,0.15)", borderRadius: 99, overflow: "hidden" }}>
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
                  <span style={{ color: s.buffers > 0 ? V.red : V.textLight, fontWeight: s.buffers > 0 ? 600 : 400 }}>
                    {s.buffers > 0 ? s.buffers : "—"}
                  </span>
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
}
