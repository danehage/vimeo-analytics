export async function handleAnalytics(path, params, sql) {
  // Route matching
  const retentionMatch = path.match(/^\/api\/analytics\/retention\/(.+)$/);
  const hotspotsMatch = path.match(/^\/api\/analytics\/hotspots\/(.+)$/);
  const sessionDetailMatch = path.match(/^\/api\/analytics\/sessions\/(.+)$/);
  const viewerDetailMatch = path.match(/^\/api\/analytics\/viewers\/(.+)$/);

  if (path === '/api/analytics/summary') {
    return handleSummary(params, sql);
  } else if (path === '/api/analytics/daily') {
    return handleDaily(params, sql);
  } else if (path === '/api/analytics/videos') {
    return handleVideos(params, sql);
  } else if (retentionMatch) {
    return handleRetention(retentionMatch[1], sql);
  } else if (hotspotsMatch) {
    return handleHotspots(hotspotsMatch[1], sql);
  } else if (path === '/api/analytics/quality') {
    return handleQuality(params, sql);
  } else if (path === '/api/analytics/sessions') {
    return handleSessions(params, sql);
  } else if (sessionDetailMatch) {
    return handleSessionDetail(sessionDetailMatch[1], sql);
  } else if (path === '/api/analytics/viewers') {
    return handleViewers(params, sql);
  } else if (viewerDetailMatch) {
    return handleViewerDetail(viewerDetailMatch[1], sql);
  } else if (path === '/api/analytics/recent-events') {
    return handleRecentEvents(sql);
  }

  return json({ error: 'Not found' }, 404);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status });
}

function dateFilter(params) {
  const from = params.get('from');
  const to = params.get('to');
  return { from, to };
}

// ---------------------------------------------------------------------------
// GET /api/analytics/summary
// ---------------------------------------------------------------------------

async function handleSummary(params, sql) {
  const { from, to } = dateFilter(params);

  let dateClause = '';
  const args = [];

  // Build date-filtered queries using tagged template approach
  // Since neon tagged templates don't support dynamic WHERE easily,
  // we run separate queries depending on whether filters are present.

  if (from && to) {
    const rows = await sql`
      SELECT
        COUNT(*)::int AS total_views,
        COUNT(DISTINCT COALESCE(viewer_id, fingerprint_id))::int AS unique_viewers,
        COALESCE(ROUND((SUM(GREATEST(percent_watched, 0) / 100.0 * COALESCE(
          (SELECT duration FROM videos v WHERE v.video_id = s.video_id), 0
        )) / 60.0)::numeric, 1), 0) AS total_watch_mins,
        COALESCE(ROUND(AVG(percent_watched)::numeric, 1), 0) AS avg_percent_watched
      FROM sessions s
      WHERE s.started_at >= ${from} AND s.started_at <= ${to}
    `;

    const deep = await sql`
      SELECT
        COALESCE(ROUND(
          COUNT(*) FILTER (WHERE event_type = 'texttrackchange')::numeric * 100.0 /
          NULLIF(COUNT(DISTINCT session_id), 0), 1
        ), 0) AS caption_adoption,
        COUNT(*) FILTER (WHERE event_type = 'seeked')::int AS seek_events,
        COALESCE(ROUND(
          COUNT(*) FILTER (WHERE event_type = 'bufferstart')::numeric * 100.0 /
          NULLIF(COUNT(DISTINCT session_id), 0), 1
        ), 0) AS buffer_rate,
        COUNT(*) FILTER (WHERE event_type = 'qualitychange')::int AS quality_changes
      FROM events
      WHERE timestamp >= ${from} AND timestamp <= ${to}
    `;

    return json({ ...rows[0], ...deep[0] });
  }

  // No date filter
  const rows = await sql`
    SELECT
      COUNT(*)::int AS total_views,
      COUNT(DISTINCT COALESCE(viewer_id, fingerprint_id))::int AS unique_viewers,
      COALESCE(ROUND((SUM(GREATEST(percent_watched, 0) / 100.0 * COALESCE(
        (SELECT duration FROM videos v WHERE v.video_id = s.video_id), 0
      )) / 60.0)::numeric, 1), 0) AS total_watch_mins,
      COALESCE(ROUND(AVG(percent_watched)::numeric, 1), 0) AS avg_percent_watched
    FROM sessions s
  `;

  const deep = await sql`
    SELECT
      COALESCE(ROUND(
        COUNT(*) FILTER (WHERE event_type = 'texttrackchange')::numeric * 100.0 /
        NULLIF(COUNT(DISTINCT session_id), 0), 1
      ), 0) AS caption_adoption,
      COUNT(*) FILTER (WHERE event_type = 'seeked')::int AS seek_events,
      COALESCE(ROUND(
        COUNT(*) FILTER (WHERE event_type = 'bufferstart')::numeric * 100.0 /
        NULLIF(COUNT(DISTINCT session_id), 0), 1
      ), 0) AS buffer_rate,
      COUNT(*) FILTER (WHERE event_type = 'qualitychange')::int AS quality_changes
    FROM events
  `;

  return json({ ...rows[0], ...deep[0] });
}

// ---------------------------------------------------------------------------
// GET /api/analytics/daily
// ---------------------------------------------------------------------------

async function handleDaily(params, sql) {
  const { from, to } = dateFilter(params);

  let rows;
  if (from && to) {
    rows = await sql`
      SELECT
        DATE(started_at) AS date,
        COUNT(*)::int AS sessions,
        (SELECT COUNT(*) FROM events e WHERE e.event_type = 'seeked' AND DATE(e.timestamp) = DATE(s.started_at))::int AS seeks,
        (SELECT COUNT(DISTINCT e.session_id) FROM events e WHERE e.event_type = 'texttrackchange' AND DATE(e.timestamp) = DATE(s.started_at))::int AS caption_sessions
      FROM sessions s
      WHERE s.started_at >= ${from} AND s.started_at <= ${to}
      GROUP BY DATE(started_at)
      ORDER BY date ASC
    `;
  } else {
    rows = await sql`
      SELECT
        DATE(started_at) AS date,
        COUNT(*)::int AS sessions,
        (SELECT COUNT(*) FROM events e WHERE e.event_type = 'seeked' AND DATE(e.timestamp) = DATE(s.started_at))::int AS seeks,
        (SELECT COUNT(DISTINCT e.session_id) FROM events e WHERE e.event_type = 'texttrackchange' AND DATE(e.timestamp) = DATE(s.started_at))::int AS caption_sessions
      FROM sessions s
      GROUP BY DATE(started_at)
      ORDER BY date ASC
    `;
  }

  return json(rows);
}

// ---------------------------------------------------------------------------
// GET /api/analytics/videos
// ---------------------------------------------------------------------------

async function handleVideos(params, sql) {
  const rows = await sql`
    SELECT
      s.video_id,
      v.title,
      v.duration,
      COUNT(*)::int AS views,
      COUNT(DISTINCT COALESCE(s.viewer_id, s.fingerprint_id))::int AS unique_viewers,
      COALESCE(ROUND(AVG(s.percent_watched)::numeric, 1), 0) AS avg_percent_watched,
      COUNT(*) FILTER (WHERE s.completed)::int AS finishes,
      COALESCE(ROUND(
        (SELECT COUNT(DISTINCT e.session_id) FROM events e WHERE e.video_id = s.video_id AND e.event_type = 'texttrackchange')::numeric * 100.0 /
        NULLIF(COUNT(*), 0), 1
      ), 0) AS caption_adoption,
      (SELECT COUNT(*) FROM events e WHERE e.video_id = s.video_id AND e.event_type = 'seeked')::int AS seek_events,
      COALESCE(ROUND(
        (SELECT COUNT(DISTINCT e.session_id) FROM events e WHERE e.video_id = s.video_id AND e.event_type = 'bufferstart')::numeric * 100.0 /
        NULLIF(COUNT(*), 0), 1
      ), 0) AS buffer_rate
    FROM sessions s
    LEFT JOIN videos v ON v.video_id = s.video_id
    GROUP BY s.video_id, v.title, v.duration
    ORDER BY views DESC
  `;

  return json(rows);
}

// ---------------------------------------------------------------------------
// GET /api/analytics/retention/:id
// ---------------------------------------------------------------------------

async function handleRetention(videoId, sql) {
  // Bucket timeupdate events into 100 segments (0-99% of duration)
  const rows = await sql`
    SELECT
      CASE
        WHEN v.duration > 0 THEN FLOOR(e.playhead / v.duration * 100)::int
        ELSE 0
      END AS bucket,
      COUNT(DISTINCT e.session_id)::int AS viewers
    FROM events e
    JOIN videos v ON v.video_id = e.video_id
    WHERE e.video_id = ${videoId}
      AND e.event_type = 'timeupdate'
      AND v.duration > 0
    GROUP BY bucket
    ORDER BY bucket ASC
  `;

  // Get total sessions for this video to compute percentages
  const totalResult = await sql`
    SELECT COUNT(DISTINCT session_id)::int AS total
    FROM events
    WHERE video_id = ${videoId} AND event_type = 'timeupdate'
  `;

  const total = totalResult[0]?.total || 1;

  // Build full 100-bucket array, filling gaps with 0
  const bucketMap = {};
  rows.forEach(r => { bucketMap[r.bucket] = r.viewers; });

  const retention = [];
  for (let i = 0; i < 100; i++) {
    retention.push({
      bucket: i,
      viewers: bucketMap[i] || 0,
      percent: Math.round(((bucketMap[i] || 0) / total) * 100),
    });
  }

  return json({ video_id: videoId, total_sessions: total, retention });
}

// ---------------------------------------------------------------------------
// GET /api/analytics/hotspots/:id
// ---------------------------------------------------------------------------

async function handleHotspots(videoId, sql) {
  // Bucket seek destinations into 20 segments
  const rows = await sql`
    SELECT
      CASE
        WHEN v.duration > 0 THEN FLOOR(e.playhead / v.duration * 20)::int
        ELSE 0
      END AS bucket,
      COUNT(*)::int AS seeks
    FROM events e
    JOIN videos v ON v.video_id = e.video_id
    WHERE e.video_id = ${videoId}
      AND e.event_type = 'seeked'
      AND v.duration > 0
    GROUP BY bucket
    ORDER BY bucket ASC
  `;

  // Build full 20-bucket array
  const bucketMap = {};
  rows.forEach(r => { bucketMap[r.bucket] = r.seeks; });

  const hotspots = [];
  for (let i = 0; i < 20; i++) {
    hotspots.push({
      bucket: i,
      seeks: bucketMap[i] || 0,
    });
  }

  return json({ video_id: videoId, hotspots });
}

// ---------------------------------------------------------------------------
// GET /api/analytics/quality
// ---------------------------------------------------------------------------

async function handleQuality(params, sql) {
  const videoId = params.get('videoId');

  let rows;
  if (videoId) {
    rows = await sql`
      SELECT
        payload->>'quality' AS quality,
        COUNT(*)::int AS count
      FROM events
      WHERE event_type = 'qualitychange'
        AND payload->>'quality' IS NOT NULL
        AND video_id = ${videoId}
      GROUP BY payload->>'quality'
      ORDER BY count DESC
    `;
  } else {
    rows = await sql`
      SELECT
        payload->>'quality' AS quality,
        COUNT(*)::int AS count
      FROM events
      WHERE event_type = 'qualitychange'
        AND payload->>'quality' IS NOT NULL
      GROUP BY payload->>'quality'
      ORDER BY count DESC
    `;
  }

  return json(rows);
}

// ---------------------------------------------------------------------------
// GET /api/analytics/sessions
// ---------------------------------------------------------------------------

async function handleSessions(params, sql) {
  const videoId = params.get('videoId');
  const page = parseInt(params.get('page') || '1', 10);
  const limit = parseInt(params.get('limit') || '50', 10);
  const offset = (page - 1) * limit;

  let rows;
  let countResult;

  if (videoId) {
    countResult = await sql`SELECT COUNT(*)::int AS total FROM sessions WHERE video_id = ${videoId}`;
    rows = await sql`
      SELECT
        s.session_id, s.video_id, s.viewer_id, s.fingerprint_id, s.embed_url,
        s.started_at, s.ended_at, s.percent_watched, s.completed,
        s.identified_at, s.identified_via,
        (SELECT COUNT(*) FROM events e WHERE e.session_id = s.session_id AND e.event_type = 'texttrackchange')::int AS caption_events,
        (SELECT COUNT(*) FROM events e WHERE e.session_id = s.session_id AND e.event_type = 'seeked')::int AS seek_events,
        (SELECT COUNT(*) FROM events e WHERE e.session_id = s.session_id AND e.event_type = 'bufferstart')::int AS buffer_events
      FROM sessions s
      WHERE s.video_id = ${videoId}
      ORDER BY s.started_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else {
    countResult = await sql`SELECT COUNT(*)::int AS total FROM sessions`;
    rows = await sql`
      SELECT
        s.session_id, s.video_id, s.viewer_id, s.fingerprint_id, s.embed_url,
        s.started_at, s.ended_at, s.percent_watched, s.completed,
        s.identified_at, s.identified_via,
        (SELECT COUNT(*) FROM events e WHERE e.session_id = s.session_id AND e.event_type = 'texttrackchange')::int AS caption_events,
        (SELECT COUNT(*) FROM events e WHERE e.session_id = s.session_id AND e.event_type = 'seeked')::int AS seek_events,
        (SELECT COUNT(*) FROM events e WHERE e.session_id = s.session_id AND e.event_type = 'bufferstart')::int AS buffer_events
      FROM sessions s
      ORDER BY s.started_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  return json({
    sessions: rows,
    total: countResult[0]?.total || 0,
    page,
    limit,
  });
}

// ---------------------------------------------------------------------------
// GET /api/analytics/sessions/:id
// ---------------------------------------------------------------------------

async function handleSessionDetail(sessionId, sql) {
  const sessionRows = await sql`
    SELECT
      s.session_id, s.video_id, s.viewer_id, s.fingerprint_id, s.embed_url,
      s.started_at, s.ended_at, s.percent_watched, s.completed,
      s.identified_at, s.identified_via,
      v.title AS video_title, v.duration AS video_duration
    FROM sessions s
    LEFT JOIN videos v ON v.video_id = s.video_id
    WHERE s.session_id = ${sessionId}
  `;

  if (sessionRows.length === 0) {
    return json({ error: 'Session not found' }, 404);
  }

  const events = await sql`
    SELECT event_id, event_type, playhead, timestamp, video_duration, payload
    FROM events
    WHERE session_id = ${sessionId}
    ORDER BY timestamp ASC
  `;

  return json({
    session: sessionRows[0],
    events,
  });
}

// ---------------------------------------------------------------------------
// GET /api/analytics/viewers
// ---------------------------------------------------------------------------

async function handleViewers(params, sql) {
  const status = params.get('status') || 'all';

  let rows;

  if (status === 'identified') {
    rows = await sql`
      SELECT
        vw.fingerprint_id, vw.viewer_id, vw.identified_at, vw.identified_via,
        vw.first_seen, vw.last_seen, vw.total_sessions, vw.total_watch_mins,
        (SELECT COUNT(DISTINCT s.video_id) FROM sessions s WHERE s.fingerprint_id = vw.fingerprint_id)::int AS unique_videos,
        COALESCE((SELECT ROUND(AVG(s.percent_watched)::numeric, 1) FROM sessions s WHERE s.fingerprint_id = vw.fingerprint_id), 0) AS avg_engagement,
        (SELECT COUNT(*) FROM events e WHERE e.fingerprint_id = vw.fingerprint_id AND e.event_type = 'texttrackchange')::int AS caption_events
      FROM viewers vw
      WHERE vw.viewer_id IS NOT NULL
      ORDER BY vw.last_seen DESC
    `;
  } else if (status === 'anonymous') {
    rows = await sql`
      SELECT
        vw.fingerprint_id, vw.viewer_id, vw.identified_at, vw.identified_via,
        vw.first_seen, vw.last_seen, vw.total_sessions, vw.total_watch_mins,
        (SELECT COUNT(DISTINCT s.video_id) FROM sessions s WHERE s.fingerprint_id = vw.fingerprint_id)::int AS unique_videos,
        COALESCE((SELECT ROUND(AVG(s.percent_watched)::numeric, 1) FROM sessions s WHERE s.fingerprint_id = vw.fingerprint_id), 0) AS avg_engagement,
        (SELECT COUNT(*) FROM events e WHERE e.fingerprint_id = vw.fingerprint_id AND e.event_type = 'texttrackchange')::int AS caption_events
      FROM viewers vw
      WHERE vw.viewer_id IS NULL
      ORDER BY vw.last_seen DESC
    `;
  } else {
    rows = await sql`
      SELECT
        vw.fingerprint_id, vw.viewer_id, vw.identified_at, vw.identified_via,
        vw.first_seen, vw.last_seen, vw.total_sessions, vw.total_watch_mins,
        (SELECT COUNT(DISTINCT s.video_id) FROM sessions s WHERE s.fingerprint_id = vw.fingerprint_id)::int AS unique_videos,
        COALESCE((SELECT ROUND(AVG(s.percent_watched)::numeric, 1) FROM sessions s WHERE s.fingerprint_id = vw.fingerprint_id), 0) AS avg_engagement,
        (SELECT COUNT(*) FROM events e WHERE e.fingerprint_id = vw.fingerprint_id AND e.event_type = 'texttrackchange')::int AS caption_events
      FROM viewers vw
      ORDER BY vw.last_seen DESC
    `;
  }

  // Summary counts
  const summary = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE viewer_id IS NOT NULL)::int AS identified,
      COUNT(*) FILTER (WHERE viewer_id IS NULL)::int AS anonymous,
      COALESCE(ROUND(AVG(
        (SELECT AVG(s.percent_watched) FROM sessions s WHERE s.fingerprint_id = vw.fingerprint_id)
      )::numeric, 1), 0) AS avg_engagement
    FROM viewers vw
  `;

  return json({
    summary: summary[0],
    viewers: rows,
  });
}

// ---------------------------------------------------------------------------
// GET /api/analytics/viewers/:fp
// ---------------------------------------------------------------------------

async function handleViewerDetail(fingerprintId, sql) {
  const viewerRows = await sql`
    SELECT fingerprint_id, viewer_id, identified_at, identified_via,
           first_seen, last_seen, total_sessions, total_watch_mins
    FROM viewers
    WHERE fingerprint_id = ${fingerprintId}
  `;

  if (viewerRows.length === 0) {
    return json({ error: 'Viewer not found' }, 404);
  }

  const sessions = await sql`
    SELECT
      s.session_id, s.video_id, s.started_at, s.ended_at,
      s.percent_watched, s.completed, s.embed_url,
      s.identified_at, s.identified_via,
      v.title AS video_title, v.duration AS video_duration,
      (SELECT COUNT(*) FROM events e WHERE e.session_id = s.session_id AND e.event_type = 'texttrackchange')::int AS caption_events,
      (SELECT COUNT(*) FROM events e WHERE e.session_id = s.session_id AND e.event_type = 'seeked')::int AS seek_events,
      (SELECT COUNT(*) FROM events e WHERE e.session_id = s.session_id AND e.event_type = 'bufferstart')::int AS buffer_events
    FROM sessions s
    LEFT JOIN videos v ON v.video_id = s.video_id
    WHERE s.fingerprint_id = ${fingerprintId}
    ORDER BY s.started_at DESC
  `;

  // Per-video summary for the viewer
  const videos = await sql`
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
    WHERE s.fingerprint_id = ${fingerprintId}
    GROUP BY s.video_id, v.title, v.duration
    ORDER BY session_count DESC
  `;

  // Recent events for this viewer
  const events = await sql`
    SELECT event_id, session_id, video_id, event_type, playhead, timestamp, payload
    FROM events
    WHERE fingerprint_id = ${fingerprintId}
    ORDER BY timestamp DESC
    LIMIT 100
  `;

  return json({
    viewer: viewerRows[0],
    sessions,
    videos,
    events,
  });
}

// ---------------------------------------------------------------------------
// GET /api/analytics/recent-events
// ---------------------------------------------------------------------------

async function handleRecentEvents(sql) {
  const rows = await sql`
    SELECT event_id, session_id, video_id, viewer_id, fingerprint_id,
           embed_url, event_type, playhead, timestamp, video_duration, payload
    FROM events
    ORDER BY timestamp DESC
    LIMIT 20
  `;

  return json(rows);
}
