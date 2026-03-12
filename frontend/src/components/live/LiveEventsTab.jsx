import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { V, fmtSecs } from '../../constants/theme';
import { usePolling } from '../../hooks/usePolling';
import EnterpriseStatCard from '../shared/EnterpriseStatCard';
import SectionHeader from '../shared/SectionHeader';

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function streamDuration(createdAt) {
  if (!createdAt) return '—';
  const diff = (Date.now() - new Date(createdAt).getTime()) / 1000;
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function watchTime(viewer) {
  if (viewer.started_at && viewer.last_event_at) {
    const elapsed = (new Date(viewer.last_event_at).getTime() - new Date(viewer.started_at).getTime()) / 1000;
    if (elapsed > 0) return fmtSecs(elapsed);
  }
  if (viewer.last_playhead != null) return fmtSecs(viewer.last_playhead);
  return '—';
}

function experienceLevel(viewer) {
  const q = viewer.current_quality || 'auto';
  const isHighQuality = ['1080p', '2K', '4K', '2160p', '1440p', '720p'].includes(q);
  const buffers = viewer.buffer_count || 0;
  const qChanges = viewer.quality_changes || 0;

  if (buffers >= 3) return { label: 'Poor', color: V.red };
  if (buffers >= 1 || !isHighQuality || qChanges >= 2) return { label: 'Good', color: V.amber };
  return { label: 'Excellent', color: V.green };
}

export default function LiveEventsTab({ onSelectEvent, onSelectSession }) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  if (selectedEvent) {
    return <LiveEventDetail
      videoId={selectedEvent.video_id}
      event={selectedEvent}
      onBack={() => setSelectedEvent(null)}
      onSelectSession={onSelectSession}
    />;
  }

  return <LiveEventsList onSelect={setSelectedEvent} />;
}

// ---------------------------------------------------------------------------
// List View
// ---------------------------------------------------------------------------

function LiveEventsList({ onSelect }) {
  const { data, loading } = usePolling('/api/analytics/live-events', 10000);
  const events = data || [];
  const activeEvents = events.filter(e => e.is_active);
  const pastEvents = events.filter(e => !e.is_active);

  if (loading && events.length === 0) {
    return <div style={{ fontSize: 13, color: V.textMuted, padding: 20 }}>Loading live events...</div>;
  }

  if (events.length === 0) {
    return (
      <div style={{
        background: V.white, border: `1px solid ${V.border}`,
        borderRadius: V.cardRadius, padding: "48px 24px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📡</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: V.text, marginBottom: 8 }}>
          No live events yet
        </div>
        <div style={{ fontSize: 13, color: V.textMuted, maxWidth: 460, margin: "0 auto", lineHeight: 1.6 }}>
          Live events appear here when a collector is embedded on a page with a Vimeo live stream.
          Add <code style={{ background: V.tableHeaderBg, padding: "2px 6px", borderRadius: 3, fontFamily: "monospace", fontSize: 12 }}>isLive: true</code> to
          your <code style={{ background: V.tableHeaderBg, padding: "2px 6px", borderRadius: 3, fontFamily: "monospace", fontSize: 12 }}>VimeoAnalyticsConfig</code> to tag events as live.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Streaming Now */}
      {activeEvents.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: V.red,
              boxShadow: `0 0 8px ${V.red}`,
            }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: V.text, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Streaming Now
            </span>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {activeEvents.map(ev => (
              <div
                key={ev.video_id}
                onClick={() => onSelect(ev)}
                style={{
                  background: V.white, border: `1px solid ${V.border}`,
                  borderRadius: V.cardRadius, padding: "20px 24px",
                  flex: "1 1 300px", maxWidth: 500,
                  cursor: "pointer", position: "relative", overflow: "hidden",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = V.active}
                onMouseLeave={e => e.currentTarget.style.background = V.white}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: V.red }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{
                    background: V.red, color: "#fff",
                    fontSize: 10, fontWeight: 700, padding: "3px 8px",
                    borderRadius: 4, letterSpacing: 0.5,
                  }}>
                    LIVE
                  </span>
                  <span style={{ fontSize: 11, color: V.textLight }}>
                    {streamDuration(ev.created_at)} elapsed
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: V.text, marginBottom: 4 }}>
                  {ev.title || ev.video_id}
                </div>
                <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: V.teal }}>{ev.current_viewers}</div>
                    <div style={{ fontSize: 11, color: V.textLight }}>watching now</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: V.text }}>{ev.unique_viewers}</div>
                    <div style={{ fontSize: 11, color: V.textLight }}>total viewers</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: V.text }}>{ev.total_sessions}</div>
                    <div style={{ fontSize: 11, color: V.textLight }}>sessions</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Live Events */}
      {pastEvents.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: V.textLight, marginBottom: 10 }}>
            Past Live Events
          </div>
          <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: V.tableHeaderBg }}>
                  {["Event", "Date", "Duration", "Total Viewers", "Unique Viewers", "Avg. Engagement", ""].map(h => (
                    <th key={h} style={{
                      padding: "10px 14px", textAlign: h === "" ? "center" : "left",
                      fontWeight: 500, fontSize: 11, color: V.textMuted,
                      borderBottom: `1px solid ${V.border}`,
                      whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: 0.5,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pastEvents.map(ev => (
                  <tr
                    key={ev.video_id}
                    onClick={() => onSelect(ev)}
                    style={{ borderBottom: `1px solid ${V.borderLight}`, cursor: "pointer", transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = V.active}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 500, color: V.text }}>{ev.title || ev.video_id}</div>
                      <div style={{ fontSize: 11, color: V.textLight }}>{ev.video_id}</div>
                    </td>
                    <td style={{ padding: "12px 14px", color: V.textMid, whiteSpace: "nowrap" }}>
                      {ev.last_activity ? new Date(ev.last_activity).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: "12px 14px", color: V.textMid }}>
                      {ev.duration ? fmtSecs(ev.duration) : '—'}
                    </td>
                    <td style={{ padding: "12px 14px", color: V.textMid }}>{ev.total_sessions}</td>
                    <td style={{ padding: "12px 14px", color: V.textMid }}>{ev.unique_viewers}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        color: ev.avg_percent_watched >= 60 ? V.green : V.textMid,
                        fontWeight: 600,
                      }}>
                        {ev.avg_percent_watched}%
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
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail View
// ---------------------------------------------------------------------------

function LiveEventDetail({ videoId, event, onBack, onSelectSession }) {
  const { data, loading } = usePolling(`/api/analytics/live-events/${videoId}`, 10000);

  const video = data?.video || event;
  const activeViewers = data?.active_viewers || [];
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

  const isActive = video.is_active;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: V.textMuted }}>
        <span onClick={onBack} style={{ cursor: "pointer", color: V.teal, fontWeight: 500 }}>← Live Events</span>
        <span>›</span>
        <span style={{ color: V.text }}>{video.title || videoId}</span>
      </div>

      {/* Header card */}
      <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, padding: "20px 24px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: isActive ? V.red : V.textLight }} />

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 48, height: 34, borderRadius: 6,
            background: V.tableHeaderBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, flexShrink: 0,
          }}>
            📡
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: V.text }}>{video.title || videoId}</span>
              <span style={{
                background: isActive ? V.red : V.textLight,
                color: "#fff",
                fontSize: 10, fontWeight: 700, padding: "3px 8px",
                borderRadius: 4, letterSpacing: 0.5,
              }}>
                {isActive ? 'LIVE' : 'ENDED'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: V.textLight }}>
              {videoId} · {video.duration ? fmtSecs(video.duration) : '—'}
            </div>
          </div>
        </div>

        {/* Aggregate stats */}
        <div style={{ display: "flex", gap: 0, flexWrap: "wrap", borderTop: `1px solid ${V.borderLight}`, paddingTop: 16 }}>
          {[
            ["Current Viewers", isActive ? (video.current_viewers || 0) : "—", isActive ? V.teal : V.textLight],
            ["Total Sessions", video.total_sessions || 0, V.text],
            ["Unique Viewers", video.unique_viewers || 0, V.text],
            ["Avg. Engagement", `${video.avg_percent_watched || 0}%`, (video.avg_percent_watched || 0) >= 60 ? V.green : V.textMid],
            ["Finishes", video.finishes || 0, V.text],
          ].map(([label, val, color]) => (
            <div key={label} style={{ flex: 1, minWidth: 100, padding: "0 12px" }}>
              <div style={{ fontSize: 11, color: V.textLight, marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Currently Watching panel */}
      {isActive && activeViewers.length > 0 && (
        <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${V.border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: V.red,
              boxShadow: `0 0 6px ${V.red}`,
            }} />
            <SectionHeader title="Currently Watching" sub={`${activeViewers.length} active viewer${activeViewers.length !== 1 ? 's' : ''} · updates every 10s`} />
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: V.tableHeaderBg }}>
                {["Viewer", "Quality", "Captions", "Buffers", "Experience", "Watch Time"].map(h => (
                  <th key={h} style={{
                    padding: "10px 14px", textAlign: "left",
                    fontWeight: 500, fontSize: 11, color: V.textMuted,
                    borderBottom: `1px solid ${V.border}`,
                    whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: 0.5,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeViewers.map(v => {
                const exp = experienceLevel(v);
                return (
                  <tr key={v.session_id} style={{ borderBottom: `1px solid ${V.borderLight}` }}>
                    <td style={{ padding: "12px 14px", maxWidth: 180 }}>
                      {v.viewer_id ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: V.green, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: V.text, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 }}>{v.viewer_id}</span>
                        </div>
                      ) : (
                        <span style={{ fontFamily: "monospace", fontSize: 11, color: V.textLight }}>{v.fingerprint_id || '—'}</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        background: V.tableHeaderBg, border: `1px solid ${V.border}`,
                        padding: "2px 8px", borderRadius: 4,
                        fontSize: 11, fontWeight: 600, color: V.textMid,
                      }}>
                        {v.current_quality || 'auto'}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      {v.caption_label
                        ? <span style={{ color: V.green, fontWeight: 600, fontSize: 12 }}>{v.caption_label}</span>
                        : <span style={{ color: V.textLight, fontSize: 12 }}>Off</span>}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        color: (v.buffer_count || 0) > 0 ? V.red : V.textLight,
                        fontWeight: (v.buffer_count || 0) > 0 ? 600 : 400,
                      }}>
                        {(v.buffer_count || 0) > 0 ? v.buffer_count : '—'}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        background: exp.color === V.green ? V.greenLight : exp.color === V.amber ? V.amberLight : V.redLight,
                        color: exp.color,
                        fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4,
                      }}>
                        {exp.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 12, color: V.textMid }}>
                        {watchTime(v)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Retention chart — shown once event has ended and has a duration */}
      {!isActive && video.duration > 0 && (
        <LiveRetentionChart videoId={videoId} duration={video.duration} />
      )}

      {/* Sessions table */}
      <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${V.border}` }}>
          <SectionHeader title="All Sessions" sub={`${sessions.length} sessions for this live event`} />
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
                    padding: "10px 14px", textAlign: h === "" ? "center" : "left",
                    fontWeight: 500, fontSize: 11, color: V.textMuted,
                    borderBottom: `1px solid ${V.border}`,
                    whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: 0.5,
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
                    <span style={{
                      background: s.source === "embed" ? V.tealLight : V.purpleLight,
                      color: s.source === "embed" ? V.teal : V.purple,
                      fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 4,
                    }}>
                      {s.source}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 50, height: 5, background: "rgba(114,130,163,0.15)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{
                          width: `${s.watchedPct}%`, height: "100%",
                          background: s.watchedPct >= 80 ? V.green : s.watchedPct >= 40 ? V.teal : V.amber,
                          borderRadius: 99,
                        }} />
                      </div>
                      <span style={{
                        fontSize: 12, fontWeight: 600,
                        color: s.watchedPct >= 80 ? V.green : s.watchedPct >= 40 ? V.textMid : V.amber,
                      }}>
                        {s.watchedPct}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    {s.captionsEnabled
                      ? <span style={{ color: V.green, fontWeight: 600, fontSize: 12 }}>On</span>
                      : <span style={{ color: V.textLight, fontSize: 12 }}>Off</span>}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ color: s.seeks > 2 ? V.purple : V.textMid, fontWeight: s.seeks > 2 ? 600 : 400 }}>{s.seeks}</span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
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

// ---------------------------------------------------------------------------
// Retention Chart for ended live events
// ---------------------------------------------------------------------------

function RetentionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: V.tableHeaderBg, border: `1px solid ${V.border}`, borderRadius: 6, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
      <div style={{ color: V.textMuted, marginBottom: 4, fontSize: 11 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: V.teal, fontWeight: 600 }}>{p.value}% of viewers</div>
      ))}
    </div>
  );
}

function LiveRetentionChart({ videoId, duration }) {
  const { data } = usePolling(`/api/analytics/retention/${videoId}`, 30000);
  const retention = data?.retention || [];

  const chartData = retention.map((r, i) => ({
    label: i % 25 === 0 ? fmtSecs((i / 100) * duration) : '',
    percent: r.percent,
  }));

  if (chartData.length === 0) return null;

  return (
    <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, padding: "20px 24px", marginBottom: 16 }}>
      <SectionHeader title="Viewer retention" sub="Watch map generated from live event recording" />
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="liveRetGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={V.teal} stopOpacity={0.15} />
              <stop offset="100%" stopColor={V.teal} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={V.borderLight} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: V.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: V.textLight, fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
          <Tooltip content={<RetentionTooltip />} />
          <Area type="monotone" dataKey="percent" name="Retention" stroke={V.teal} strokeWidth={2} fill="url(#liveRetGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
