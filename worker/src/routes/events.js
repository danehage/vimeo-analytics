// Validation helpers
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_EVENT_TYPES = [
  'play', 'pause', 'ended', 'seeked', 'timeupdate',
  'qualitychange', 'texttrackchange', 'volumechange',
  'bufferstart', 'bufferend', 'session_end'
];

function validateEvent(body) {
  const errors = [];

  if (!body.session_id || !UUID_REGEX.test(body.session_id)) {
    errors.push('session_id must be a valid UUID');
  }
  if (!body.event_type || !ALLOWED_EVENT_TYPES.includes(body.event_type)) {
    errors.push(`event_type must be one of: ${ALLOWED_EVENT_TYPES.join(', ')}`);
  }
  if (body.playhead != null && (typeof body.playhead !== 'number' || !Number.isFinite(body.playhead) || body.playhead < 0)) {
    errors.push('playhead must be a non-negative number');
  }
  if (body.video_duration != null && (typeof body.video_duration !== 'number' || !Number.isFinite(body.video_duration) || body.video_duration < 0)) {
    errors.push('video_duration must be a non-negative number');
  }
  if (body.fingerprint_id && (typeof body.fingerprint_id !== 'string' || body.fingerprint_id.length > 50)) {
    errors.push('fingerprint_id must be a string under 50 characters');
  }
  if (body.embed_url && body.embed_url.length > 2048) {
    errors.push('embed_url must be under 2048 characters');
  }
  if (body.timestamp && isNaN(Date.parse(body.timestamp))) {
    errors.push('timestamp must be a valid ISO8601 date');
  }
  if (!body.video_id || typeof body.video_id !== 'string') {
    errors.push('video_id is required');
  }
  if (body.event_id != null && !UUID_REGEX.test(body.event_id)) {
    errors.push('event_id must be a valid UUID');
  }

  return errors;
}

export async function handleEvents(request, sql) {
  const body = await request.json();

  // Validate input
  const errors = validateEvent(body);
  if (errors.length > 0) {
    return new Response(JSON.stringify({ error: 'Validation failed', details: errors }), { status: 400 });
  }

  const {
    event_id, session_id, video_id, viewer_id, fingerprint_id,
    embed_url, event_type, playhead, timestamp, video_duration, is_live, payload
  } = body;

  // Insert event with idempotency — client-provided event_id deduplicates retries
  if (event_id) {
    await sql`
      INSERT INTO events (event_id, session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload)
      VALUES (${event_id}, ${session_id}, ${video_id}, ${viewer_id}, ${fingerprint_id}, ${embed_url}, ${event_type}, ${playhead}, ${timestamp}, ${video_duration}, ${JSON.stringify(payload)})
      ON CONFLICT (event_id) DO NOTHING
    `;
  } else {
    // Legacy clients without event_id — let Postgres generate one
    await sql`
      INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload)
      VALUES (${session_id}, ${video_id}, ${viewer_id}, ${fingerprint_id}, ${embed_url}, ${event_type}, ${playhead}, ${timestamp}, ${video_duration}, ${JSON.stringify(payload)})
    `;
  }

  // Upsert session — use payload.duration as fallback for live streams where video_duration is 0
  const effectiveDuration = video_duration > 0 ? video_duration : (payload?.duration || 0);
  const percentWatched = effectiveDuration > 0 ? Math.min((playhead / effectiveDuration) * 100, 100) : 0;
  const completed = event_type === 'ended' || percentWatched >= 95;

  const sessionResult = await sql`
    INSERT INTO sessions (session_id, video_id, viewer_id, fingerprint_id, embed_url, started_at, ended_at, percent_watched, completed)
    VALUES (${session_id}, ${video_id}, ${viewer_id}, ${fingerprint_id}, ${embed_url}, ${timestamp}, ${timestamp}, ${percentWatched}, ${completed})
    ON CONFLICT (session_id) DO UPDATE SET
      ended_at = ${timestamp},
      percent_watched = GREATEST(sessions.percent_watched, ${percentWatched}),
      completed = sessions.completed OR ${completed},
      viewer_id = COALESCE(${viewer_id}, sessions.viewer_id)
    RETURNING (xmax = 0) AS is_new_session
  `;

  const isNewSession = sessionResult[0]?.is_new_session ?? false;

  // Upsert viewer — increment total_sessions only for new sessions, watch_mins only on session_end
  if (fingerprint_id) {
    // Only accumulate watch time on session_end to avoid counting every event
    const watchMins = (event_type === 'session_end' && playhead > 0) ? (playhead / 60) : 0;
    await sql`
      INSERT INTO viewers (fingerprint_id, viewer_id, first_seen, last_seen, total_sessions, total_watch_mins)
      VALUES (${fingerprint_id}, ${viewer_id}, ${timestamp}, ${timestamp}, 1, ${watchMins})
      ON CONFLICT (fingerprint_id) DO UPDATE SET
        last_seen = ${timestamp},
        viewer_id = COALESCE(${viewer_id}, viewers.viewer_id),
        total_sessions = viewers.total_sessions + CASE WHEN ${isNewSession} THEN 1 ELSE 0 END,
        total_watch_mins = viewers.total_watch_mins + ${watchMins}
    `;
  }

  // Upsert video — fetch title from Vimeo oEmbed if missing
  if (video_id && (effectiveDuration || is_live)) {
    const existing = await sql`SELECT title FROM videos WHERE video_id = ${video_id}`;
    let title = existing[0]?.title || null;

    if (!title) {
      try {
        const res = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${video_id}`);
        if (res.ok) {
          const meta = await res.json();
          title = meta.title || null;
        }
      } catch {
        // Silent fail — title is optional
      }
    }

    await sql`
      INSERT INTO videos (video_id, title, duration, created_at, is_live)
      VALUES (${video_id}, ${title}, ${effectiveDuration}, NOW(), ${!!is_live})
      ON CONFLICT (video_id) DO UPDATE SET
        title = COALESCE(NULLIF(${title}, ''), videos.title),
        duration = GREATEST(COALESCE(NULLIF(${effectiveDuration}, 0), videos.duration), videos.duration),
        is_live = videos.is_live OR ${!!is_live}
    `;
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}

export async function handleIdentify(request, sql) {
  const { fingerprintId, viewerId, identifiedVia } = await request.json();

  if (!fingerprintId || !viewerId) {
    return new Response(JSON.stringify({ error: 'fingerprintId and viewerId required' }), { status: 400 });
  }

  // Update sessions
  const sessionResult = await sql`
    UPDATE sessions
    SET viewer_id = ${viewerId}, identified_at = NOW(), identified_via = ${identifiedVia}
    WHERE fingerprint_id = ${fingerprintId} AND viewer_id IS NULL
    RETURNING session_id
  `;

  // Update events for those sessions
  if (sessionResult.length > 0) {
    const sessionIds = sessionResult.map(r => r.session_id);
    await sql`
      UPDATE events SET viewer_id = ${viewerId}
      WHERE session_id = ANY(${sessionIds})
    `;
  }

  // Update viewer
  await sql`
    UPDATE viewers
    SET viewer_id = ${viewerId}, identified_at = NOW(), identified_via = ${identifiedVia}
    WHERE fingerprint_id = ${fingerprintId}
  `;

  return new Response(JSON.stringify({
    ok: true,
    attributed_sessions: sessionResult.length,
  }), { status: 200 });
}
