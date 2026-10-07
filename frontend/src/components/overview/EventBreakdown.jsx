import { V, EVENT_COLORS } from '../../constants/theme';
import SectionHeader from '../shared/SectionHeader';
import { usePolling } from '../../hooks/usePolling';

const EVENT_ORDER = ['play', 'pause', 'seeked', 'texttrackchange', 'qualitychange', 'volumechange', 'bufferstart'];

const SUMMARY_FIELD = {
  play: 'play_events',
  pause: 'pause_events',
  seeked: 'seek_events',
  texttrackchange: 'caption_events',
  qualitychange: 'quality_changes',
  volumechange: 'volume_events',
  bufferstart: 'buffer_events',
};

export default function EventBreakdown({ dateParams = '' }) {
  const summaryPath = dateParams
    ? `/api/analytics/summary?${dateParams}`
    : '/api/analytics/summary';
  const { data: summary } = usePolling(summaryPath);

  const breakdown = EVENT_ORDER.map(event => ({
    event,
    count: Number(summary?.[SUMMARY_FIELD[event]]) || 0,
    color: EVENT_COLORS[event] || V.textMuted,
  })).filter(e => e.count > 0);

  if (breakdown.length === 0) {
    // Show placeholder
    return (
      <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, padding: "20px 24px" }}>
        <SectionHeader title="Event breakdown" />
        <div style={{ fontSize: 12, color: V.textLight, padding: "20px 0" }}>Waiting for events...</div>
      </div>
    );
  }

  const maxCount = Math.max(...breakdown.map(e => e.count));

  return (
    <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, padding: "20px 24px" }}>
      <SectionHeader title="Event breakdown" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {breakdown.map(({ event, count, color }) => (
          <div key={event}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
                <span style={{ fontSize: 12, color: V.textMid, fontFamily: "monospace" }}>{event}</span>
              </div>
              <span style={{ fontSize: 12, color: V.textMuted }}>{count.toLocaleString()}</span>
            </div>
            <div style={{ background: "rgba(114,130,163,0.12)", borderRadius: 99, height: 4 }}>
              <div style={{ width: `${(count / maxCount) * 100}%`, height: "100%", background: color, borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
