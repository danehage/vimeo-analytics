# Plan 03 — Polling Client (`usePolling`)

Status: Draft (background-agent generated, awaiting grilling)

## 1. Current State

`frontend/src/hooks/usePolling.js` — 58 lines.

**Does:** fetch + setInterval + cancellation ref + setError.
**Does not:** retry, backoff, jitter, error classification, stale-while-revalidate, request dedup, pause-on-hidden.

### Call sites

| Component | Path | Interval | On failure today |
|---|---|---|---|
| EventFeed | `/api/analytics/recent-events` | 3s | Falls back to MOCK_EVENTS |
| OverviewTab | `/api/analytics/summary` | 30s | ErrorMessage + manual refetch |
| SessionList | `/api/analytics/sessions` | 30s | ErrorMessage + manual refetch |
| ViewerList | `/api/analytics/viewers` | 30s | ErrorMessage + manual refetch |
| SeekHeatmap | `/api/analytics/hotspots/:id` | 30s | Silent fail |
| VideoTable etc. | Various | 30s | Mixed |

---

## 2. Deletion Test

If inlined, each call site picks up ~50 lines of fetch/interval/cancellation boilerplate. Total ~300 lines across 6 sites. The module **is barely earning its keep** — it's a pass-through hiding the missing behaviour.

---

## 3. Two Paths

### Path A — Delete & inline

Each component owns its fetch, interval, error handling. Visibility wins; ~300 lines added. Per-site retry policy variation (EventFeed aggressive, OverviewTab conservative) becomes natural. No future global features (pause-on-hidden, request dedup) without re-introducing a module.

### Path B — Deepen (recommended)

```javascript
usePolling(path, {
  intervalMs = 30000,
  retryPolicy = { maxRetries: 3, baseBackoffMs: 500, multiplier: 2 },
  cacheMode = 'network-first',   // | 'stale-while-revalidate' | 'cache-only'
  enabled = true,
  onError,                       // (err, classification) => void
})
// returns: { data, loading, error, errorClass, refetch, isPaused }
```

**Error classification:** `{ code: 'NETWORK'|'CLIENT'|'SERVER'|'PARSE', status?, retried }`
- 5xx + network → retry with backoff
- 4xx → fail fast (no retry)
- Parse → fail fast

**Cache modes:**
- `network-first` (default): fetch; serve stale on error
- `stale-while-revalidate`: show stale immediately, update in background — EventFeed wants this
- `cache-only`: no fetch

### Third-party (react-query / SWR)?

**No, not now.** 6 endpoints, POC scope, demo-as-deliverable. Path B gets 90% of the value with zero deps. Bundle stays lean for the pitch.

---

## 4. Recommendation: Path B

1. Path A scatters 300 lines and loses centralization.
2. Path B's ~100 lines added in the hook buys retry, stale-while-revalidate, error classification.
3. Retry+backoff is **critical** for the 3s EventFeed poll — without it, one timeout freezes the feed for 60s+.

---

## 5. Migration Sequence

1. Expand `usePolling` with `retryPolicy`, classification, `cacheMode`. Keep return-object backwards compatible.
2. Update EventFeed to `stale-while-revalidate` + 5 retries at 100ms base.
3. Leave other sites on defaults (network-first, 3 retries).
4. Test under failure: Worker offline, slow network, parse error.
5. Demo: verify EventFeed survives brief Worker outage.

---

## 6. Open Questions

1. **429 (rate limit):** retry or fail-fast?
2. **Cache key:** include query params? Worth implementing now or YAGNI?
3. **Jitter:** add randomized jitter to backoff to avoid thundering herd?
4. **Pause-on-hidden:** default `enabled: !document.hidden`? Saves API calls; adds visibility-state coupling.
5. **Stale-data age threshold:** when does "this data is stale" warrant a UI badge?
6. **Error UX:** keep per-component `<ErrorMessage />`, or expose a callback that a top-level toast can subscribe to?
