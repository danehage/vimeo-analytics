export async function handleAnalytics(path, params, sql) {
  // Route matching
  const retentionMatch = path.match(/^\/api\/analytics\/retention\/(.+)$/);
  const hotspotsMatch = path.match(/^\/api\/analytics\/hotspots\/(.+)$/);
  const sessionDetailMatch = path.match(/^\/api\/analytics\/sessions\/(.+)$/);
  const viewerDetailMatch = path.match(/^\/api\/analytics\/viewers\/(.+)$/);
  const liveEventDetailMatch = path.match(/^\/api\/analytics\/live-events\/(.+)$/);

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
  } else if (path === '/api/analytics/live-events') {
    return handleLiveEvents(sql);
  } else if (liveEventDetailMatch) {
    return handleLiveEventDetail(liveEventDetailMatch[1], sql);
  } else if (path === '/api/analytics/caption-languages') {
    return handleCaptionLanguages(sql);
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
        COALESCE(LEAST(ROUND(
          COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'texttrackchange')::numeric * 100.0 /
          NULLIF(COUNT(DISTINCT session_id), 0), 1
        ), 100), 0) AS caption_adoption,
        COUNT(*) FILTER (WHERE event_type = 'seeked')::int AS seek_events,
        COUNT(*) FILTER (WHERE event_type = 'qualitychange')::int AS quality_changes
      FROM events
      WHERE timestamp >= ${from} AND timestamp <= ${to}
    `;

    const bufferResult = await sql`
      SELECT COALESCE(ROUND(
        COUNT(*)::numeric * 100.0 / NULLIF((SELECT COUNT(*) FROM sessions WHERE started_at >= ${from} AND started_at <= ${to}), 0), 1
      ), 0) AS buffer_rate
      FROM (
        SELECT session_id
        FROM events
        WHERE event_type = 'bufferend' AND timestamp >= ${from} AND timestamp <= ${to}
        GROUP BY session_id
        HAVING SUM(COALESCE((payload->>'bufferDuration')::float, 0)) / NULLIF(MAX(video_duration), 0) > 0.03
      ) high_buffer
    `;

    return json({ ...rows[0], ...deep[0], buffer_rate: bufferResult[0]?.buffer_rate ?? 0 });
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
      COALESCE(LEAST(ROUND(
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'texttrackchange')::numeric * 100.0 /
        NULLIF(COUNT(DISTINCT session_id), 0), 1
      ), 100), 0) AS caption_adoption,
      COUNT(*) FILTER (WHERE event_type = 'seeked')::int AS seek_events,
      COUNT(*) FILTER (WHERE event_type = 'qualitychange')::int AS quality_changes
    FROM events
  `;

  const bufferResult = await sql`
    SELECT COALESCE(ROUND(
      COUNT(*)::numeric * 100.0 / NULLIF((SELECT COUNT(*) FROM sessions), 0), 1
    ), 0) AS buffer_rate
    FROM (
      SELECT session_id
      FROM events
      WHERE event_type = 'bufferend'
      GROUP BY session_id
      HAVING SUM(COALESCE((payload->>'bufferDuration')::float, 0)) / NULLIF(MAX(video_duration), 0) > 0.03
    ) high_buffer
  `;

  return json({ ...rows[0], ...deep[0], buffer_rate: bufferResult[0]?.buffer_rate ?? 0 });
}

// ---------------------------------------------------------------------------
// GET /api/analytics/daily
// ---------------------------------------------------------------------------

async function handleDaily(params, sql) {
  const { from, to } = dateFilter(params);

  let rows;
  if (from && to) {
    rows = await sql`
      WITH daily_sessions AS (
        SELECT DATE(started_at) AS date, COUNT(*)::int AS sessions
        FROM sessions
        WHERE started_at >= ${from} AND started_at <= ${to}
        GROUP BY DATE(started_at)
      ),
      daily_events AS (
        SELECT
          DATE(timestamp) AS date,
          COUNT(*) FILTER (WHERE event_type = 'seeked')::int AS seeks,
          COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'texttrackchange')::int AS caption_sessions
        FROM events
        WHERE timestamp >= ${from} AND timestamp <= ${to}
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
    `;
  } else {
    rows = await sql`
      WITH daily_sessions AS (
        SELECT DATE(started_at) AS date, COUNT(*)::int AS sessions
        FROM sessions
        GROUP BY DATE(started_at)
      ),
      daily_events AS (
        SELECT
          DATE(timestamp) AS date,
          COUNT(*) FILTER (WHERE event_type = 'seeked')::int AS seeks,
          COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'texttrackchange')::int AS caption_sessions
        FROM events
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
    `;
  }

  return json(rows);
}

// ---------------------------------------------------------------------------
// GET /api/analytics/videos
// ---------------------------------------------------------------------------

async function handleVideos(params, sql) {
  const { from, to } = dateFilter(params);

  let rows;
  if (from && to) {
    rows = await sql`
      WITH session_stats AS (
        SELECT
          video_id,
          COUNT(*)::int AS views,
          COUNT(DISTINCT COALESCE(viewer_id, fingerprint_id))::int AS unique_viewers,
          COALESCE(ROUND(AVG(percent_watched)::numeric, 1), 0) AS avg_percent_watched,
          COUNT(*) FILTER (WHERE completed)::int AS finishes
        FROM sessions
        WHERE started_at >= ${from} AND started_at <= ${to}
        GROUP BY video_id
      ),
      event_stats AS (
        SELECT
          video_id,
          COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'texttrackchange')::int AS caption_sessions,
          COUNT(*) FILTER (WHERE event_type = 'seeked')::int AS seek_events
        FROM events
        WHERE timestamp >= ${from} AND timestamp <= ${to}
        GROUP BY video_id
      ),
      buffer_stats AS (
        SELECT
          video_id,
          COUNT(DISTINCT session_id)::int AS high_buffer_sessions
        FROM (
          SELECT video_id, session_id
          FROM events
          WHERE event_type = 'bufferend' AND timestamp >= ${from} AND timestamp <= ${to}
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
    `;
  } else {
    rows = await sql`
      WITH session_stats AS (
        SELECT
          video_id,
          COUNT(*)::int AS views,
          COUNT(DISTINCT COALESCE(viewer_id, fingerprint_id))::int AS unique_viewers,
          COALESCE(ROUND(AVG(percent_watched)::numeric, 1), 0) AS avg_percent_watched,
          COUNT(*) FILTER (WHERE completed)::int AS finishes
        FROM sessions
        GROUP BY video_id
      ),
      event_stats AS (
        SELECT
          video_id,
          COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'texttrackchange')::int AS caption_sessions,
          COUNT(*) FILTER (WHERE event_type = 'seeked')::int AS seek_events
        FROM events
        GROUP BY video_id
      ),
      buffer_stats AS (
        SELECT
          video_id,
          COUNT(DISTINCT session_id)::int AS high_buffer_sessions
        FROM (
          SELECT video_id, session_id
          FROM events
          WHERE event_type = 'bufferend'
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
    `;
  }

  return json(rows);
}

// ---------------------------------------------------------------------------
// GET /api/analytics/retention/:id
// ---------------------------------------------------------------------------

async function handleRetention(videoId, sql) {
  // Get per-session bucket hits so we can gap-fill continuous playback
  const rows = await sql`
    SELECT
      e.session_id,
      CASE
        WHEN v.duration > 0 THEN LEAST(FLOOR(e.playhead / v.duration * 100)::int, 99)
        ELSE 0
      END AS bucket
    FROM events e
    JOIN videos v ON v.video_id = e.video_id
    WHERE e.video_id = ${videoId}
      AND e.event_type IN ('timeupdate', 'play', 'pause', 'ended')
      AND v.duration > 0
    ORDER BY e.session_id, bucket ASC
  `;

  // Also get seek buckets per session so we know where continuity breaks
  const seekRows = await sql`
    SELECT
      e.session_id,
      CASE
        WHEN v.duration > 0 THEN LEAST(FLOOR(e.playhead / v.duration * 100)::int, 99)
        ELSE 0
      END AS bucket
    FROM events e
    JOIN videos v ON v.video_id = e.video_id
    WHERE e.video_id = ${videoId}
      AND e.event_type = 'seeked'
      AND v.duration > 0
  `;

  // Build seek set per session
  const seekSets = {};
  seekRows.forEach(r => {
    if (!seekSets[r.session_id]) seekSets[r.session_id] = new Set();
    seekSets[r.session_id].add(r.bucket);
  });

  // Group buckets by session, then gap-fill between consecutive hits
  const sessionBuckets = {};
  rows.forEach(r => {
    if (!sessionBuckets[r.session_id]) sessionBuckets[r.session_id] = new Set();
    sessionBuckets[r.session_id].add(r.bucket);
  });

  // Gap-fill: if two watched buckets have only unwatched gaps between them
  // (no seek in between), assume continuous playback
  const filledBuckets = {};
  for (const [sessionId, buckets] of Object.entries(sessionBuckets)) {
    const sorted = [...buckets].sort((a, b) => a - b);
    const seeks = seekSets[sessionId] || new Set();
    const filled = new Set(sorted);

    for (let idx = 0; idx < sorted.length - 1; idx++) {
      const from = sorted[idx];
      const to = sorted[idx + 1];
      // Only fill if gap is reasonable (not a massive jump) and no seek in between
      if (to - from <= 10) {
        let hasSeek = false;
        for (let b = from + 1; b < to; b++) {
          if (seeks.has(b)) { hasSeek = true; break; }
        }
        if (!hasSeek) {
          for (let b = from + 1; b < to; b++) filled.add(b);
        }
      }
    }
    filledBuckets[sessionId] = filled;
  }

  // Aggregate: count distinct sessions per bucket
  const bucketCounts = new Array(100).fill(0);
  for (const filled of Object.values(filledBuckets)) {
    for (const b of filled) {
      if (b >= 0 && b < 100) bucketCounts[b]++;
    }
  }

  const total = Object.keys(sessionBuckets).length || 1;

  const retention = [];
  for (let i = 0; i < 100; i++) {
    retention.push({
      bucket: i,
      viewers: bucketCounts[i],
      percent: Math.round((bucketCounts[i] / total) * 100),
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
  const { from, to } = dateFilter(params);
  const page = parseInt(params.get('page') || '1', 10);
  const limit = parseInt(params.get('limit') || '50', 10);
  const offset = (page - 1) * limit;

  let rows;
  let countResult;

  if (videoId && from && to) {
    countResult = await sql`SELECT COUNT(*)::int AS total FROM sessions WHERE video_id = ${videoId} AND started_at >= ${from} AND started_at <= ${to}`;
    rows = await sql`
      SELECT
        s.session_id, s.video_id, s.viewer_id, s.fingerprint_id, s.embed_url,
        s.started_at, s.ended_at, s.percent_watched, s.completed,
        s.identified_at, s.identified_via,
        v.title AS video_title, v.duration AS video_duration,
        (SELECT COUNT(*) FROM events e WHERE e.session_id = s.session_id AND e.event_type = 'texttrackchange')::int AS caption_events,
        (SELECT COUNT(*) FROM events e WHERE e.session_id = s.session_id AND e.event_type = 'seeked')::int AS seek_events,
        (SELECT COUNT(*) FROM events e WHERE e.session_id = s.session_id AND e.event_type = 'bufferstart')::int AS buffer_events
      FROM sessions s
      LEFT JOIN videos v ON v.video_id = s.video_id
      WHERE s.video_id = ${videoId} AND s.started_at >= ${from} AND s.started_at <= ${to}
      ORDER BY s.started_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (videoId) {
    countResult = await sql`SELECT COUNT(*)::int AS total FROM sessions WHERE video_id = ${videoId}`;
    rows = await sql`
      WITH session_page AS (
        SELECT session_id, video_id, viewer_id, fingerprint_id, embed_url,
               started_at, ended_at, percent_watched, completed,
               identified_at, identified_via
        FROM sessions
        WHERE video_id = ${videoId}
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
    `;
  } else if (from && to) {
    countResult = await sql`SELECT COUNT(*)::int AS total FROM sessions WHERE started_at >= ${from} AND started_at <= ${to}`;
    rows = await sql`
      SELECT
        s.session_id, s.video_id, s.viewer_id, s.fingerprint_id, s.embed_url,
        s.started_at, s.ended_at, s.percent_watched, s.completed,
        s.identified_at, s.identified_via,
        v.title AS video_title, v.duration AS video_duration,
        (SELECT COUNT(*) FROM events e WHERE e.session_id = s.session_id AND e.event_type = 'texttrackchange')::int AS caption_events,
        (SELECT COUNT(*) FROM events e WHERE e.session_id = s.session_id AND e.event_type = 'seeked')::int AS seek_events,
        (SELECT COUNT(*) FROM events e WHERE e.session_id = s.session_id AND e.event_type = 'bufferstart')::int AS buffer_events
      FROM sessions s
      LEFT JOIN videos v ON v.video_id = s.video_id
      WHERE s.started_at >= ${from} AND s.started_at <= ${to}
      ORDER BY s.started_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else {
    countResult = await sql`SELECT COUNT(*)::int AS total FROM sessions`;
    rows = await sql`
      WITH session_page AS (
        SELECT session_id, video_id, viewer_id, fingerprint_id, embed_url,
               started_at, ended_at, percent_watched, completed,
               identified_at, identified_via
        FROM sessions
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
  const { from, to } = dateFilter(params);

  // When date-filtered, we restrict to viewers who had sessions in the date range
  let rows;

  if (from && to) {
    // Filter viewers to those with sessions in the date range
    const statusClause = status === 'identified' ? 'AND vw.viewer_id IS NOT NULL'
      : status === 'anonymous' ? 'AND vw.viewer_id IS NULL'
      : '';

    // Since neon tagged templates don't support dynamic WHERE easily, branch by status
    if (status === 'identified') {
      rows = await sql`
        SELECT
          vw.fingerprint_id, vw.viewer_id, vw.identified_at, vw.identified_via,
          vw.first_seen, vw.last_seen, vw.total_sessions, vw.total_watch_mins,
          (SELECT COUNT(DISTINCT s.video_id) FROM sessions s WHERE s.fingerprint_id = vw.fingerprint_id AND s.started_at >= ${from} AND s.started_at <= ${to})::int AS unique_videos,
          COALESCE((SELECT ROUND(AVG(s.percent_watched)::numeric, 1) FROM sessions s WHERE s.fingerprint_id = vw.fingerprint_id AND s.started_at >= ${from} AND s.started_at <= ${to}), 0) AS avg_engagement,
          (SELECT COUNT(*) FROM events e WHERE e.fingerprint_id = vw.fingerprint_id AND e.event_type = 'texttrackchange' AND e.timestamp >= ${from} AND e.timestamp <= ${to})::int AS caption_events
        FROM viewers vw
        WHERE vw.viewer_id IS NOT NULL
          AND EXISTS (SELECT 1 FROM sessions s WHERE s.fingerprint_id = vw.fingerprint_id AND s.started_at >= ${from} AND s.started_at <= ${to})
        ORDER BY vw.last_seen DESC
      `;
    } else if (status === 'anonymous') {
      rows = await sql`
        SELECT
          vw.fingerprint_id, vw.viewer_id, vw.identified_at, vw.identified_via,
          vw.first_seen, vw.last_seen, vw.total_sessions, vw.total_watch_mins,
          (SELECT COUNT(DISTINCT s.video_id) FROM sessions s WHERE s.fingerprint_id = vw.fingerprint_id AND s.started_at >= ${from} AND s.started_at <= ${to})::int AS unique_videos,
          COALESCE((SELECT ROUND(AVG(s.percent_watched)::numeric, 1) FROM sessions s WHERE s.fingerprint_id = vw.fingerprint_id AND s.started_at >= ${from} AND s.started_at <= ${to}), 0) AS avg_engagement,
          (SELECT COUNT(*) FROM events e WHERE e.fingerprint_id = vw.fingerprint_id AND e.event_type = 'texttrackchange' AND e.timestamp >= ${from} AND e.timestamp <= ${to})::int AS caption_events
        FROM viewers vw
        WHERE vw.viewer_id IS NULL
          AND EXISTS (SELECT 1 FROM sessions s WHERE s.fingerprint_id = vw.fingerprint_id AND s.started_at >= ${from} AND s.started_at <= ${to})
        ORDER BY vw.last_seen DESC
      `;
    } else {
      rows = await sql`
        SELECT
          vw.fingerprint_id, vw.viewer_id, vw.identified_at, vw.identified_via,
          vw.first_seen, vw.last_seen, vw.total_sessions, vw.total_watch_mins,
          (SELECT COUNT(DISTINCT s.video_id) FROM sessions s WHERE s.fingerprint_id = vw.fingerprint_id AND s.started_at >= ${from} AND s.started_at <= ${to})::int AS unique_videos,
          COALESCE((SELECT ROUND(AVG(s.percent_watched)::numeric, 1) FROM sessions s WHERE s.fingerprint_id = vw.fingerprint_id AND s.started_at >= ${from} AND s.started_at <= ${to}), 0) AS avg_engagement,
          (SELECT COUNT(*) FROM events e WHERE e.fingerprint_id = vw.fingerprint_id AND e.event_type = 'texttrackchange' AND e.timestamp >= ${from} AND e.timestamp <= ${to})::int AS caption_events
        FROM viewers vw
        WHERE EXISTS (SELECT 1 FROM sessions s WHERE s.fingerprint_id = vw.fingerprint_id AND s.started_at >= ${from} AND s.started_at <= ${to})
        ORDER BY vw.last_seen DESC
      `;
    }

    const summary = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE viewer_id IS NOT NULL)::int AS identified,
        COUNT(*) FILTER (WHERE viewer_id IS NULL)::int AS anonymous,
        COALESCE(ROUND(AVG(
          (SELECT AVG(s.percent_watched) FROM sessions s WHERE s.fingerprint_id = vw.fingerprint_id AND s.started_at >= ${from} AND s.started_at <= ${to})
        )::numeric, 1), 0) AS avg_engagement
      FROM viewers vw
      WHERE EXISTS (SELECT 1 FROM sessions s WHERE s.fingerprint_id = vw.fingerprint_id AND s.started_at >= ${from} AND s.started_at <= ${to})
    `;

    return json({ summary: summary[0], viewers: rows });
  }

  // No date filter - original logic
  if (status === 'identified') {
    rows = await sql`
      WITH session_agg AS (
        SELECT
          fingerprint_id,
          COUNT(DISTINCT video_id)::int AS unique_videos,
          COALESCE(ROUND(AVG(percent_watched)::numeric, 1), 0) AS avg_engagement
        FROM sessions
        GROUP BY fingerprint_id
      ),
      caption_agg AS (
        SELECT
          fingerprint_id,
          COUNT(*)::int AS caption_events
        FROM events
        WHERE event_type = 'texttrackchange'
        GROUP BY fingerprint_id
      )
      SELECT
        vw.fingerprint_id, vw.viewer_id, vw.identified_at, vw.identified_via,
        vw.first_seen, vw.last_seen, vw.total_sessions, vw.total_watch_mins,
        COALESCE(sa.unique_videos, 0) AS unique_videos,
        COALESCE(sa.avg_engagement, 0) AS avg_engagement,
        COALESCE(ca.caption_events, 0) AS caption_events
      FROM viewers vw
      LEFT JOIN session_agg sa ON sa.fingerprint_id = vw.fingerprint_id
      LEFT JOIN caption_agg ca ON ca.fingerprint_id = vw.fingerprint_id
      WHERE vw.viewer_id IS NOT NULL
      ORDER BY vw.last_seen DESC
    `;
  } else if (status === 'anonymous') {
    rows = await sql`
      WITH session_agg AS (
        SELECT
          fingerprint_id,
          COUNT(DISTINCT video_id)::int AS unique_videos,
          COALESCE(ROUND(AVG(percent_watched)::numeric, 1), 0) AS avg_engagement
        FROM sessions
        GROUP BY fingerprint_id
      ),
      caption_agg AS (
        SELECT
          fingerprint_id,
          COUNT(*)::int AS caption_events
        FROM events
        WHERE event_type = 'texttrackchange'
        GROUP BY fingerprint_id
      )
      SELECT
        vw.fingerprint_id, vw.viewer_id, vw.identified_at, vw.identified_via,
        vw.first_seen, vw.last_seen, vw.total_sessions, vw.total_watch_mins,
        COALESCE(sa.unique_videos, 0) AS unique_videos,
        COALESCE(sa.avg_engagement, 0) AS avg_engagement,
        COALESCE(ca.caption_events, 0) AS caption_events
      FROM viewers vw
      LEFT JOIN session_agg sa ON sa.fingerprint_id = vw.fingerprint_id
      LEFT JOIN caption_agg ca ON ca.fingerprint_id = vw.fingerprint_id
      WHERE vw.viewer_id IS NULL
      ORDER BY vw.last_seen DESC
    `;
  } else {
    rows = await sql`
      WITH session_agg AS (
        SELECT
          fingerprint_id,
          COUNT(DISTINCT video_id)::int AS unique_videos,
          COALESCE(ROUND(AVG(percent_watched)::numeric, 1), 0) AS avg_engagement
        FROM sessions
        GROUP BY fingerprint_id
      ),
      caption_agg AS (
        SELECT
          fingerprint_id,
          COUNT(*)::int AS caption_events
        FROM events
        WHERE event_type = 'texttrackchange'
        GROUP BY fingerprint_id
      )
      SELECT
        vw.fingerprint_id, vw.viewer_id, vw.identified_at, vw.identified_via,
        vw.first_seen, vw.last_seen, vw.total_sessions, vw.total_watch_mins,
        COALESCE(sa.unique_videos, 0) AS unique_videos,
        COALESCE(sa.avg_engagement, 0) AS avg_engagement,
        COALESCE(ca.caption_events, 0) AS caption_events
      FROM viewers vw
      LEFT JOIN session_agg sa ON sa.fingerprint_id = vw.fingerprint_id
      LEFT JOIN caption_agg ca ON ca.fingerprint_id = vw.fingerprint_id
      ORDER BY vw.last_seen DESC
    `;
  }

  // Summary counts
  const summary = await sql`
    WITH viewer_engagement AS (
      SELECT
        fingerprint_id,
        AVG(percent_watched) AS avg_pw
      FROM sessions
      GROUP BY fingerprint_id
    )
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE vw.viewer_id IS NOT NULL)::int AS identified,
      COUNT(*) FILTER (WHERE vw.viewer_id IS NULL)::int AS anonymous,
      COALESCE(ROUND(AVG(ve.avg_pw)::numeric, 1), 0) AS avg_engagement
    FROM viewers vw
    LEFT JOIN viewer_engagement ve ON ve.fingerprint_id = vw.fingerprint_id
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
    WITH viewer_sessions AS (
      SELECT session_id, video_id, started_at, ended_at,
             percent_watched, completed, embed_url,
             identified_at, identified_via
      FROM sessions
      WHERE fingerprint_id = ${fingerprintId}
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
// GET /api/analytics/live-events
// ---------------------------------------------------------------------------

async function handleLiveEvents(sql) {
  const rows = await sql`
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
  `;

  return json(rows);
}

// ---------------------------------------------------------------------------
// GET /api/analytics/live-events/:id
// ---------------------------------------------------------------------------

async function handleLiveEventDetail(videoId, sql) {
  // A. Video metadata + aggregate stats
  const videoRows = await sql`
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
    WHERE v.video_id = ${videoId}
    GROUP BY v.video_id, v.title, v.duration, v.created_at, v.is_live
  `;

  if (videoRows.length === 0) {
    return json({ error: 'Live event not found' }, 404);
  }

  // B. Active viewers with real-time session metrics
  const activeViewers = await sql`
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
    WHERE s.video_id = ${videoId}
      AND latest.timestamp >= NOW() - INTERVAL '30 seconds'
      AND (v.duration = 0 OR v.duration IS NULL
           OR ABS(COALESCE((latest.payload->>'duration')::float, 0) - v.duration) > 1)
    ORDER BY COALESCE(s.viewer_id, s.fingerprint_id), latest.timestamp DESC
  `;

  // C. All sessions for this video
  const sessions = await sql`
    WITH video_sessions AS (
      SELECT session_id, video_id, viewer_id, fingerprint_id, embed_url,
             started_at, ended_at, percent_watched, completed
      FROM sessions
      WHERE video_id = ${videoId}
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
  `;

  return json({
    video: videoRows[0],
    active_viewers: activeViewers,
    sessions,
  });
}

// ---------------------------------------------------------------------------
// GET /api/analytics/caption-languages
// ---------------------------------------------------------------------------

async function handleCaptionLanguages(sql) {
  const rows = await sql`
    SELECT
      COALESCE(payload->>'language', 'unknown') AS language,
      COALESCE(payload->>'label', payload->>'language', 'Unknown') AS label,
      COUNT(*)::int AS events,
      COUNT(DISTINCT session_id)::int AS sessions
    FROM events
    WHERE event_type = 'texttrackchange'
      AND payload->>'kind' IS NOT NULL
      AND payload->>'language' IS NOT NULL
      AND payload->>'language' != ''
    GROUP BY payload->>'language', payload->>'label'
    ORDER BY sessions DESC
  `;

  return json(rows);
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
