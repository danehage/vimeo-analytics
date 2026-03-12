import { V } from '../../constants/theme';
import SectionHeader from '../shared/SectionHeader';

const CAPTION_DATA = [
  { title: "Security Training Module 3", captionPct: 67 },
  { title: "Global Partner Summit Keynote", captionPct: 36 },
];

export default function CaptionAdoption() {
  return (
    <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, padding: "20px 24px" }}>
      <SectionHeader title="Caption adoption by video" sub="% of sessions with captions enabled" />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {CAPTION_DATA.map(v => (
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
    </div>
  );
}
