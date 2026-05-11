# Plan 06 — ViewerIdentity Module (Collector + Worker)

Status: Draft (background-agent generated, awaiting grilling)

**Strategic note:** This is the demo's headline feature. CLAUDE.md frames it as the Wistia-killer: "Every session before we knew who this was is now attributed to them." The module deserves disproportionate care.

---

## 1. Current Flow

### Collector (`collector.js` L1–80)

- **L10–27** `generateFingerprint()` — deterministic hash from UA, screen, timezone, platform, CPU cores, language.
- **L30–38** `getFingerprint()` — sessionStorage → localStorage → generate. Dual-persist.
- **L40–41** Module-level: `SESSION_ID` (per page-load UUID), `FINGERPRINT_ID` (persisted).
- **L50–66** `getViewerId()` — polls `VimeoAnalyticsConfig.viewerId`; falls back to localStorage `vidharbor_viewer`.
- **L68–80** `sendEvent()` — reads viewer fresh on every event. Early events `viewer_id=null`, later events `viewer_id=set` once identification fires.

**Key insight:** Fingerprint is per-browser. Viewer is read *fresh on every event*. That's what enables retroactive attribution — the `/api/identify` backfill closes the gap.

### Worker

**`POST /api/events`** (events.js L43–133):
- L78–86 session upsert: `viewer_id = COALESCE(${viewer_id}, sessions.viewer_id)` — preserves existing attribution.
- L91–103 viewer upsert: merge `viewer_id` if present.

**`POST /api/identify`** (events.js L135–170):
- L143–148 `UPDATE sessions SET viewer_id, identified_at, identified_via WHERE fingerprint_id=? AND viewer_id IS NULL`
- L152–157 For each session, `UPDATE events SET viewer_id WHERE session_id IN (?)`
- L160–164 `UPDATE viewers SET viewer_id, identified_at, identified_via`
- Returns `attributed_sessions` count.

### Race exposures

1. Session created with `viewer_id=null`.
2. Events flow with null.
3. `/api/identify` fires concurrently with in-flight event.
4. Final state correct; intermediate query windows see mixed state.

---

## 2. Proposed Modules

### 2.1 Collector-side `Identity`

`collector/modules/identity.js`

```javascript
export class Identity {
  constructor(config = {}, storage = new BrowserStorage()) { … }

  fingerprint(): string
    // deterministic per browser (or per embedDomain if salted)
    // persists until localStorage cleared
    // never changes mid-session

  viewer(): string | null
    // polls VimeoAnalyticsConfig.viewerId
    // falls back to localStorage 'vidharbor_viewer'
    // can transition null → string (once)

  onIdentify(cb: (viewerId, fingerprint) => void): void
    // fires once when viewer() transitions null → string

  resolveIdentity(): { fingerprint, viewer, identified }
    // synchronous snapshot for event payload
}
```

**Invariants:**
- Fingerprint immutable per browser session.
- Viewer null → string transition is idempotent thereafter.
- Storage priority: sessionStorage > localStorage > regenerate.
- Identity resolution is synchronous — no internal races.

### 2.2 Worker-side `IdentityResolver`

`worker/src/modules/identity-resolver.js`

```javascript
export class IdentityResolver {
  constructor(sql) { … }

  async resolveIdentity(fingerprintId, viewerId, identifiedVia = 'api')
    → { ok, attributedSessions, viewerState, errors? }
}
```

**Invariants:**
- **Idempotent:** same `(fp, viewer)` twice = no-op after first.
- **Atomic:** all 3 UPDATEs succeed or none (transaction boundary).
- **No double attribution:** a viewer cannot be attributed to two fingerprints (open Q5).
- **Temporal:** `identified_at` ≤ all attributed session `ended_at`.

**Internal sequence:**
1. Validate inputs.
2. Begin tx.
3. `UPDATE sessions … RETURNING session_id`.
4. `UPDATE events WHERE session_id IN (?)`.
5. `UPDATE viewers`.
6. Commit.
7. Return count + viewer snapshot.

---

## 3. Test Surface (no HTTP, no browser)

1. Same browser signals → same fingerprint.
2. Different signals → different fingerprints.
3. `viewer()` null when `VimeoAnalyticsConfig.viewerId` absent.
4. `viewer()` returns config value when present.
5. `onIdentify` fires once on null → string transition.
6. `onIdentify` does not fire if viewer already set at construction.
7. Storage fallback chain (session → local → regenerate).
8. 5 anonymous sessions + identify → 5 attributed.
9. Identify with already-known viewer = no-op.
10. Identify unknown fingerprint → creates viewers row, 0 sessions.
11. Invalid input (null fingerprint) → error, no UPDATE.
12. Race: events arrive during identify → eventual consistency holds.

---

## 4. Migration Sequence

**Phase 1 — Extract, behavior-preserving**
- Move `generateFingerprint` / `getFingerprint` / `getViewerId` into `collector/modules/identity.js`.
- `collector.js` instantiates `new Identity(CONFIG, new BrowserStorage())`.
- Move `handleIdentify` logic into `IdentityResolver`.
- Wire from `worker/src/routes/events.js` and `index.js`.

**Phase 2 — Test coverage**
- Unit tests for `Identity` (mocked storage).
- Unit tests for `IdentityResolver` (in-memory SQL or test DB).
- Integration test: full collector → worker flow.

**Phase 3 — Edge cases**
- Idempotency guard before UPDATE.
- Transaction boundary across 3 UPDATEs.
- JSDoc on race-condition guarantees.

**Phase 4 — Doc + deploy**
- Update CLAUDE.md with `Identity` interface.
- Deploy. Monitor identify failures.

---

## 5. Open Questions

1. **Salting:** fingerprint per-embed-domain (so vidharbor.com and internal-client.com don't collide), or global cross-domain tracking?
2. **Consistency guarantee:** eventual (events in flight may briefly be null) or transactional (identify blocks until quiesced)?
3. **Identify idempotency:** documented + guarded, or accept current implicit behavior?
4. **Collision rate:** what's the real-world collision rate of the 7-signal hash? Have we profiled?
5. **Two fingerprints → one viewer:** support a MERGE operation when a person identifies from two browsers?
6. **`identified_at` semantics:** endpoint receipt time or host-page-supplied time?
7. **localStorage eviction:** acceptable to lose continuity, or do we need a server-side fingerprint cookie?
8. **Viewer ID validation:** format/length/regex on the worker? Today: any string accepted.

---

## 6. Why It Matters

This is the only feature in the deck Vimeo's native analytics cannot do. The L&D buyer payoff:

> Deploy a Vimeo embed on the intranet. Employees watch anonymously. Some later log in. We *retroactively* know every prior session they had.

The module must be:
- **Bulletproof** — retroactive attribution is the demo.
- **Testable** — confidence in race-condition handling without prod.
- **Explainable** — the 3-step backfill (sessions → events → viewers) must be obvious in the code.
