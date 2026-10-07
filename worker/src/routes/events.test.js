import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEvent, isValidViewerId, handleIdentify } from './events.js';

const base = {
  session_id: '513e3620-967a-408c-999f-9e6ccdcdf62e',
  event_type: 'play',
  video_id: '1123665262',
};

test('isValidViewerId: accepts emails and plain IDs', () => {
  assert.ok(isValidViewerId('j.smith@corp.com'));
  assert.ok(isValidViewerId('employee-1234'));
});

test('isValidViewerId: rejects values that would break avatar rendering or bloat rows', () => {
  for (const bad of ['', '.x@y.com', '@corp.com', ' j@corp.com', 'a b', 'x'.repeat(255), 42, null, {}]) {
    assert.equal(isValidViewerId(bad), false, JSON.stringify(bad));
  }
});

test('validateEvent: null viewer_id is allowed, malformed viewer_id is rejected', () => {
  assert.deepEqual(validateEvent({ ...base, viewer_id: null }), []);
  assert.equal(validateEvent({ ...base, viewer_id: '.oops' }).length, 1);
});

test('handleIdentify: rejects invalid input without touching the database', async () => {
  const sql = () => { throw new Error('should not query'); };
  const req = (body) => new Request('https://x/api/identify', { method: 'POST', body });
  for (const body of ['not json', '{}', JSON.stringify({ fingerprintId: 'fp_a', viewerId: '@bad' })]) {
    const res = await handleIdentify(req(body), sql);
    assert.equal(res.status, 400, body);
  }
});
