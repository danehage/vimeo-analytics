# Plan 02 — EventIngest Module

Status: Draft (background-agent generated, awaiting grilling)

## 1. Current State

**Location:** `worker/src/routes/events.js` (L1–169)

### What lives there today

- **Validation** (L9–41): 11 rules on shape, type, referential integrity.
- **Event insert** (L58–70): Two-path. Client-supplied `event_id` deduplicates via `ON CONFLICT DO NOTHING`; legacy clients let Postgres generate.
- **Session upsert** (L77–88): Inserts or updates, computes `percent_watched` from playhead/duration, marks `completed` at 95% or on `ended`, tracks `is_new_session`.
- **Viewer upsert** (L91–102): Increments `total_sessions` only when `isNewSession=true`; accumulates `total_watch_mins` only on `session_end`.
- **Video upsert** (L106–129): Lazy oEmbed title fetch; handles live-stream duration fallback via `payload.duration`.

### Key invariants today

- **Idempotency:** Client `event_id` + `ON CONFLICT` silently swallows retries.
- **Live-event gate** (L106): `is_live=true` OR `effectiveDuration>0` → upsert video. A live stream with no duration still creates a row.
- **Session metrics:** `percent_watched` capped at 100%, recomputed per event as max.
- **Viewer bucketing:** Anonymous sessions accumulate under `fingerprint_id`; retroactive attribution happens in `handleIdentify` (L135–169).
- **Order dependence:** Session must exist before viewer upsert uses `isNewSession`.

### What isn't tested

- Duplicate `event_id` idempotency
- Anonymous viewer accumulates N sessions then identifies
- Live → VOD transition mid-session
- oEmbed fetch failure fallback
- Payload JSONB shape per event type
- Concurrent upserts (xmax detection race)
- `total_watch_mins` correctness when `session_end` lags last `timeupdate`

---

## 2. Proposed Module

### Interface

```typescript
type IngestEvent = {
  event_id?: string;        // optional UUID; Postgres generates if absent
  session_id: string;
  video_id: string;
  viewer_id?: string;
  fingerprint_id: string;
  embed_url: string;
  event_type: 'play'|'pause'|'ended'|'seeked'|'timeupdate'|'qualitychange'|'texttrackchange'|'volumechange'|'bufferstart'|'bufferend'|'session_end';
  playhead: number;
  timestamp: ISO8601;
  video_duration: number;   // may be 0 for live
  is_live: boolean;
  payload: Record<string, unknown>;
};

async ingest(event: IngestEvent): Promise<{ eventId, isNewSession, attributedSessions?, error? }>
```

**Ordering guarantee:** validate → event insert (idempotent) → session upsert → viewer upsert (uses isNewSession) → video upsert (lazy oEmbed).

**Error modes:** `ValidationError` (400), `DatabaseError` (500, rolled back), oEmbed timeout (non-fatal, title=null).

### Implementation sketch

Internal seams (one adapter = hypothetical, two = real):

- `EventValidator` — shape + invariants
- `EventStore` — insert, dedupe by event_id
- `SessionStore` — upsert + `isNewSession` flag
- `ViewerStore` — counters
- `VideoStore` — upsert + lazy oEmbed via injected fetcher

```javascript
export class EventIngest {
  constructor(sql, { oembed = fetch, clock = Date } = {}) {
    this.sql = sql;
    this.oembedFetcher = oembed;
    this.clock = clock;
  }

  validate(event) { /* returns { ok, errors? } */ }

  async ingest(event) {
    // 1. validate
    // 2. eventStore.insert
    // 3. sessionStore.upsert → isNewSession
    // 4. viewerStore.upsert(viewer, isNewSession)
    // 5. videoStore.upsert(video) — non-blocking oEmbed
    // return { eventId, isNewSession }
  }
}
```

### Adapters

**HTTP adapter (live):**

```javascript
// worker/src/routes/events.js becomes:
export async function handleEvents(request, sql) {
  const body = await request.json();
  const ingest = new EventIngest(sql);
  try {
    const result = await ingest.ingest(body);
    return Response.json({ ok: true, event_id: result.eventId });
  } catch (err) {
    if (err.name === 'ValidationError') return Response.json({ error: err.message }, { status: 400 });
    throw err;
  }
}
```

**In-memory adapter (test):** Same interface; replaces `sql` with `InMemorySQL` and injects `MockClock`.

---

## 3. Tests That Target The Interface (not HTTP)

1. Anonymous session: 3 events, then 4th with `viewer_id` → all 4 attributed (via separate identify call).
2. Duplicate `event_id` → only 1 row, response identical both times.
3. Live event, `video_duration=0`, `is_live=true` → session row + video row (`is_live=true`, duration=null).
4. `percent_watched` cap: 50% → 90% → 95% (completed=true).
5. Viewer counters: 5 `timeupdate` from new fingerprint → `total_sessions=1`; subsequent `session_end` at 300s → `total_watch_mins=5.0`.
6. oEmbed timeout → video row created, title null, response 200.
7. Live → VOD: first event `is_live=true,duration=0`; later event `is_live=false,duration=3600` → video row updated.
8. Ingest with both fingerprint and viewer_id → `session.identified_at` stays NULL (identity is a separate seam).
9. JSONB round-trip: `qualitychange` `payload={quality:"1080p"}` stored verbatim.
10. Concurrent ingest, same session_id → exactly one `isNewSession=true`.

---

## 4. Migration Sequence

Each step ships independently.

1. Create `worker/src/modules/event-ingest.js`. Validation only. Unit tested.
2. Move event insert into `EventStore`. Confirm dedup works.
3. Move session upsert into `SessionStore`. Confirm `isNewSession`.
4. Wire `SessionStore.isNewSession` into `ViewerStore`. Confirm counters.
5. Move video upsert + oEmbed into `VideoStore`. Confirm non-blocking.
6. Compose all in `EventIngest.ingest`. Integration test on Neon.
7. Swap `handleEvents` to call `ingest.ingest()`. Smoke test against vidharbor.com.

---

## 5. Open Questions

1. **Dependency injection:** EventIngest owns `sql` or accepts it per call? (Lifecycle vs testability.)
2. **Transaction boundary:** Neon serverless HTTP driver doesn't guarantee tx across calls. Atomic across event/session/viewer, or eventual?
3. **oEmbed:** blocking, fire-and-forget, or memoized lazy? Live streams rarely know title upfront.
4. **Live → VOD detection:** Owned by collector (today, `collector.js:129–143`) or moved into VideoStore?
5. **Payload validation:** Per-event-type schema (qualitychange must have `{quality}`)? Or stay free-form JSONB?
6. **Fingerprint + viewer_id race:** Two near-simultaneous events, one anon + one identified — which wins? Today: COALESCE in SQL = non-deterministic.
7. **`total_watch_mins`:** Sum across sessions, or cap at video duration per session? Today: unbounded sum.
8. **Module scope:** EventIngest also owns identity resolution, or `/api/identify` stays separate? (Today: separate.)
