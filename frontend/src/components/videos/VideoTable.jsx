import { useState } from 'react';
import { V } from '../../constants/theme';
import { usePolling } from '../../hooks/usePolling';

export default function VideoTable() {
  const [sortCol, setSortCol] = useState("views");
  const [sortDir, setSortDir] = useState("desc");
  const { data, loading } = usePolling('/api/analytics/videos');

  const videos = (data || []).map(v => ({
    title: v.title || v.video_id,
    videoId: v.video_id,
    duration: v.duration ? `${Math.floor(v.duration / 60)}:${String(Math.floor(v.duration % 60)).padStart(2, '0')}` : '—',
    views: v.views || 0,
    uniqueViewers: v.unique_viewers || 0,
    avgPct: Math.round(v.avg_percent_watched || 0),
    finishes: v.finishes || 0,
    captionPct: Math.round(v.caption_adoption || 0),
    seekEvents: v.seek_events || 0,
    bufferRate: Math.round((v.buffer_rate || 0) * 10) / 10,
  }));

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const sorted = [...videos].sort((a, b) => {
    const mult = sortDir === "desc" ? -1 : 1;
    return typeof a[sortCol] === "number"
      ? (a[sortCol] - b[sortCol]) * mult
      : String(a[sortCol]).localeCompare(String(b[sortCol])) * mult;
  });

  if (loading && videos.length === 0) {
    return <div style={{ fontSize: 13, color: V.textMuted, padding: 20 }}>Loading videos...</div>;
  }

  return (
    <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: V.tableHeaderBg }}>
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
                {label} {sortCol === col ? (sortDir === "desc" ? "↓" : "↑") : ""}
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
              key={v.videoId || v.title}
              style={{ borderBottom: `1px solid ${V.borderLight}`, cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = V.active}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <td style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 28, background: V.tableHeaderBg, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🎬</div>
                  <div>
                    <div style={{ fontWeight: 500, color: V.text }}>{v.title}</div>
                    <div style={{ fontSize: 11, color: V.textLight }}>{v.duration}</div>
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
                  {v.captionPct > 0 ? `${v.captionPct}%` : "—"}
                </span>
              </td>
              <td style={{ padding: "12px 14px", textAlign: "right", color: V.textMid }}>{v.seekEvents || "—"}</td>
              <td style={{ padding: "12px 14px", textAlign: "right" }}>
                <span style={{ color: v.bufferRate > 3 ? V.red : v.bufferRate > 0 ? V.amber : V.textLight }}>
                  {v.bufferRate > 0 ? `${v.bufferRate}%` : "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
