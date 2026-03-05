import { useState } from 'react';
import { V } from '../../constants/theme';

const VIDEOS_TABLE = [
  { thumb: "\uD83C\uDFAC", title: "AWS Marketplace Global Expansion", duration: "1:23", uploaded: "Jan 23, 2026", views: 11, uniqueViewers: 4, avgPct: 58, finishes: 4, captionPct: 36, seekEvents: 23, bufferRate: 1.2, source: "embed" },
  { thumb: "\uD83C\uDFD9\uFE0F", title: "Florence", duration: "0:15", uploaded: "Jan 13, 2026", views: 3, uniqueViewers: 1, avgPct: 68, finishes: 2, captionPct: 0, seekEvents: 1, bufferRate: 0, source: "vimeo.com" },
  { thumb: "\uD83D\uDCCB", title: "Security Training Module 3", duration: "18:22", uploaded: "Dec 1, 2025", views: 847, uniqueViewers: 312, avgPct: 74, finishes: 634, captionPct: 67, seekEvents: 189, bufferRate: 1.8, source: "embed" },
];

export default function VideoTable() {
  const [sortCol, setSortCol] = useState("views");
  const [sortDir, setSortDir] = useState("desc");

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const sorted = [...VIDEOS_TABLE].sort((a, b) => {
    const mult = sortDir === "desc" ? -1 : 1;
    return typeof a[sortCol] === "number"
      ? (a[sortCol] - b[sortCol]) * mult
      : a[sortCol].localeCompare(b[sortCol]) * mult;
  });

  return (
    <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: V.bg }}>
            <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 500, color: V.textMuted, fontSize: 11, borderBottom: `1px solid ${V.border}` }}>Video</th>
            {[
              ["views", "Views"],
              ["uniqueViewers", "Unique viewers"],
              ["avgPct", "Avg. % watched"],
              ["finishes", "Finishes"],
              ["captionPct", "Caption adoption"],
              ["seekEvents", "Seek events"],
              ["bufferRate", "Buffer rate"],
            ].map(([col, label]) => (
              <th
                key={col}
                onClick={() => handleSort(col)}
                style={{
                  padding: "10px 14px",
                  textAlign: "right",
                  fontWeight: 500,
                  fontSize: 11,
                  borderBottom: `1px solid ${V.border}`,
                  cursor: "pointer",
                  color: sortCol === col ? V.teal : V.textMuted,
                  whiteSpace: "nowrap",
                }}
              >
                {label} {sortCol === col ? (sortDir === "desc" ? "\u2193" : "\u2191") : ""}
                {["captionPct", "seekEvents", "bufferRate"].includes(col) && (
                  <span style={{ background: V.tealLight, color: V.teal, fontSize: 8, fontWeight: 700, padding: "1px 4px", borderRadius: 3, marginLeft: 4 }}>NEW</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(v => (
            <tr
              key={v.title}
              style={{ borderBottom: `1px solid ${V.borderLight}`, cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = V.bg}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <td style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 28, background: V.borderLight, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{v.thumb}</div>
                  <div>
                    <div style={{ fontWeight: 500, color: V.text }}>{v.title}</div>
                    <div style={{ fontSize: 11, color: V.textLight }}>Uploaded {v.uploaded}</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: "12px 14px", textAlign: "right", color: V.textMid }}>{v.views.toLocaleString()}</td>
              <td style={{ padding: "12px 14px", textAlign: "right", color: V.textMid }}>{v.uniqueViewers}</td>
              <td style={{ padding: "12px 14px", textAlign: "right" }}>
                <span style={{ color: v.avgPct >= 60 ? V.green : V.textMid, fontWeight: 600 }}>{v.avgPct}%</span>
              </td>
              <td style={{ padding: "12px 14px", textAlign: "right", color: V.textMid }}>{v.finishes}</td>
              <td style={{ padding: "12px 14px", textAlign: "right" }}>
                <span style={{ color: v.captionPct >= 50 ? V.teal : v.captionPct > 0 ? V.textMid : V.textLight }}>
                  {v.captionPct > 0 ? `${v.captionPct}%` : "\u2014"}
                </span>
              </td>
              <td style={{ padding: "12px 14px", textAlign: "right", color: V.textMid }}>{v.seekEvents || "\u2014"}</td>
              <td style={{ padding: "12px 14px", textAlign: "right" }}>
                <span style={{ color: v.bufferRate > 3 ? V.red : v.bufferRate > 0 ? V.amber : V.textLight }}>
                  {v.bufferRate > 0 ? `${v.bufferRate}%` : "\u2014"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
