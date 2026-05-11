import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listVideosSql } from './videos.js';

test('listVideosSql: no filters → all three CTEs unfiltered, no params', () => {
  const { sql, params } = listVideosSql();
  assert.ok(sql.includes('WITH session_stats AS'));
  assert.ok(sql.includes('event_stats AS'));
  assert.ok(sql.includes('buffer_stats AS'));
  assert.ok(!sql.includes('started_at >='));
  assert.ok(!sql.includes('timestamp >='));
  assert.deepEqual(params, []);
});

test('listVideosSql: dateRange threads through all three CTEs', () => {
  const { sql, params } = listVideosSql({
    dateRange: { from: '2026-01-01', to: '2026-02-01' },
  });
  assert.ok(sql.includes('FROM sessions WHERE started_at >= $1 AND started_at <= $2'));
  assert.ok(sql.includes('FROM events WHERE timestamp >= $1 AND timestamp <= $2'));
  assert.ok(sql.includes("event_type = 'bufferend' AND timestamp >= $1 AND timestamp <= $2"));
  assert.deepEqual(params, ['2026-01-01', '2026-02-01']);
});

test('listVideosSql: row column set is stable', () => {
  const { sql } = listVideosSql();
  for (const col of [
    'ss.video_id',
    'v.title',
    'v.duration',
    'ss.views',
    'ss.unique_viewers',
    'ss.avg_percent_watched',
    'ss.finishes',
    'AS caption_adoption',
    'AS seek_events',
    'AS buffer_rate',
  ]) {
    assert.ok(sql.includes(col), `column missing: ${col}`);
  }
});

test('listVideosSql: ORDER BY ss.views DESC in both variants', () => {
  for (const v of [{}, { dateRange: { from: 'a', to: 'b' } }]) {
    const { sql } = listVideosSql(v);
    assert.ok(sql.includes('ORDER BY ss.views DESC'), JSON.stringify(v));
  }
});

test('listVideosSql: CTE invariant — no correlated subqueries', () => {
  for (const v of [{}, { dateRange: { from: 'a', to: 'b' } }]) {
    const { sql } = listVideosSql(v);
    assert.ok(sql.includes('WITH session_stats AS'));
    assert.ok(
      !sql.includes('FROM sessions s WHERE s.video_id = '),
      'no correlated subquery N+1 pattern',
    );
  }
});
