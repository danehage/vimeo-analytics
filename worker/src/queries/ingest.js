import { composer } from './_composer.js';

/**
 * Event ingest module.
 *
 * Pure functions returning {sql, params} for the four upserts that an event
 * triggers (event row, session row, viewer row, video row), plus the tuple
 * for retroactive identity attribution.
 *
 * Computed metrics live in computeSessionMetrics() so they're testable
 * without touching the database.
 *
 * oEmbed title lookup lives in fetchVideoTitle(). The fetcher is injected so
 * tests can substitute it; a failure is non-fatal and returns null.
 */

const COMPLETED_THRESHOLD = 95; // percent watched

/**
 * Derive everything the session/viewer upserts need from a raw event.
 *
 *   effectiveDuration  — uses payload.duration as fallback for live streams
 *                        where video_duration arrives as 0
 *   percentWatched     — capped at 100; 0 when duration unknown
 *   completed          — true on 'ended' event OR when ≥95% watched
 *   watchMins          — only non-zero on 'session_end' with a real playhead;
 *                        prevents counting every timeupdate
 */
export function computeSessionMetrics(event) {
  const videoDuration = Number(event.video_duration) || 0;
  const playhead = Number(event.playhead) || 0;
  const payloadDuration = Number(event.payload?.duration) || 0;
  const effectiveDuration = videoDuration > 0 ? videoDuration : payloadDuration;

  const percentWatched = effectiveDuration > 0
    ? Math.min((playhead / effectiveDuration) * 100, 100)
    : 0;

  const completed = event.event_type === 'ended' || percentWatched >= COMPLETED_THRESHOLD;

  const watchMins = (event.event_type === 'session_end' && playhead > 0)
    ? playhead / 60
    : 0;

  return { effectiveDuration, percentWatched, completed, watchMins };
}

/**
 * Event insert. When the client supplies an event_id we use ON CONFLICT
 * DO NOTHING so retries are idempotent. Without an event_id, Postgres
 * generates one (legacy clients).
 */
export function insertEventSql(event) {
  const c = composer();
  const payloadJson = JSON.stringify(event.payload);
  if (event.event_id) {
    const eventId = c.push(event.event_id);
    const sessionId = c.push(event.session_id);
    const videoId = c.push(event.video_id);
    const viewerId = c.push(event.viewer_id);
    const fingerprintId = c.push(event.fingerprint_id);
    const embedUrl = c.push(event.embed_url);
    const eventType = c.push(event.event_type);
    const playhead = c.push(event.playhead);
    const timestamp = c.push(event.timestamp);
    const videoDuration = c.push(event.video_duration);
    const payload = c.push(payloadJson);
    return c.build(`
      INSERT INTO events (event_id, session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload)
      VALUES (${eventId}, ${sessionId}, ${videoId}, ${viewerId}, ${fingerprintId}, ${embedUrl}, ${eventType}, ${playhead}, ${timestamp}, ${videoDuration}, ${payload})
      ON CONFLICT (event_id) DO NOTHING
    `);
  }
  const sessionId = c.push(event.session_id);
  const videoId = c.push(event.video_id);
  const viewerId = c.push(event.viewer_id);
  const fingerprintId = c.push(event.fingerprint_id);
  const embedUrl = c.push(event.embed_url);
  const eventType = c.push(event.event_type);
  const playhead = c.push(event.playhead);
  const timestamp = c.push(event.timestamp);
  const videoDuration = c.push(event.video_duration);
  const payload = c.push(payloadJson);
  return c.build(`
    INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload)
    VALUES (${sessionId}, ${videoId}, ${viewerId}, ${fingerprintId}, ${embedUrl}, ${eventType}, ${playhead}, ${timestamp}, ${videoDuration}, ${payload})
  `);
}

/**
 * Session upsert. Returns is_new_session via xmax detection so the caller can
 * pass it to the viewer upsert. percent_watched and completed only ever
 * increase (GREATEST / OR) so out-of-order events don't regress the session.
 */
export function upsertSessionSql(event, metrics) {
  const c = composer();
  const sessionId = c.push(event.session_id);
  const videoId = c.push(event.video_id);
  const viewerId = c.push(event.viewer_id);
  const fingerprintId = c.push(event.fingerprint_id);
  const embedUrl = c.push(event.embed_url);
  const startedAt = c.push(event.timestamp);
  const endedAt = c.push(event.timestamp);
  const percentWatched = c.push(metrics.percentWatched);
  const completed = c.push(metrics.completed);
  return c.build(`
    INSERT INTO sessions (session_id, video_id, viewer_id, fingerprint_id, embed_url, started_at, ended_at, percent_watched, completed)
    VALUES (${sessionId}, ${videoId}, ${viewerId}, ${fingerprintId}, ${embedUrl}, ${startedAt}, ${endedAt}, ${percentWatched}, ${completed})
    ON CONFLICT (session_id) DO UPDATE SET
      ended_at = ${endedAt},
      percent_watched = GREATEST(sessions.percent_watched, ${percentWatched}),
      completed = sessions.completed OR ${completed},
      viewer_id = COALESCE(${viewerId}, sessions.viewer_id)
    RETURNING (xmax = 0) AS is_new_session
  `);
}

/**
 * Viewer upsert. Only safe to call when fingerprint_id is set. Increments
 * total_sessions only for new sessions; accumulates total_watch_mins from
 * the metrics derived for this event.
 */
export function upsertViewerSql(event, isNewSession, metrics) {
  const c = composer();
  const fingerprintId = c.push(event.fingerprint_id);
  const viewerId = c.push(event.viewer_id);
  const firstSeen = c.push(event.timestamp);
  const lastSeen = c.push(event.timestamp);
  const watchMins = c.push(metrics.watchMins);
  const isNew = c.push(isNewSession);
  return c.build(`
    INSERT INTO viewers (fingerprint_id, viewer_id, first_seen, last_seen, total_sessions, total_watch_mins)
    VALUES (${fingerprintId}, ${viewerId}, ${firstSeen}, ${lastSeen}, 1, ${watchMins})
    ON CONFLICT (fingerprint_id) DO UPDATE SET
      last_seen = ${lastSeen},
      viewer_id = COALESCE(${viewerId}, viewers.viewer_id),
      total_sessions = viewers.total_sessions + CASE WHEN ${isNew} THEN 1 ELSE 0 END,
      total_watch_mins = viewers.total_watch_mins + ${watchMins}
  `);
}

/**
 * Video upsert. The caller is responsible for the gate
 * (effectiveDuration > 0 || is_live) so live streams with unknown duration
 * still create a row. title may be null when oEmbed lookup hasn't run or
 * failed; existing titles are preserved by COALESCE.
 */
export function upsertVideoSql(event, title, effectiveDuration) {
  const c = composer();
  const videoId = c.push(event.video_id);
  const titleParam = c.push(title);
  const duration = c.push(effectiveDuration);
  const isLive = c.push(!!event.is_live);
  return c.build(`
    INSERT INTO videos (video_id, title, duration, created_at, is_live)
    VALUES (${videoId}, ${titleParam}, ${duration}, NOW(), ${isLive})
    ON CONFLICT (video_id) DO UPDATE SET
      title = COALESCE(NULLIF(${titleParam}, ''), videos.title),
      duration = GREATEST(COALESCE(NULLIF(${duration}, 0), videos.duration), videos.duration),
      is_live = videos.is_live OR ${isLive}
  `);
}

/**
 * Lookup the video's existing title so we can decide whether to call oEmbed.
 */
export function getVideoTitleSql(videoId) {
  const c = composer();
  const id = c.push(videoId);
  return c.build(`SELECT title FROM videos WHERE video_id = ${id}`);
}

/**
 * Fetch a video's title from Vimeo's oEmbed endpoint. Failures are silent —
 * title is optional and live streams often don't have one upfront.
 *
 * The fetcher is injected so tests can substitute it; defaults to global fetch.
 */
export async function fetchVideoTitle(videoId, fetcher = globalThis.fetch) {
  try {
    const res = await fetcher(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`);
    if (!res.ok) return null;
    const meta = await res.json();
    return meta.title || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Retroactive identity attribution
// ---------------------------------------------------------------------------

/**
 * Identity-attribution queries: returns a tuple of three queries that must
 * run sequentially because step 2 needs session_ids from step 1:
 *   step1Sessions(fingerprintId, viewerId, identifiedVia)
 *     → UPDATE sessions, RETURNING session_id
 *   step2EventsSql(sessionIds, viewerId) — null when step1 attributed nothing
 *     → UPDATE events
 *   step3ViewerSql(fingerprintId, viewerId, identifiedVia)
 *     → UPDATE viewers
 *
 * Returned as separate builders rather than a single tuple so the caller can
 * skip step 2 when no sessions were attributed.
 */
export function attributeSessionsSql(fingerprintId, viewerId, identifiedVia) {
  const c = composer();
  const v = c.push(viewerId);
  const via = c.push(identifiedVia);
  const fp = c.push(fingerprintId);
  return c.build(`
    UPDATE sessions
    SET viewer_id = ${v}, identified_at = NOW(), identified_via = ${via}
    WHERE fingerprint_id = ${fp} AND viewer_id IS NULL
    RETURNING session_id
  `);
}

export function attributeEventsSql(sessionIds, viewerId) {
  const c = composer();
  const v = c.push(viewerId);
  const ids = c.push(sessionIds);
  return c.build(`
    UPDATE events SET viewer_id = ${v}
    WHERE session_id = ANY(${ids})
  `);
}

export function attributeViewerSql(fingerprintId, viewerId, identifiedVia) {
  const c = composer();
  const v = c.push(viewerId);
  const via = c.push(identifiedVia);
  const fp = c.push(fingerprintId);
  return c.build(`
    UPDATE viewers
    SET viewer_id = ${v}, identified_at = NOW(), identified_via = ${via}
    WHERE fingerprint_id = ${fp}
  `);
}
