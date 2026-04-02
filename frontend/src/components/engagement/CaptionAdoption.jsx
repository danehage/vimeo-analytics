import { V } from '../../constants/theme';
import SectionHeader from '../shared/SectionHeader';
import { usePolling } from '../../hooks/usePolling';

export default function CaptionAdoption() {
  const { data, loading } = usePolling('/api/analytics/videos', 30000);

  const videos = data || [];
  // Filter to videos that have caption data and sort by adoption descending
  const captionData = videos
    .filter(v => v.views > 0)
    .map(v => ({
      title: v.title || v.video_id,
      captionPct: Math.round(Number(v.caption_adoption) || 0),
    }))
    .sort((a, b) => b.captionPct - a.captionPct);

  return (
    <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, padding: "20px 24px" }}>
      <SectionHeader title="Caption adoption by video" sub="% of sessions with captions enabled" />
      {loading ? (
        <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: V.textLight, fontSize: 13 }}>
          Loading caption data...
        </div>
      ) : captionData.length === 0 ? (
        <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: V.textLight, fontSize: 13 }}>
          No caption data available yet
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {captionData.map(v => (
            <div key={v.title}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: V.textMid }}>{v.title.length > 30 ? v.title.slice(0, 30) + "\u2026" : v.title}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: v.captionPct >= 50 ? V.teal : V.textMid }}>{v.captionPct}%</span>
              </div>
              <div style={{ background: "rgba(114,130,163,0.12)", borderRadius: 99, height: 6 }}>
                <div style={{ width: `${v.captionPct}%`, height: "100%", background: v.captionPct >= 50 ? V.teal : V.tealMid, borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
