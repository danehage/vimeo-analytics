-- ============================================================
-- SEED DATA — vimeo-deep-analytics
-- ============================================================

-- Videos
INSERT INTO videos (video_id, title, duration, created_at) VALUES
  ('v_aws_mktplace',  'Global Partner Summit Keynote',  83,   '2026-01-10T09:00:00Z'),
  ('v_sec_train_3',   'Security Training Module 3',        1102, '2026-01-15T14:00:00Z'),
  ('v_florence',      'Florence',                          15,   '2026-01-20T11:00:00Z'),
  ('v_onboard_cult',  'Onboarding: Company Culture',       720,  '2026-01-05T08:00:00Z'),
  ('v_benefits_2026', 'Benefits Overview 2026',            540,  '2026-01-08T10:00:00Z'),
  ('v_ceo_townhall',  'CEO Town Hall - Jan 2026',          2400, '2026-01-28T16:00:00Z');

-- Viewers
INSERT INTO viewers (fingerprint_id, viewer_id, identified_at, identified_via, first_seen, last_seen, total_sessions, total_watch_mins) VALUES
  ('fp_a3c8e1', 'j.smith@corp.com', '2026-02-12T10:30:00Z', 'SSO login',    '2026-02-10T09:00:00Z', '2026-03-04T14:22:00Z', 8,  42.5),
  ('fp_b7d2f9', NULL,                NULL,                   NULL,           '2026-02-14T11:00:00Z', '2026-03-03T16:45:00Z', 5,  28.3),
  ('fp_c1e5a3', 'm.chen@corp.com',  '2026-02-18T09:15:00Z', 'form submit',  '2026-02-16T08:00:00Z', '2026-03-04T11:10:00Z', 6,  35.1),
  ('fp_d9f3b8', NULL,                NULL,                   NULL,           '2026-02-20T13:00:00Z', '2026-03-02T10:30:00Z', 3,  12.7);

-- ============================================================
-- SESSIONS
-- ============================================================

-- j.smith@corp.com (fp_a3c8e1) — 8 sessions
INSERT INTO sessions (session_id, video_id, viewer_id, fingerprint_id, embed_url, started_at, ended_at, percent_watched, completed, identified_at, identified_via) VALUES
  ('a3f9b2e1-1111-4aaa-b111-000000000001', 'v_onboard_cult',  'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/onboarding',   '2026-02-10T09:05:00Z', '2026-02-10T09:18:00Z', 92,  TRUE,  '2026-02-12T10:30:00Z', 'SSO login'),
  ('a3f9b2e1-2222-4aaa-b222-000000000002', 'v_benefits_2026', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/benefits',     '2026-02-10T10:00:00Z', '2026-02-10T10:08:00Z', 78,  FALSE, '2026-02-12T10:30:00Z', 'SSO login'),
  ('a3f9b2e1-3333-4aaa-b333-000000000003', 'v_sec_train_3',   'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security',     '2026-02-11T14:00:00Z', '2026-02-11T14:19:00Z', 100, TRUE,  '2026-02-12T10:30:00Z', 'SSO login'),
  ('a3f9b2e1-4444-4aaa-b444-000000000004', 'v_aws_mktplace',  'j.smith@corp.com', 'fp_a3c8e1', 'https://vidharbor.com/demos/aws',        '2026-02-15T11:30:00Z', '2026-02-15T11:32:00Z', 100, TRUE,  '2026-02-12T10:30:00Z', 'SSO login'),
  ('a3f9b2e1-5555-4aaa-b555-000000000005', 'v_florence',      'j.smith@corp.com', 'fp_a3c8e1', 'https://vidharbor.com/demos/florence',    '2026-02-18T16:00:00Z', '2026-02-18T16:00:15Z', 100, TRUE,  '2026-02-12T10:30:00Z', 'SSO login'),
  ('a3f9b2e1-6666-4aaa-b666-000000000006', 'v_ceo_townhall',  'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/townhall',     '2026-02-28T16:00:00Z', '2026-02-28T16:42:00Z', 88,  FALSE, '2026-02-12T10:30:00Z', 'SSO login'),
  ('a3f9b2e1-7777-4aaa-b777-000000000007', 'v_sec_train_3',   'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security',     '2026-03-03T09:00:00Z', '2026-03-03T09:12:00Z', 55,  FALSE, '2026-02-12T10:30:00Z', 'SSO login'),
  ('a3f9b2e1-8888-4aaa-b888-000000000008', 'v_onboard_cult',  'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/onboarding',   '2026-03-04T14:00:00Z', '2026-03-04T14:22:00Z', 100, TRUE,  '2026-02-12T10:30:00Z', 'SSO login');

-- fp_b7d2f9 (anonymous) — 5 sessions
INSERT INTO sessions (session_id, video_id, viewer_id, fingerprint_id, embed_url, started_at, ended_at, percent_watched, completed, identified_at, identified_via) VALUES
  ('c82e41a0-1111-4bbb-a111-000000000001', 'v_sec_train_3',   NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security',     '2026-02-14T11:00:00Z', '2026-02-14T11:08:00Z', 32,  FALSE, NULL, NULL),
  ('c82e41a0-2222-4bbb-a222-000000000002', 'v_sec_train_3',   NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security',     '2026-02-17T09:30:00Z', '2026-02-17T09:42:00Z', 45,  FALSE, NULL, NULL),
  ('c82e41a0-3333-4bbb-a333-000000000003', 'v_onboard_cult',  NULL, 'fp_b7d2f9', 'https://intranet.corp.com/onboarding',   '2026-02-20T14:00:00Z', '2026-02-20T14:10:00Z', 68,  FALSE, NULL, NULL),
  ('c82e41a0-4444-4bbb-a444-000000000004', 'v_benefits_2026', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/benefits',     '2026-02-25T10:00:00Z', '2026-02-25T10:07:00Z', 55,  FALSE, NULL, NULL),
  ('c82e41a0-5555-4bbb-a555-000000000005', 'v_ceo_townhall',  NULL, 'fp_b7d2f9', 'https://intranet.corp.com/townhall',     '2026-03-03T16:00:00Z', '2026-03-03T16:45:00Z', 72,  FALSE, NULL, NULL);

-- m.chen@corp.com (fp_c1e5a3) — 6 sessions
INSERT INTO sessions (session_id, video_id, viewer_id, fingerprint_id, embed_url, started_at, ended_at, percent_watched, completed, identified_at, identified_via) VALUES
  ('d5a7f3b2-1111-4ccc-a111-000000000001', 'v_onboard_cult',  'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/onboarding',   '2026-02-16T08:00:00Z', '2026-02-16T08:13:00Z', 100, TRUE,  '2026-02-18T09:15:00Z', 'form submit'),
  ('d5a7f3b2-2222-4ccc-a222-000000000002', 'v_benefits_2026', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/benefits',     '2026-02-16T09:00:00Z', '2026-02-16T09:10:00Z', 100, TRUE,  '2026-02-18T09:15:00Z', 'form submit'),
  ('d5a7f3b2-3333-4ccc-a333-000000000003', 'v_sec_train_3',   'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/security',     '2026-02-19T10:00:00Z', '2026-02-19T10:20:00Z', 100, TRUE,  '2026-02-18T09:15:00Z', 'form submit'),
  ('d5a7f3b2-4444-4ccc-a444-000000000004', 'v_aws_mktplace',  'm.chen@corp.com', 'fp_c1e5a3', 'https://vidharbor.com/demos/aws',        '2026-02-22T15:00:00Z', '2026-02-22T15:01:30Z', 100, TRUE,  '2026-02-18T09:15:00Z', 'form submit'),
  ('d5a7f3b2-5555-4ccc-a555-000000000005', 'v_ceo_townhall',  'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/townhall',     '2026-03-01T16:00:00Z', '2026-03-01T16:40:00Z', 95,  TRUE,  '2026-02-18T09:15:00Z', 'form submit'),
  ('d5a7f3b2-6666-4ccc-a666-000000000006', 'v_florence',      'm.chen@corp.com', 'fp_c1e5a3', 'https://vidharbor.com/demos/florence',    '2026-03-04T11:00:00Z', '2026-03-04T11:10:00Z', 100, TRUE,  '2026-02-18T09:15:00Z', 'form submit');

-- fp_d9f3b8 (anonymous) — 3 sessions
INSERT INTO sessions (session_id, video_id, viewer_id, fingerprint_id, embed_url, started_at, ended_at, percent_watched, completed, identified_at, identified_via) VALUES
  ('e9c2d4a1-1111-4ddd-a111-000000000001', 'v_florence',      NULL, 'fp_d9f3b8', 'https://vidharbor.com/demos/florence',    '2026-02-20T13:00:00Z', '2026-02-20T13:00:16Z', 100, TRUE,  NULL, NULL),
  ('e9c2d4a1-2222-4ddd-a222-000000000002', 'v_aws_mktplace',  NULL, 'fp_d9f3b8', 'https://vidharbor.com/demos/aws',         '2026-02-22T14:00:00Z', '2026-02-22T14:01:25Z', 85,  FALSE, NULL, NULL),
  ('e9c2d4a1-3333-4ddd-a333-000000000003', 'v_onboard_cult',  NULL, 'fp_d9f3b8', 'https://intranet.corp.com/onboarding',    '2026-03-02T10:00:00Z', '2026-03-02T10:30:00Z', 40,  FALSE, NULL, NULL);

-- ============================================================
-- EVENTS — Session a3f9b2e1-3333 (j.smith, Security Training, full watch)
-- ============================================================
INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload) VALUES
  ('a3f9b2e1-3333-4aaa-b333-000000000003', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'play',            0,    '2026-02-11T14:00:00Z', 1102, '{"seconds":0,"duration":1102,"percent":0}'),
  ('a3f9b2e1-3333-4aaa-b333-000000000003', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'timeupdate',      5,    '2026-02-11T14:00:05Z', 1102, '{"seconds":5,"duration":1102,"percent":0.45}'),
  ('a3f9b2e1-3333-4aaa-b333-000000000003', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'timeupdate',      60,   '2026-02-11T14:01:00Z', 1102, '{"seconds":60,"duration":1102,"percent":5.44}'),
  ('a3f9b2e1-3333-4aaa-b333-000000000003', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'texttrackchange', 65,   '2026-02-11T14:01:05Z', 1102, '{"kind":"captions","label":"English","language":"en"}'),
  ('a3f9b2e1-3333-4aaa-b333-000000000003', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'timeupdate',      120,  '2026-02-11T14:02:00Z', 1102, '{"seconds":120,"duration":1102,"percent":10.89}'),
  ('a3f9b2e1-3333-4aaa-b333-000000000003', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'timeupdate',      240,  '2026-02-11T14:04:00Z', 1102, '{"seconds":240,"duration":1102,"percent":21.78}'),
  ('a3f9b2e1-3333-4aaa-b333-000000000003', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'seeked',          480,  '2026-02-11T14:05:00Z', 1102, '{"seconds":480,"duration":1102,"percent":43.56}'),
  ('a3f9b2e1-3333-4aaa-b333-000000000003', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'pause',           482,  '2026-02-11T14:05:02Z', 1102, '{"seconds":482,"duration":1102,"percent":43.74}'),
  ('a3f9b2e1-3333-4aaa-b333-000000000003', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'play',            482,  '2026-02-11T14:05:10Z', 1102, '{"seconds":482,"duration":1102,"percent":43.74}'),
  ('a3f9b2e1-3333-4aaa-b333-000000000003', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'seeked',          240,  '2026-02-11T14:06:00Z', 1102, '{"seconds":240,"duration":1102,"percent":21.78}'),
  ('a3f9b2e1-3333-4aaa-b333-000000000003', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'timeupdate',      300,  '2026-02-11T14:07:00Z', 1102, '{"seconds":300,"duration":1102,"percent":27.22}'),
  ('a3f9b2e1-3333-4aaa-b333-000000000003', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'bufferstart',     550,  '2026-02-11T14:10:00Z', 1102, '{"seconds":550}'),
  ('a3f9b2e1-3333-4aaa-b333-000000000003', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'bufferend',       550,  '2026-02-11T14:10:03Z', 1102, '{"seconds":550,"bufferDuration":3.1}'),
  ('a3f9b2e1-3333-4aaa-b333-000000000003', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'timeupdate',      660,  '2026-02-11T14:12:00Z', 1102, '{"seconds":660,"duration":1102,"percent":59.89}'),
  ('a3f9b2e1-3333-4aaa-b333-000000000003', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'qualitychange',   700,  '2026-02-11T14:12:40Z', 1102, '{"quality":"1080p"}'),
  ('a3f9b2e1-3333-4aaa-b333-000000000003', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'timeupdate',      900,  '2026-02-11T14:16:00Z', 1102, '{"seconds":900,"duration":1102,"percent":81.67}'),
  ('a3f9b2e1-3333-4aaa-b333-000000000003', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'timeupdate',      1050, '2026-02-11T14:18:30Z', 1102, '{"seconds":1050,"duration":1102,"percent":95.28}'),
  ('a3f9b2e1-3333-4aaa-b333-000000000003', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'ended',           1102, '2026-02-11T14:19:00Z', 1102, '{"seconds":1102,"duration":1102,"percent":100}'),
  ('a3f9b2e1-3333-4aaa-b333-000000000003', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'session_end',     1102, '2026-02-11T14:19:01Z', 1102, '{}');

-- ============================================================
-- EVENTS — Session a3f9b2e1-4444 (j.smith, AWS Marketplace, quick full watch)
-- ============================================================
INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload) VALUES
  ('a3f9b2e1-4444-4aaa-b444-000000000004', 'v_aws_mktplace', 'j.smith@corp.com', 'fp_a3c8e1', 'https://vidharbor.com/demos/aws', 'play',        0,  '2026-02-15T11:30:00Z', 83, '{"seconds":0,"duration":83,"percent":0}'),
  ('a3f9b2e1-4444-4aaa-b444-000000000004', 'v_aws_mktplace', 'j.smith@corp.com', 'fp_a3c8e1', 'https://vidharbor.com/demos/aws', 'timeupdate',  5,  '2026-02-15T11:30:05Z', 83, '{"seconds":5,"duration":83,"percent":6.02}'),
  ('a3f9b2e1-4444-4aaa-b444-000000000004', 'v_aws_mktplace', 'j.smith@corp.com', 'fp_a3c8e1', 'https://vidharbor.com/demos/aws', 'timeupdate',  30, '2026-02-15T11:30:30Z', 83, '{"seconds":30,"duration":83,"percent":36.14}'),
  ('a3f9b2e1-4444-4aaa-b444-000000000004', 'v_aws_mktplace', 'j.smith@corp.com', 'fp_a3c8e1', 'https://vidharbor.com/demos/aws', 'timeupdate',  60, '2026-02-15T11:31:00Z', 83, '{"seconds":60,"duration":83,"percent":72.29}'),
  ('a3f9b2e1-4444-4aaa-b444-000000000004', 'v_aws_mktplace', 'j.smith@corp.com', 'fp_a3c8e1', 'https://vidharbor.com/demos/aws', 'ended',       83, '2026-02-15T11:31:23Z', 83, '{"seconds":83,"duration":83,"percent":100}'),
  ('a3f9b2e1-4444-4aaa-b444-000000000004', 'v_aws_mktplace', 'j.smith@corp.com', 'fp_a3c8e1', 'https://vidharbor.com/demos/aws', 'session_end', 83, '2026-02-15T11:31:24Z', 83, '{}');

-- ============================================================
-- EVENTS — Session c82e41a0-1111 (fp_b7d2f9, Security Training attempt 1 — abandoned at 32%)
-- ============================================================
INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload) VALUES
  ('c82e41a0-1111-4bbb-a111-000000000001', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'play',            0,    '2026-02-14T11:00:00Z', 1102, '{"seconds":0,"duration":1102,"percent":0}'),
  ('c82e41a0-1111-4bbb-a111-000000000001', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'texttrackchange', 3,    '2026-02-14T11:00:03Z', 1102, '{"kind":"captions","label":"Spanish","language":"es"}'),
  ('c82e41a0-1111-4bbb-a111-000000000001', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'qualitychange',   5,    '2026-02-14T11:00:05Z', 1102, '{"quality":"540p"}'),
  ('c82e41a0-1111-4bbb-a111-000000000001', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'timeupdate',      60,   '2026-02-14T11:01:00Z', 1102, '{"seconds":60,"duration":1102,"percent":5.44}'),
  ('c82e41a0-1111-4bbb-a111-000000000001', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'timeupdate',      120,  '2026-02-14T11:02:00Z', 1102, '{"seconds":120,"duration":1102,"percent":10.89}'),
  ('c82e41a0-1111-4bbb-a111-000000000001', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'bufferstart',     180,  '2026-02-14T11:03:00Z', 1102, '{"seconds":180}'),
  ('c82e41a0-1111-4bbb-a111-000000000001', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'bufferend',       180,  '2026-02-14T11:03:08Z', 1102, '{"seconds":180,"bufferDuration":8.2}'),
  ('c82e41a0-1111-4bbb-a111-000000000001', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'timeupdate',      240,  '2026-02-14T11:05:00Z', 1102, '{"seconds":240,"duration":1102,"percent":21.78}'),
  ('c82e41a0-1111-4bbb-a111-000000000001', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'timeupdate',      300,  '2026-02-14T11:06:00Z', 1102, '{"seconds":300,"duration":1102,"percent":27.22}'),
  ('c82e41a0-1111-4bbb-a111-000000000001', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'bufferstart',     340,  '2026-02-14T11:07:00Z', 1102, '{"seconds":340}'),
  ('c82e41a0-1111-4bbb-a111-000000000001', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'bufferend',       340,  '2026-02-14T11:07:12Z', 1102, '{"seconds":340,"bufferDuration":12.4}'),
  ('c82e41a0-1111-4bbb-a111-000000000001', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'pause',           352,  '2026-02-14T11:07:30Z', 1102, '{"seconds":352,"duration":1102,"percent":31.94}'),
  ('c82e41a0-1111-4bbb-a111-000000000001', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'session_end',     352,  '2026-02-14T11:08:00Z', 1102, '{}');

-- ============================================================
-- EVENTS — Session c82e41a0-2222 (fp_b7d2f9, Security Training attempt 2 — abandoned at 45%)
-- ============================================================
INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload) VALUES
  ('c82e41a0-2222-4bbb-a222-000000000002', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'play',            0,    '2026-02-17T09:30:00Z', 1102, '{"seconds":0,"duration":1102,"percent":0}'),
  ('c82e41a0-2222-4bbb-a222-000000000002', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'texttrackchange', 2,    '2026-02-17T09:30:02Z', 1102, '{"kind":"captions","label":"Spanish","language":"es"}'),
  ('c82e41a0-2222-4bbb-a222-000000000002', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'qualitychange',   3,    '2026-02-17T09:30:03Z', 1102, '{"quality":"540p"}'),
  ('c82e41a0-2222-4bbb-a222-000000000002', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'timeupdate',      60,   '2026-02-17T09:31:00Z', 1102, '{"seconds":60,"duration":1102,"percent":5.44}'),
  ('c82e41a0-2222-4bbb-a222-000000000002', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'timeupdate',      180,  '2026-02-17T09:33:00Z', 1102, '{"seconds":180,"duration":1102,"percent":16.33}'),
  ('c82e41a0-2222-4bbb-a222-000000000002', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'seeked',          350,  '2026-02-17T09:34:00Z', 1102, '{"seconds":350,"duration":1102,"percent":31.76}'),
  ('c82e41a0-2222-4bbb-a222-000000000002', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'timeupdate',      400,  '2026-02-17T09:35:00Z', 1102, '{"seconds":400,"duration":1102,"percent":36.30}'),
  ('c82e41a0-2222-4bbb-a222-000000000002', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'bufferstart',     450,  '2026-02-17T09:37:00Z', 1102, '{"seconds":450}'),
  ('c82e41a0-2222-4bbb-a222-000000000002', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'bufferend',       450,  '2026-02-17T09:37:06Z', 1102, '{"seconds":450,"bufferDuration":5.8}'),
  ('c82e41a0-2222-4bbb-a222-000000000002', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'timeupdate',      495,  '2026-02-17T09:38:00Z', 1102, '{"seconds":495,"duration":1102,"percent":44.92}'),
  ('c82e41a0-2222-4bbb-a222-000000000002', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'pause',           500,  '2026-02-17T09:42:00Z', 1102, '{"seconds":500,"duration":1102,"percent":45.37}'),
  ('c82e41a0-2222-4bbb-a222-000000000002', 'v_sec_train_3', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/security', 'session_end',     500,  '2026-02-17T09:42:01Z', 1102, '{}');

-- ============================================================
-- EVENTS — Session c82e41a0-5555 (fp_b7d2f9, CEO Town Hall — partial watch)
-- ============================================================
INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload) VALUES
  ('c82e41a0-5555-4bbb-a555-000000000005', 'v_ceo_townhall', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/townhall', 'play',        0,    '2026-03-03T16:00:00Z', 2400, '{"seconds":0,"duration":2400,"percent":0}'),
  ('c82e41a0-5555-4bbb-a555-000000000005', 'v_ceo_townhall', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/townhall', 'timeupdate',  60,   '2026-03-03T16:01:00Z', 2400, '{"seconds":60,"duration":2400,"percent":2.5}'),
  ('c82e41a0-5555-4bbb-a555-000000000005', 'v_ceo_townhall', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/townhall', 'timeupdate',  300,  '2026-03-03T16:05:00Z', 2400, '{"seconds":300,"duration":2400,"percent":12.5}'),
  ('c82e41a0-5555-4bbb-a555-000000000005', 'v_ceo_townhall', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/townhall', 'seeked',      900,  '2026-03-03T16:10:00Z', 2400, '{"seconds":900,"duration":2400,"percent":37.5}'),
  ('c82e41a0-5555-4bbb-a555-000000000005', 'v_ceo_townhall', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/townhall', 'timeupdate',  1200, '2026-03-03T16:20:00Z', 2400, '{"seconds":1200,"duration":2400,"percent":50}'),
  ('c82e41a0-5555-4bbb-a555-000000000005', 'v_ceo_townhall', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/townhall', 'seeked',      1600, '2026-03-03T16:28:00Z', 2400, '{"seconds":1600,"duration":2400,"percent":66.67}'),
  ('c82e41a0-5555-4bbb-a555-000000000005', 'v_ceo_townhall', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/townhall', 'timeupdate',  1728, '2026-03-03T16:35:00Z', 2400, '{"seconds":1728,"duration":2400,"percent":72}'),
  ('c82e41a0-5555-4bbb-a555-000000000005', 'v_ceo_townhall', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/townhall', 'pause',       1730, '2026-03-03T16:45:00Z', 2400, '{"seconds":1730,"duration":2400,"percent":72.08}'),
  ('c82e41a0-5555-4bbb-a555-000000000005', 'v_ceo_townhall', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/townhall', 'session_end', 1730, '2026-03-03T16:45:01Z', 2400, '{}');

-- ============================================================
-- EVENTS — Session d5a7f3b2-1111 (m.chen, Onboarding, full watch)
-- ============================================================
INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload) VALUES
  ('d5a7f3b2-1111-4ccc-a111-000000000001', 'v_onboard_cult', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/onboarding', 'play',        0,   '2026-02-16T08:00:00Z', 720, '{"seconds":0,"duration":720,"percent":0}'),
  ('d5a7f3b2-1111-4ccc-a111-000000000001', 'v_onboard_cult', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/onboarding', 'timeupdate',  60,  '2026-02-16T08:01:00Z', 720, '{"seconds":60,"duration":720,"percent":8.33}'),
  ('d5a7f3b2-1111-4ccc-a111-000000000001', 'v_onboard_cult', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/onboarding', 'timeupdate',  180, '2026-02-16T08:03:00Z', 720, '{"seconds":180,"duration":720,"percent":25}'),
  ('d5a7f3b2-1111-4ccc-a111-000000000001', 'v_onboard_cult', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/onboarding', 'timeupdate',  360, '2026-02-16T08:06:00Z', 720, '{"seconds":360,"duration":720,"percent":50}'),
  ('d5a7f3b2-1111-4ccc-a111-000000000001', 'v_onboard_cult', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/onboarding', 'timeupdate',  540, '2026-02-16T08:09:00Z', 720, '{"seconds":540,"duration":720,"percent":75}'),
  ('d5a7f3b2-1111-4ccc-a111-000000000001', 'v_onboard_cult', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/onboarding', 'timeupdate',  660, '2026-02-16T08:11:00Z', 720, '{"seconds":660,"duration":720,"percent":91.67}'),
  ('d5a7f3b2-1111-4ccc-a111-000000000001', 'v_onboard_cult', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/onboarding', 'ended',       720, '2026-02-16T08:12:00Z', 720, '{"seconds":720,"duration":720,"percent":100}'),
  ('d5a7f3b2-1111-4ccc-a111-000000000001', 'v_onboard_cult', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/onboarding', 'session_end', 720, '2026-02-16T08:13:00Z', 720, '{}');

-- ============================================================
-- EVENTS — Session d5a7f3b2-3333 (m.chen, Security Training, full watch with captions)
-- ============================================================
INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload) VALUES
  ('d5a7f3b2-3333-4ccc-a333-000000000003', 'v_sec_train_3', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/security', 'play',            0,    '2026-02-19T10:00:00Z', 1102, '{"seconds":0,"duration":1102,"percent":0}'),
  ('d5a7f3b2-3333-4ccc-a333-000000000003', 'v_sec_train_3', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/security', 'texttrackchange', 8,    '2026-02-19T10:00:08Z', 1102, '{"kind":"captions","label":"English","language":"en"}'),
  ('d5a7f3b2-3333-4ccc-a333-000000000003', 'v_sec_train_3', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/security', 'timeupdate',      60,   '2026-02-19T10:01:00Z', 1102, '{"seconds":60,"duration":1102,"percent":5.44}'),
  ('d5a7f3b2-3333-4ccc-a333-000000000003', 'v_sec_train_3', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/security', 'timeupdate',      300,  '2026-02-19T10:05:00Z', 1102, '{"seconds":300,"duration":1102,"percent":27.22}'),
  ('d5a7f3b2-3333-4ccc-a333-000000000003', 'v_sec_train_3', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/security', 'timeupdate',      600,  '2026-02-19T10:10:00Z', 1102, '{"seconds":600,"duration":1102,"percent":54.45}'),
  ('d5a7f3b2-3333-4ccc-a333-000000000003', 'v_sec_train_3', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/security', 'timeupdate',      900,  '2026-02-19T10:15:00Z', 1102, '{"seconds":900,"duration":1102,"percent":81.67}'),
  ('d5a7f3b2-3333-4ccc-a333-000000000003', 'v_sec_train_3', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/security', 'timeupdate',      1050, '2026-02-19T10:18:00Z', 1102, '{"seconds":1050,"duration":1102,"percent":95.28}'),
  ('d5a7f3b2-3333-4ccc-a333-000000000003', 'v_sec_train_3', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/security', 'ended',           1102, '2026-02-19T10:19:30Z', 1102, '{"seconds":1102,"duration":1102,"percent":100}'),
  ('d5a7f3b2-3333-4ccc-a333-000000000003', 'v_sec_train_3', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/security', 'session_end',     1102, '2026-02-19T10:20:00Z', 1102, '{}');

-- ============================================================
-- EVENTS — Session d5a7f3b2-5555 (m.chen, CEO Town Hall, near-complete)
-- ============================================================
INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload) VALUES
  ('d5a7f3b2-5555-4ccc-a555-000000000005', 'v_ceo_townhall', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/townhall', 'play',            0,    '2026-03-01T16:00:00Z', 2400, '{"seconds":0,"duration":2400,"percent":0}'),
  ('d5a7f3b2-5555-4ccc-a555-000000000005', 'v_ceo_townhall', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/townhall', 'texttrackchange', 5,    '2026-03-01T16:00:05Z', 2400, '{"kind":"captions","label":"English","language":"en"}'),
  ('d5a7f3b2-5555-4ccc-a555-000000000005', 'v_ceo_townhall', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/townhall', 'timeupdate',      300,  '2026-03-01T16:05:00Z', 2400, '{"seconds":300,"duration":2400,"percent":12.5}'),
  ('d5a7f3b2-5555-4ccc-a555-000000000005', 'v_ceo_townhall', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/townhall', 'timeupdate',      600,  '2026-03-01T16:10:00Z', 2400, '{"seconds":600,"duration":2400,"percent":25}'),
  ('d5a7f3b2-5555-4ccc-a555-000000000005', 'v_ceo_townhall', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/townhall', 'timeupdate',      900,  '2026-03-01T16:15:00Z', 2400, '{"seconds":900,"duration":2400,"percent":37.5}'),
  ('d5a7f3b2-5555-4ccc-a555-000000000005', 'v_ceo_townhall', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/townhall', 'timeupdate',      1200, '2026-03-01T16:20:00Z', 2400, '{"seconds":1200,"duration":2400,"percent":50}'),
  ('d5a7f3b2-5555-4ccc-a555-000000000005', 'v_ceo_townhall', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/townhall', 'timeupdate',      1500, '2026-03-01T16:25:00Z', 2400, '{"seconds":1500,"duration":2400,"percent":62.5}'),
  ('d5a7f3b2-5555-4ccc-a555-000000000005', 'v_ceo_townhall', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/townhall', 'timeupdate',      1800, '2026-03-01T16:30:00Z', 2400, '{"seconds":1800,"duration":2400,"percent":75}'),
  ('d5a7f3b2-5555-4ccc-a555-000000000005', 'v_ceo_townhall', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/townhall', 'timeupdate',      2100, '2026-03-01T16:35:00Z', 2400, '{"seconds":2100,"duration":2400,"percent":87.5}'),
  ('d5a7f3b2-5555-4ccc-a555-000000000005', 'v_ceo_townhall', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/townhall', 'timeupdate',      2280, '2026-03-01T16:38:00Z', 2400, '{"seconds":2280,"duration":2400,"percent":95}'),
  ('d5a7f3b2-5555-4ccc-a555-000000000005', 'v_ceo_townhall', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/townhall', 'pause',           2280, '2026-03-01T16:40:00Z', 2400, '{"seconds":2280,"duration":2400,"percent":95}'),
  ('d5a7f3b2-5555-4ccc-a555-000000000005', 'v_ceo_townhall', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/townhall', 'session_end',     2280, '2026-03-01T16:40:01Z', 2400, '{}');

-- ============================================================
-- EVENTS — Session e9c2d4a1-1111 (fp_d9f3b8, Florence, quick full watch)
-- ============================================================
INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload) VALUES
  ('e9c2d4a1-1111-4ddd-a111-000000000001', 'v_florence', NULL, 'fp_d9f3b8', 'https://vidharbor.com/demos/florence', 'play',        0,  '2026-02-20T13:00:00Z', 15, '{"seconds":0,"duration":15,"percent":0}'),
  ('e9c2d4a1-1111-4ddd-a111-000000000001', 'v_florence', NULL, 'fp_d9f3b8', 'https://vidharbor.com/demos/florence', 'timeupdate',  5,  '2026-02-20T13:00:05Z', 15, '{"seconds":5,"duration":15,"percent":33.33}'),
  ('e9c2d4a1-1111-4ddd-a111-000000000001', 'v_florence', NULL, 'fp_d9f3b8', 'https://vidharbor.com/demos/florence', 'timeupdate',  10, '2026-02-20T13:00:10Z', 15, '{"seconds":10,"duration":15,"percent":66.67}'),
  ('e9c2d4a1-1111-4ddd-a111-000000000001', 'v_florence', NULL, 'fp_d9f3b8', 'https://vidharbor.com/demos/florence', 'ended',       15, '2026-02-20T13:00:15Z', 15, '{"seconds":15,"duration":15,"percent":100}'),
  ('e9c2d4a1-1111-4ddd-a111-000000000001', 'v_florence', NULL, 'fp_d9f3b8', 'https://vidharbor.com/demos/florence', 'session_end', 15, '2026-02-20T13:00:16Z', 15, '{}');

-- ============================================================
-- EVENTS — Session e9c2d4a1-2222 (fp_d9f3b8, AWS Marketplace, partial)
-- ============================================================
INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload) VALUES
  ('e9c2d4a1-2222-4ddd-a222-000000000002', 'v_aws_mktplace', NULL, 'fp_d9f3b8', 'https://vidharbor.com/demos/aws', 'play',        0,  '2026-02-22T14:00:00Z', 83, '{"seconds":0,"duration":83,"percent":0}'),
  ('e9c2d4a1-2222-4ddd-a222-000000000002', 'v_aws_mktplace', NULL, 'fp_d9f3b8', 'https://vidharbor.com/demos/aws', 'timeupdate',  5,  '2026-02-22T14:00:05Z', 83, '{"seconds":5,"duration":83,"percent":6.02}'),
  ('e9c2d4a1-2222-4ddd-a222-000000000002', 'v_aws_mktplace', NULL, 'fp_d9f3b8', 'https://vidharbor.com/demos/aws', 'timeupdate',  30, '2026-02-22T14:00:30Z', 83, '{"seconds":30,"duration":83,"percent":36.14}'),
  ('e9c2d4a1-2222-4ddd-a222-000000000002', 'v_aws_mktplace', NULL, 'fp_d9f3b8', 'https://vidharbor.com/demos/aws', 'seeked',      60, '2026-02-22T14:00:45Z', 83, '{"seconds":60,"duration":83,"percent":72.29}'),
  ('e9c2d4a1-2222-4ddd-a222-000000000002', 'v_aws_mktplace', NULL, 'fp_d9f3b8', 'https://vidharbor.com/demos/aws', 'timeupdate',  70, '2026-02-22T14:01:00Z', 83, '{"seconds":70,"duration":83,"percent":84.34}'),
  ('e9c2d4a1-2222-4ddd-a222-000000000002', 'v_aws_mktplace', NULL, 'fp_d9f3b8', 'https://vidharbor.com/demos/aws', 'pause',       71, '2026-02-22T14:01:05Z', 83, '{"seconds":71,"duration":83,"percent":85.54}'),
  ('e9c2d4a1-2222-4ddd-a222-000000000002', 'v_aws_mktplace', NULL, 'fp_d9f3b8', 'https://vidharbor.com/demos/aws', 'session_end', 71, '2026-02-22T14:01:25Z', 83, '{}');

-- ============================================================
-- EVENTS — Session e9c2d4a1-3333 (fp_d9f3b8, Onboarding, abandoned at 40%)
-- ============================================================
INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload) VALUES
  ('e9c2d4a1-3333-4ddd-a333-000000000003', 'v_onboard_cult', NULL, 'fp_d9f3b8', 'https://intranet.corp.com/onboarding', 'play',        0,   '2026-03-02T10:00:00Z', 720, '{"seconds":0,"duration":720,"percent":0}'),
  ('e9c2d4a1-3333-4ddd-a333-000000000003', 'v_onboard_cult', NULL, 'fp_d9f3b8', 'https://intranet.corp.com/onboarding', 'timeupdate',  60,  '2026-03-02T10:01:00Z', 720, '{"seconds":60,"duration":720,"percent":8.33}'),
  ('e9c2d4a1-3333-4ddd-a333-000000000003', 'v_onboard_cult', NULL, 'fp_d9f3b8', 'https://intranet.corp.com/onboarding', 'timeupdate',  120, '2026-03-02T10:02:00Z', 720, '{"seconds":120,"duration":720,"percent":16.67}'),
  ('e9c2d4a1-3333-4ddd-a333-000000000003', 'v_onboard_cult', NULL, 'fp_d9f3b8', 'https://intranet.corp.com/onboarding', 'seeked',      200, '2026-03-02T10:05:00Z', 720, '{"seconds":200,"duration":720,"percent":27.78}'),
  ('e9c2d4a1-3333-4ddd-a333-000000000003', 'v_onboard_cult', NULL, 'fp_d9f3b8', 'https://intranet.corp.com/onboarding', 'timeupdate',  240, '2026-03-02T10:06:00Z', 720, '{"seconds":240,"duration":720,"percent":33.33}'),
  ('e9c2d4a1-3333-4ddd-a333-000000000003', 'v_onboard_cult', NULL, 'fp_d9f3b8', 'https://intranet.corp.com/onboarding', 'seeked',      100, '2026-03-02T10:08:00Z', 720, '{"seconds":100,"duration":720,"percent":13.89}'),
  ('e9c2d4a1-3333-4ddd-a333-000000000003', 'v_onboard_cult', NULL, 'fp_d9f3b8', 'https://intranet.corp.com/onboarding', 'timeupdate',  180, '2026-03-02T10:10:00Z', 720, '{"seconds":180,"duration":720,"percent":25}'),
  ('e9c2d4a1-3333-4ddd-a333-000000000003', 'v_onboard_cult', NULL, 'fp_d9f3b8', 'https://intranet.corp.com/onboarding', 'timeupdate',  240, '2026-03-02T10:15:00Z', 720, '{"seconds":240,"duration":720,"percent":33.33}'),
  ('e9c2d4a1-3333-4ddd-a333-000000000003', 'v_onboard_cult', NULL, 'fp_d9f3b8', 'https://intranet.corp.com/onboarding', 'timeupdate',  288, '2026-03-02T10:20:00Z', 720, '{"seconds":288,"duration":720,"percent":40}'),
  ('e9c2d4a1-3333-4ddd-a333-000000000003', 'v_onboard_cult', NULL, 'fp_d9f3b8', 'https://intranet.corp.com/onboarding', 'pause',       288, '2026-03-02T10:25:00Z', 720, '{"seconds":288,"duration":720,"percent":40}'),
  ('e9c2d4a1-3333-4ddd-a333-000000000003', 'v_onboard_cult', NULL, 'fp_d9f3b8', 'https://intranet.corp.com/onboarding', 'session_end', 288, '2026-03-02T10:30:00Z', 720, '{}');

-- ============================================================
-- EVENTS — Session a3f9b2e1-1111 (j.smith, Onboarding, 92% watch)
-- ============================================================
INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload) VALUES
  ('a3f9b2e1-1111-4aaa-b111-000000000001', 'v_onboard_cult', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/onboarding', 'play',        0,   '2026-02-10T09:05:00Z', 720, '{"seconds":0,"duration":720,"percent":0}'),
  ('a3f9b2e1-1111-4aaa-b111-000000000001', 'v_onboard_cult', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/onboarding', 'timeupdate',  60,  '2026-02-10T09:06:00Z', 720, '{"seconds":60,"duration":720,"percent":8.33}'),
  ('a3f9b2e1-1111-4aaa-b111-000000000001', 'v_onboard_cult', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/onboarding', 'timeupdate',  180, '2026-02-10T09:08:00Z', 720, '{"seconds":180,"duration":720,"percent":25}'),
  ('a3f9b2e1-1111-4aaa-b111-000000000001', 'v_onboard_cult', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/onboarding', 'timeupdate',  360, '2026-02-10T09:11:00Z', 720, '{"seconds":360,"duration":720,"percent":50}'),
  ('a3f9b2e1-1111-4aaa-b111-000000000001', 'v_onboard_cult', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/onboarding', 'timeupdate',  540, '2026-02-10T09:14:00Z', 720, '{"seconds":540,"duration":720,"percent":75}'),
  ('a3f9b2e1-1111-4aaa-b111-000000000001', 'v_onboard_cult', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/onboarding', 'timeupdate',  660, '2026-02-10T09:16:00Z', 720, '{"seconds":660,"duration":720,"percent":91.67}'),
  ('a3f9b2e1-1111-4aaa-b111-000000000001', 'v_onboard_cult', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/onboarding', 'pause',       662, '2026-02-10T09:17:00Z', 720, '{"seconds":662,"duration":720,"percent":91.94}'),
  ('a3f9b2e1-1111-4aaa-b111-000000000001', 'v_onboard_cult', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/onboarding', 'session_end', 662, '2026-02-10T09:18:00Z', 720, '{}');

-- ============================================================
-- EVENTS — Session a3f9b2e1-6666 (j.smith, CEO Town Hall, 88%)
-- ============================================================
INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload) VALUES
  ('a3f9b2e1-6666-4aaa-b666-000000000006', 'v_ceo_townhall', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/townhall', 'play',            0,    '2026-02-28T16:00:00Z', 2400, '{"seconds":0,"duration":2400,"percent":0}'),
  ('a3f9b2e1-6666-4aaa-b666-000000000006', 'v_ceo_townhall', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/townhall', 'timeupdate',      300,  '2026-02-28T16:05:00Z', 2400, '{"seconds":300,"duration":2400,"percent":12.5}'),
  ('a3f9b2e1-6666-4aaa-b666-000000000006', 'v_ceo_townhall', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/townhall', 'timeupdate',      600,  '2026-02-28T16:10:00Z', 2400, '{"seconds":600,"duration":2400,"percent":25}'),
  ('a3f9b2e1-6666-4aaa-b666-000000000006', 'v_ceo_townhall', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/townhall', 'seeked',          1000, '2026-02-28T16:15:00Z', 2400, '{"seconds":1000,"duration":2400,"percent":41.67}'),
  ('a3f9b2e1-6666-4aaa-b666-000000000006', 'v_ceo_townhall', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/townhall', 'timeupdate',      1200, '2026-02-28T16:20:00Z', 2400, '{"seconds":1200,"duration":2400,"percent":50}'),
  ('a3f9b2e1-6666-4aaa-b666-000000000006', 'v_ceo_townhall', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/townhall', 'timeupdate',      1500, '2026-02-28T16:25:00Z', 2400, '{"seconds":1500,"duration":2400,"percent":62.5}'),
  ('a3f9b2e1-6666-4aaa-b666-000000000006', 'v_ceo_townhall', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/townhall', 'timeupdate',      1800, '2026-02-28T16:30:00Z', 2400, '{"seconds":1800,"duration":2400,"percent":75}'),
  ('a3f9b2e1-6666-4aaa-b666-000000000006', 'v_ceo_townhall', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/townhall', 'bufferstart',     1850, '2026-02-28T16:31:00Z', 2400, '{"seconds":1850}'),
  ('a3f9b2e1-6666-4aaa-b666-000000000006', 'v_ceo_townhall', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/townhall', 'bufferend',       1850, '2026-02-28T16:31:04Z', 2400, '{"seconds":1850,"bufferDuration":4.2}'),
  ('a3f9b2e1-6666-4aaa-b666-000000000006', 'v_ceo_townhall', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/townhall', 'timeupdate',      2100, '2026-02-28T16:38:00Z', 2400, '{"seconds":2100,"duration":2400,"percent":87.5}'),
  ('a3f9b2e1-6666-4aaa-b666-000000000006', 'v_ceo_townhall', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/townhall', 'pause',           2112, '2026-02-28T16:42:00Z', 2400, '{"seconds":2112,"duration":2400,"percent":88}'),
  ('a3f9b2e1-6666-4aaa-b666-000000000006', 'v_ceo_townhall', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/townhall', 'session_end',     2112, '2026-02-28T16:42:01Z', 2400, '{}');

-- ============================================================
-- EVENTS — Session c82e41a0-3333 (fp_b7d2f9, Onboarding, 68%)
-- ============================================================
INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload) VALUES
  ('c82e41a0-3333-4bbb-a333-000000000003', 'v_onboard_cult', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/onboarding', 'play',        0,   '2026-02-20T14:00:00Z', 720, '{"seconds":0,"duration":720,"percent":0}'),
  ('c82e41a0-3333-4bbb-a333-000000000003', 'v_onboard_cult', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/onboarding', 'timeupdate',  60,  '2026-02-20T14:01:00Z', 720, '{"seconds":60,"duration":720,"percent":8.33}'),
  ('c82e41a0-3333-4bbb-a333-000000000003', 'v_onboard_cult', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/onboarding', 'timeupdate',  180, '2026-02-20T14:03:00Z', 720, '{"seconds":180,"duration":720,"percent":25}'),
  ('c82e41a0-3333-4bbb-a333-000000000003', 'v_onboard_cult', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/onboarding', 'timeupdate',  300, '2026-02-20T14:05:00Z', 720, '{"seconds":300,"duration":720,"percent":41.67}'),
  ('c82e41a0-3333-4bbb-a333-000000000003', 'v_onboard_cult', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/onboarding', 'timeupdate',  420, '2026-02-20T14:07:00Z', 720, '{"seconds":420,"duration":720,"percent":58.33}'),
  ('c82e41a0-3333-4bbb-a333-000000000003', 'v_onboard_cult', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/onboarding', 'timeupdate',  490, '2026-02-20T14:09:00Z', 720, '{"seconds":490,"duration":720,"percent":68.06}'),
  ('c82e41a0-3333-4bbb-a333-000000000003', 'v_onboard_cult', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/onboarding', 'pause',       490, '2026-02-20T14:10:00Z', 720, '{"seconds":490,"duration":720,"percent":68.06}'),
  ('c82e41a0-3333-4bbb-a333-000000000003', 'v_onboard_cult', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/onboarding', 'session_end', 490, '2026-02-20T14:10:01Z', 720, '{}');

-- ============================================================
-- EVENTS — Session c82e41a0-4444 (fp_b7d2f9, Benefits, 55%)
-- ============================================================
INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload) VALUES
  ('c82e41a0-4444-4bbb-a444-000000000004', 'v_benefits_2026', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/benefits', 'play',        0,   '2026-02-25T10:00:00Z', 540, '{"seconds":0,"duration":540,"percent":0}'),
  ('c82e41a0-4444-4bbb-a444-000000000004', 'v_benefits_2026', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/benefits', 'timeupdate',  60,  '2026-02-25T10:01:00Z', 540, '{"seconds":60,"duration":540,"percent":11.11}'),
  ('c82e41a0-4444-4bbb-a444-000000000004', 'v_benefits_2026', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/benefits', 'timeupdate',  180, '2026-02-25T10:03:00Z', 540, '{"seconds":180,"duration":540,"percent":33.33}'),
  ('c82e41a0-4444-4bbb-a444-000000000004', 'v_benefits_2026', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/benefits', 'seeked',      250, '2026-02-25T10:04:00Z', 540, '{"seconds":250,"duration":540,"percent":46.30}'),
  ('c82e41a0-4444-4bbb-a444-000000000004', 'v_benefits_2026', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/benefits', 'timeupdate',  297, '2026-02-25T10:05:30Z', 540, '{"seconds":297,"duration":540,"percent":55}'),
  ('c82e41a0-4444-4bbb-a444-000000000004', 'v_benefits_2026', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/benefits', 'pause',       297, '2026-02-25T10:07:00Z', 540, '{"seconds":297,"duration":540,"percent":55}'),
  ('c82e41a0-4444-4bbb-a444-000000000004', 'v_benefits_2026', NULL, 'fp_b7d2f9', 'https://intranet.corp.com/benefits', 'session_end', 297, '2026-02-25T10:07:01Z', 540, '{}');

-- ============================================================
-- EVENTS — Session a3f9b2e1-2222 (j.smith, Benefits, 78%)
-- ============================================================
INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload) VALUES
  ('a3f9b2e1-2222-4aaa-b222-000000000002', 'v_benefits_2026', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/benefits', 'play',        0,   '2026-02-10T10:00:00Z', 540, '{"seconds":0,"duration":540,"percent":0}'),
  ('a3f9b2e1-2222-4aaa-b222-000000000002', 'v_benefits_2026', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/benefits', 'timeupdate',  60,  '2026-02-10T10:01:00Z', 540, '{"seconds":60,"duration":540,"percent":11.11}'),
  ('a3f9b2e1-2222-4aaa-b222-000000000002', 'v_benefits_2026', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/benefits', 'timeupdate',  180, '2026-02-10T10:03:00Z', 540, '{"seconds":180,"duration":540,"percent":33.33}'),
  ('a3f9b2e1-2222-4aaa-b222-000000000002', 'v_benefits_2026', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/benefits', 'timeupdate',  300, '2026-02-10T10:05:00Z', 540, '{"seconds":300,"duration":540,"percent":55.56}'),
  ('a3f9b2e1-2222-4aaa-b222-000000000002', 'v_benefits_2026', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/benefits', 'timeupdate',  420, '2026-02-10T10:07:00Z', 540, '{"seconds":420,"duration":540,"percent":77.78}'),
  ('a3f9b2e1-2222-4aaa-b222-000000000002', 'v_benefits_2026', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/benefits', 'pause',       421, '2026-02-10T10:08:00Z', 540, '{"seconds":421,"duration":540,"percent":77.96}'),
  ('a3f9b2e1-2222-4aaa-b222-000000000002', 'v_benefits_2026', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/benefits', 'session_end', 421, '2026-02-10T10:08:01Z', 540, '{}');

-- ============================================================
-- EVENTS — Session d5a7f3b2-2222 (m.chen, Benefits, full watch)
-- ============================================================
INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload) VALUES
  ('d5a7f3b2-2222-4ccc-a222-000000000002', 'v_benefits_2026', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/benefits', 'play',        0,   '2026-02-16T09:00:00Z', 540, '{"seconds":0,"duration":540,"percent":0}'),
  ('d5a7f3b2-2222-4ccc-a222-000000000002', 'v_benefits_2026', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/benefits', 'timeupdate',  60,  '2026-02-16T09:01:00Z', 540, '{"seconds":60,"duration":540,"percent":11.11}'),
  ('d5a7f3b2-2222-4ccc-a222-000000000002', 'v_benefits_2026', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/benefits', 'timeupdate',  180, '2026-02-16T09:03:00Z', 540, '{"seconds":180,"duration":540,"percent":33.33}'),
  ('d5a7f3b2-2222-4ccc-a222-000000000002', 'v_benefits_2026', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/benefits', 'timeupdate',  360, '2026-02-16T09:06:00Z', 540, '{"seconds":360,"duration":540,"percent":66.67}'),
  ('d5a7f3b2-2222-4ccc-a222-000000000002', 'v_benefits_2026', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/benefits', 'timeupdate',  480, '2026-02-16T09:08:00Z', 540, '{"seconds":480,"duration":540,"percent":88.89}'),
  ('d5a7f3b2-2222-4ccc-a222-000000000002', 'v_benefits_2026', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/benefits', 'ended',       540, '2026-02-16T09:09:00Z', 540, '{"seconds":540,"duration":540,"percent":100}'),
  ('d5a7f3b2-2222-4ccc-a222-000000000002', 'v_benefits_2026', 'm.chen@corp.com', 'fp_c1e5a3', 'https://intranet.corp.com/benefits', 'session_end', 540, '2026-02-16T09:10:00Z', 540, '{}');

-- ============================================================
-- EVENTS — Session d5a7f3b2-4444 (m.chen, AWS Marketplace, full watch)
-- ============================================================
INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload) VALUES
  ('d5a7f3b2-4444-4ccc-a444-000000000004', 'v_aws_mktplace', 'm.chen@corp.com', 'fp_c1e5a3', 'https://vidharbor.com/demos/aws', 'play',        0,  '2026-02-22T15:00:00Z', 83, '{"seconds":0,"duration":83,"percent":0}'),
  ('d5a7f3b2-4444-4ccc-a444-000000000004', 'v_aws_mktplace', 'm.chen@corp.com', 'fp_c1e5a3', 'https://vidharbor.com/demos/aws', 'timeupdate',  30, '2026-02-22T15:00:30Z', 83, '{"seconds":30,"duration":83,"percent":36.14}'),
  ('d5a7f3b2-4444-4ccc-a444-000000000004', 'v_aws_mktplace', 'm.chen@corp.com', 'fp_c1e5a3', 'https://vidharbor.com/demos/aws', 'timeupdate',  60, '2026-02-22T15:01:00Z', 83, '{"seconds":60,"duration":83,"percent":72.29}'),
  ('d5a7f3b2-4444-4ccc-a444-000000000004', 'v_aws_mktplace', 'm.chen@corp.com', 'fp_c1e5a3', 'https://vidharbor.com/demos/aws', 'ended',       83, '2026-02-22T15:01:23Z', 83, '{"seconds":83,"duration":83,"percent":100}'),
  ('d5a7f3b2-4444-4ccc-a444-000000000004', 'v_aws_mktplace', 'm.chen@corp.com', 'fp_c1e5a3', 'https://vidharbor.com/demos/aws', 'session_end', 83, '2026-02-22T15:01:30Z', 83, '{}');

-- ============================================================
-- EVENTS — Session d5a7f3b2-6666 (m.chen, Florence, full watch)
-- ============================================================
INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload) VALUES
  ('d5a7f3b2-6666-4ccc-a666-000000000006', 'v_florence', 'm.chen@corp.com', 'fp_c1e5a3', 'https://vidharbor.com/demos/florence', 'play',        0,  '2026-03-04T11:00:00Z', 15, '{"seconds":0,"duration":15,"percent":0}'),
  ('d5a7f3b2-6666-4ccc-a666-000000000006', 'v_florence', 'm.chen@corp.com', 'fp_c1e5a3', 'https://vidharbor.com/demos/florence', 'timeupdate',  5,  '2026-03-04T11:00:05Z', 15, '{"seconds":5,"duration":15,"percent":33.33}'),
  ('d5a7f3b2-6666-4ccc-a666-000000000006', 'v_florence', 'm.chen@corp.com', 'fp_c1e5a3', 'https://vidharbor.com/demos/florence', 'timeupdate',  10, '2026-03-04T11:00:10Z', 15, '{"seconds":10,"duration":15,"percent":66.67}'),
  ('d5a7f3b2-6666-4ccc-a666-000000000006', 'v_florence', 'm.chen@corp.com', 'fp_c1e5a3', 'https://vidharbor.com/demos/florence', 'ended',       15, '2026-03-04T11:00:15Z', 15, '{"seconds":15,"duration":15,"percent":100}'),
  ('d5a7f3b2-6666-4ccc-a666-000000000006', 'v_florence', 'm.chen@corp.com', 'fp_c1e5a3', 'https://vidharbor.com/demos/florence', 'session_end', 15, '2026-03-04T11:10:00Z', 15, '{}');

-- ============================================================
-- EVENTS — Session a3f9b2e1-5555 (j.smith, Florence, quick watch)
-- ============================================================
INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload) VALUES
  ('a3f9b2e1-5555-4aaa-b555-000000000005', 'v_florence', 'j.smith@corp.com', 'fp_a3c8e1', 'https://vidharbor.com/demos/florence', 'play',        0,  '2026-02-18T16:00:00Z', 15, '{"seconds":0,"duration":15,"percent":0}'),
  ('a3f9b2e1-5555-4aaa-b555-000000000005', 'v_florence', 'j.smith@corp.com', 'fp_a3c8e1', 'https://vidharbor.com/demos/florence', 'timeupdate',  5,  '2026-02-18T16:00:05Z', 15, '{"seconds":5,"duration":15,"percent":33.33}'),
  ('a3f9b2e1-5555-4aaa-b555-000000000005', 'v_florence', 'j.smith@corp.com', 'fp_a3c8e1', 'https://vidharbor.com/demos/florence', 'timeupdate',  10, '2026-02-18T16:00:10Z', 15, '{"seconds":10,"duration":15,"percent":66.67}'),
  ('a3f9b2e1-5555-4aaa-b555-000000000005', 'v_florence', 'j.smith@corp.com', 'fp_a3c8e1', 'https://vidharbor.com/demos/florence', 'ended',       15, '2026-02-18T16:00:15Z', 15, '{"seconds":15,"duration":15,"percent":100}'),
  ('a3f9b2e1-5555-4aaa-b555-000000000005', 'v_florence', 'j.smith@corp.com', 'fp_a3c8e1', 'https://vidharbor.com/demos/florence', 'session_end', 15, '2026-02-18T16:00:16Z', 15, '{}');

-- ============================================================
-- EVENTS — Session a3f9b2e1-7777 (j.smith, Security Training rewatch, 55%)
-- ============================================================
INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload) VALUES
  ('a3f9b2e1-7777-4aaa-b777-000000000007', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'play',            0,   '2026-03-03T09:00:00Z', 1102, '{"seconds":0,"duration":1102,"percent":0}'),
  ('a3f9b2e1-7777-4aaa-b777-000000000007', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'timeupdate',      60,  '2026-03-03T09:01:00Z', 1102, '{"seconds":60,"duration":1102,"percent":5.44}'),
  ('a3f9b2e1-7777-4aaa-b777-000000000007', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'seeked',          300, '2026-03-03T09:03:00Z', 1102, '{"seconds":300,"duration":1102,"percent":27.22}'),
  ('a3f9b2e1-7777-4aaa-b777-000000000007', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'texttrackchange', 305, '2026-03-03T09:03:05Z', 1102, '{"kind":"captions","label":"English","language":"en"}'),
  ('a3f9b2e1-7777-4aaa-b777-000000000007', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'timeupdate',      360, '2026-03-03T09:04:00Z', 1102, '{"seconds":360,"duration":1102,"percent":32.67}'),
  ('a3f9b2e1-7777-4aaa-b777-000000000007', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'timeupdate',      480, '2026-03-03T09:06:00Z', 1102, '{"seconds":480,"duration":1102,"percent":43.56}'),
  ('a3f9b2e1-7777-4aaa-b777-000000000007', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'seeked',          200, '2026-03-03T09:07:00Z', 1102, '{"seconds":200,"duration":1102,"percent":18.15}'),
  ('a3f9b2e1-7777-4aaa-b777-000000000007', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'timeupdate',      300, '2026-03-03T09:09:00Z', 1102, '{"seconds":300,"duration":1102,"percent":27.22}'),
  ('a3f9b2e1-7777-4aaa-b777-000000000007', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'timeupdate',      480, '2026-03-03T09:11:00Z', 1102, '{"seconds":480,"duration":1102,"percent":43.56}'),
  ('a3f9b2e1-7777-4aaa-b777-000000000007', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'timeupdate',      600, '2026-03-03T09:12:00Z', 1102, '{"seconds":600,"duration":1102,"percent":54.45}'),
  ('a3f9b2e1-7777-4aaa-b777-000000000007', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'pause',           606, '2026-03-03T09:12:06Z', 1102, '{"seconds":606,"duration":1102,"percent":54.99}'),
  ('a3f9b2e1-7777-4aaa-b777-000000000007', 'v_sec_train_3', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/security', 'session_end',     606, '2026-03-03T09:12:07Z', 1102, '{}');

-- ============================================================
-- EVENTS — Session a3f9b2e1-8888 (j.smith, Onboarding rewatch, 100%)
-- ============================================================
INSERT INTO events (session_id, video_id, viewer_id, fingerprint_id, embed_url, event_type, playhead, timestamp, video_duration, payload) VALUES
  ('a3f9b2e1-8888-4aaa-b888-000000000008', 'v_onboard_cult', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/onboarding', 'play',            0,   '2026-03-04T14:00:00Z', 720, '{"seconds":0,"duration":720,"percent":0}'),
  ('a3f9b2e1-8888-4aaa-b888-000000000008', 'v_onboard_cult', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/onboarding', 'texttrackchange', 10,  '2026-03-04T14:00:10Z', 720, '{"kind":"captions","label":"English","language":"en"}'),
  ('a3f9b2e1-8888-4aaa-b888-000000000008', 'v_onboard_cult', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/onboarding', 'timeupdate',      60,  '2026-03-04T14:01:00Z', 720, '{"seconds":60,"duration":720,"percent":8.33}'),
  ('a3f9b2e1-8888-4aaa-b888-000000000008', 'v_onboard_cult', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/onboarding', 'timeupdate',      180, '2026-03-04T14:03:00Z', 720, '{"seconds":180,"duration":720,"percent":25}'),
  ('a3f9b2e1-8888-4aaa-b888-000000000008', 'v_onboard_cult', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/onboarding', 'timeupdate',      360, '2026-03-04T14:06:00Z', 720, '{"seconds":360,"duration":720,"percent":50}'),
  ('a3f9b2e1-8888-4aaa-b888-000000000008', 'v_onboard_cult', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/onboarding', 'qualitychange',   400, '2026-03-04T14:07:00Z', 720, '{"quality":"1080p"}'),
  ('a3f9b2e1-8888-4aaa-b888-000000000008', 'v_onboard_cult', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/onboarding', 'timeupdate',      540, '2026-03-04T14:09:00Z', 720, '{"seconds":540,"duration":720,"percent":75}'),
  ('a3f9b2e1-8888-4aaa-b888-000000000008', 'v_onboard_cult', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/onboarding', 'timeupdate',      660, '2026-03-04T14:18:00Z', 720, '{"seconds":660,"duration":720,"percent":91.67}'),
  ('a3f9b2e1-8888-4aaa-b888-000000000008', 'v_onboard_cult', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/onboarding', 'ended',           720, '2026-03-04T14:21:00Z', 720, '{"seconds":720,"duration":720,"percent":100}'),
  ('a3f9b2e1-8888-4aaa-b888-000000000008', 'v_onboard_cult', 'j.smith@corp.com', 'fp_a3c8e1', 'https://intranet.corp.com/onboarding', 'session_end',     720, '2026-03-04T14:22:00Z', 720, '{}');
