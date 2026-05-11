import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getSummarySql,
  getDailySql,
  getQualityDistributionSql,
} from './overview.js';

// ---------------------------------------------------------------------------
// getSummarySql
// ---------------------------------------------------------------------------

test('getSummarySql: returns tuple of three queries', () => {
  const tuple = getSummarySql();
  assert.equal(tuple.length, 3);
  for (const q of tuple) {
    assert.ok(q.sql);
    assert.ok(Array.isArray(q.params));
  }
});

test('getSummarySql: no filters → no WHERE clauses, empty params', () => {
  const [standard, deep, buffer] = getSummarySql();
  assert.ok(!standard.sql.includes('started_at >='));
  assert.ok(!deep.sql.includes('timestamp >='));
  assert.ok(!buffer.sql.includes('timestamp >='));
  assert.deepEqual(standard.params, []);
  assert.deepEqual(deep.params, []);
  assert.deepEqual(buffer.params, []);
});

test('getSummarySql: dateRange threads through all three queries', () => {
  const [standard, deep, buffer] = getSummarySql({
    dateRange: { from: '2026-01-01', to: '2026-02-01' },
  });
  assert.ok(standard.sql.includes('WHERE s.started_at >= $1 AND s.started_at <= $2'));
  assert.deepEqual(standard.params, ['2026-01-01', '2026-02-01']);

  assert.ok(deep.sql.includes('WHERE timestamp >= $1 AND timestamp <= $2'));
  assert.deepEqual(deep.params, ['2026-01-01', '2026-02-01']);

  // buffer query has two date predicates (events sub + sessions sub)
  assert.ok(buffer.sql.includes("event_type = 'bufferend' AND timestamp >= $1 AND timestamp <= $2"));
  assert.ok(buffer.sql.includes('FROM sessions WHERE started_at >= $1 AND started_at <= $2'));
  assert.deepEqual(buffer.params, ['2026-01-01', '2026-02-01']);
});

test('getSummarySql: standard query exposes all four KPI columns', () => {
  const [standard] = getSummarySql();
  for (const col of ['total_views', 'unique_viewers', 'total_watch_mins', 'avg_percent_watched']) {
    assert.ok(standard.sql.includes(col), `column missing: ${col}`);
  }
});

test('getSummarySql: deep query exposes caption_adoption / seek_events / quality_changes', () => {
  const [, deep] = getSummarySql();
  for (const col of ['caption_adoption', 'seek_events', 'quality_changes']) {
    assert.ok(deep.sql.includes(col), `column missing: ${col}`);
  }
});

test('getSummarySql: buffer query exposes buffer_rate', () => {
  const [, , buffer] = getSummarySql();
  assert.ok(buffer.sql.includes('AS buffer_rate'));
});

test('getSummarySql: each query has its own param array', () => {
  const tuple = getSummarySql({ dateRange: { from: 'a', to: 'b' } });
  for (let i = 0; i < tuple.length; i++) {
    for (let j = i + 1; j < tuple.length; j++) {
      assert.notEqual(tuple[i].params, tuple[j].params, `tuple[${i}] vs tuple[${j}]`);
    }
  }
});

// ---------------------------------------------------------------------------
// getDailySql
// ---------------------------------------------------------------------------

test('getDailySql: no filters → CTEs unfiltered, no params', () => {
  const { sql, params } = getDailySql();
  assert.ok(sql.includes('WITH daily_sessions AS'));
  assert.ok(sql.includes('daily_events AS'));
  assert.ok(!sql.includes('started_at >='));
  assert.ok(!sql.includes('timestamp >='));
  assert.deepEqual(params, []);
});

test('getDailySql: dateRange filters both CTEs', () => {
  const { sql, params } = getDailySql({
    dateRange: { from: '2026-01-01', to: '2026-02-01' },
  });
  assert.ok(sql.includes('FROM sessions WHERE started_at >= $1 AND started_at <= $2'));
  assert.ok(sql.includes('FROM events WHERE timestamp >= $1 AND timestamp <= $2'));
  assert.deepEqual(params, ['2026-01-01', '2026-02-01']);
});

test('getDailySql: ORDER BY date ASC in both variants', () => {
  for (const v of [{}, { dateRange: { from: 'a', to: 'b' } }]) {
    const { sql } = getDailySql(v);
    assert.ok(sql.includes('ORDER BY ds.date ASC'), JSON.stringify(v));
  }
});

// ---------------------------------------------------------------------------
// getQualityDistributionSql
// ---------------------------------------------------------------------------

test('getQualityDistributionSql: no filters', () => {
  const { sql, params } = getQualityDistributionSql();
  assert.ok(sql.includes("WHERE event_type = 'qualitychange'"));
  assert.ok(!sql.includes('video_id ='));
  assert.deepEqual(params, []);
});

test('getQualityDistributionSql: videoId narrows to one video', () => {
  const { sql, params } = getQualityDistributionSql({ videoId: 'v123' });
  assert.ok(sql.includes('AND video_id = $1'));
  assert.deepEqual(params, ['v123']);
});

test('getQualityDistributionSql: ORDER BY count DESC always present', () => {
  for (const v of [{}, { videoId: 'v123' }]) {
    const { sql } = getQualityDistributionSql(v);
    assert.ok(sql.includes('ORDER BY count DESC'), JSON.stringify(v));
  }
});
