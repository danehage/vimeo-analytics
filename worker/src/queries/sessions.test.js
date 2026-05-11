import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  listSessionsSql,
  countSessionsSql,
  getSessionDetailSql,
} from './sessions.js';

// Composer normalises whitespace (trim + collapse). Mirror that in fixtures.
const norm = (s) => s.trim().replace(/\s+/g, ' ');

// ---------------------------------------------------------------------------
// listSessionsSql
// ---------------------------------------------------------------------------

test('listSessionsSql: no filters → no WHERE, default LIMIT 50 OFFSET 0', () => {
  const { sql, params } = listSessionsSql();
  assert.ok(sql.startsWith('WITH session_page AS'), 'CTE shape always present');
  assert.ok(!sql.includes('WHERE video_id'), 'no videoId predicate');
  assert.ok(!sql.includes('started_at >='), 'no date predicate');
  assert.ok(sql.includes('LIMIT $1 OFFSET $2'), 'limit/offset are $1/$2');
  assert.deepEqual(params, [50, 0]);
});

test('listSessionsSql: videoId only', () => {
  const { sql, params } = listSessionsSql({ videoId: 'v123' });
  assert.ok(sql.includes('WHERE video_id = $1'));
  assert.ok(sql.includes('LIMIT $2 OFFSET $3'));
  assert.deepEqual(params, ['v123', 50, 0]);
});

test('listSessionsSql: dateRange only', () => {
  const { sql, params } = listSessionsSql({
    dateRange: { from: '2026-01-01', to: '2026-02-01' },
  });
  assert.ok(sql.includes('WHERE started_at >= $1 AND started_at <= $2'));
  assert.ok(sql.includes('LIMIT $3 OFFSET $4'));
  assert.deepEqual(params, ['2026-01-01', '2026-02-01', 50, 0]);
});

test('listSessionsSql: videoId + dateRange', () => {
  const { sql, params } = listSessionsSql({
    videoId: 'v123',
    dateRange: { from: '2026-01-01', to: '2026-02-01' },
  });
  assert.ok(
    sql.includes('WHERE video_id = $1 AND started_at >= $2 AND started_at <= $3'),
  );
  assert.ok(sql.includes('LIMIT $4 OFFSET $5'));
  assert.deepEqual(params, ['v123', '2026-01-01', '2026-02-01', 50, 0]);
});

test('listSessionsSql: custom limit/offset', () => {
  const { params } = listSessionsSql({ limit: 10, offset: 20 });
  assert.deepEqual(params, [10, 20]);
});

test('listSessionsSql: CTE invariant — always uses session_page + event_counts', () => {
  const variants = [
    {},
    { videoId: 'v1' },
    { dateRange: { from: 'a', to: 'b' } },
    { videoId: 'v1', dateRange: { from: 'a', to: 'b' } },
    { videoId: 'v1', limit: 5, offset: 0 },
  ];
  for (const v of variants) {
    const { sql } = listSessionsSql(v);
    assert.ok(sql.includes('WITH session_page AS'), `session_page CTE for ${JSON.stringify(v)}`);
    assert.ok(sql.includes('event_counts AS'), `event_counts CTE for ${JSON.stringify(v)}`);
    assert.ok(
      !sql.includes("FROM events e WHERE e.session_id = s.session_id"),
      'no correlated subquery N+1 pattern',
    );
  }
});

test('listSessionsSql: row column set is stable', () => {
  const { sql } = listSessionsSql();
  for (const col of [
    's.session_id',
    's.video_id',
    's.viewer_id',
    's.fingerprint_id',
    's.embed_url',
    's.started_at',
    's.ended_at',
    's.percent_watched',
    's.completed',
    's.identified_at',
    's.identified_via',
    'v.title AS video_title',
    'v.duration AS video_duration',
    'COALESCE(ec.caption_events, 0) AS caption_events',
    'COALESCE(ec.seek_events, 0) AS seek_events',
    'COALESCE(ec.buffer_events, 0) AS buffer_events',
  ]) {
    assert.ok(sql.includes(col), `column missing: ${col}`);
  }
});

test('listSessionsSql: injection probe', () => {
  const { sql, params } = listSessionsSql({ videoId: "'; DROP TABLE sessions; --" });
  assert.ok(!sql.includes('DROP TABLE'));
  assert.equal(params[0], "'; DROP TABLE sessions; --");
});

// ---------------------------------------------------------------------------
// countSessionsSql
// ---------------------------------------------------------------------------

test('countSessionsSql: no filters', () => {
  const { sql, params } = countSessionsSql();
  assert.equal(sql, norm('SELECT COUNT(*)::int AS total FROM sessions'));
  assert.deepEqual(params, []);
});

test('countSessionsSql: videoId', () => {
  const { sql, params } = countSessionsSql({ videoId: 'v123' });
  assert.equal(
    sql,
    norm('SELECT COUNT(*)::int AS total FROM sessions WHERE video_id = $1'),
  );
  assert.deepEqual(params, ['v123']);
});

test('countSessionsSql: dateRange', () => {
  const { sql, params } = countSessionsSql({
    dateRange: { from: '2026-01-01', to: '2026-02-01' },
  });
  assert.equal(
    sql,
    norm(
      'SELECT COUNT(*)::int AS total FROM sessions WHERE started_at >= $1 AND started_at <= $2',
    ),
  );
  assert.deepEqual(params, ['2026-01-01', '2026-02-01']);
});

test('countSessionsSql: filter shape mirrors listSessionsSql', () => {
  const filters = {
    videoId: 'v1',
    dateRange: { from: 'a', to: 'b' },
  };
  const listParams = listSessionsSql(filters).params.slice(0, 3);
  const countParams = countSessionsSql(filters).params;
  assert.deepEqual(listParams, countParams);
});

// ---------------------------------------------------------------------------
// getSessionDetailSql
// ---------------------------------------------------------------------------

test('getSessionDetailSql: returns a tuple of two queries', () => {
  const result = getSessionDetailSql('abc-123');
  assert.equal(result.length, 2);
  assert.ok(result[0].sql);
  assert.ok(result[1].sql);
});

test('getSessionDetailSql: first query selects session header by id', () => {
  const [header] = getSessionDetailSql('abc-123');
  assert.ok(header.sql.includes('WHERE s.session_id = $1'));
  assert.ok(header.sql.includes('LEFT JOIN videos v'));
  assert.deepEqual(header.params, ['abc-123']);
});

test('getSessionDetailSql: second query selects events ordered by timestamp', () => {
  const [, events] = getSessionDetailSql('abc-123');
  assert.ok(events.sql.includes('FROM events'));
  assert.ok(events.sql.includes('WHERE session_id = $1'));
  assert.ok(events.sql.includes('ORDER BY timestamp ASC'));
  assert.deepEqual(events.params, ['abc-123']);
});

test('getSessionDetailSql: each query has its own param array', () => {
  const [header, events] = getSessionDetailSql('abc-123');
  assert.notEqual(header.params, events.params, 'distinct param arrays');
});
