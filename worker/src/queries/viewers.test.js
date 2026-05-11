import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  listViewersSql,
  getViewersSummarySql,
  getViewerDetailSql,
} from './viewers.js';

// ---------------------------------------------------------------------------
// listViewersSql
// ---------------------------------------------------------------------------

test('listViewersSql: no filters → LEFT JOIN, no status predicate, no params', () => {
  const { sql, params } = listViewersSql();
  assert.ok(sql.includes('WITH session_agg AS'));
  assert.ok(sql.includes('caption_agg AS'));
  assert.ok(sql.includes('LEFT JOIN session_agg sa'));
  assert.ok(!sql.includes('INNER JOIN session_agg'));
  assert.ok(!sql.includes('viewer_id IS NOT NULL'));
  assert.ok(!sql.includes('viewer_id IS NULL'));
  assert.ok(!sql.includes('started_at >='));
  assert.ok(!sql.includes('timestamp >='));
  assert.deepEqual(params, []);
});

test('listViewersSql: status=identified', () => {
  const { sql, params } = listViewersSql({ status: 'identified' });
  assert.ok(sql.includes('WHERE vw.viewer_id IS NOT NULL'));
  assert.ok(sql.includes('LEFT JOIN session_agg sa'));
  assert.deepEqual(params, []);
});

test('listViewersSql: status=anonymous', () => {
  const { sql, params } = listViewersSql({ status: 'anonymous' });
  assert.ok(sql.includes('WHERE vw.viewer_id IS NULL'));
  assert.deepEqual(params, []);
});

test('listViewersSql: status=all → no status predicate', () => {
  const { sql } = listViewersSql({ status: 'all' });
  assert.ok(!sql.includes('vw.viewer_id IS NOT NULL'));
  assert.ok(!sql.includes('vw.viewer_id IS NULL'));
});

test('listViewersSql: dateRange only → INNER JOIN, both CTEs date-filtered', () => {
  const { sql, params } = listViewersSql({
    dateRange: { from: '2026-01-01', to: '2026-02-01' },
  });
  assert.ok(sql.includes('INNER JOIN session_agg sa'));
  assert.ok(sql.includes('started_at >= $1 AND started_at <= $2'));
  assert.ok(sql.includes("event_type = 'texttrackchange' AND timestamp >= $1 AND timestamp <= $2"));
  assert.deepEqual(params, ['2026-01-01', '2026-02-01']);
});

test('listViewersSql: status + dateRange combined', () => {
  const { sql, params } = listViewersSql({
    status: 'identified',
    dateRange: { from: '2026-01-01', to: '2026-02-01' },
  });
  assert.ok(sql.includes('INNER JOIN session_agg sa'));
  assert.ok(sql.includes('WHERE vw.viewer_id IS NOT NULL'));
  assert.ok(sql.includes('started_at >= $1 AND started_at <= $2'));
  assert.deepEqual(params, ['2026-01-01', '2026-02-01']);
});

test('listViewersSql: CTE invariant — no correlated subqueries across all variants', () => {
  const variants = [
    {},
    { status: 'identified' },
    { status: 'anonymous' },
    { status: 'all' },
    { dateRange: { from: 'a', to: 'b' } },
    { status: 'identified', dateRange: { from: 'a', to: 'b' } },
    { status: 'anonymous', dateRange: { from: 'a', to: 'b' } },
  ];
  for (const v of variants) {
    const { sql } = listViewersSql(v);
    assert.ok(sql.includes('WITH session_agg AS'), `session_agg for ${JSON.stringify(v)}`);
    assert.ok(
      !sql.includes('FROM sessions s WHERE s.fingerprint_id = vw.fingerprint_id'),
      `no correlated subquery N+1 in ${JSON.stringify(v)}`,
    );
  }
});

test('listViewersSql: row column set is stable', () => {
  const { sql } = listViewersSql();
  for (const col of [
    'vw.fingerprint_id',
    'vw.viewer_id',
    'vw.identified_at',
    'vw.identified_via',
    'vw.first_seen',
    'vw.last_seen',
    'vw.total_sessions',
    'vw.total_watch_mins',
    'COALESCE(sa.unique_videos, 0) AS unique_videos',
    'COALESCE(sa.avg_engagement, 0) AS avg_engagement',
    'COALESCE(ca.caption_events, 0) AS caption_events',
  ]) {
    assert.ok(sql.includes(col), `column missing: ${col}`);
  }
});

test('listViewersSql: ORDER BY vw.last_seen DESC always present', () => {
  const variants = [
    {},
    { status: 'identified' },
    { dateRange: { from: 'a', to: 'b' } },
  ];
  for (const v of variants) {
    const { sql } = listViewersSql(v);
    assert.ok(sql.includes('ORDER BY vw.last_seen DESC'), JSON.stringify(v));
  }
});

// ---------------------------------------------------------------------------
// getViewersSummarySql
// ---------------------------------------------------------------------------

test('getViewersSummarySql: no filters → LEFT JOIN, no params', () => {
  const { sql, params } = getViewersSummarySql();
  assert.ok(sql.includes('LEFT JOIN viewer_engagement ve'));
  assert.ok(!sql.includes('started_at >='));
  assert.deepEqual(params, []);
});

test('getViewersSummarySql: dateRange → INNER JOIN, date-filtered CTE', () => {
  const { sql, params } = getViewersSummarySql({
    dateRange: { from: '2026-01-01', to: '2026-02-01' },
  });
  assert.ok(sql.includes('INNER JOIN viewer_engagement ve'));
  assert.ok(sql.includes('started_at >= $1 AND started_at <= $2'));
  assert.deepEqual(params, ['2026-01-01', '2026-02-01']);
});

test('getViewersSummarySql: shape — total / identified / anonymous / avg_engagement', () => {
  const { sql } = getViewersSummarySql();
  assert.ok(sql.includes('COUNT(*)::int AS total'));
  assert.ok(sql.includes("FILTER (WHERE vw.viewer_id IS NOT NULL)::int AS identified"));
  assert.ok(sql.includes("FILTER (WHERE vw.viewer_id IS NULL)::int AS anonymous"));
  assert.ok(sql.includes('AS avg_engagement'));
});

// ---------------------------------------------------------------------------
// getViewerDetailSql
// ---------------------------------------------------------------------------

test('getViewerDetailSql: returns a tuple of four queries', () => {
  const result = getViewerDetailSql('fp_abc');
  assert.equal(result.length, 4);
  for (const q of result) {
    assert.ok(q.sql, 'each tuple element has sql');
    assert.ok(Array.isArray(q.params), 'each tuple element has params array');
  }
});

test('getViewerDetailSql: header query selects from viewers by fingerprint', () => {
  const [header] = getViewerDetailSql('fp_abc');
  assert.ok(header.sql.includes('FROM viewers'));
  assert.ok(header.sql.includes('WHERE fingerprint_id = $1'));
  assert.deepEqual(header.params, ['fp_abc']);
});

test('getViewerDetailSql: sessions query uses viewer_sessions CTE shape', () => {
  const [, sessions] = getViewerDetailSql('fp_abc');
  assert.ok(sessions.sql.includes('WITH viewer_sessions AS'));
  assert.ok(sessions.sql.includes('event_counts AS'));
  assert.ok(sessions.sql.includes('LEFT JOIN videos v'));
  assert.deepEqual(sessions.params, ['fp_abc']);
});

test('getViewerDetailSql: videos query groups by video_id', () => {
  const [, , videos] = getViewerDetailSql('fp_abc');
  assert.ok(videos.sql.includes('FROM sessions s'));
  assert.ok(videos.sql.includes('GROUP BY s.video_id'));
  assert.ok(videos.sql.includes('ORDER BY session_count DESC'));
  assert.deepEqual(videos.params, ['fp_abc']);
});

test('getViewerDetailSql: events query ordered desc and limited to 100', () => {
  const [, , , events] = getViewerDetailSql('fp_abc');
  assert.ok(events.sql.includes('FROM events'));
  assert.ok(events.sql.includes('ORDER BY timestamp DESC'));
  assert.ok(events.sql.includes('LIMIT 100'));
  assert.deepEqual(events.params, ['fp_abc']);
});

test('getViewerDetailSql: each query has its own param array', () => {
  const tuple = getViewerDetailSql('fp_abc');
  for (let i = 0; i < tuple.length; i++) {
    for (let j = i + 1; j < tuple.length; j++) {
      assert.notEqual(tuple[i].params, tuple[j].params, `tuple[${i}] vs tuple[${j}]`);
    }
  }
});
