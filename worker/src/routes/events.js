import {
  computeSessionMetrics,
  insertEventSql,
  upsertSessionSql,
  upsertViewerSql,
  upsertVideoSql,
  getVideoTitleSql,
  fetchVideoTitle,
  attributeSessionsSql,
  attributeEventsSql,
  attributeViewerSql,
} from '../queries/ingest.js';
import { run } from '../queries/_execute.js';

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

export async function handleEvents(request, sql, { oembed = globalThis.fetch } = {}) {
  const event = await request.json();

  const errors = validateEvent(event);
  if (errors.length > 0) {
    return new Response(JSON.stringify({ error: 'Validation failed', details: errors }), { status: 400 });
  }

  // 1. event insert (idempotent if client supplied event_id)
  await run(sql, insertEventSql(event));

  // 2. session upsert; needs isNewSession for the viewer counter
  const metrics = computeSessionMetrics(event);
  const sessionResult = await run(sql, upsertSessionSql(event, metrics));
  const isNewSession = sessionResult[0]?.is_new_session ?? false;

  // 3. viewer upsert (only when we have a fingerprint)
  if (event.fingerprint_id) {
    await run(sql, upsertViewerSql(event, isNewSession, metrics));
  }

  // 4. video upsert — gated on having a usable duration OR being a live stream
  if (event.video_id && (metrics.effectiveDuration || event.is_live)) {
    const existing = await run(sql, getVideoTitleSql(event.video_id));
    let title = existing[0]?.title || null;
    if (!title) {
      title = await fetchVideoTitle(event.video_id, oembed);
    }
    await run(sql, upsertVideoSql(event, title, metrics.effectiveDuration));
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}

export async function handleIdentify(request, sql) {
  const { fingerprintId, viewerId, identifiedVia } = await request.json();

  if (!fingerprintId || !viewerId) {
    return new Response(JSON.stringify({ error: 'fingerprintId and viewerId required' }), { status: 400 });
  }

  // Step 1: attribute anonymous sessions to the now-known viewer
  const sessionResult = await run(sql, attributeSessionsSql(fingerprintId, viewerId, identifiedVia));

  // Step 2: backfill viewer_id on the events of those sessions (skip if none)
  if (sessionResult.length > 0) {
    const sessionIds = sessionResult.map(r => r.session_id);
    await run(sql, attributeEventsSql(sessionIds, viewerId));
  }

  // Step 3: mark the viewer profile itself as identified
  await run(sql, attributeViewerSql(fingerprintId, viewerId, identifiedVia));

  return new Response(JSON.stringify({
    ok: true,
    attributed_sessions: sessionResult.length,
  }), { status: 200 });
}
