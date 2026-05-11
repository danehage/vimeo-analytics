import { composer } from './_composer.js';

/**
 * Filter object for viewer queries.
 *   status?: 'all' | 'identified' | 'anonymous'  — default 'all'
 *   dateRange?: { from: string, to: string }      — ISO-8601 bounds, inclusive
 *
 * When dateRange is set, the list restricts to viewers with sessions in range
 * (INNER JOIN with the date-filtered session_agg CTE). When absent, all viewers
 * appear (LEFT JOIN). Same pattern for the summary.
 */

function statusPredicate(status) {
  if (status === 'identified') return 'vw.viewer_id IS NOT NULL';
  if (status === 'anonymous') return 'vw.viewer_id IS NULL';
  return null;
}

/**
 * Paginated viewer list with per-viewer aggregates (unique_videos, avg_engagement,
 * caption_events). Always uses the session_agg + caption_agg CTE shape so the
 * scan is bounded once per CTE regardless of filters.
 */
export function listViewersSql(filters = {}) {
  const c = composer();
  const { status = 'all', dateRange } = filters;

  let sessionDateClause = '';
  let captionDateClause = '';
  if (dateRange) {
    const from = c.push(dateRange.from);
    const to = c.push(dateRange.to);
    sessionDateClause = `WHERE started_at >= ${from} AND started_at <= ${to}`;
    captionDateClause = `AND timestamp >= ${from} AND timestamp <= ${to}`;
  }

  const joinKind = dateRange ? 'INNER JOIN' : 'LEFT JOIN';

  const where = [];
  const sp = statusPredicate(status);
  if (sp) where.push(sp);
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  return c.build(`
    WITH session_agg AS (
      SELECT
        fingerprint_id,
        COUNT(DISTINCT video_id)::int AS unique_videos,
        COALESCE(ROUND(AVG(percent_watched)::numeric, 1), 0) AS avg_engagement
      FROM sessions
      ${sessionDateClause}
      GROUP BY fingerprint_id
    ),
    caption_agg AS (
      SELECT
        fingerprint_id,
        COUNT(*)::int AS caption_events
      FROM events
      WHERE event_type = 'texttrackchange'
        ${captionDateClause}
      GROUP BY fingerprint_id
    )
    SELECT
      vw.fingerprint_id, vw.viewer_id, vw.identified_at, vw.identified_via,
      vw.first_seen, vw.last_seen, vw.total_sessions, vw.total_watch_mins,
      COALESCE(sa.unique_videos, 0) AS unique_videos,
      COALESCE(sa.avg_engagement, 0) AS avg_engagement,
      COALESCE(ca.caption_events, 0) AS caption_events
    FROM viewers vw
    ${joinKind} session_agg sa ON sa.fingerprint_id = vw.fingerprint_id
    LEFT JOIN caption_agg ca ON ca.fingerprint_id = vw.fingerprint_id
    ${whereClause}
    ORDER BY vw.last_seen DESC
  `);
}

/**
 * Summary counts paired with listViewersSql. Mirrors its dateRange behaviour:
 * INNER JOIN when filtered, LEFT JOIN otherwise.
 */
export function getViewersSummarySql(filters = {}) {
  const c = composer();
  const { dateRange } = filters;

  let dateClause = '';
  if (dateRange) {
    const from = c.push(dateRange.from);
    const to = c.push(dateRange.to);
    dateClause = `WHERE started_at >= ${from} AND started_at <= ${to}`;
  }

  const joinKind = dateRange ? 'INNER JOIN' : 'LEFT JOIN';

  return c.build(`
    WITH viewer_engagement AS (
      SELECT
        fingerprint_id,
        AVG(percent_watched) AS avg_pw
      FROM sessions
      ${dateClause}
      GROUP BY fingerprint_id
    )
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE vw.viewer_id IS NOT NULL)::int AS identified,
      COUNT(*) FILTER (WHERE vw.viewer_id IS NULL)::int AS anonymous,
      COALESCE(ROUND(AVG(ve.avg_pw)::numeric, 1), 0) AS avg_engagement
    FROM viewers vw
    ${joinKind} viewer_engagement ve ON ve.fingerprint_id = vw.fingerprint_id
  `);
}

/**
 * Detail-page queries for a single viewer: returns a tuple of
 *   [viewerHeader, sessions, videos, events]
 * meant to be executed with runMany() for parallel round-trips.
 */
export function getViewerDetailSql(fingerprintId) {
  const cHeader = composer();
  const headerId = cHeader.push(fingerprintId);
  const header = cHeader.build(`
    SELECT fingerprint_id, viewer_id, identified_at, identified_via,
           first_seen, last_seen, total_sessions, total_watch_mins
    FROM viewers
    WHERE fingerprint_id = ${headerId}
  `);

  const cSessions = composer();
  const sessionsId = cSessions.push(fingerprintId);
  const sessions = cSessions.build(`
    WITH viewer_sessions AS (
      SELECT session_id, video_id, started_at, ended_at,
             percent_watched, completed, embed_url,
             identified_at, identified_via
      FROM sessions
      WHERE fingerprint_id = ${sessionsId}
    ),
    event_counts AS (
      SELECT
        e.session_id,
        COUNT(*) FILTER (WHERE e.event_type = 'texttrackchange')::int AS caption_events,
        COUNT(*) FILTER (WHERE e.event_type = 'seeked')::int AS seek_events,
        COUNT(*) FILTER (WHERE e.event_type = 'bufferstart')::int AS buffer_events
      FROM events e
      INNER JOIN viewer_sessions vs ON vs.session_id = e.session_id
      WHERE e.event_type IN ('texttrackchange', 'seeked', 'bufferstart')
      GROUP BY e.session_id
    )
    SELECT
      s.session_id, s.video_id, s.started_at, s.ended_at,
      s.percent_watched, s.completed, s.embed_url,
      s.identified_at, s.identified_via,
      v.title AS video_title, v.duration AS video_duration,
      COALESCE(ec.caption_events, 0) AS caption_events,
      COALESCE(ec.seek_events, 0) AS seek_events,
      COALESCE(ec.buffer_events, 0) AS buffer_events
    FROM viewer_sessions s
    LEFT JOIN videos v ON v.video_id = s.video_id
    LEFT JOIN event_counts ec ON ec.session_id = s.session_id
    ORDER BY s.started_at DESC
  `);

  const cVideos = composer();
  const videosId = cVideos.push(fingerprintId);
  const videos = cVideos.build(`
    SELECT
      s.video_id,
      v.title,
      v.duration,
      COUNT(*)::int AS session_count,
      COALESCE(ROUND(MAX(s.percent_watched)::numeric, 1), 0) AS best_percent,
      COALESCE(ROUND(AVG(s.percent_watched)::numeric, 1), 0) AS avg_percent,
      BOOL_OR(s.completed) AS ever_completed
    FROM sessions s
    LEFT JOIN videos v ON v.video_id = s.video_id
    WHERE s.fingerprint_id = ${videosId}
    GROUP BY s.video_id, v.title, v.duration
    ORDER BY session_count DESC
  `);

  const cEvents = composer();
  const eventsId = cEvents.push(fingerprintId);
  const events = cEvents.build(`
    SELECT event_id, session_id, video_id, event_type, playhead, timestamp, payload
    FROM events
    WHERE fingerprint_id = ${eventsId}
    ORDER BY timestamp DESC
    LIMIT 100
  `);

  return [header, sessions, videos, events];
}
