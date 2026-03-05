import { V, fmtSecs } from '../../constants/theme';
import SectionHeader from '../shared/SectionHeader';
import SessionScrubber from './SessionScrubber';

export default function SessionDetail({ session, onBack }) {
  const nonTimeUpdates = session.events.filter(e => e.type !== "timeupdate");
  const hasCaptions = session.events.some(e => e.type === "texttrackchange");
  const hasBuffer = session.events.some(e => e.type === "bufferstart");
  const seekCount = session.events.filter(e => e.type === "seeked").length;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: V.textMuted }}>
        <span onClick={onBack} style={{ cursor: "pointer", color: V.teal, fontWeight: 500 }}>\u2190 Sessions</span>
        <span>\u203A</span>
        <span style={{ color: V.text }}>Session {session.shortId}</span>
      </div>

      {/* Session header */}
      <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, padding: "20px 24px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: V.text }}>Session {session.shortId}</span>
              <span style={{
                background: session.source === "embed" ? V.tealLight : V.purpleLight,
                color: session.source === "embed" ? V.teal : V.purple,
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 4,
              }}>
                {session.source}
              </span>
              {session.completed && (
                <span style={{ background: V.greenLight, color: V.green, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4 }}>\u2713 Completed</span>
              )}
              {!session.completed && (
                <span style={{ background: "#fff8f0", color: V.amber, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4 }}>{session.watchedPct}% watched</span>
              )}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: V.textMid, marginBottom: 2 }}>{session.video}</div>
            <div style={{ fontSize: 12, color: V.textLight }}>{session.date} at {session.time} \u00B7 {session.embedUrl}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {hasCaptions && (
              <div style={{ background: V.tealLight, border: `1px solid ${V.tealMid}`, borderRadius: 6, padding: "6px 10px", fontSize: 12, color: V.teal, fontWeight: 600 }}>CC On</div>
            )}
            {hasBuffer && (
              <div style={{ background: V.redLight, border: "1px solid #fecaca", borderRadius: 6, padding: "6px 10px", fontSize: 12, color: V.red, fontWeight: 600 }}>\u29D7 Buffered</div>
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

        {/* Insight callout -- only show for sessions with interesting patterns */}
        {session.id === "a3f9b2" && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: "#faf5ff", border: "1px solid #ddd0f7", borderRadius: 8, fontSize: 12, color: V.enterpriseText, lineHeight: 1.6 }}>
            <strong>This viewer rewound to 8:10 after reaching 9:20.</strong> Combined with turning captions on at 6:45, they may have had difficulty understanding the content in that section. Consider reviewing the 8-9 minute segment for clarity.
          </div>
        )}
        {session.id === "f17d93" && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: V.redLight, border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, color: "#991b1b", lineHeight: 1.6 }}>
            <strong>This session had 3 buffer events and was abandoned at 18%.</strong> The viewer dropped their quality twice before stopping. This may indicate a network issue on the embed page \u2014 compare with buffer rates from other sessions on the same URL.
          </div>
        )}
      </div>
    </div>
  );
}
