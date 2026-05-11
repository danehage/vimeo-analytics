import { test } from 'node:test';
import assert from 'node:assert/strict';
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
} from './ingest.js';

// ---------------------------------------------------------------------------
// computeSessionMetrics — pure logic, table-driven
// ---------------------------------------------------------------------------

test('computeSessionMetrics: half-watched normal video', () => {
  const m = computeSessionMetrics({ playhead: 50, video_duration: 100, event_type: 'timeupdate' });
  assert.equal(m.effectiveDuration, 100);
  assert.equal(m.percentWatched, 50);
  assert.equal(m.completed, false);
  assert.equal(m.watchMins, 0);
});

test('computeSessionMetrics: percent_watched capped at 100', () => {
  const m = computeSessionMetrics({ playhead: 250, video_duration: 100, event_type: 'timeupdate' });
  assert.equal(m.percentWatched, 100);
});

test('computeSessionMetrics: ≥95% triggers completed', () => {
  const m = computeSessionMetrics({ playhead: 95, video_duration: 100, event_type: 'timeupdate' });
  assert.equal(m.completed, true);
});

test('computeSessionMetrics: ended event always completed even mid-playhead', () => {
  const m = computeSessionMetrics({ playhead: 30, video_duration: 100, event_type: 'ended' });
  assert.equal(m.completed, true);
});

test('computeSessionMetrics: live stream uses payload.duration fallback', () => {
  const m = computeSessionMetrics({
    playhead: 30,
    video_duration: 0,
    event_type: 'timeupdate',
    payload: { duration: 60 },
  });
  assert.equal(m.effectiveDuration, 60);
  assert.equal(m.percentWatched, 50);
});

test('computeSessionMetrics: no duration anywhere → percent 0, not completed', () => {
  const m = computeSessionMetrics({ playhead: 30, video_duration: 0, event_type: 'timeupdate', payload: {} });
  assert.equal(m.effectiveDuration, 0);
  assert.equal(m.percentWatched, 0);
  assert.equal(m.completed, false);
});

test('computeSessionMetrics: watchMins non-zero only on session_end', () => {
  const a = computeSessionMetrics({ playhead: 300, video_duration: 600, event_type: 'timeupdate' });
  assert.equal(a.watchMins, 0);
  const b = computeSessionMetrics({ playhead: 300, video_duration: 600, event_type: 'session_end' });
  assert.equal(b.watchMins, 5);
});

test('computeSessionMetrics: session_end with playhead 0 contributes nothing', () => {
  const m = computeSessionMetrics({ playhead: 0, video_duration: 100, event_type: 'session_end' });
  assert.equal(m.watchMins, 0);
});

test('computeSessionMetrics: missing payload safely defaults', () => {
  const m = computeSessionMetrics({ playhead: 0, video_duration: 0, event_type: 'play' });
  assert.equal(m.effectiveDuration, 0);
});

// ---------------------------------------------------------------------------
// insertEventSql
// ---------------------------------------------------------------------------

const baseEvent = {
  event_id: '11111111-2222-3333-4444-555555555555',
  session_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  video_id: 'v123',
  viewer_id: null,
  fingerprint_id: 'fp_abc',
  embed_url: 'https://example.com/page',
  event_type: 'play',
  playhead: 0,
  timestamp: '2026-05-11T12:00:00Z',
  video_duration: 100,
  is_live: false,
  payload: { seconds: 0, duration: 100 },
};

test('insertEventSql: with event_id uses ON CONFLICT DO NOTHING', () => {
  const { sql, params } = insertEventSql(baseEvent);
  assert.ok(sql.includes('INSERT INTO events (event_id'));
  assert.ok(sql.includes('ON CONFLICT (event_id) DO NOTHING'));
  assert.equal(params[0], baseEvent.event_id);
});

test('insertEventSql: without event_id omits ON CONFLICT', () => {
  const event = { ...baseEvent, event_id: undefined };
  const { sql, params } = insertEventSql(event);
  assert.ok(!sql.includes('ON CONFLICT'));
  assert.ok(!sql.includes('event_id,'));
  assert.equal(params[0], event.session_id);
});

test('insertEventSql: payload is serialized as JSON string', () => {
  const { params } = insertEventSql(baseEvent);
  const payloadParam = params[params.length - 1];
  assert.equal(typeof payloadParam, 'string');
  assert.deepEqual(JSON.parse(payloadParam), baseEvent.payload);
});

// ---------------------------------------------------------------------------
// upsertSessionSql
// ---------------------------------------------------------------------------

test('upsertSessionSql: returns is_new_session via xmax', () => {
  const metrics = computeSessionMetrics(baseEvent);
  const { sql } = upsertSessionSql(baseEvent, metrics);
  assert.ok(sql.includes('RETURNING (xmax = 0) AS is_new_session'));
});

test('upsertSessionSql: percent_watched only ever increases (GREATEST)', () => {
  const metrics = computeSessionMetrics(baseEvent);
  const { sql } = upsertSessionSql(baseEvent, metrics);
  assert.ok(sql.includes('GREATEST(sessions.percent_watched'));
});

test('upsertSessionSql: completed flag never regresses (OR)', () => {
  const metrics = computeSessionMetrics(baseEvent);
  const { sql } = upsertSessionSql(baseEvent, metrics);
  assert.ok(sql.includes('completed = sessions.completed OR'));
});

test('upsertSessionSql: viewer_id preserved via COALESCE when incoming is null', () => {
  const metrics = computeSessionMetrics(baseEvent);
  const { sql } = upsertSessionSql(baseEvent, metrics);
  assert.ok(sql.includes('viewer_id = COALESCE('));
});

// ---------------------------------------------------------------------------
// upsertViewerSql
// ---------------------------------------------------------------------------

test('upsertViewerSql: total_sessions increments only when isNewSession=true', () => {
  const metrics = computeSessionMetrics(baseEvent);
  const { sql, params } = upsertViewerSql(baseEvent, true, metrics);
  assert.ok(sql.includes('CASE WHEN'));
  assert.ok(sql.includes('THEN 1 ELSE 0 END'));
  assert.ok(params.includes(true));
});

test('upsertViewerSql: accumulates total_watch_mins', () => {
  const metrics = computeSessionMetrics({ ...baseEvent, event_type: 'session_end', playhead: 600 });
  const { sql, params } = upsertViewerSql(baseEvent, false, metrics);
  assert.ok(sql.includes('total_watch_mins = viewers.total_watch_mins +'));
  assert.equal(metrics.watchMins, 10);
  assert.ok(params.includes(10));
});

// ---------------------------------------------------------------------------
// upsertVideoSql
// ---------------------------------------------------------------------------

test('upsertVideoSql: preserves existing title via NULLIF + COALESCE', () => {
  const { sql } = upsertVideoSql(baseEvent, null, 100);
  assert.ok(sql.includes('title = COALESCE(NULLIF('));
});

test('upsertVideoSql: duration never regresses (GREATEST)', () => {
  const { sql } = upsertVideoSql(baseEvent, 'Title', 100);
  assert.ok(sql.includes('duration = GREATEST(COALESCE(NULLIF('));
});

test('upsertVideoSql: is_live latches on (OR)', () => {
  const { sql, params } = upsertVideoSql({ ...baseEvent, is_live: true }, null, 0);
  assert.ok(sql.includes('is_live = videos.is_live OR'));
  assert.ok(params.includes(true));
});

// ---------------------------------------------------------------------------
// getVideoTitleSql
// ---------------------------------------------------------------------------

test('getVideoTitleSql: parameterised by videoId', () => {
  const { sql, params } = getVideoTitleSql('v123');
  assert.equal(sql, 'SELECT title FROM videos WHERE video_id = $1');
  assert.deepEqual(params, ['v123']);
});

// ---------------------------------------------------------------------------
// fetchVideoTitle — injected fetcher
// ---------------------------------------------------------------------------

test('fetchVideoTitle: returns title on 200', async () => {
  const fakeFetcher = async () => ({
    ok: true,
    json: async () => ({ title: 'My Video' }),
  });
  const title = await fetchVideoTitle('v123', fakeFetcher);
  assert.equal(title, 'My Video');
});

test('fetchVideoTitle: returns null on non-ok response', async () => {
  const fakeFetcher = async () => ({ ok: false });
  const title = await fetchVideoTitle('v123', fakeFetcher);
  assert.equal(title, null);
});

test('fetchVideoTitle: returns null when fetcher throws', async () => {
  const fakeFetcher = async () => { throw new Error('network down'); };
  const title = await fetchVideoTitle('v123', fakeFetcher);
  assert.equal(title, null);
});

test('fetchVideoTitle: returns null when title field absent', async () => {
  const fakeFetcher = async () => ({ ok: true, json: async () => ({}) });
  const title = await fetchVideoTitle('v123', fakeFetcher);
  assert.equal(title, null);
});

// ---------------------------------------------------------------------------
// Identity attribution
// ---------------------------------------------------------------------------

test('attributeSessionsSql: updates only anonymous sessions for the fingerprint', () => {
  const { sql, params } = attributeSessionsSql('fp_abc', 'user@example.com', 'login');
  assert.ok(sql.includes('UPDATE sessions'));
  assert.ok(sql.includes('viewer_id IS NULL'));
  assert.ok(sql.includes('identified_at = NOW()'));
  assert.ok(sql.includes('RETURNING session_id'));
  assert.deepEqual(params, ['user@example.com', 'login', 'fp_abc']);
});

test('attributeEventsSql: ANY array binding for session_ids', () => {
  const { sql, params } = attributeEventsSql(['s1', 's2', 's3'], 'user@example.com');
  assert.ok(sql.includes('UPDATE events SET viewer_id'));
  assert.ok(sql.includes('WHERE session_id = ANY('));
  assert.deepEqual(params, ['user@example.com', ['s1', 's2', 's3']]);
});

test('attributeViewerSql: updates by fingerprint, sets identified_at and via', () => {
  const { sql, params } = attributeViewerSql('fp_abc', 'user@example.com', 'login');
  assert.ok(sql.includes('UPDATE viewers'));
  assert.ok(sql.includes('identified_at = NOW()'));
  assert.deepEqual(params, ['user@example.com', 'login', 'fp_abc']);
});
