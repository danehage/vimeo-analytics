import { composer } from './_composer.js';

/**
 * Live-event queries. "Live" = a video flagged is_live=true, with activity
 * detected via timeupdate events in the last 30 seconds whose payload duration
 * differs from the video's known duration (i.e. the player is reporting a
 * stream length, not a VOD position).
 */

/**
 * List of all live-flagged videos with aggregate session stats and a
 * live-activity flag. No filters.
 */
export function listLiveEventsSql() {
  const c = composer();
  return c.build(`
    SELECT
      v.video_id, v.title, v.duration, v.created_at,
      COUNT(DISTINCT s.session_id)::int AS total_sessions,
      COUNT(DISTINCT COALESCE(s.viewer_id, s.fingerprint_id))::int AS unique_viewers,
      COALESCE(ROUND(AVG(s.percent_watched)::numeric, 1), 0) AS avg_percent_watched,
      MAX(s.ended_at) AS last_activity,
      EXISTS(
        SELECT 1 FROM events e
        WHERE e.video_id = v.video_id
          AND e.timestamp >= NOW() - INTERVAL '30 seconds'
          AND e.event_type = 'timeupdate'
          AND (v.duration = 0 OR v.duration IS NULL
               OR ABS(COALESCE((e.payload->>'duration')::float, 0) - v.duration) > 1)
      ) AS is_active,
      (SELECT COUNT(DISTINCT e.session_id) FROM events e
       WHERE e.video_id = v.video_id
         AND e.timestamp >= NOW() - INTERVAL '30 seconds'
         AND (v.duration = 0 OR v.duration IS NULL
              OR ABS(COALESCE((e.payload->>'duration')::float, 0) - v.duration) > 1))::int AS current_viewers
    FROM videos v
    LEFT JOIN sessions s ON s.video_id = v.video_id
    WHERE v.is_live = true
    GROUP BY v.video_id, v.title, v.duration, v.created_at
    ORDER BY
      is_active DESC,
      last_activity DESC NULLS LAST
  `);
}

/**
 * Detail-page queries for one live event: returns a tuple of
 *   [videoHeader, activeViewers, sessions]
 * meant to be executed with runMany() for parallel round-trips.
 */
export function getLiveEventDetailSql(videoId) {
  const cHeader = composer();
  const headerId = cHeader.push(videoId);
  const header = cHeader.build(`
    SELECT
      v.video_id, v.title, v.duration, v.created_at, v.is_live,
      COUNT(DISTINCT s.session_id)::int AS total_sessions,
      COUNT(DISTINCT COALESCE(s.viewer_id, s.fingerprint_id))::int AS unique_viewers,
      COALESCE(ROUND(AVG(s.percent_watched)::numeric, 1), 0) AS avg_percent_watched,
      COUNT(*) FILTER (WHERE s.completed)::int AS finishes,
      MAX(s.ended_at) AS last_activity,
      EXISTS(
        SELECT 1 FROM events e
        WHERE e.video_id = v.video_id
          AND e.timestamp >= NOW() - INTERVAL '30 seconds'
          AND e.event_type = 'timeupdate'
          AND (v.duration = 0 OR v.duration IS NULL
               OR ABS(COALESCE((e.payload->>'duration')::float, 0) - v.duration) > 1)
      ) AS is_active,
      (SELECT COUNT(DISTINCT e.session_id) FROM events e
       WHERE e.video_id = v.video_id
         AND e.timestamp >= NOW() - INTERVAL '30 seconds'
         AND (v.duration = 0 OR v.duration IS NULL
              OR ABS(COALESCE((e.payload->>'duration')::float, 0) - v.duration) > 1))::int AS current_viewers
    FROM videos v
    LEFT JOIN sessions s ON s.video_id = v.video_id
    WHERE v.video_id = ${headerId}
    GROUP BY v.video_id, v.title, v.duration, v.created_at, v.is_live
  `);

  const cActive = composer();
  const activeId = cActive.push(videoId);
  const activeViewers = cActive.build(`
    SELECT DISTINCT ON (COALESCE(s.viewer_id, s.fingerprint_id))
      s.session_id, s.viewer_id, s.fingerprint_id, s.percent_watched, s.embed_url, s.started_at,
      latest.playhead AS last_playhead,
      latest.timestamp AS last_event_at,
      (SELECT payload->>'quality' FROM events eq
       WHERE eq.session_id = s.session_id AND eq.event_type = 'qualitychange'
       ORDER BY eq.timestamp DESC LIMIT 1) AS current_quality,
      (SELECT payload->>'label' FROM events ec
       WHERE ec.session_id = s.session_id AND ec.event_type = 'texttrackchange'
       ORDER BY ec.timestamp DESC LIMIT 1) AS caption_label,
      (SELECT COUNT(*) FROM events eb
       WHERE eb.session_id = s.session_id AND eb.event_type = 'bufferstart')::int AS buffer_count,
      (SELECT COALESCE(SUM((eb.payload->>'bufferDuration')::float), 0) FROM events eb
       WHERE eb.session_id = s.session_id AND eb.event_type = 'bufferend') AS total_buffer_secs,
      (SELECT COUNT(*) FROM events eq
       WHERE eq.session_id = s.session_id AND eq.event_type = 'qualitychange')::int AS quality_changes
    FROM sessions s
    JOIN videos v ON v.video_id = s.video_id
    INNER JOIN LATERAL (
      SELECT playhead, timestamp, video_duration, payload FROM events e
      WHERE e.session_id = s.session_id ORDER BY e.timestamp DESC LIMIT 1
    ) latest ON true
    WHERE s.video_id = ${activeId}
      AND latest.timestamp >= NOW() - INTERVAL '30 seconds'
      AND (v.duration = 0 OR v.duration IS NULL
           OR ABS(COALESCE((latest.payload->>'duration')::float, 0) - v.duration) > 1)
    ORDER BY COALESCE(s.viewer_id, s.fingerprint_id), latest.timestamp DESC
  `);

  const cSessions = composer();
  const sessionsId = cSessions.push(videoId);
  const sessions = cSessions.build(`
    WITH video_sessions AS (
      SELECT session_id, video_id, viewer_id, fingerprint_id, embed_url,
             started_at, ended_at, percent_watched, completed
      FROM sessions
      WHERE video_id = ${sessionsId}
      ORDER BY started_at DESC
      LIMIT 100
    ),
    event_counts AS (
      SELECT
        e.session_id,
        COUNT(*) FILTER (WHERE e.event_type = 'texttrackchange')::int AS caption_events,
        COUNT(*) FILTER (WHERE e.event_type = 'seeked')::int AS seek_events,
        COUNT(*) FILTER (WHERE e.event_type = 'bufferstart')::int AS buffer_events
      FROM events e
      INNER JOIN video_sessions vs ON vs.session_id = e.session_id
      WHERE e.event_type IN ('texttrackchange', 'seeked', 'bufferstart')
      GROUP BY e.session_id
    )
    SELECT
      s.session_id, s.video_id, s.viewer_id, s.fingerprint_id, s.embed_url,
      s.started_at, s.ended_at, s.percent_watched, s.completed,
      v.title AS video_title, v.duration AS video_duration,
      COALESCE(ec.caption_events, 0) AS caption_events,
      COALESCE(ec.seek_events, 0) AS seek_events,
      COALESCE(ec.buffer_events, 0) AS buffer_events
    FROM video_sessions s
    LEFT JOIN videos v ON v.video_id = s.video_id
    LEFT JOIN event_counts ec ON ec.session_id = s.session_id
    ORDER BY s.started_at DESC
  `);

  return [header, activeViewers, sessions];
}
