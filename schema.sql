CREATE TABLE events (
  event_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL,
  video_id        VARCHAR NOT NULL,
  viewer_id       VARCHAR,
  fingerprint_id  VARCHAR,
  embed_url       TEXT,
  event_type      VARCHAR NOT NULL,
  playhead        FLOAT,
  timestamp       TIMESTAMPTZ NOT NULL,
  video_duration  FLOAT,
  payload         JSONB
);

CREATE TABLE sessions (
  session_id      UUID PRIMARY KEY,
  video_id        VARCHAR NOT NULL,
  viewer_id       VARCHAR,
  fingerprint_id  VARCHAR,
  embed_url       TEXT,
  started_at      TIMESTAMPTZ NOT NULL,
  ended_at        TIMESTAMPTZ,
  percent_watched FLOAT,
  completed       BOOLEAN DEFAULT FALSE,
  identified_at   TIMESTAMPTZ,
  identified_via  TEXT
);

CREATE TABLE viewers (
  fingerprint_id   VARCHAR PRIMARY KEY,
  viewer_id        VARCHAR,
  identified_at    TIMESTAMPTZ,
  identified_via   TEXT,
  first_seen       TIMESTAMPTZ,
  last_seen        TIMESTAMPTZ,
  total_sessions   INTEGER DEFAULT 0,
  total_watch_mins FLOAT DEFAULT 0
);

CREATE TABLE videos (
  video_id   VARCHAR PRIMARY KEY,
  title      TEXT,
  duration   FLOAT,
  created_at TIMESTAMPTZ
);

CREATE INDEX idx_events_video_id      ON events(video_id);
CREATE INDEX idx_events_viewer_id     ON events(viewer_id);
CREATE INDEX idx_events_fingerprint   ON events(fingerprint_id);
CREATE INDEX idx_events_event_type    ON events(event_type);
CREATE INDEX idx_events_timestamp     ON events(timestamp);
CREATE INDEX idx_events_session_id    ON events(session_id);
CREATE INDEX idx_sessions_fingerprint ON sessions(fingerprint_id);
CREATE INDEX idx_sessions_viewer_id   ON sessions(viewer_id);
CREATE INDEX idx_viewers_viewer_id    ON viewers(viewer_id);
