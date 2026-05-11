import {
  listSessionsSql,
  countSessionsSql,
  getSessionDetailSql,
} from '../queries/sessions.js';
import {
  listViewersSql,
  getViewersSummarySql,
  getViewerDetailSql,
} from '../queries/viewers.js';
import { listVideosSql } from '../queries/videos.js';
import {
  getSummarySql,
  getDailySql,
  getQualityDistributionSql,
} from '../queries/overview.js';
import { run, runMany } from '../queries/_execute.js';

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
  const filters = {};
  if (from && to) filters.dateRange = { from, to };

  const [rows, deep, bufferResult] = await runMany(sql, getSummarySql(filters));

  return json({ ...rows[0], ...deep[0], buffer_rate: bufferResult[0]?.buffer_rate ?? 0 });
}

// ---------------------------------------------------------------------------
// GET /api/analytics/daily
// ---------------------------------------------------------------------------

async function handleDaily(params, sql) {
  const { from, to } = dateFilter(params);
  const filters = {};
  if (from && to) filters.dateRange = { from, to };

  const rows = await run(sql, getDailySql(filters));
  return json(rows);
}

// ---------------------------------------------------------------------------
// GET /api/analytics/videos
// ---------------------------------------------------------------------------

async function handleVideos(params, sql) {
  const { from, to } = dateFilter(params);
  const filters = {};
  if (from && to) filters.dateRange = { from, to };

  const rows = await run(sql, listVideosSql(filters));
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
  const filters = {};
  if (videoId) filters.videoId = videoId;

  const rows = await run(sql, getQualityDistributionSql(filters));
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

  const filters = { limit, offset };
  if (videoId) filters.videoId = videoId;
  if (from && to) filters.dateRange = { from, to };

  const [rows, countResult] = await runMany(sql, [
    listSessionsSql(filters),
    countSessionsSql(filters),
  ]);

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
  const [sessionRows, events] = await runMany(sql, getSessionDetailSql(sessionId));

  if (sessionRows.length === 0) {
    return json({ error: 'Session not found' }, 404);
  }

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

  const filters = { status };
  if (from && to) filters.dateRange = { from, to };

  const [rows, summary] = await runMany(sql, [
    listViewersSql(filters),
    getViewersSummarySql(filters),
  ]);

  return json({
    summary: summary[0],
    viewers: rows,
  });
}

// ---------------------------------------------------------------------------
// GET /api/analytics/viewers/:fp
// ---------------------------------------------------------------------------

async function handleViewerDetail(fingerprintId, sql) {
  const [viewerRows, sessions, videos, events] = await runMany(
    sql,
    getViewerDetailSql(fingerprintId),
  );

  if (viewerRows.length === 0) {
    return json({ error: 'Viewer not found' }, 404);
  }

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
