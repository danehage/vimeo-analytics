import { V, fmtSecs } from '../../constants/theme';

export default function SessionScrubber({ session }) {
  // Build a simplified linear watch map across 100 buckets
  const buckets = Array(100).fill("unwatched");
  session.events.forEach(ev => {
    if (ev.type === "timeupdate" || ev.type === "play" || ev.type === "ended") {
      const pct = Math.round((ev.playhead / session.duration) * 100);
      if (pct >= 0 && pct < 100) buckets[pct] = "watched";
    }
    if (ev.type === "seeked") {
      const pct = Math.round((ev.playhead / session.duration) * 100);
      if (pct >= 0 && pct < 100) buckets[pct] = "seeked";
    }
  });

  // Fill gaps between consecutive watched/play buckets — if two timeupdate
  // events land at bucket 10 and 14, the viewer was watching continuously
  // through 11-13 as well. Only bridge across unwatched gaps, not seeks.
  let lastWatched = -1;
  for (let i = 0; i < 100; i++) {
    if (buckets[i] === "watched") {
      if (lastWatched >= 0) {
        for (let j = lastWatched + 1; j < i; j++) {
          if (buckets[j] === "unwatched") buckets[j] = "watched";
        }
      }
      lastWatched = i;
    } else if (buckets[i] === "seeked") {
      lastWatched = -1; // seek breaks continuity
    }
  }

  return (
    <div>
      {/* Timeline bar */}
      <div style={{ position: "relative", marginBottom: 8 }}>
        <div style={{ display: "flex", height: 20, borderRadius: 4, overflow: "hidden", border: `1px solid ${V.border}` }}>
          {buckets.map((type, i) => (
            <div key={i} style={{
              flex: 1,
              background: type === "watched" ? V.teal : type === "seeked" ? V.purple : "rgba(114,130,163,0.1)",
              borderRight: i % 10 === 9 ? `1px solid ${V.bg}` : "none",
            }} />
          ))}
        </div>
        {/* Event markers */}
        {session.events.filter(e => e.type !== "timeupdate").map((ev, i) => {
          const left = (ev.playhead / session.duration) * 100;
          return (
            <div key={i} title={ev.label} style={{
              position: "absolute",
              top: -6,
              left: `${Math.min(left, 98)}%`,
              width: 2,
              height: 32,
              background: ev.color === V.borderLight || ev.color === "#efefed" ? "transparent" : ev.color,
              opacity: 0.9,
            }} />
          );
        })}
      </div>
      {/* Time labels */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: V.textLight }}>
        <span>0:00</span>
        <span>{fmtSecs(session.duration * 0.25)}</span>
        <span>{fmtSecs(session.duration * 0.5)}</span>
        <span>{fmtSecs(session.duration * 0.75)}</span>
        <span>{fmtSecs(session.duration)}</span>
      </div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
        {[[V.teal, "Watched"], [V.purple, "Seek point"], ["rgba(114,130,163,0.1)", "Not watched"]].map(([c, l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: V.textMuted }}>
            <div style={{ width: 12, height: 6, background: c, borderRadius: 2, border: `1px solid ${V.border}` }} />
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}
