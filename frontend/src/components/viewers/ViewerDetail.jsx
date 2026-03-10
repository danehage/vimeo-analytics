import { V } from '../../constants/theme';
import SectionHeader from '../shared/SectionHeader';
import FingerprintBadge from '../shared/FingerprintBadge';
import IdentityBadge from '../shared/IdentityBadge';
import { usePolling } from '../../hooks/usePolling';

export default function ViewerDetail({ viewer, onBack }) {
  const identified = viewer.status === "identified";
  const { data, loading } = usePolling(`/api/analytics/viewers/${viewer.fingerprintId}`, 30000);

  // Use API data if available, fall back to viewer prop
  const sessions = (data?.sessions || []).map(s => ({
    id: '#' + (s.session_id?.slice(0, 6) || '—'),
    video: s.video_title || s.video_id,
    date: s.started_at ? new Date(s.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
    watchedPct: Math.round(s.percent_watched || 0),
    completed: !!s.completed,
  }));

  const videos = (data?.videos || []).map(v => ({
    title: v.title || v.video_id,
    sessions: v.session_count || 0,
    avgPct: Math.round(v.avg_percent || 0),
    completed: !!v.ever_completed,
    lastWatched: '—',
  }));

  const totalSessions = data?.viewer?.total_sessions || viewer.totalSessions;
  const totalWatchMins = Math.round(data?.viewer?.total_watch_mins || viewer.totalWatchMins || 0);
  const totalVideos = videos.length || viewer.totalVideos || 0;
  const avgPct = viewer.avgWatchPct || 0;

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
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: identified ? `linear-gradient(135deg, ${V.teal}, ${V.green})` : V.borderLight,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: identified ? 18 : 20,
              color: identified ? V.white : V.textLight,
              fontWeight: 700, flexShrink: 0,
            }}>
              {identified && viewer.identifiedAs ? viewer.identifiedAs.split(/[.@]/)[0][0].toUpperCase() : "?"}
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
                <span style={{ fontSize: 12, color: V.textLight }}>First seen {viewer.firstSeen} · Last seen {viewer.lastSeen}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Identity resolution story */}
        {identified ? (
          <div style={{ padding: "12px 16px", background: V.greenLight, border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 12, color: "#166534", lineHeight: 1.6 }}>
            <strong>Identity resolved{viewer.identifiedOn ? ` on ${viewer.identifiedOn}` : ''}</strong>{viewer.identifiedVia ? ` via ${viewer.identifiedVia}` : ''}.<br />
            All {totalSessions} prior anonymous sessions from fingerprint <code style={{ background: "#dcfce7", padding: "1px 4px", borderRadius: 3, fontFamily: "monospace" }}>{viewer.fingerprintId}</code> have been retroactively attributed to this user.
          </div>
        ) : (
          <div style={{ padding: "12px 16px", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 8, fontSize: 12, color: V.textMid, lineHeight: 1.6 }}>
            <strong>Not yet identified.</strong> This viewer's sessions are tracked by browser fingerprint only. If they log in or submit a form on an instrumented page, their identity will be retroactively linked to all sessions under <code style={{ fontFamily: "monospace" }}>{viewer.fingerprintId}</code>.
          </div>
        )}

        {/* Quick stats */}
        <div style={{ display: "flex", gap: 28, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${V.borderLight}`, flexWrap: "wrap" }}>
          {[
            ["Sessions", totalSessions, V.text],
            ["Videos watched", totalVideos, V.text],
            ["Total watch time", `${totalWatchMins}m`, V.text],
            ["Avg engagement", `${avgPct}%`, avgPct >= 70 ? V.green : avgPct >= 40 ? V.textMid : V.amber],
            ["Captions", viewer.captionsAlwaysOn ? "Always on" : "Off", viewer.captionsAlwaysOn ? V.teal : V.textLight],
          ].map(([label, val, color]) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: V.textLight, marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Videos watched */}
        <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, padding: "20px 24px" }}>
          <SectionHeader title="Videos watched" sub={`${videos.length} unique videos`} />
          {videos.length === 0 && !loading && (
            <div style={{ fontSize: 12, color: V.textLight, padding: "12px 0" }}>No video data yet.</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {videos.map((v, i) => (
              <div key={v.title} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: i < videos.length - 1 ? `1px solid ${V.borderLight}` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: V.text, marginBottom: 2 }}>{v.title}</div>
                    <div style={{ fontSize: 11, color: V.textLight }}>{v.sessions} session{v.sessions > 1 ? "s" : ""}</div>
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
          <SectionHeader title="Session history" sub={`${sessions.length} sessions`} />
          {sessions.length === 0 && !loading && (
            <div style={{ fontSize: 12, color: V.textLight, padding: "12px 0" }}>No sessions yet.</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {sessions.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < sessions.length - 1 ? `1px solid ${V.borderLight}` : "none" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.completed ? V.green : s.watchedPct >= 50 ? V.teal : V.amber, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: V.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.video}</div>
                  <div style={{ fontSize: 11, color: V.textLight }}>{s.date}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
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
}
