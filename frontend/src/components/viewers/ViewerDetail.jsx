import { V } from '../../constants/theme';
import SectionHeader from '../shared/SectionHeader';
import FingerprintBadge from '../shared/FingerprintBadge';
import IdentityBadge from '../shared/IdentityBadge';

export default function ViewerDetail({ viewer, onBack }) {
  const identified = viewer.status === "identified";

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: V.textMuted }}>
        <span onClick={onBack} style={{ cursor: "pointer", color: V.teal, fontWeight: 500 }}>\u2190 Viewers</span>
        <span>\u203A</span>
        <span style={{ color: V.text }}>{identified ? viewer.identifiedAs : `Anonymous \u00B7 ${viewer.fingerprintId}`}</span>
      </div>

      {/* Identity card */}
      <div style={{ background: V.white, border: `1px solid ${identified ? "#bbf7d0" : V.border}`, borderRadius: 8, padding: "20px 24px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
        {identified && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${V.green}, ${V.teal})` }} />}
        {!identified && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: V.border }} />}

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Avatar */}
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: identified ? `linear-gradient(135deg, ${V.teal}, ${V.green})` : V.borderLight,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: identified ? 18 : 20,
              color: identified ? V.white : V.textLight,
              fontWeight: 700, flexShrink: 0,
            }}>
              {identified ? viewer.identifiedAs.split(".")[0][0].toUpperCase() : "?"}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                {identified
                  ? <span style={{ fontSize: 18, fontWeight: 700, color: V.text }}>{viewer.identifiedAs}</span>
                  : <span style={{ fontSize: 15, fontWeight: 600, color: V.textMid }}>Anonymous Viewer</span>}
                <IdentityBadge viewer={viewer} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <FingerprintBadge id={viewer.fingerprintId} />
                <span style={{ fontSize: 12, color: V.textLight }}>First seen {viewer.firstSeen} \u00B7 Last seen {viewer.lastSeen}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Identity resolution story */}
        {identified ? (
          <div style={{ padding: "12px 16px", background: V.greenLight, border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 12, color: "#166534", lineHeight: 1.6 }}>
            <strong>Identity resolved on {viewer.identifiedOn}</strong> via {viewer.identifiedVia}.<br />
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
        <div style={{ padding: "14px 18px", background: V.amberLight, border: "1px solid #fde68a", borderRadius: 8, marginBottom: 16, fontSize: 12, color: "#92400e", lineHeight: 1.6 }}>
          <strong>Behavioral insight:</strong> {viewer.insight}
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
                    <div style={{ fontSize: 11, color: V.textLight }}>{v.sessions} session{v.sessions > 1 ? "s" : ""} \u00B7 last watched {v.lastWatched}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {v.completed && <span style={{ fontSize: 10, background: V.greenLight, color: V.green, fontWeight: 700, padding: "1px 6px", borderRadius: 3 }}>\u2713 Done</span>}
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
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: s.completed ? V.green : s.watchedPct >= 50 ? V.textMid : V.amber }}>{s.completed ? "\u2713 100%" : `${s.watchedPct}%`}</span>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: V.teal }}>{s.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
