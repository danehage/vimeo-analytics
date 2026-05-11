import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run, runMany } from './_execute.js';

test('run passes sql text and params to the client', async () => {
  const calls = [];
  const fakeSql = (text, params) => {
    calls.push({ text, params });
    return Promise.resolve([{ id: 1 }]);
  };
  const result = await run(fakeSql, { sql: 'SELECT 1', params: [] });
  assert.deepEqual(calls, [{ text: 'SELECT 1', params: [] }]);
  assert.deepEqual(result, [{ id: 1 }]);
});

test('run forwards bind parameters in order', async () => {
  let captured;
  const fakeSql = (text, params) => {
    captured = { text, params };
    return Promise.resolve([]);
  };
  await run(fakeSql, {
    sql: 'SELECT * FROM sessions WHERE video_id = $1 AND started_at >= $2',
    params: ['v123', '2026-01-01'],
  });
  assert.equal(captured.text, 'SELECT * FROM sessions WHERE video_id = $1 AND started_at >= $2');
  assert.deepEqual(captured.params, ['v123', '2026-01-01']);
});

test('runMany executes queries in parallel and preserves order', async () => {
  const order = [];
  const fakeSql = async (text) => {
    order.push('start:' + text);
    await new Promise((r) => setTimeout(r, text === 'SELECT 1' ? 20 : 0));
    order.push('end:' + text);
    return [text];
  };
  const results = await runMany(fakeSql, [
    { sql: 'SELECT 1', params: [] },
    { sql: 'SELECT 2', params: [] },
  ]);
  assert.deepEqual(results, [['SELECT 1'], ['SELECT 2']]);
  // Parallelism: SELECT 2 should end before SELECT 1
  assert.deepEqual(order, ['start:SELECT 1', 'start:SELECT 2', 'end:SELECT 2', 'end:SELECT 1']);
});

test('runMany on empty array resolves to empty array', async () => {
  const results = await runMany(() => assert.fail('should not be called'), []);
  assert.deepEqual(results, []);
});
