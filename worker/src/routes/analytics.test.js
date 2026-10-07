import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dateFilter, clampInt } from './analytics.js';

const p = (qs) => new URLSearchParams(qs);

test('dateFilter: bare `to` date includes the whole day', () => {
  assert.deepEqual(dateFilter(p('from=2026-10-01&to=2026-10-07')), {
    from: '2026-10-01',
    to: '2026-10-07T23:59:59.999Z',
  });
});

test('dateFilter: full timestamps pass through unchanged', () => {
  const to = '2026-10-07T12:00:00Z';
  assert.equal(dateFilter(p(`from=2026-10-01&to=${to}`)).to, to);
});

test('dateFilter: missing or malformed values become null', () => {
  assert.deepEqual(dateFilter(p('')), { from: null, to: null });
  assert.deepEqual(dateFilter(p('from=yesterday&to=nope')), { from: null, to: null });
});

test('clampInt: falls back on junk and clamps to bounds', () => {
  assert.equal(clampInt(null, 50, 1, 500), 50);
  assert.equal(clampInt('abc', 50, 1, 500), 50);
  assert.equal(clampInt('100000', 50, 1, 500), 500);
  assert.equal(clampInt('-3', 1, 1, 10000), 1);
  assert.equal(clampInt('25', 50, 1, 500), 25);
});
