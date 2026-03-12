import { V } from '../../constants/theme';
import SectionHeader from '../shared/SectionHeader';

const BUFFER_DATA = [
  { title: "Security Training Module 3", bufferRate: 1.8, source: "embed", embedUrl: "intranet.corp.com" },
  { title: "Global Partner Summit Keynote", bufferRate: 1.2, source: "embed", embedUrl: "sharepoint.corp.com" },
  { title: "Florence", bufferRate: 0, source: "vimeo.com", embedUrl: null },
];

export default function BufferRates() {
  const maxRate = Math.max(...BUFFER_DATA.map(v => v.bufferRate), 1);

  return (
    <div style={{ background: V.white, border: `1px solid ${V.border}`, borderRadius: V.cardRadius, padding: "20px 24px" }}>
      <SectionHeader title="High buffer rate by video" sub="% of sessions with >3% buffer time" />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {BUFFER_DATA.map(v => (
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
    </div>
  );
}
