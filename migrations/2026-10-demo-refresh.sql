-- Demo refresh — run in the Neon console SQL editor. Safe to re-run before
-- each demo: step 2 always moves the newest seeded session to yesterday.
--
-- Seeded rows are identified by session IDs ending in -0000000000NN
-- (same rule as frontend/src/utils/sessions.js).

BEGIN;

-- 1. Give j.smith's seed sessions distinct short IDs. All eight used to start
--    with a3f9b2e1, so the Sessions list showed eight rows labeled #a3f9b2.
--    The demo-script session (Security Training, rewind at 8:00) keeps it.
CREATE TEMP TABLE _reid (old_id UUID, new_id UUID) ON COMMIT DROP;
INSERT INTO _reid VALUES
  ('a3f9b2e1-1111-4aaa-b111-000000000001', '5d1e7c40-1111-4aaa-b111-000000000001'),
  ('a3f9b2e1-2222-4aaa-b222-000000000002', '9b4a2f18-2222-4aaa-b222-000000000002'),
  ('a3f9b2e1-4444-4aaa-b444-000000000004', 'e27c6b93-4444-4aaa-b444-000000000004'),
  ('a3f9b2e1-5555-4aaa-b555-000000000005', '71f0d8a5-5555-4aaa-b555-000000000005'),
  ('a3f9b2e1-6666-4aaa-b666-000000000006', 'c4b93e27-6666-4aaa-b666-000000000006'),
  ('a3f9b2e1-7777-4aaa-b777-000000000007', '2a8e5f61-7777-4aaa-b777-000000000007'),
  ('a3f9b2e1-8888-4aaa-b888-000000000008', 'f6d3a90c-8888-4aaa-b888-000000000008');
UPDATE sessions s SET session_id = r.new_id FROM _reid r WHERE s.session_id = r.old_id;
UPDATE events   e SET session_id = r.new_id FROM _reid r WHERE e.session_id = r.old_id;

-- 2. Shift seeded data so it looks recent (newest seeded session = yesterday).
CREATE TEMP TABLE _shift ON COMMIT DROP AS
  SELECT date_trunc('day', NOW()) - date_trunc('day', MAX(started_at)) - INTERVAL '1 day' AS d
  FROM sessions WHERE session_id::text ~ '-0{10}[0-9]{2}$';

UPDATE sessions SET
  started_at    = started_at    + (SELECT d FROM _shift),
  ended_at      = ended_at      + (SELECT d FROM _shift),
  identified_at = identified_at + (SELECT d FROM _shift)
WHERE session_id::text ~ '-0{10}[0-9]{2}$';

UPDATE events SET timestamp = timestamp + (SELECT d FROM _shift)
WHERE session_id::text ~ '-0{10}[0-9]{2}$';

UPDATE viewers SET identified_at = identified_at + (SELECT d FROM _shift)
WHERE fingerprint_id IN ('fp_a3c8e1', 'fp_b7d2f9', 'fp_c1e5a3', 'fp_d9f3b8');

-- 3. Remove noise: test rows and real sessions that never got past 0%.
CREATE TEMP TABLE _junk ON COMMIT DROP AS
  SELECT session_id FROM sessions
  WHERE session_id::text !~ '-0{10}[0-9]{2}$'
    AND (COALESCE(percent_watched, 0) = 0 OR video_id = 'test_video' OR fingerprint_id = 'fp_test123');
DELETE FROM events   WHERE session_id IN (SELECT session_id FROM _junk);
DELETE FROM sessions WHERE session_id IN (SELECT session_id FROM _junk);
DELETE FROM videos   WHERE video_id = 'test_video';

-- 4. Recompute the materialized viewer profiles from what's left.
UPDATE viewers v SET
  total_sessions = agg.n,
  first_seen     = agg.first_seen,
  last_seen      = agg.last_seen
FROM (
  SELECT fingerprint_id, COUNT(*)::int AS n,
         MIN(started_at) AS first_seen, MAX(COALESCE(ended_at, started_at)) AS last_seen
  FROM sessions GROUP BY fingerprint_id
) agg
WHERE v.fingerprint_id = agg.fingerprint_id;
DELETE FROM viewers v WHERE NOT EXISTS (SELECT 1 FROM sessions s WHERE s.fingerprint_id = v.fingerprint_id);

-- 5. (Optional) Titles for private videos, where Vimeo oEmbed returns 404.
--    Fill in real titles and uncomment.
-- UPDATE videos SET title = '...' WHERE video_id = '1173088575';
-- UPDATE videos SET title = '...' WHERE video_id = '1173090362';
-- UPDATE videos SET title = '...' WHERE video_id = '1179644748';
-- UPDATE videos SET title = '...' WHERE video_id = '1174527469';
-- UPDATE videos SET title = '...' WHERE video_id = '1185910547';
-- UPDATE videos SET title = '...' WHERE video_id = '1172675565';

COMMIT;
