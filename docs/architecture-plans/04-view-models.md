# Plan 04 — Session & Viewer View-Models

Status: Draft (background-agent generated, awaiting grilling)

## 1. The Duplication

Row-shaping logic is repeated across list and detail components.

- `SessionList.jsx` L13–33 — date/time/short-id/source/watched-color
- `SessionDetail.jsx` L52–53, L162, L169, L174, L182, L185, L196–198
- `ViewerList.jsx` L17–30 — date, status, watched-color
- `ViewerDetail.jsx` L22–27, L31–45, L120, L148, L152, L174, L180

Concrete duplications:
1. Date: `toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })` — 8+ sites.
2. Time: `toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' })` — 4 sites.
3. Short ID: `session_id?.slice(0,6)` — 3 sites.
4. Watched-pct color thresholds: `pct>=80?green:pct>=40?teal:amber` — 5 sites.
5. Status: `viewer_id ? 'identified' : 'anonymous'` — repeated.
6. Source: `embed_url ? 'embed' : 'direct'` + `embed_url?.includes('vidharbor.com')` — 2 sites.

**Deletion test:** removing the duplication concentrates ~300 lines of conditional logic into ~50 lines of shared helpers. Threshold change today = 5 edits.

---

## 2. Two Choices

### Choice A — API returns view-models

Worker pre-formats dates, infers status, colors. Frontend just renders.

- **Test surface:** worker output → assert formatted strings (brittle to locale).
- **Coupling:** color thresholds drift between SQL and `theme.js`.
- **Cost:** every threshold tweak = Worker deploy.

### Choice B — Frontend view-model modules (recommended)

```
frontend/src/models/
├── sessionViewModel.js   // toSessionView(row)
├── viewerViewModel.js    // toViewerView(row)
├── colorHelpers.js       // colorForWatchedPct, colorForCaptions, …
├── formatHelpers.js      // formatDate, formatTime
├── sourceHelpers.js      // inferSource, isLive, inferStatus
└── __tests__/
```

**Interfaces:**

```javascript
// sessionViewModel.js
toSessionView(row) → {
  shortId, sessionId, dateFormatted, timeFormatted,
  source, isLiveSession, status,
  watchedPctColor, captionAdoptionColor,
  videoTitle, watchedPct, seeks, buffers,
}

// colorHelpers.js
export const COLOR_THRESHOLDS = {
  watchedPct: [
    { min: 80, color: V.green },
    { min: 40, color: V.teal },
    { min: 0,  color: V.amber },
  ],
  captions: [ … ],
  seeks: [ … ],
};
colorForWatchedPct(pct: number): string
colorForCaptions(count: number): string
colorForSeeks(count: number): string

// formatHelpers.js
formatDate(iso): string   // 'Mar 14, 2025' or '—'
formatTime(iso): string   // '2:30 PM' or ''

// sourceHelpers.js
inferSource(embedUrl): 'embed'|'direct'
isLive(embedUrl): boolean
inferStatus(viewerId): 'identified'|'anonymous'
```

**Component usage:**

```javascript
import { toSessionView } from '../../models/sessionViewModel';
const sessions = (data?.sessions || []).map(toSessionView);
// JSX uses s.shortId, s.dateFormatted, s.watchedPctColor directly
```

---

## 3. Recommendation: Choice B

- Color and date logic *are* UI concerns — frontend owns them.
- Threshold tweaks land in one file.
- Pure functions = fast unit tests.
- API stays pure data — easier to expose to BI as raw export (one of the pitch points).
- Pitch line works either way: "API returns data, view layer shapes it" matches how Vimeo would build this natively.

---

## 4. Migration Sequence

1. Create `formatHelpers`, `sourceHelpers`, `colorHelpers` with tests.
2. Create `toSessionView` and `toViewerView` composing the helpers.
3. Refactor one component at a time: SessionList → SessionDetail → ViewerList → ViewerDetail.
4. Visual regression: compare screenshots before/after.

---

## 5. Open Questions

1. **Color source-of-truth:** import `V.*` from `theme.js` into `colorHelpers`, or replicate? (Rebranding cost.)
2. **Locale:** hard-code `en-US` or accept a config? For internal L&D it's probably fine. Vimeo would i18n.
3. **Caption color semantics:** "captions enabled on session" (list) vs "caption adoption %" (overview) — same thresholds or different?
4. **Seek threshold:** SessionList highlights at `>2`, SessionDetail uncolored. Unify?
5. **API parity:** when Vimeo ships natively, do they own view-models server-side? Does our POC need to model that or stay client-shaped?
6. **Performance:** 100+ rows × `toSessionView` — negligible, but worth a quick benchmark before locking in?
