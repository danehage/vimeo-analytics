# Plan 01 — Analytics Query Module

Status: Drafted from grilling session (2026-05-11). Five load-bearing decisions locked; smaller branches still open.

## Decisions Locked

| # | Decision | Why |
|---|---|---|
| Q1 | **Roll our own composer.** No Kysely / Drizzle. | SQL stays grep-able; BI team can read the source; no dependency narrative to defend in the Vimeo pitch. |
| Q2 | **SQL as data.** Module emits `{sql, params}`; execution is a separate seam. | Module becomes a pure function of filter input. Tests assert strings + param arrays in milliseconds. Catches the "branches diverged" bug we're refactoring away from — every divergence is a string diff. |
| Q3 | **Aggregate-once CTE pattern, always.** Every list query includes `WITH counts AS (… GROUP BY session_id) … LEFT JOIN counts`. | One shape, always. The opt-in `include:[...]` filter is exactly the trap we're escaping. |
| Q4 | **Narrow scope.** Sessions, Viewers, Videos lists only. Per-entity files. Summary/daily/retention/hotspots stay in `analytics.js` — they're single-shape and have no friction. | Solve the measured friction; don't deepen things that aren't shallow. |
| Q5 | **Tuple of queries for detail.** `getSessionDetailSql(id)` returns `[{sql,params}, {sql,params}]`; executor `Promise.all`s them. | Honest about "detail is two things." Avoids walking back the Q4 EventQuery decision. Avoids baking page shape into SQL (the trap C in Q5). |

---

## Module Shape

```
worker/src/queries/
├── _composer.js   ← internal: param tracking, WHERE/ORDER/LIMIT helpers
├── _execute.js    ← internal: run / runMany over a neon sql client
├── sessions.js    ← listSessionsSql, getSessionDetailSql
├── viewers.js     ← listViewersSql, getViewerDetailSql
└── videos.js      ← listVideosSql
```

### Public interface (per entity)

```javascript
// queries/sessions.js
export function listSessionsSql(filters: SessionFilters): { sql, params }
export function getSessionDetailSql(sessionId: string): [{ sql, params }, { sql, params }]

// queries/viewers.js
export function listViewersSql(filters: ViewerFilters): { sql, params }
export function getViewerDetailSql(fingerprintId: string): [{ sql, params }, { sql, params }]

// queries/videos.js
export function listVideosSql(filters: VideoFilters): { sql, params }
```

### Filter shapes (proposed; see Open Q)

```typescript
type SessionFilters = {
  videoId?: string;
  dateRange?: { from: Date, to: Date };  // both required if present
  limit?: number;                         // default 50
  offset?: number;                        // default 0
};

type ViewerFilters = {
  status?: 'identified' | 'anonymous';   // undefined = all
  dateRange?: { from: Date, to: Date };
  limit?: number;
  offset?: number;
};

type VideoFilters = {
  dateRange?: { from: Date, to: Date };
  limit?: number;
  offset?: number;
};
```

Absent filters = absent keys. No `null` sentinels.

### Composer internal API (sketch)

```javascript
// _composer.js
export function composer() {
  const params = [];
  const idx = () => '$' + params.length;
  return {
    push(value) { params.push(value); return idx(); },
    build(sqlText) { return { sql: sqlText, params }; },
  };
}

// Used inside list functions:
export function listSessionsSql(filters = {}) {
  const c = composer();
  const where = [];
  if (filters.videoId)   where.push(`s.video_id = ${c.push(filters.videoId)}`);
  if (filters.dateRange) {
    where.push(`s.started_at >= ${c.push(filters.dateRange.from)}`);
    where.push(`s.started_at <  ${c.push(filters.dateRange.to)}`);
  }
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  return c.build(`
    WITH counts AS (
      SELECT session_id,
        count(*) FILTER (WHERE event_type='texttrackchange') AS captions,
        count(*) FILTER (WHERE event_type='seeked')          AS seeks,
        count(*) FILTER (WHERE event_type='bufferstart')     AS buffers
      FROM events
      GROUP BY session_id
    )
    SELECT s.*, c.captions, c.seeks, c.buffers
    FROM sessions s
    LEFT JOIN counts c USING (session_id)
    ${whereClause}
    ORDER BY s.started_at DESC
    LIMIT ${c.push(limit)} OFFSET ${c.push(offset)}
  `);
}
```

### Executor adapter

```javascript
// _execute.js
export async function run(sql, query) {
  return sql(query.sql, query.params);
}
export async function runMany(sql, queries) {
  return Promise.all(queries.map(q => run(sql, q)));
}
```

Routes become thin:

```javascript
// routes/analytics.js  (after refactor)
async function handleSessions(req, sql) {
  const filters = parseSessionFilters(req.url);
  const rows = await run(sql, listSessionsSql(filters));
  return Response.json({ sessions: rows });
}

async function handleSessionDetail(req, sql, sessionId) {
  const [[session], events] = await runMany(sql, getSessionDetailSql(sessionId));
  return Response.json({ session, events });
}
```

---

## Tests That Survive

All target the public interface; no DB, no HTTP.

1. `listSessionsSql({})` — emits full-table query with no WHERE, default LIMIT 50.
2. `listSessionsSql({ videoId: 'v123' })` — WHERE has `video_id = $1`, params = `['v123']`.
3. `listSessionsSql({ dateRange: { from, to } })` — WHERE has both bounds, params has both Dates.
4. `listSessionsSql({ videoId, dateRange })` — both filters AND-ed; params in declaration order.
5. `listSessionsSql({ limit: 10, offset: 20 })` — placeholders for limit/offset; param values correct.
6. **Branch divergence regression:** every combination of (videoId × dateRange × limit) produces the *same* CTE prefix and the *same* ORDER BY. String-diff catches drift instantly.
7. `listViewersSql({ status: 'identified' })` — adds `WHERE viewer_id IS NOT NULL`.
8. `listViewersSql({ status: 'anonymous' })` — adds `WHERE viewer_id IS NULL`.
9. `listViewersSql({})` — no status predicate.
10. `getSessionDetailSql('abc-…')` — returns a 2-tuple. First query selects session by id. Second selects events ordered by timestamp.
11. **Injection probe:** `listSessionsSql({ videoId: "'; DROP TABLE sessions; --" })` — SQL text contains `$1`, params contains the literal string. No interpolation.
12. **No params reused:** every `$N` in the SQL appears exactly once.

---

## Migration Sequence

Each step is one PR. Behavior-preserving. Tests target SQL+params before any route is cut over.

1. **Add `_composer.js` + `_execute.js`.** Unit tests for both. No route changes. No behavior change.
2. **Add `queries/sessions.js`.** Implement `listSessionsSql` + `getSessionDetailSql`. Tests for all known filter combinations match the existing routes' SQL semantically.
3. **Cut over `handleSessions` and `handleSessionDetail`** to use the new module. Manual smoke against vidharbor.com. Delete the 4 branches in `analytics.js`.
4. **Add `queries/viewers.js`.** Implement `listViewersSql` + `getViewerDetailSql`. Tests for status × dateRange combinations.
5. **Cut over `handleViewers` and `handleViewerDetail`.** Delete the 6 branches.
6. **Add `queries/videos.js`** + cut over `handleVideos`.
7. **(Optional)** Move summary/daily/retention/hotspots only if a real friction emerges. Default: leave them alone.

Order rationale: sessions first because it has the worst N+1 divergence (Q3's actual headline bug). Each cut-over reduces analytics.js line count visibly — a useful PR-by-PR demo.

---

## Open Questions (smaller; not blocking)

1. **`dateRange` shape:** `{from, to}` with both required, vs each optional? Open-ended ranges (just `from`, or just `to`) might be useful for "since launch" queries.
2. **Default LIMIT:** 50 chosen arbitrarily. Should it be a per-entity constant in each file, or a composer-level default?
3. **`ORDER BY` configurability:** every list query hard-codes its sort (`sessions` by `started_at DESC`, `viewers` by `last_seen DESC`, `videos` by views DESC?). Configurable via filter object, or compile-time per entity? My read: per-entity until a column-sort table header forces our hand.
4. **Param array vs object:** neon supports both `sql(text, [params])` and `sql(text, {paramObj})`. Array is simpler; object enables named params (`:videoId`). We assumed array — confirm.
5. **Cursor vs offset pagination:** offset is fine for POC scale. Worth flagging that switching to cursor later is a non-breaking change to filter shape (`afterId?` added) but a breaking change to executor results (need to surface the cursor).
6. **Where the executor lives:** `_execute.js` inside `queries/`, or top-level `worker/src/db.js`? Either fine; `_execute` keeps it co-located with the thing being executed.
7. **Migration safety net:** do we keep the old branches running alongside the new module behind a feature flag for one demo, or hot-swap and trust the tests? Hot-swap unless a demo is scheduled inside the migration window.

---

## What This Refactor Buys

- **Locality:** a new filter (e.g. `quality`, `viewerStatus`) lands in one composer addition, one filter type, one set of tests. No branch explosion.
- **Leverage:** every route consumer gets the same CTE-counts shape. The "different N+1 fixes in different branches" failure mode is structurally impossible.
- **Test surface:** the seam *is* the test surface. We test the module without booting the worker, without hitting Neon, without HTTP.
- **Pitch:** when a Vimeo engineer reads `queries/sessions.js`, they see exactly one paragraph of SQL with one paragraph of filter composition. The deletion test passes: removing this module makes complexity reappear across 6+ branches.
