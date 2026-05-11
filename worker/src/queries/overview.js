import { composer } from './_composer.js';

/**
 * Overview-tab queries: account-level KPIs and daily breakdown.
 * All accept an optional dateRange and thread it through identically.
 */

/**
 * Summary KPIs returned as a tuple of three queries:
 *   [standardSql, deepSql, bufferSql]
 * meant to be executed with runMany() for parallel round-trips.
 *
 * Each entry shares the same dateRange so the three queries are filtered
 * consistently. Absent dateRange = no WHERE clauses.
 */
export function getSummarySql(filters = {}) {
  const { dateRange } = filters;

  const cStandard = composer();
  let standardWhere = '';
  if (dateRange) {
    const from = cStandard.push(dateRange.from);
    const to = cStandard.push(dateRange.to);
    standardWhere = `WHERE s.started_at >= ${from} AND s.started_at <= ${to}`;
  }
  const standard = cStandard.build(`
    SELECT
      COUNT(*)::int AS total_views,
      COUNT(DISTINCT COALESCE(viewer_id, fingerprint_id))::int AS unique_viewers,
      COALESCE(ROUND((SUM(GREATEST(percent_watched, 0) / 100.0 * COALESCE(
        (SELECT duration FROM videos v WHERE v.video_id = s.video_id), 0
      )) / 60.0)::numeric, 1), 0) AS total_watch_mins,
      COALESCE(ROUND(AVG(percent_watched)::numeric, 1), 0) AS avg_percent_watched
    FROM sessions s
    ${standardWhere}
  `);

  const cDeep = composer();
  let deepWhere = '';
  if (dateRange) {
    const from = cDeep.push(dateRange.from);
    const to = cDeep.push(dateRange.to);
    deepWhere = `WHERE timestamp >= ${from} AND timestamp <= ${to}`;
  }
  const deep = cDeep.build(`
    SELECT
      COALESCE(LEAST(ROUND(
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'texttrackchange')::numeric * 100.0 /
        NULLIF(COUNT(DISTINCT session_id), 0), 1
      ), 100), 0) AS caption_adoption,
      COUNT(*) FILTER (WHERE event_type = 'seeked')::int AS seek_events,
      COUNT(*) FILTER (WHERE event_type = 'qualitychange')::int AS quality_changes
    FROM events
    ${deepWhere}
  `);

  const cBuffer = composer();
  let bufferEventDateClause = '';
  let bufferSessionDateClause = '';
  if (dateRange) {
    const from = cBuffer.push(dateRange.from);
    const to = cBuffer.push(dateRange.to);
    bufferEventDateClause = `AND timestamp >= ${from} AND timestamp <= ${to}`;
    bufferSessionDateClause = `WHERE started_at >= ${from} AND started_at <= ${to}`;
  }
  const buffer = cBuffer.build(`
    SELECT COALESCE(ROUND(
      COUNT(*)::numeric * 100.0 / NULLIF((SELECT COUNT(*) FROM sessions ${bufferSessionDateClause}), 0), 1
    ), 0) AS buffer_rate
    FROM (
      SELECT session_id
      FROM events
      WHERE event_type = 'bufferend' ${bufferEventDateClause}
      GROUP BY session_id
      HAVING SUM(COALESCE((payload->>'bufferDuration')::float, 0)) / NULLIF(MAX(video_duration), 0) > 0.03
    ) high_buffer
  `);

  return [standard, deep, buffer];
}

/**
 * Daily breakdown: sessions / seeks / caption-sessions per calendar day.
 * Single query with two CTEs that share the dateRange.
 */
export function getDailySql(filters = {}) {
  const c = composer();
  const { dateRange } = filters;
  let sessionWhere = '';
  let eventWhere = '';
  if (dateRange) {
    const from = c.push(dateRange.from);
    const to = c.push(dateRange.to);
    sessionWhere = `WHERE started_at >= ${from} AND started_at <= ${to}`;
    eventWhere = `WHERE timestamp >= ${from} AND timestamp <= ${to}`;
  }
  return c.build(`
    WITH daily_sessions AS (
      SELECT DATE(started_at) AS date, COUNT(*)::int AS sessions
      FROM sessions
      ${sessionWhere}
      GROUP BY DATE(started_at)
    ),
    daily_events AS (
      SELECT
        DATE(timestamp) AS date,
        COUNT(*) FILTER (WHERE event_type = 'seeked')::int AS seeks,
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'texttrackchange')::int AS caption_sessions
      FROM events
      ${eventWhere}
      GROUP BY DATE(timestamp)
    )
    SELECT
      ds.date,
      ds.sessions,
      COALESCE(de.seeks, 0) AS seeks,
      COALESCE(de.caption_sessions, 0) AS caption_sessions
    FROM daily_sessions ds
    LEFT JOIN daily_events de ON de.date = ds.date
    ORDER BY ds.date ASC
  `);
}

/**
 * Quality distribution. Optional videoId narrows to one video.
 */
export function getQualityDistributionSql(filters = {}) {
  const c = composer();
  const { videoId } = filters;
  let videoClause = '';
  if (videoId) {
    videoClause = `AND video_id = ${c.push(videoId)}`;
  }
  return c.build(`
    SELECT
      payload->>'quality' AS quality,
      COUNT(*)::int AS count
    FROM events
    WHERE event_type = 'qualitychange'
      AND payload->>'quality' IS NOT NULL
      ${videoClause}
    GROUP BY payload->>'quality'
    ORDER BY count DESC
  `);
}
