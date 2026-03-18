import { V } from '../../constants/theme';
import SectionHeader from '../shared/SectionHeader';
import FingerprintBadge from '../shared/FingerprintBadge';
import IdentityBadge from '../shared/IdentityBadge';
import { usePolling } from '../../hooks/usePolling';

export default function ViewerDetail({ viewer, onBack, onSelectSession }) {
  const { data, loading } = usePolling(`/api/analytics/viewers/${viewer.fingerprintId}`, 30000);

  // Derive identity from API data when available, fall back to viewer prop
  const identified = data?.viewer?.viewer_id
    ? true
    : viewer.status === "unknown"
      ? false
      : viewer.status === "identified";

  // Merge API viewer data into viewer prop for display
  const resolvedViewer = data?.viewer ? {
    ...viewer,
    identifiedAs: data.viewer.viewer_id || viewer.identifiedAs,
    identifiedVia: data.viewer.identified_via || viewer.identifiedVia,
    identifiedOn: data.viewer.identified_at ? new Date(data.viewer.identified_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : viewer.identifiedOn,
    firstSeen: data.viewer.first_seen ? new Date(data.viewer.first_seen).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : viewer.firstSeen || '—',
    lastSeen: data.viewer.last_seen ? new Date(data.viewer.last_seen).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : viewer.lastSeen || '—',
    captionsAlwaysOn: viewer.captionsAlwaysOn ?? false,
    status: identified ? "identified" : "anonymous",
  } : viewer;

  // Use API data if available, fall back to viewer prop
  const sessions = (data?.sessions || []).map(s => ({
    id: '#' + (s.session_id?.slice(0, 6) || '—'),
    session_id: s.session_id,
    shortId: '#' + (s.session_id?.slice(0, 6) || '—'),
    video: s.video_title || s.video_id,
    videoId: s.video_id,
    viewerId: s.viewer_id || viewer.identifiedAs || null,
    fingerprintId: s.fingerprint_id || viewer.fingerprintId,
    duration: s.video_duration || 0,
    date: s.started_at ? new Date(s.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
    time: s.started_at ? new Date(s.started_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
    embedUrl: s.embed_url || '',
    watchedPct: Math.round(s.percent_watched || 0),
    completed: !!s.completed,
    isLive: s.embed_url?.includes('vidharbor.com'),
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
  const avgPct = data?.viewer?.avg_engagement ? Math.round(data.viewer.avg_engagement) : (viewer.avgWatchPct || 0);

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: V.textMuted }}>
        <span onClick={onBack} style={{ cursor: "pointer", color: V.teal, fontWeight: 500 }}>← Viewers</span>
        <span>›</span>
        <span style={{ color: V.text }}>{identified ? resolvedViewer.identifiedAs : `Anonymous · ${resolvedViewer.fingerprintId}`}</span>
      </div>

      {/* Identity card */}
      <div style={{ background: V.white, border: `1px solid ${identified ? "rgba(48,164,108,0.3)" : V.border}`, borderRadius: V.cardRadius, padding: "20px 24px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
        {identified && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${V.green}, ${V.teal})` }} />}
        {!identified && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: V.border }} />}

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Avatar */}
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: identified ? `linear-gradient(135deg, ${V.teal}, ${V.green})` : V.tableHeaderBg,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: identified ? 18 : 20,
              color: identified ? "#0e1216" : V.textLight,
              fontWeight: 700, flexShrink: 0,
            }}>
              {identified && resolvedViewer.identifiedAs ? resolvedViewer.identifiedAs.split(/[.@]/)[0][0].toUpperCase() : "?"}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                {identified
                  ? <span style={{ fontSize: 18, fontWeight: 700, color: V.text }}>{resolvedViewer.identifiedAs}</span>
                  : <span style={{ fontSize: 15, fontWeight: 600, color: V.textMid }}>Anonymous Viewer</span>}
                <IdentityBadge viewer={resolvedViewer} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <FingerprintBadge id={resolvedViewer.fingerprintId} />
                <span style={{ fontSize: 12, color: V.textLight }}>First seen {resolvedViewer.firstSeen} · Last seen {resolvedViewer.lastSeen}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Identity resolution story */}
        {identified ? (
          <div style={{ padding: "12px 16px", background: V.greenLight, border: "1px solid rgba(48,164,108,0.25)", borderRadius: V.cardRadius, fontSize: 12, color: V.green, lineHeight: 1.6 }}>
            <strong>Identity resolved{resolvedViewer.identifiedOn ? ` on ${resolvedViewer.identifiedOn}` : ''}</strong>{resolvedViewer.identifiedVia ? ` via ${resolvedViewer.identifiedVia}` : ''}.<br />
            All {totalSessions} prior anonymous sessions from fingerprint <code style={{ background: "rgba(48,164,108,0.15)", padding: "1px 4px", borderRadius: 3, fontFamily: "monospace" }}>{resolvedViewer.fingerprintId}</code> have been retroactively attributed to this user.
          </div>
        ) : (
          <div style={{ padding: "12px 16px", background: V.bg, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, fontSize: 12, color: V.textMid, lineHeight: 1.6 }}>
            <strong>Not yet identified.</strong> This viewer's sessions are tracked by browser fingerprint only. If they log in or submit a form on an instrumented page, their identity will be retroactively linked to all sessions under <code style={{ fontFamily: "monospace" }}>{resolvedViewer.fingerprintId}</code>.
          </div>
        )}

        {/* Quick stats */}
        <div style={{ display: "flex", gap: 28, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${V.borderLight}`, flexWrap: "wrap" }}>
          {[
            ["Sessions", totalSessions, V.text],
            ["Videos watched", totalVideos, V.text],
            ["Total watch time", `${totalWatchMins}m`, V.text],
            ["Avg engagement", `${avgPct}%`, avgPct >= 70 ? V.green : avgPct >= 40 ? V.textMid : V.amber],
            ["Captions", resolvedViewer.captionsAlwaysOn ? "Always on" : "Off", resolvedViewer.captionsAlwaysOn ? V.teal : V.textLight],
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
        <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, padding: "20px 24px" }}>
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
                <div style={{ background: "rgba(114,130,163,0.12)", borderRadius: 99, height: 5, overflow: "hidden" }}>
                  <div style={{ width: `${v.avgPct}%`, height: "100%", background: v.avgPct >= 70 ? V.green : v.avgPct >= 40 ? V.teal : V.amber, borderRadius: 99, transition: "width 0.5s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Session history */}
        <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, padding: "20px 24px" }}>
          <SectionHeader title="Session history" sub={`${sessions.length} sessions`} />
          {sessions.length === 0 && !loading && (
            <div style={{ fontSize: 12, color: V.textLight, padding: "12px 0" }}>No sessions yet.</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {sessions.map((s, i) => (
              <div
                key={s.id}
                onClick={() => onSelectSession?.(s)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < sessions.length - 1 ? `1px solid ${V.borderLight}` : "none", cursor: onSelectSession ? "pointer" : "default", borderRadius: 4, transition: "background 0.1s" }}
                onMouseEnter={e => { if (onSelectSession) e.currentTarget.style.background = V.active; }}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.completed ? V.green : s.watchedPct >= 50 ? V.teal : V.amber, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: V.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.video}</div>
                  <div style={{ fontSize: 11, color: V.textLight }}>{s.date}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: s.completed ? V.green : s.watchedPct >= 50 ? V.textMid : V.amber }}>{s.completed ? "✓ 100%" : `${s.watchedPct}%`}</span>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: V.teal }}>{s.id}</span>
                  {onSelectSession && <span style={{ color: V.teal, fontSize: 14 }}>›</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
