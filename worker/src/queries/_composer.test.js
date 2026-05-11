import { test } from 'node:test';
import assert from 'node:assert/strict';
import { composer } from './_composer.js';

test('starts with empty params', () => {
  const c = composer();
  const { params } = c.build('SELECT 1');
  assert.deepEqual(params, []);
});

test('push returns sequential placeholders', () => {
  const c = composer();
  assert.equal(c.push('a'), '$1');
  assert.equal(c.push('b'), '$2');
  assert.equal(c.push('c'), '$3');
});

test('push accumulates params in order', () => {
  const c = composer();
  c.push('a');
  c.push('b');
  c.push('c');
  const { params } = c.build('');
  assert.deepEqual(params, ['a', 'b', 'c']);
});

test('typical usage: build query with placeholders', () => {
  const c = composer();
  const sql = `SELECT * FROM sessions WHERE video_id = ${c.push('v123')} AND started_at >= ${c.push('2026-01-01')}`;
  const result = c.build(sql);
  assert.equal(
    result.sql,
    'SELECT * FROM sessions WHERE video_id = $1 AND started_at >= $2',
  );
  assert.deepEqual(result.params, ['v123', '2026-01-01']);
});

test('injection probe: values stay in params, never SQL', () => {
  const c = composer();
  const malicious = "'; DROP TABLE sessions; --";
  const sql = `SELECT * FROM sessions WHERE video_id = ${c.push(malicious)}`;
  const { sql: text, params } = c.build(sql);
  assert.equal(text, 'SELECT * FROM sessions WHERE video_id = $1');
  assert.deepEqual(params, [malicious]);
  assert.ok(!text.includes('DROP TABLE'));
});

test('whitespace collapse: multi-line query normalised', () => {
  const c = composer();
  const { sql } = c.build(`
    SELECT *
    FROM sessions
    WHERE video_id = ${c.push('v123')}
  `);
  assert.equal(sql, 'SELECT * FROM sessions WHERE video_id = $1');
});

test('null and undefined values are captured verbatim', () => {
  const c = composer();
  c.push(null);
  c.push(undefined);
  const { params } = c.build('');
  assert.deepEqual(params, [null, undefined]);
});

test('Date and number values pass through unchanged', () => {
  const c = composer();
  const d = new Date('2026-01-01T00:00:00Z');
  c.push(d);
  c.push(42);
  const { params } = c.build('');
  assert.equal(params[0], d);
  assert.equal(params[1], 42);
});
