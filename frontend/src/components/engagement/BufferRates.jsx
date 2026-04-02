import { V } from '../../constants/theme';
import SectionHeader from '../shared/SectionHeader';
import { usePolling } from '../../hooks/usePolling';

function extractDomain(url) {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default function BufferRates() {
  const { data, loading } = usePolling('/api/analytics/videos', 30000);
  const { data: sessionsData } = usePolling('/api/analytics/sessions?limit=200', 30000);

  const videos = data || [];
  const sessions = sessionsData?.sessions || [];

  // Build a map of video_id -> most common embed domain
  const videoDomains = {};
  for (const s of sessions) {
    if (!s.embed_url) continue;
    const domain = extractDomain(s.embed_url);
    if (!domain) continue;
    if (!videoDomains[s.video_id]) videoDomains[s.video_id] = {};
    videoDomains[s.video_id][domain] = (videoDomains[s.video_id][domain] || 0) + 1;
  }

  const bufferData = videos
    .filter(v => v.views > 0)
    .map(v => {
      const domains = videoDomains[v.video_id] || {};
      const topDomain = Object.entries(domains).sort((a, b) => b[1] - a[1])[0];
      const embedUrl = topDomain ? topDomain[0] : null;
      const isEmbed = embedUrl && !embedUrl.includes('vimeo.com');
      return {
        title: v.title || v.video_id,
        bufferRate: Math.round((Number(v.buffer_rate) || 0) * 10) / 10,
        source: isEmbed ? 'embed' : 'vimeo.com',
        embedUrl,
      };
    })
    .sort((a, b) => b.bufferRate - a.bufferRate);

  const maxRate = Math.max(...bufferData.map(v => v.bufferRate), 1);

  return (
    <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, padding: "20px 24px" }}>
      <SectionHeader title="High buffer rate by video" sub="% of sessions with >3% buffer time" />
      {loading ? (
        <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: V.textLight, fontSize: 13 }}>
          Loading buffer data...
        </div>
      ) : bufferData.length === 0 ? (
        <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: V.textLight, fontSize: 13 }}>
          No buffer data available yet
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {bufferData.map(v => (
            <div key={v.title}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: V.textMid }}>
                    {v.title.length > 28 ? v.title.slice(0, 28) + "\u2026" : v.title}
                  </span>
                  <span style={{
                    background: v.source === "embed" ? V.tealLight : V.purpleLight,
                    color: v.source === "embed" ? V.teal : V.purple,
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "1px 6px",
                    borderRadius: 3,
                  }}>
                    {v.source}
                  </span>
                </div>
                <span style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: v.bufferRate > 3 ? V.red : v.bufferRate > 0 ? V.amber : V.textLight,
                }}>
                  {v.bufferRate > 0 ? `${v.bufferRate}%` : "\u2014"}
                </span>
              </div>
              <div style={{ background: "rgba(114,130,163,0.12)", borderRadius: 99, height: 6 }}>
                <div style={{
                  width: `${(v.bufferRate / maxRate) * 100}%`,
                  height: "100%",
                  background: v.bufferRate > 3 ? V.red : v.bufferRate > 0 ? V.amber : V.borderLight,
                  borderRadius: 99,
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
