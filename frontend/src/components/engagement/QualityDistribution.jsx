import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { V } from '../../constants/theme';
import SectionHeader from '../shared/SectionHeader';
import { usePolling } from '../../hooks/usePolling';

const QUALITY_COLORS = {
  "2160p": V.teal,
  "1440p": V.teal,
  "1080p": V.teal,
  "720p": V.tealMid,
  "540p": V.amber,
  "360p": V.red,
  "240p": V.red,
  "auto": V.textLight,
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: V.tableHeaderBg, border: `1px solid ${V.border}`, borderRadius: 6, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
      <div style={{ color: V.textMuted, marginBottom: 4, fontSize: 11 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: V.teal, fontWeight: 600 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
}

export default function QualityDistribution() {
  const [selectedVideo, setSelectedVideo] = useState("all");
  const { data: videosData } = usePolling('/api/analytics/videos', 30000);
  const qualityUrl = selectedVideo === "all"
    ? '/api/analytics/quality'
    : `/api/analytics/quality?videoId=${selectedVideo}`;
  const { data: qualityData } = usePolling(qualityUrl, 30000);

  const videos = videosData || [];

  const chartData = (qualityData || []).map(q => ({
    quality: q.quality,
    sessions: q.count,
    color: QUALITY_COLORS[q.quality] || V.textMuted,
  }));

  const selectedVid = videos.find(v => v.video_id === selectedVideo);
  const sub = selectedVideo === "all"
    ? "Playback quality across all sessions"
    : (selectedVid?.title || selectedVideo);

  return (
    <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <SectionHeader title="Quality distribution" sub={sub} />
        <select
          value={selectedVideo}
          onChange={e => setSelectedVideo(e.target.value)}
          style={{
            fontSize: 12, padding: "5px 10px", borderRadius: 5,
            border: `1px solid ${V.border}`, background: V.tableHeaderBg,
            color: V.textMid, cursor: "pointer", maxWidth: 200,
          }}
        >
          <option value="all">All Videos</option>
          {videos.map(v => (
            <option key={v.video_id} value={v.video_id}>
              {(v.title || v.video_id).slice(0, 35)}
            </option>
          ))}
        </select>
      </div>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={V.borderLight} vertical={false} />
            <XAxis dataKey="quality" tick={{ fill: V.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: V.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="sessions" name="Sessions" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: V.textLight, fontSize: 13 }}>
          No quality change data yet
        </div>
      )}
    </div>
  );
}
