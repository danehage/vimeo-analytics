import { V, fmtSecs, EVENT_COLORS } from '../../constants/theme';
import SectionHeader from '../shared/SectionHeader';
import SessionScrubber from './SessionScrubber';
import { usePolling } from '../../hooks/usePolling';

const EVENT_ICONS = {
  play: "▶", pause: "⏸", ended: "✓", seeked: "⏭",
  texttrackchange: "CC", qualitychange: "⚙", volumechange: "♪",
  bufferstart: "⧗", bufferend: "▶", session_end: "■",
};

function buildLabel(ev) {
  switch (ev.event_type) {
    case 'play': return ev.playhead > 0 ? 'Resumed' : 'Started playback';
    case 'pause': return 'Paused';
    case 'ended': return `Completed — 100% watched`;
    case 'seeked': return `Seeked → ${fmtSecs(ev.playhead)}`;
    case 'texttrackchange': {
      const p = ev.payload || {};
      return `Captions ${p.label ? `turned on (${p.label})` : 'changed'}`;
    }
    case 'qualitychange': return `Quality changed to ${ev.payload?.quality || 'auto'}`;
    case 'bufferstart': return 'Buffering started';
    case 'bufferend': return 'Buffering ended';
    case 'volumechange': return `Volume changed`;
    case 'session_end': return 'Session ended';
    default: return ev.event_type;
  }
}

export default function SessionDetail({ session, onBack }) {
  const { data, loading } = usePolling(`/api/analytics/sessions/${session.session_id}`, 60000);

  const sessionData = data?.session || session;
  const events = (data?.events || []).map(ev => ({
    type: ev.event_type,
    time: fmtSecs(ev.playhead || 0),
    playhead: ev.playhead || 0,
    icon: EVENT_ICONS[ev.event_type] || "·",
    color: EVENT_COLORS[ev.event_type] || V.textLight,
    label: buildLabel(ev),
    payload: ev.payload,
  }));

  const duration = sessionData.video_duration || sessionData.duration || session.duration || 0;
  const watchedPct = sessionData.percent_watched ?? session.watchedPct ?? 0;
  const completed = sessionData.completed ?? session.completed;
  const video = sessionData.video_title || session.video || session.videoId;
  const embedUrl = sessionData.embed_url || session.embedUrl || '';
  const date = session.date || (sessionData.started_at ? new Date(sessionData.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
  const time = session.time || (sessionData.started_at ? new Date(sessionData.started_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '');

  const nonTimeUpdates = events.filter(e => e.type !== "timeupdate");
  const hasCaptions = events.some(e => e.type === "texttrackchange");
  const hasBuffer = events.some(e => e.type === "bufferstart");
  const seekCount = events.filter(e => e.type === "seeked").length;
  const bufferCount = events.filter(e => e.type === "bufferstart").length;
  const qualityCount = events.filter(e => e.type === "qualitychange").length;

  // Build session-like object for scrubber
  const scrubberSession = {
    duration,
    events,
  };

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
              <span style={{
                background: V.tealLight,
                color: V.teal,
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 4,
              }}>
                embed
              </span>
              {completed ? (
                <span style={{ background: V.greenLight, color: V.green, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4 }}>✓ Completed</span>
              ) : (
                <span style={{ background: "#fff8f0", color: V.amber, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4 }}>{Math.round(watchedPct)}% watched</span>
              )}
              {session.isLive && (
                <span style={{ background: V.greenLight, color: V.green, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>live</span>
              )}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: V.textMid, marginBottom: 2 }}>{video}</div>
            <div style={{ fontSize: 12, color: V.textLight }}>{date} at {time} · {embedUrl}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {hasCaptions && (
              <div style={{ background: V.tealLight, border: `1px solid ${V.tealMid}`, borderRadius: 6, padding: "6px 10px", fontSize: 12, color: V.teal, fontWeight: 600 }}>CC On</div>
            )}
            {hasBuffer && (
              <div style={{ background: V.redLight, border: "1px solid #fecaca", borderRadius: 6, padding: "6px 10px", fontSize: 12, color: V.red, fontWeight: 600 }}>⧗ Buffered</div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: "flex", gap: 24, paddingTop: 16, borderTop: `1px solid ${V.borderLight}` }}>
          {[
            ["Duration watched", duration > 0 ? fmtSecs(Math.round(duration * watchedPct / 100)) : '—', V.text],
            ["Total video length", duration > 0 ? fmtSecs(duration) : '—', V.textMuted],
            ["Seek events", seekCount, seekCount > 2 ? V.purple : V.textMid],
            ["Quality changes", qualityCount, qualityCount > 1 ? V.amber : V.textMid],
            ["Captions enabled", hasCaptions ? "Yes" : "No", hasCaptions ? V.green : V.textMuted],
            ["Buffer events", bufferCount, bufferCount > 0 ? V.red : V.green],
          ].map(([label, val, color]) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: V.textLight, marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scrubber */}
      {events.length > 0 && (
        <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, padding: "20px 24px", marginBottom: 16 }}>
          <SectionHeader title="Watch map" sub="Visual reconstruction of what was watched, skipped, and rewound" />
          <SessionScrubber session={scrubberSession} />
        </div>
      )}

      {/* Event timeline */}
      <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, padding: "20px 24px" }}>
        <SectionHeader title="Event timeline" sub={loading ? 'Loading events...' : `${nonTimeUpdates.length} significant events captured`} />
        {nonTimeUpdates.length === 0 && !loading && (
          <div style={{ fontSize: 12, color: V.textLight, padding: "12px 0" }}>No events recorded yet — session may still be in progress.</div>
        )}
        <div style={{ position: "relative" }}>
          {/* Vertical line */}
          <div style={{ position: "absolute", left: 15, top: 8, bottom: 8, width: 1, background: V.borderLight }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {nonTimeUpdates.map((ev, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "10px 0", position: "relative" }}>
                {/* Icon */}
                <div style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                  background: ev.color === V.borderLight || ev.color === "#efefed" ? V.bg : ev.color + "18",
                  border: `1.5px solid ${ev.color === V.borderLight || ev.color === "#efefed" ? V.border : ev.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: ev.icon.length > 1 ? 8 : 12, fontWeight: 700,
                  color: ev.color === V.borderLight || ev.color === "#efefed" ? V.textLight : ev.color,
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
                  {duration > 0 && (
                    <div style={{ fontSize: 11, color: V.textLight }}>
                      Playhead: {fmtSecs(ev.playhead)} / {fmtSecs(duration)}
                      <span style={{ display: "inline-block", width: 80, height: 3, background: V.borderLight, borderRadius: 99, margin: "0 8px -1px", overflow: "hidden" }}>
                        <span style={{ display: "block", width: `${(ev.playhead / duration) * 100}%`, height: "100%", background: V.teal, borderRadius: 99 }} />
                      </span>
                      {Math.round((ev.playhead / duration) * 100)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic insight callouts */}
        {bufferCount >= 3 && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: V.redLight, border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, color: "#991b1b", lineHeight: 1.6 }}>
            <strong>This session had {bufferCount} buffer events{watchedPct < 50 ? ` and was abandoned at ${Math.round(watchedPct)}%` : ''}.</strong> This may indicate a network issue on the embed page — compare with buffer rates from other sessions on the same URL.
          </div>
        )}
        {seekCount >= 2 && hasCaptions && bufferCount < 3 && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: "#faf5ff", border: "1px solid #ddd0f7", borderRadius: 8, fontSize: 12, color: V.enterpriseText, lineHeight: 1.6 }}>
            <strong>This viewer sought multiple times and enabled captions.</strong> They may have had difficulty understanding the content. Consider reviewing the sections they replayed.
          </div>
        )}
      </div>
    </div>
  );
}
