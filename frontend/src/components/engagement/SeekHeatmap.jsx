import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { V } from '../../constants/theme';
import SectionHeader from '../shared/SectionHeader';
import { usePolling } from '../../hooks/usePolling';

function buildSegmentLabel(bucket, duration) {
  if (!duration) {
    const min = Math.floor(bucket * 0.5);
    return bucket < 19 ? `${min}–${min + 1}m` : `${min}m+`;
  }
  const segSecs = duration / 20;
  const startSecs = bucket * segSecs;
  const m = Math.floor(startSecs / 60);
  const s = Math.floor(startSecs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: V.tableHeaderBg, border: `1px solid ${V.border}`, borderRadius: 6, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
      <div style={{ color: V.textMuted, marginBottom: 4, fontSize: 11 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || V.teal, fontWeight: 600 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
}

export default function SeekHeatmap() {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const { data: videosData } = usePolling('/api/analytics/videos', 30000);
  const { data: hotspotsData, loading } = usePolling(
    selectedVideo ? `/api/analytics/hotspots/${selectedVideo}` : null,
    30000
  );

  const videos = videosData || [];

  // Build chart data
  let chartData;
  const selectedVid = videos.find(v => v.video_id === selectedVideo);
  const duration = selectedVid?.duration || 0;

  if (selectedVideo && hotspotsData?.hotspots) {
    chartData = hotspotsData.hotspots.map(h => ({
      segment: buildSegmentLabel(h.bucket, duration),
      replays: h.seeks,
    }));
  } else {
    chartData = null;
  }

  const sub = selectedVid
    ? (selectedVid.title || selectedVid.video_id)
    : "Select a video to view seek heatmap";

  return (
    <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <SectionHeader title="Most replayed sections" sub={sub} />
        <select
          value={selectedVideo || ""}
          onChange={e => setSelectedVideo(e.target.value || null)}
          style={{
            fontSize: 12, padding: "5px 10px", borderRadius: 5,
            border: `1px solid ${V.border}`, background: V.tableHeaderBg,
            color: V.textMid, cursor: "pointer", maxWidth: 200,
          }}
        >
          <option value="">Select video...</option>
          {videos.map(v => (
            <option key={v.video_id} value={v.video_id}>
              {(v.title || v.video_id).slice(0, 35)}
            </option>
          ))}
        </select>
      </div>
      {chartData && chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={V.borderLight} vertical={false} />
            <XAxis dataKey="segment" tick={{ fill: V.textLight, fontSize: 9 }} axisLine={false} tickLine={false} interval={1} />
            <YAxis tick={{ fill: V.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="replays" name="Seek events" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.replays > 100 ? V.teal : entry.replays > 50 ? V.tealMid : "rgba(114,130,163,0.2)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: V.textLight, fontSize: 13 }}>
          {loading ? "Loading seek data..." : selectedVideo ? "No seek data for this video yet" : "Select a video to view seek heatmap"}
        </div>
      )}
    </div>
  );
}
