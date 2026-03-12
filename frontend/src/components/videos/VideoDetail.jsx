import { V, fmtSecs } from '../../constants/theme';
import SectionHeader from '../shared/SectionHeader';
import { usePolling } from '../../hooks/usePolling';

export default function VideoDetail({ video, onBack, onSelectSession }) {
  const { data, loading } = usePolling(`/api/analytics/sessions?videoId=${video.videoId}&limit=100`, 30000);

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
    seeks: s.seek_events || 0,
    buffers: s.buffer_events || 0,
    isLive: s.embed_url?.includes('vidharbor.com'),
  }));

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: V.textMuted }}>
        <span onClick={onBack} style={{ cursor: "pointer", color: V.teal, fontWeight: 500 }}>← Videos</span>
        <span>›</span>
        <span style={{ color: V.text }}>{video.title}</span>
      </div>

      {/* Video header card */}
      <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, padding: "20px 24px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${V.teal}, ${V.purple})` }} />

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 48, height: 34, borderRadius: 6,
            background: V.tableHeaderBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, flexShrink: 0,
          }}>
            🎬
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: V.text }}>{video.title}</div>
            <div style={{ fontSize: 12, color: V.textLight }}>
              {video.videoId} · {video.duration}
            </div>
          </div>
        </div>

        {/* Aggregate stats */}
        <div style={{ display: "flex", gap: 0, flexWrap: "wrap", borderTop: `1px solid ${V.borderLight}`, paddingTop: 16 }}>
          {[
            ["Views", video.views, V.text],
            ["Unique viewers", video.uniqueViewers, V.text],
            ["Avg. % watched", `${video.avgPct}%`, video.avgPct >= 60 ? V.green : video.avgPct >= 30 ? V.textMid : V.amber],
            ["Finishes", video.finishes, V.text],
            ["Caption adoption", video.captionPct > 0 ? `${video.captionPct}%` : "—", video.captionPct >= 50 ? V.teal : V.textLight],
            ["Seek events", video.seekEvents || "—", V.textMid],
            ["High buffer %", video.bufferRate > 0 ? `${video.bufferRate}%` : "—", video.bufferRate > 3 ? V.red : video.bufferRate > 0 ? V.amber : V.textLight],
          ].map(([label, val, color]) => (
            <div key={label} style={{ flex: 1, minWidth: 100, padding: "0 12px" }}>
              <div style={{ fontSize: 11, color: V.textLight, marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sessions list */}
      <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${V.border}` }}>
          <SectionHeader title="Sessions" sub={`${sessions.length} sessions for this video`} />
        </div>

        {loading && sessions.length === 0 ? (
          <div style={{ padding: 24, fontSize: 13, color: V.textMuted }}>Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div style={{ padding: 24, fontSize: 13, color: V.textLight }}>No sessions recorded yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: V.tableHeaderBg }}>
                {["Session", "Viewer", "Date", "Source", "Watched", "Captions", "Seeks", "Buffers", ""].map(h => (
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
              {sessions.map(s => (
                <tr
                  key={s.session_id}
                  onClick={() => onSelectSession?.(s)}
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
        )}
      </div>
    </div>
  );
}
