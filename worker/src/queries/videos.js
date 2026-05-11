import { composer } from './_composer.js';

/**
 * Filter object for video queries.
 *   dateRange?: { from: string, to: string }  — ISO-8601 bounds, inclusive
 *
 * The three CTEs (session_stats, event_stats, buffer_stats) all take the same
 * dateRange. Absent dateRange = absent WHERE in each CTE. No correlated
 * subqueries; each CTE aggregates once and the result joins by video_id.
 */
export function listVideosSql(filters = {}) {
  const c = composer();
  const { dateRange } = filters;

  let sessionWhere = '';
  let eventWhere = '';
  let bufferDateClause = '';
  if (dateRange) {
    const from = c.push(dateRange.from);
    const to = c.push(dateRange.to);
    sessionWhere = `WHERE started_at >= ${from} AND started_at <= ${to}`;
    eventWhere = `WHERE timestamp >= ${from} AND timestamp <= ${to}`;
    bufferDateClause = `AND timestamp >= ${from} AND timestamp <= ${to}`;
  }

  return c.build(`
    WITH session_stats AS (
      SELECT
        video_id,
        COUNT(*)::int AS views,
        COUNT(DISTINCT COALESCE(viewer_id, fingerprint_id))::int AS unique_viewers,
        COALESCE(ROUND(AVG(percent_watched)::numeric, 1), 0) AS avg_percent_watched,
        COUNT(*) FILTER (WHERE completed)::int AS finishes
      FROM sessions
      ${sessionWhere}
      GROUP BY video_id
    ),
    event_stats AS (
      SELECT
        video_id,
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'texttrackchange')::int AS caption_sessions,
        COUNT(*) FILTER (WHERE event_type = 'seeked')::int AS seek_events
      FROM events
      ${eventWhere}
      GROUP BY video_id
    ),
    buffer_stats AS (
      SELECT
        video_id,
        COUNT(DISTINCT session_id)::int AS high_buffer_sessions
      FROM (
        SELECT video_id, session_id
        FROM events
        WHERE event_type = 'bufferend' ${bufferDateClause}
        GROUP BY video_id, session_id
        HAVING SUM(COALESCE((payload->>'bufferDuration')::float, 0)) / NULLIF(MAX(video_duration), 0) > 0.03
      ) hb
      GROUP BY video_id
    )
    SELECT
      ss.video_id,
      v.title,
      v.duration,
      ss.views,
      ss.unique_viewers,
      ss.avg_percent_watched,
      ss.finishes,
      COALESCE(LEAST(ROUND(es.caption_sessions::numeric * 100.0 / NULLIF(ss.views, 0), 1), 100), 0) AS caption_adoption,
      COALESCE(es.seek_events, 0) AS seek_events,
      COALESCE(ROUND(bs.high_buffer_sessions::numeric * 100.0 / NULLIF(ss.views, 0), 1), 0) AS buffer_rate
    FROM session_stats ss
    LEFT JOIN videos v ON v.video_id = ss.video_id
    LEFT JOIN event_stats es ON es.video_id = ss.video_id
    LEFT JOIN buffer_stats bs ON bs.video_id = ss.video_id
    ORDER BY ss.views DESC
  `);
}
