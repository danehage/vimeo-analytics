import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { V } from '../../constants/theme';
import SectionHeader from '../shared/SectionHeader';
import { usePolling } from '../../hooks/usePolling';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: V.tableHeaderBg, border: `1px solid ${V.border}`, borderRadius: 6, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
      <div style={{ color: V.textMuted, marginBottom: 4, fontSize: 11 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || V.teal, fontWeight: 600 }}>{p.name}: {p.value}%</div>
      ))}
    </div>
  );
}

function formatTime(bucket, duration) {
  if (!duration) {
    const pct = bucket;
    return `${pct}%`;
  }
  const secs = (bucket / 100) * duration;
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function RetentionChart() {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const { data: videosData } = usePolling('/api/analytics/videos', 30000);
  const { data: retentionData, loading } = usePolling(
    selectedVideo ? `/api/analytics/retention/${selectedVideo}` : null,
    30000
  );

  const videos = videosData || [];

  // Auto-select first video if none selected
  if (!selectedVideo && videos.length > 0) {
    setSelectedVideo(videos[0].video_id);
  }

  const selectedVid = videos.find(v => v.video_id === selectedVideo);
  const duration = selectedVid?.duration || 0;

  // Build chart data from API retention response
  let chartData = null;
  if (retentionData?.retention && retentionData.retention.length > 0) {
    // Sample every 10th bucket to get ~10 data points for a clean chart
    const step = 10;
    chartData = [];
    for (let i = 0; i < retentionData.retention.length; i += step) {
      const bucket = retentionData.retention[i];
      // "Standard" estimate: simple linear decay from 100 to ~30
      const standardEstimate = Math.max(Math.round(100 - (i / 100) * 70), 0);
      chartData.push({
        t: formatTime(bucket.bucket, duration),
        existing: standardEstimate,
        deep: bucket.percent,
      });
    }
  }

  return (
    <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 0 }}>
        <SectionHeader title="Viewer retention" sub="Standard estimate vs Deep Analytics actual" />
        <select
          value={selectedVideo || ""}
          onChange={e => setSelectedVideo(e.target.value || null)}
          style={{
            fontSize: 12, padding: "5px 10px", borderRadius: 5,
            border: `1px solid ${V.border}`, background: V.white,
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
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="deepGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={V.teal} stopOpacity={0.15} />
                <stop offset="100%" stopColor={V.teal} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={V.borderLight} vertical={false} />
            <XAxis dataKey="t" tick={{ fill: V.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: V.textLight, fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="existing" name="Standard" stroke={V.textLight} strokeWidth={1.5} fill="none" dot={false} strokeDasharray="4 3" />
            <Area type="monotone" dataKey="deep" name="Deep Analytics" stroke={V.teal} strokeWidth={2.5} fill="url(#deepGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: V.textLight, fontSize: 13 }}>
          {loading ? "Loading retention data..." : selectedVideo ? "No retention data for this video yet" : "Select a video to view retention"}
        </div>
      )}
    </div>
  );
}
