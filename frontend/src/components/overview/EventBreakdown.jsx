import { V } from '../../constants/theme';
import SectionHeader from '../shared/SectionHeader';

const EVENT_BREAKDOWN = [
  { event: "play", count: 847, color: V.teal },
  { event: "pause", count: 623, color: V.textLight },
  { event: "seeked", count: 412, color: V.purple },
  { event: "texttrackchange", count: 198, color: V.green },
  { event: "qualitychange", count: 89, color: V.amber },
  { event: "volumechange", count: 67, color: V.textMuted },
  { event: "bufferstart", count: 34, color: V.red },
];

export default function EventBreakdown() {
  const maxCount = Math.max(...EVENT_BREAKDOWN.map(e => e.count));
  return (
    <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: 8, padding: "20px 24px" }}>
      <SectionHeader title="Event breakdown" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {EVENT_BREAKDOWN.map(({ event, count, color }) => (
          <div key={event}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
                <span style={{ fontSize: 12, color: V.textMid, fontFamily: "monospace" }}>{event}</span>
              </div>
              <span style={{ fontSize: 12, color: V.textMuted }}>{count.toLocaleString()}</span>
            </div>
            <div style={{ background: V.bg, borderRadius: 99, height: 4 }}>
              <div style={{ width: `${(count / maxCount) * 100}%`, height: "100%", background: color, borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
