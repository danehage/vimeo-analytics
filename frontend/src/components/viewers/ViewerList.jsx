import { useState } from 'react';
import { V } from '../../constants/theme';
import FingerprintBadge from '../shared/FingerprintBadge';
import IdentityBadge from '../shared/IdentityBadge';
import ErrorMessage from '../shared/ErrorMessage';
import { usePolling } from '../../hooks/usePolling';

export default function ViewerList({ onSelect }) {
  const [filter, setFilter] = useState("all");
  const { data, loading, error, refetch } = usePolling('/api/analytics/viewers');

  const summary = data?.summary || { total: 0, identified: 0, anonymous: 0, avg_engagement: 0 };

  const viewers = (data?.viewers || []).map(v => ({
    fingerprintId: v.fingerprint_id,
    identifiedAs: v.viewer_id || null,
    identifiedOn: v.identified_at ? new Date(v.identified_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null,
    identifiedVia: v.identified_via || null,
    status: v.viewer_id ? "identified" : "anonymous",
    firstSeen: v.first_seen ? new Date(v.first_seen).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
    lastSeen: v.last_seen ? new Date(v.last_seen).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
    totalSessions: v.total_sessions || 0,
    totalVideos: v.unique_videos || 0,
    totalWatchMins: Math.round(v.total_watch_mins || 0),
    avgWatchPct: Math.round(v.avg_engagement || 0),
    captionsAlwaysOn: (v.caption_events || 0) > 0,
  }));

  const filtered = filter === "all" ? viewers
    : filter === "identified" ? viewers.filter(v => v.status === "identified")
    : viewers.filter(v => v.status === "anonymous");

  if (error) {
    return <ErrorMessage error={error} onRetry={refetch} />;
  }

  if (loading && viewers.length === 0) {
    return <div style={{ fontSize: 13, color: V.textMuted, padding: 20 }}>Loading viewers...</div>;
  }

  return (
    <div>
      {/* Header stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          ["Total viewers", summary.total, V.text],
          ["Identified", summary.identified, V.green],
          ["Anonymous", summary.anonymous, V.textMuted],
          ["Avg engagement", `${Math.round(summary.avg_engagement || 0)}%`, V.teal],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, padding: "14px 20px", flex: 1 }}>
            <div style={{ fontSize: 11, color: V.textMuted, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* How it works banner */}
      <div style={{ background: V.enterpriseBg, border: `1px solid ${V.enterpriseBorder}`, borderRadius: V.cardRadius, padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>✦</span>
        <div style={{ fontSize: 12, color: V.enterpriseText, lineHeight: 1.7 }}>
          <strong>How viewer identity works:</strong> Every session starts anonymous, tracked by browser fingerprint. When a viewer logs in or submits a form on an instrumented page, their identity is resolved and <em>all prior anonymous sessions</em> from that fingerprint are retroactively attributed to them — no data is lost.
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["all", "All viewers"], ["identified", "Identified only"], ["anonymous", "Anonymous only"]].map(([val, label]) => (
          <div
            key={val}
            onClick={() => setFilter(val)}
            style={{
              padding: "5px 14px",
              borderRadius: 5,
              fontSize: 12,
              cursor: "pointer",
              background: filter === val ? V.teal : V.tableHeaderBg,
              color: filter === val ? "#0e1216" : V.textMid,
              border: `1px solid ${filter === val ? V.teal : V.border}`,
              fontWeight: filter === val ? 600 : 400,
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Viewer table */}
      <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: V.tableHeaderBg }}>
              {["Viewer", "Status", "Sessions", "Videos", "Avg engagement", "Captions", "Last seen", ""].map(h => (
                <th key={h} style={{
                  padding: "10px 14px",
                  textAlign: "left",
                  fontWeight: 500,
                  fontSize: 11,
                  color: V.textMuted,
                  borderBottom: `1px solid ${V.border}`,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  whiteSpace: "nowrap",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(viewer => (
              <tr
                key={viewer.fingerprintId}
                onClick={() => onSelect(viewer)}
                style={{ borderBottom: `1px solid ${V.borderLight}`, cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = V.active}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: viewer.status === "identified" ? `linear-gradient(135deg, ${V.teal}, ${V.green})` : V.tableHeaderBg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: viewer.status === "identified" ? 13 : 16,
                      color: viewer.status === "identified" ? "#0e1216" : V.textLight,
                      fontWeight: 700, flexShrink: 0,
                    }}>
                      {viewer.status === "identified" && viewer.identifiedAs ? viewer.identifiedAs.split(/[.@]/)[0][0].toUpperCase() : "?"}
                    </div>
                    <div>
                      {viewer.status === "identified"
                        ? <div style={{ fontWeight: 600, color: V.text }}>{viewer.identifiedAs}</div>
                        : <div style={{ fontWeight: 500, color: V.textMuted }}>Anonymous viewer</div>}
                      <FingerprintBadge id={viewer.fingerprintId} />
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 14px" }}><IdentityBadge viewer={viewer} /></td>
                <td style={{ padding: "12px 14px", color: V.textMid, fontWeight: 500 }}>{viewer.totalSessions}</td>
                <td style={{ padding: "12px 14px", color: V.textMid }}>{viewer.totalVideos}</td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 48, height: 4, background: "rgba(114,130,163,0.15)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{
                        width: `${viewer.avgWatchPct}%`,
                        height: "100%",
                        background: viewer.avgWatchPct >= 70 ? V.green : viewer.avgWatchPct >= 40 ? V.teal : V.amber,
                        borderRadius: 99,
                      }} />
                    </div>
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: viewer.avgWatchPct >= 70 ? V.green : viewer.avgWatchPct >= 40 ? V.textMid : V.amber,
                    }}>
                      {viewer.avgWatchPct}%
                    </span>
                  </div>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  {viewer.captionsAlwaysOn
                    ? <span style={{ color: V.teal, fontSize: 12, fontWeight: 600 }}>On</span>
                    : <span style={{ color: V.textLight, fontSize: 12 }}>Off</span>}
                </td>
                <td style={{ padding: "12px 14px", color: V.textMuted, fontSize: 12 }}>{viewer.lastSeen}</td>
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
