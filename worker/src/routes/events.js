export async function handleEvents(request, sql) {
  const body = await request.json();
  const {
    event_id, session_id, video_id, viewer_id, fingerprint_id,
    embed_url, event_type, playhead, timestamp, video_duration, is_live, payload
  } = body;

  // Insert event (omit event_id to let Postgres generate it via gen_random_uuid())
  await sql`
    INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload)
    VALUES (${session_id}, ${video_id}, ${viewer_id}, ${fingerprint_id}, ${embed_url}, ${event_type}, ${playhead}, ${timestamp}, ${video_duration}, ${JSON.stringify(payload)})
  `;

  // Upsert session
  const percentWatched = video_duration > 0 ? Math.min((playhead / video_duration) * 100, 100) : 0;
  const completed = event_type === 'ended' || percentWatched >= 95;

  await sql`
    INSERT INTO sessions (session_id, video_id, viewer_id, fingerprint_id, embed_url, started_at, ended_at, percent_watched, completed)
    VALUES (${session_id}, ${video_id}, ${viewer_id}, ${fingerprint_id}, ${embed_url}, ${timestamp}, ${timestamp}, ${percentWatched}, ${completed})
    ON CONFLICT (session_id) DO UPDATE SET
      ended_at = ${timestamp},
      percent_watched = GREATEST(sessions.percent_watched, ${percentWatched}),
      completed = sessions.completed OR ${completed},
      viewer_id = COALESCE(${viewer_id}, sessions.viewer_id)
  `;

  // Upsert viewer
  if (fingerprint_id) {
    const watchMins = video_duration ? (playhead / 60) : 0;
    await sql`
      INSERT INTO viewers (fingerprint_id, viewer_id, first_seen, last_seen, total_sessions, total_watch_mins)
      VALUES (${fingerprint_id}, ${viewer_id}, ${timestamp}, ${timestamp}, 1, ${watchMins})
      ON CONFLICT (fingerprint_id) DO UPDATE SET
        last_seen = ${timestamp},
        viewer_id = COALESCE(${viewer_id}, viewers.viewer_id),
        total_watch_mins = viewers.total_watch_mins + ${watchMins}
    `;
  }

  // Upsert video — fetch title from Vimeo oEmbed if missing
  if (video_id && (video_duration || is_live)) {
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
      VALUES (${video_id}, ${title}, ${video_duration}, NOW(), ${!!is_live})
      ON CONFLICT (video_id) DO UPDATE SET
        title = COALESCE(NULLIF(${title}, ''), videos.title),
        duration = COALESCE(NULLIF(${video_duration}, 0), videos.duration),
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
