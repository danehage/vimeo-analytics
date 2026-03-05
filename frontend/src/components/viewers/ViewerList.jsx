import { useState } from 'react';
import { V } from '../../constants/theme';
import FingerprintBadge from '../shared/FingerprintBadge';
import IdentityBadge from '../shared/IdentityBadge';

const VIEWERS = [
  {
    fingerprintId: "fp_a3c8e1",
    identifiedAs: "j.smith@corp.com",
    identifiedOn: "Mar 5, 2026",
    identifiedVia: "SSO login on intranet.corp.com",
    status: "identified",
    firstSeen: "Feb 19, 2026",
    lastSeen: "Mar 5, 2026",
    totalSessions: 7,
    totalVideos: 3,
    totalWatchMins: 94,
    avgWatchPct: 81,
    captionsAlwaysOn: true,
    preferredQuality: "1080p",
    sessions: [
      { id: "#a3f9b2", video: "Security Training Module 3", date: "Mar 4, 2026", watchedPct: 74, completed: false },
      { id: "#c82e41", video: "Security Training Module 3", date: "Mar 4, 2026", watchedPct: 100, completed: true },
      { id: "#d91b33", video: "Onboarding: Company Culture", date: "Feb 28, 2026", watchedPct: 100, completed: true },
      { id: "#e74f22", video: "AWS Marketplace Global Expansion", date: "Feb 19, 2026", watchedPct: 91, completed: false },
      { id: "#f00c11", video: "Security Training Module 3", date: "Feb 19, 2026", watchedPct: 42, completed: false },
    ],
    videos: [
      { title: "Security Training Module 3", sessions: 3, avgPct: 72, completed: true, lastWatched: "Mar 4, 2026" },
      { title: "Onboarding: Company Culture", sessions: 2, avgPct: 100, completed: true, lastWatched: "Feb 28, 2026" },
      { title: "AWS Marketplace Global Expansion", sessions: 2, avgPct: 74, completed: false, lastWatched: "Feb 19, 2026" },
    ],
  },
  {
    fingerprintId: "fp_b7d2f9",
    identifiedAs: null,
    status: "anonymous",
    firstSeen: "Mar 3, 2026",
    lastSeen: "Mar 5, 2026",
    totalSessions: 3,
    totalVideos: 2,
    totalWatchMins: 12,
    avgWatchPct: 31,
    captionsAlwaysOn: true,
    preferredQuality: "540p",
    sessions: [
      { id: "#f17d93", video: "Security Training Module 3", date: "Mar 3, 2026", watchedPct: 18, completed: false },
      { id: "#g22a18", video: "Security Training Module 3", date: "Mar 4, 2026", watchedPct: 24, completed: false },
      { id: "#h91c04", video: "Benefits Overview 2026", date: "Mar 5, 2026", watchedPct: 51, completed: false },
    ],
    videos: [
      { title: "Security Training Module 3", sessions: 2, avgPct: 21, completed: false, lastWatched: "Mar 4, 2026" },
      { title: "Benefits Overview 2026", sessions: 1, avgPct: 51, completed: false, lastWatched: "Mar 5, 2026" },
    ],
    insight: "This viewer has attempted Security Training Module 3 twice and abandoned both times under 25%. Combined with consistent Spanish captions and repeated quality drops, they may be on a poor connection or a non-English speaker struggling with the content.",
  },
  {
    fingerprintId: "fp_c1e5a3",
    identifiedAs: "m.chen@corp.com",
    identifiedOn: "Mar 1, 2026",
    identifiedVia: "Form submission on hr.corp.com",
    status: "identified",
    firstSeen: "Feb 24, 2026",
    lastSeen: "Mar 4, 2026",
    totalSessions: 4,
    totalVideos: 2,
    totalWatchMins: 67,
    avgWatchPct: 68,
    captionsAlwaysOn: false,
    preferredQuality: "720p",
    sessions: [
      { id: "#i44d91", video: "Benefits Overview 2026", date: "Mar 4, 2026", watchedPct: 88, completed: false },
      { id: "#j83b72", video: "Benefits Overview 2026", date: "Mar 1, 2026", watchedPct: 51, completed: false },
      { id: "#k12c55", video: "CEO Town Hall - Jan 2026", date: "Feb 28, 2026", watchedPct: 61, completed: false },
      { id: "#l90a34", video: "CEO Town Hall - Jan 2026", date: "Feb 24, 2026", watchedPct: 71, completed: false },
    ],
    videos: [
      { title: "Benefits Overview 2026", sessions: 2, avgPct: 70, completed: false, lastWatched: "Mar 4, 2026" },
      { title: "CEO Town Hall - Jan 2026", sessions: 2, avgPct: 66, completed: false, lastWatched: "Feb 28, 2026" },
    ],
  },
  {
    fingerprintId: "fp_d9f3b8",
    identifiedAs: null,
    status: "anonymous",
    firstSeen: "Mar 5, 2026",
    lastSeen: "Mar 5, 2026",
    totalSessions: 1,
    totalVideos: 1,
    totalWatchMins: 1,
    avgWatchPct: 91,
    captionsAlwaysOn: false,
    preferredQuality: "1080p",
    sessions: [
      { id: "#b55a07", video: "AWS Marketplace Global Expansion", date: "Mar 5, 2026", watchedPct: 91, completed: false },
    ],
    videos: [
      { title: "AWS Marketplace Global Expansion", sessions: 1, avgPct: 91, completed: false, lastWatched: "Mar 5, 2026" },
    ],
  },
];

export { VIEWERS };

export default function ViewerList({ onSelect }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? VIEWERS
    : filter === "identified" ? VIEWERS.filter(v => v.status === "identified")
    : VIEWERS.filter(v => v.status === "anonymous");

  return (
    <div>
      {/* Header stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          ["Total viewers", VIEWERS.length, V.text],
          ["Identified", VIEWERS.filter(v => v.status === "identified").length, V.green],
          ["Anonymous", VIEWERS.filter(v => v.status === "anonymous").length, V.textMuted],
          ["Avg engagement", "68%", V.teal],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, padding: "14px 20px", flex: 1 }}>
            <div style={{ fontSize: 11, color: V.textMuted, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* How it works banner */}
      <div style={{ background: V.enterpriseBg, border: `1px solid ${V.enterpriseBorder}`, borderRadius: 8, padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>\u2726</span>
        <div style={{ fontSize: 12, color: V.enterpriseText, lineHeight: 1.7 }}>
          <strong>How viewer identity works:</strong> Every session starts anonymous, tracked by browser fingerprint. When a viewer logs in or submits a form on an instrumented page, their identity is resolved and <em>all prior anonymous sessions</em> from that fingerprint are retroactively attributed to them \u2014 no data is lost.
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
              background: filter === val ? V.teal : V.white,
              color: filter === val ? V.white : V.textMid,
              border: `1px solid ${filter === val ? V.teal : V.border}`,
              fontWeight: filter === val ? 600 : 400,
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Viewer table */}
      <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: V.bg }}>
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
                onMouseEnter={e => e.currentTarget.style.background = V.bg}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: viewer.status === "identified" ? `linear-gradient(135deg, ${V.teal}, ${V.green})` : V.borderLight,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: viewer.status === "identified" ? 13 : 16,
                      color: viewer.status === "identified" ? V.white : V.textLight,
                      fontWeight: 700, flexShrink: 0,
                    }}>
                      {viewer.status === "identified" ? viewer.identifiedAs.split(".")[0][0].toUpperCase() : "?"}
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
                    <div style={{ width: 48, height: 4, background: V.borderLight, borderRadius: 99, overflow: "hidden" }}>
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
                  <span style={{ color: V.teal, fontSize: 16 }}>\u203A</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
