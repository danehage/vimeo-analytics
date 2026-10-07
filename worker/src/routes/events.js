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
// Viewer IDs come from host pages (usually an email). Must start with a
// letter/digit — the UI derives avatar initials from the first character.
const VIEWER_ID_REGEX = /^[a-z0-9][^\s<>]{0,253}$/i;

export const isValidViewerId = (v) => typeof v === 'string' && VIEWER_ID_REGEX.test(v);

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

const badRequest = (body) => new Response(JSON.stringify(body), { status: 400 });

export function validateEvent(body) {
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
  if (body.viewer_id != null && !isValidViewerId(body.viewer_id)) {
    errors.push('viewer_id must be a string under 255 characters starting with a letter or digit');
  }
  if (body.event_id != null && !UUID_REGEX.test(body.event_id)) {
    errors.push('event_id must be a valid UUID');
  }

  return errors;
}

export async function handleEvents(request, sql, { oembed = globalThis.fetch } = {}) {
  const event = await readJson(request);
  if (!event || typeof event !== 'object') return badRequest({ error: 'Body must be a JSON object' });

  const errors = validateEvent(event);
  if (errors.length > 0) {
    return badRequest({ error: 'Validation failed', details: errors });
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
  const { fingerprintId, viewerId, identifiedVia } = (await readJson(request)) || {};

  if (typeof fingerprintId !== 'string' || !fingerprintId || fingerprintId.length > 50 || !isValidViewerId(viewerId)) {
    return badRequest({ error: 'fingerprintId and a valid viewerId are required' });
  }
  if (identifiedVia != null && (typeof identifiedVia !== 'string' || identifiedVia.length > 100)) {
    return badRequest({ error: 'identifiedVia must be a string under 100 characters' });
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
