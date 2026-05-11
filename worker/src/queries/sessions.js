import { composer } from './_composer.js';

const DEFAULT_LIMIT = 50;

/**
 * Filter object for session queries.
 *   videoId?: string                          — narrow to one video
 *   dateRange?: { from: string, to: string }  — ISO-8601 bounds, inclusive
 *   limit?: number                            — default 50
 *   offset?: number                           — default 0
 *
 * Absent filters = absent keys. No null sentinels.
 */
function buildSessionsWhere(c, filters) {
  const where = [];
  if (filters.videoId) {
    where.push(`video_id = ${c.push(filters.videoId)}`);
  }
  if (filters.dateRange) {
    where.push(`started_at >= ${c.push(filters.dateRange.from)}`);
    where.push(`started_at <= ${c.push(filters.dateRange.to)}`);
  }
  return where;
}

/**
 * Paginated session list with per-session event counts (captions, seeks, buffers).
 * Always uses the session_page → event_counts CTE shape so the events scan is
 * bounded to the returned page, regardless of filters.
 */
export function listSessionsSql(filters = {}) {
  const c = composer();
  const where = buildSessionsWhere(c, filters);
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const limit = c.push(filters.limit ?? DEFAULT_LIMIT);
  const offset = c.push(filters.offset ?? 0);

  return c.build(`
    WITH session_page AS (
      SELECT session_id, video_id, viewer_id, fingerprint_id, embed_url,
             started_at, ended_at, percent_watched, completed,
             identified_at, identified_via
      FROM sessions
      ${whereClause}
      ORDER BY started_at DESC
      LIMIT ${limit} OFFSET ${offset}
    ),
    event_counts AS (
      SELECT
        e.session_id,
        COUNT(*) FILTER (WHERE e.event_type = 'texttrackchange')::int AS caption_events,
        COUNT(*) FILTER (WHERE e.event_type = 'seeked')::int AS seek_events,
        COUNT(*) FILTER (WHERE e.event_type = 'bufferstart')::int AS buffer_events
      FROM events e
      INNER JOIN session_page sp ON sp.session_id = e.session_id
      WHERE e.event_type IN ('texttrackchange', 'seeked', 'bufferstart')
      GROUP BY e.session_id
    )
    SELECT
      s.session_id, s.video_id, s.viewer_id, s.fingerprint_id, s.embed_url,
      s.started_at, s.ended_at, s.percent_watched, s.completed,
      s.identified_at, s.identified_via,
      v.title AS video_title, v.duration AS video_duration,
      COALESCE(ec.caption_events, 0) AS caption_events,
      COALESCE(ec.seek_events, 0) AS seek_events,
      COALESCE(ec.buffer_events, 0) AS buffer_events
    FROM session_page s
    LEFT JOIN videos v ON v.video_id = s.video_id
    LEFT JOIN event_counts ec ON ec.session_id = s.session_id
    ORDER BY s.started_at DESC
  `);
}

/**
 * Total session count for pagination. Mirrors listSessionsSql's filter shape.
 */
export function countSessionsSql(filters = {}) {
  const c = composer();
  const where = buildSessionsWhere(c, filters);
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return c.build(`SELECT COUNT(*)::int AS total FROM sessions ${whereClause}`);
}

/**
 * Detail-page queries for a single session: returns a tuple of
 *   [sessionHeader, events]
 * meant to be executed with runMany() for parallel round-trips.
 */
export function getSessionDetailSql(sessionId) {
  const cHeader = composer();
  const headerId = cHeader.push(sessionId);
  const header = cHeader.build(`
    SELECT
      s.session_id, s.video_id, s.viewer_id, s.fingerprint_id, s.embed_url,
      s.started_at, s.ended_at, s.percent_watched, s.completed,
      s.identified_at, s.identified_via,
      v.title AS video_title, v.duration AS video_duration
    FROM sessions s
    LEFT JOIN videos v ON v.video_id = s.video_id
    WHERE s.session_id = ${headerId}
  `);

  const cEvents = composer();
  const eventsId = cEvents.push(sessionId);
  const events = cEvents.build(`
    SELECT event_id, event_type, playhead, timestamp, video_duration, payload
    FROM events
    WHERE session_id = ${eventsId}
    ORDER BY timestamp ASC
  `);

  return [header, events];
}
