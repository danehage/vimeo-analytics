# Plan 05 — Route Module (`useRoute`)

Status: Draft (background-agent generated, awaiting grilling)

## 1. Current State

### URL shapes
- `#/dashboard` — fallback dashboard
- `#/deep/{tab}` — main tabs (overview | videos | sessions | viewers | engagement | live-events)
- `#/deep/sessions/{sessionId}` — session detail
- `#/deep/viewers/{viewerFp}` — viewer detail
- `#/deep/videos/{videoId}` — video detail
- `#/` or invalid → falls back to `#/deep/viewers`

### Mirror functions (`App.jsx` L28–57)
- `buildHash` priority chain: dashboard → sessionId → viewerFp → videoId → tab.
- `parseHash` extracts parts, validates tabs against `VALID_TABS`, silent fallback on anything invalid.

### `skipPush` ref dance (L79–125)
- `popstate` sets `skipPush.current = true`.
- Effects watching `activeNav`, `activeTab`, `selectedSession`, `selectedViewer`, `selectedVideo` then push/replace state.
- `skipPush` guards re-push during popstate.
- Bug it prevents: infinite loop parseHash → setState → pushState → popstate → parseHash.

### Silent-fallback cases
- Unknown tab → "viewers"
- Invalid path → dashboard
- Invalid detail IDs → blank render via JSX conditionals (not routing)

---

## 2. Two Paths

### Path A — Custom `useRoute()` hook

```javascript
const { current, go } = useRoute();
// current: { nav, tab, sessionId, viewerFp, videoId }
// go(partial): merges + validates + syncs hash
```

- ~100 LOC. Zero deps.
- Owns hash format end-to-end.
- Replicates browser history (popstate / pushState / replaceState).

### Path B — React Router v6

- ~40KB gzipped.
- Declarative `<Routes>` block.
- Scroll restoration, lazy loading for free.
- Hash routing less idiomatic (built around history API).
- Overkill for 5 tabs + 3 detail views.

### Path C — Wouter

- ~4KB. Smaller surface; sufficient for this scope.

---

## 3. Recommendation: Path A

- POC scale (5 tabs, 3 detail views) — a router library is overhead.
- Hash routing is deliberate (Cloudflare Pages, no server-side route awareness needed).
- No dependency churn.
- ~100 LOC is testable, owned, grep-able.

---

## 4. Design Sketch

`frontend/src/hooks/useRoute.js`

```javascript
export function useRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  const skipPush = useRef(false);

  useEffect(() => {
    if (skipPush.current) { skipPush.current = false; return; }
    const hash = buildHash(route);
    window.history.pushState(null, '', hash);
  }, [route]);

  useEffect(() => {
    const onPop = () => {
      skipPush.current = true;
      setRoute(parseHash(window.location.hash));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = useCallback((partial) => {
    setRoute(prev => validate({ ...prev, ...partial }));
  }, []);

  return { current: route, go };
}

function validate(route) {
  const detailCount = [route.sessionId, route.viewerFp, route.videoId].filter(Boolean).length;
  if (detailCount > 1) throw new Error(`Invalid route: multiple detail views (${detailCount})`);
  if (route.tab && !VALID_TABS.includes(route.tab)) return { ...route, tab: 'viewers' };
  return route;
}
```

`App.jsx` usage:

```javascript
const { current, go } = useRoute();

const handleTabChange = (id) =>
  go({ tab: id, sessionId: null, viewerFp: null, videoId: null });

const handleSelectSession = (s) =>
  go({ tab: 'sessions', sessionId: s.session_id });
```

---

## 5. Migration Sequence

1. Extract `buildHash` / `parseHash` into `useRoute.js`; add `validate`.
2. Build `useRoute`; test against current App.jsx state shape.
3. Replace 5 `useState` calls in App with `useRoute() + go`.
4. Delete `skipPush` ref, `isInitial` ref, manual popstate / pushState code.
5. Verify back/forward, invalid hash, detail view transitions, date-range preservation.

---

## 6. Open Questions

1. **Invalid route handling:** `go({ invalidTab })` — throw or silent-correct? Today: silent-correct. Permissive vs fail-fast.
2. **Detail view stacking:** validation prevents multiple detail IDs; JSX also does. One source of truth?
3. **Date range in URL?** Currently App state only. If we want shareable filtered views, `?from=…&to=…` would need querystring support in `useRoute`.
4. **Tab memory on nav change:** `handleNavChange` clears all detail state. Should it remember last tab?
5. **Test isolation:** test `useRoute` against jsdom popstate, or only via App integration?
6. **Querystring support:** add now or YAGNI until date filters go in URL?
