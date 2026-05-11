import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  listLiveEventsSql,
  getLiveEventDetailSql,
} from './live-events.js';

// ---------------------------------------------------------------------------
// listLiveEventsSql
// ---------------------------------------------------------------------------

test('listLiveEventsSql: no params, filters videos by is_live=true', () => {
  const { sql, params } = listLiveEventsSql();
  assert.ok(sql.includes('WHERE v.is_live = true'));
  assert.deepEqual(params, []);
});

test('listLiveEventsSql: surfaces is_active and current_viewers', () => {
  const { sql } = listLiveEventsSql();
  assert.ok(sql.includes('AS is_active'));
  assert.ok(sql.includes('AS current_viewers'));
});

test('listLiveEventsSql: orders by is_active then last_activity', () => {
  const { sql } = listLiveEventsSql();
  assert.ok(sql.includes('ORDER BY is_active DESC, last_activity DESC NULLS LAST'));
});

// ---------------------------------------------------------------------------
// getLiveEventDetailSql
// ---------------------------------------------------------------------------

test('getLiveEventDetailSql: returns tuple of three queries', () => {
  const tuple = getLiveEventDetailSql('v123');
  assert.equal(tuple.length, 3);
  for (const q of tuple) {
    assert.ok(q.sql);
    assert.ok(Array.isArray(q.params));
  }
});

test('getLiveEventDetailSql: header query filters by video_id', () => {
  const [header] = getLiveEventDetailSql('v123');
  assert.ok(header.sql.includes('WHERE v.video_id = $1'));
  assert.deepEqual(header.params, ['v123']);
});

test('getLiveEventDetailSql: active viewers query filters by 30s window and uses LATERAL', () => {
  const [, active] = getLiveEventDetailSql('v123');
  assert.ok(active.sql.includes("INTERVAL '30 seconds'"));
  assert.ok(active.sql.includes('INNER JOIN LATERAL'));
  assert.ok(active.sql.includes('WHERE s.video_id = $1'));
  assert.deepEqual(active.params, ['v123']);
});

test('getLiveEventDetailSql: sessions query uses video_sessions CTE + event_counts', () => {
  const [, , sessions] = getLiveEventDetailSql('v123');
  assert.ok(sessions.sql.includes('WITH video_sessions AS'));
  assert.ok(sessions.sql.includes('event_counts AS'));
  assert.ok(sessions.sql.includes('LIMIT 100'));
  assert.deepEqual(sessions.params, ['v123']);
});

test('getLiveEventDetailSql: each query has its own param array', () => {
  const tuple = getLiveEventDetailSql('v123');
  for (let i = 0; i < tuple.length; i++) {
    for (let j = i + 1; j < tuple.length; j++) {
      assert.notEqual(tuple[i].params, tuple[j].params);
    }
  }
});
