// Derives viewer-level stats and behavioral callouts from the
// /api/analytics/viewers/:fp response, so the detail view doesn't depend
// on fields that only exist on the list row.

export function avatarInitial(id) {
  const match = (id || '').match(/[a-z0-9]/i);
  return match ? match[0].toUpperCase() : '?';
}

export function avgEngagement(sessions) {
  if (!sessions?.length) return 0;
  const total = sessions.reduce((sum, s) => sum + (Number(s.percent_watched) || 0), 0);
  return Math.round(total / sessions.length);
}

// 'always' | 'sometimes' | 'off'
export function captionUsage(sessions) {
  if (!sessions?.length) return 'off';
  const withCaptions = sessions.filter(s => (s.caption_events || 0) > 0).length;
  if (withCaptions === 0) return 'off';
  return withCaptions === sessions.length && sessions.length > 1 ? 'always' : 'sometimes';
}

export function sessionsBeforeIdentification(sessions, identifiedAt) {
  if (!identifiedAt || !sessions?.length) return 0;
  const cutoff = new Date(identifiedAt).getTime();
  return sessions.filter(s => s.started_at && new Date(s.started_at).getTime() < cutoff).length;
}

function mostCommon(values) {
  const counts = {};
  values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

// Returns a list of short, human-readable observations worth calling out.
export function behavioralInsights({ sessions = [], videos = [], events = [] }) {
  const insights = [];

  videos
    .filter(v => (v.session_count || 0) >= 2 && !v.ever_completed)
    .forEach(v => {
      insights.push(
        `${v.session_count} attempts at ${v.title || v.video_id} without finishing (best: ${Math.round(Number(v.best_percent) || 0)}%).`
      );
    });

  const captionLangs = events
    .filter(e => e.event_type === 'texttrackchange' && e.payload?.language)
    .map(e => e.payload.label || e.payload.language);
  const usage = captionUsage(sessions);
  if (usage !== 'off' && captionLangs.length) {
    const lang = mostCommon(captionLangs);
    insights.push(usage === 'always'
      ? `${lang} captions turned on in every session.`
      : `Turns on ${lang} captions.`);
  }

  const qualities = events
    .filter(e => e.event_type === 'qualitychange' && e.payload?.quality)
    .map(e => e.payload.quality);
  const quality = mostCommon(qualities);
  if (quality && parseInt(quality, 10) < 720) {
    insights.push(`Usually watches at ${quality} — likely a bandwidth-constrained connection.`);
  }

  const rewinds = events.filter((e, i) => {
    if (e.event_type !== 'seeked') return false;
    // events are newest-first; the previous playhead is the next older event in the same session
    const prior = events.slice(i + 1).find(p => p.session_id === e.session_id && p.playhead != null);
    return prior && e.playhead < prior.playhead - 10;
  }).length;
  if (rewinds >= 2) {
    insights.push(`Rewound ${rewinds} times to rewatch sections.`);
  }

  return insights;
}
