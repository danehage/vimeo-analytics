# CLAUDE.md — vimeo-deep-analytics

## Project Overview

A proof-of-concept analytics platform that captures granular player-level events from embedded Vimeo players and displays them inside a dashboard that deliberately mimics Vimeo's own analytics UI — because the end goal is to pitch this to Vimeo product and engineering as a native feature.

**The core pitch:** Vimeo's native analytics shows aggregate views, impressions, and a rough retention estimate. This project captures what actually happens inside a session — every seek, caption toggle, quality change, buffer event, and watch-progress tick — and visualizes it at the account, video, session, and viewer level. None of this data is currently surfaced in Vimeo's dashboard.

**The internal Vimeo pitch:** This mockup demonstrates what a "Deep Analytics" tab would look like inside vimeo.com/analytics if Vimeo shipped it natively. The UI deliberately matches Vimeo's design system (light theme, their sidebar, their color palette, their card patterns) so it looks like it was built by Vimeo's own design team. The argument is: the data exists, the instrumentation is trivial at Vimeo's scale since they control player.js, and there is clear Enterprise monetization potential.

**Primary audiences:**
1. Vimeo product and engineering — internal pitch for a native Deep Analytics feature
2. Enterprise L&D clients embedded on intranets, LMS platforms, SharePoint — who want to know if employees are actually watching training content

**Critical constraint:** The collector snippet only works on pages you control. Videos watched directly on vimeo.com are currently out of scope for the POC — but the native Vimeo version would close this gap entirely since Vimeo controls player.js. Be clear about this distinction in the UI.

---

## Owner / Developer Context

- **Developer:** Dane, Principal Solutions Engineer at Vimeo
- **Primary domain:** `danecast.net` (portfolio hub)
- **Live demo domain:** `vidharbor.com` — collector snippet deployed here on pages with real Vimeo embeds, generates actual live event data for demos
- **Dashboard deployment:** `analytics.danecast.net`
- **Stack:** Cloudflare Workers (API), Cloudflare Pages (frontend), Neon serverless Postgres (database)
- **Infrastructure:** All free tier. Cloudflare DNS/Pages/Workers already in use on other projects. Neon account already exists.

---

## Repository Structure

```
vimeo-deep-analytics/
├── CLAUDE.md                          ← this file
├── README.md
├── schema.sql                         ← full DB schema, run once against Neon
├── seed.sql                           ← seeded mock sessions for demo visual weight
├── .env.example
├── collector/
│   ├── collector.js                   ← snippet dropped on vidharbor.com pages
│   ├── test.html                      ← local test page with embed + snippet
│   └── vimeo-deep-analytics-mockup.jsx ← full UI mockup, visual source of truth
├── worker/
│   ├── package.json
│   ├── wrangler.toml
│   └── src/
│       ├── index.js                   ← Worker entry, routes all requests
│       └── routes/
│           ├── events.js              ← POST /api/events (ingest)
│           └── analytics.js           ← GET /api/analytics/* (all dashboard queries)
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                    ← tab routing, nav state
        ├── hooks/
        │   └── usePolling.js          ← polls analytics endpoints on interval
        ├── components/
        │   ├── layout/
        │   │   ├── Sidebar.jsx
        │   │   ├── TopNav.jsx
        │   │   └── TabBar.jsx
        │   ├── shared/
        │   │   ├── StatCard.jsx
        │   │   ├── EnterpriseStatCard.jsx
        │   │   ├── SectionHeader.jsx
        │   │   ├── MiniBar.jsx
        │   │   ├── FingerprintBadge.jsx
        │   │   └── IdentityBadge.jsx
        │   ├── overview/
        │   │   ├── OverviewTab.jsx
        │   │   ├── RetentionChart.jsx
        │   │   └── EventBreakdown.jsx
        │   ├── videos/
        │   │   └── VideoTable.jsx
        │   ├── sessions/
        │   │   ├── SessionList.jsx
        │   │   ├── SessionDetail.jsx
        │   │   └── SessionScrubber.jsx
        │   ├── viewers/
        │   │   ├── ViewerList.jsx
        │   │   └── ViewerDetail.jsx
        │   ├── engagement/
        │   │   ├── SeekHeatmap.jsx
        │   │   ├── CaptionAdoption.jsx
        │   │   ├── QualityDistribution.jsx
        │   │   └── BufferRates.jsx
        │   └── EventFeed.jsx
        └── constants/
            └── theme.js
```

---

## UI Design — Critical

### This must look like Vimeo built it

The entire point of this mockup is to show Vimeo product/engineering what the feature would look like natively. The dashboard must match Vimeo's actual analytics UI as closely as possible.

**The full mockup lives at `collector/vimeo-deep-analytics-mockup.jsx`.** This is the visual source of truth. Build components by decomposing this file — do not reimagine the design.

### Vimeo Design Tokens

```javascript
// constants/theme.js
export const V = {
  bg:               "#f2f2f0",   // page background (light gray)
  white:            "#ffffff",   // card and sidebar backgrounds
  border:           "#e5e5e3",   // all borders
  borderLight:      "#efefed",   // table row dividers
  teal:             "#1ab7ea",   // Vimeo primary accent
  tealLight:        "#e8f8fd",   // teal at low opacity
  tealMid:          "#b3e8f7",
  text:             "#1a1a1a",
  textMid:          "#444444",
  textMuted:        "#767676",
  textLight:        "#999999",
  active:           "#f0f0ee",   // sidebar active item
  red:              "#e5484d",
  redLight:         "#fff0f0",
  green:            "#30a46c",
  greenLight:       "#f0fdf4",
  amber:            "#f59e0b",
  amberLight:       "#fffbeb",
  purple:           "#8b5cf6",
  purpleLight:      "#f5f3ff",
  enterpriseBg:     "#faf7ff",
  enterpriseBorder: "#ddd0f7",
  enterpriseText:   "#6d28d9",
};
```

### Typography
- Font: `'Aktiv Grotesk', 'Nunito Sans', 'DM Sans', -apple-system, sans-serif`
- Load DM Sans from Google Fonts as fallback
- Monospace for fingerprint IDs and session IDs

### Component Patterns
- **StatCard:** White background, border, 32px bold number, 13px label
- **EnterpriseStatCard:** Same + 3px colored top accent bar + optional NEW badge (tealLight bg, teal text, 9px, 700 weight)
- **ENTERPRISE badge:** teal bg, white text, 10px, 700 weight, "3px 8px" padding
- **Table rows:** hover V.active, cursor pointer
- **Tab active:** 2px solid teal bottom border, fontWeight 600
- **Breadcrumb links:** color teal, cursor pointer, fontWeight 500

---

## Features / Tabs

Five tabs on the Deep Analytics page. Deep Analytics appears at bottom of sidebar nav with teal NEW badge.

### 1. Overview
- Two row groups: "Standard metrics (existing)" and "Deep analytics — new"
- Standard: Views, Unique viewers, Total time watched, Avg. % watched
- Deep (EnterpriseStatCard with colored top accent): Caption adoption (teal), Seek events (purple), Buffer incidents (red), Quality changes (amber)
- Retention curve: dashed gray (standard estimate) vs solid teal area (deep actual) — most important visual for the pitch
- Event breakdown: horizontal progress bars per event type

### 2. By Video
- Sortable table, click header toggles asc/desc
- Standard cols: Video, Views, Unique viewers, Avg. % watched, Finishes
- New cols (NEW badge): Caption adoption, Seek events, Buffer rate

### 3. Sessions
- Filterable by video
- Row: session ID (monospace teal), video, date/time, source badge, watch % with mini bar, captions, seeks, buffers
- Click → SessionDetail drill-down
- **SessionDetail:** breadcrumb, header with quick stats, SessionScrubber, event timeline
- **SessionScrubber:** 100-bucket bar — teal=watched, purple marks=seeks, gray=unwatched. Vertical event marker lines above bar. Time labels at 0/25/50/75/100%.
- **Event timeline:** vertical connector line, icon circles per event type (▶ teal, ⏸ gray, ⏭/⏮ purple, CC green, ⚙ amber, ⧗ red, ✓ green). Label + timestamp + playhead mini bar.
- Insight callouts for notable patterns (rewinds, buffer abandonment)

### 4. Viewers ← opens by default
- Summary: Total viewers, Identified, Anonymous, Avg engagement
- "How it works" enterprise banner explaining fingerprint → retroactive attribution
- Filter: All / Identified / Anonymous
- Table: avatar, identity/fingerprint, status badge, sessions, videos, avg engagement bar, captions, last seen
- Click → ViewerDetail
- **ViewerDetail (identified):** green top gradient, green callout "All N prior sessions retroactively attributed." Quick stats. Videos panel with completion bars. Session history.
- **ViewerDetail (anonymous):** neutral styling, explains attribution fires on identification. Behavioral insight callout if notable pattern.

### 5. Engagement
- Seek heatmap (most replayed sections by segment)
- Caption adoption by video
- Quality distribution
- Buffer rate by video with source badges

### EventFeed
- Toggleable, polls every 3s
- Last 20 events: colored type badge, video ID, playhead, relative time, embed domain

---

## Viewer Identity & Fingerprinting

### How it works

1. Every session starts anonymous. Collector generates `fingerprint_id` from browser signals.
2. Sessions accumulate under the fingerprint.
3. When viewer identifies (login, form submit), host page sets `window.VimeoAnalyticsConfig = { viewerId: 'user@corp.com' }`. Next event fires with viewer_id set.
4. Backend retroactively attributes all sessions under that fingerprint to the viewer_id.

### Fingerprint generation

```javascript
function generateFingerprint() {
  const signals = [
    navigator.userAgent,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.platform,
    navigator.hardwareConcurrency || 'unknown',
    navigator.language,
  ].join('|');
  let hash = 0;
  for (let i = 0; i < signals.length; i++) {
    const char = signals.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'fp_' + Math.abs(hash).toString(36);
}
```

Store in `sessionStorage` (within-tab persistence) and `localStorage` (cross-session continuity).

### Identity resolution endpoint

```
POST /api/identify
Body: { fingerprintId, viewerId, identifiedVia }

UPDATE sessions SET viewer_id, identified_at WHERE fingerprint_id = ? AND viewer_id IS NULL
UPDATE events SET viewer_id WHERE session_id IN (sessions with that fingerprint)
UPDATE viewers SET viewer_id, identified_at WHERE fingerprint_id = ?
→ return { attributed_sessions: N }
```

---

## Database Schema

Run `schema.sql` once against Neon console SQL editor.

```sql
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
```

**Design principles:**
- `payload JSONB` for event-specific data. Query columns always top-level indexed.
- `sessions` separate from `events` — aggregates queried constantly, not recomputed from raw.
- `viewers` materialized profile table — updated on session end and identity resolution.

---

## Event Schema

```json
{
  "event_id":       "uuid",
  "session_id":     "uuid",
  "fingerprint_id": "fp_xxxxxx",
  "video_id":       "string",
  "viewer_id":      "string or null",
  "embed_url":      "window.location.href",
  "event_type":     "string",
  "playhead":       "float (seconds)",
  "timestamp":      "ISO 8601",
  "video_duration": "float",
  "payload":        "object"
}
```

| event_type | payload |
|---|---|
| `play` | `{ seconds, duration, percent }` |
| `pause` | `{ seconds, duration, percent }` |
| `ended` | `{ seconds, duration, percent }` |
| `seeked` | `{ seconds, duration, percent }` |
| `timeupdate` | `{ seconds, duration, percent }` — every 5s only |
| `qualitychange` | `{ quality }` |
| `texttrackchange` | `{ kind, label, language }` |
| `volumechange` | `{ volume, muted }` |
| `bufferstart` | `{ seconds }` |
| `bufferend` | `{ seconds, bufferDuration }` |
| `session_end` | via `navigator.sendBeacon` on beforeunload |

---

## Collector Snippet

`collector/collector.js` — self-contained IIFE, zero dependencies beyond player.js.

- `SESSION_ID`: `crypto.randomUUID()` on page load
- `FINGERPRINT_ID`: `generateFingerprint()`, stored in sessionStorage + localStorage
- `VIDEO_ID`: `player.getVideoId()` async call
- `VIEWER_ID`: `window.VimeoAnalyticsConfig?.viewerId || null`
- `timeupdate` sampled every 5 seconds
- Uses `navigator.sendBeacon` on beforeunload
- Targets first Vimeo iframe, configurable via `VimeoAnalyticsConfig.iframeSelector`

**Drop-in for vidharbor.com** (before `</body>`):
```html
<script src="https://player.vimeo.com/api/player.js"></script>
<script>
  window.VimeoAnalyticsConfig = {
    endpoint: 'https://vimeo-analytics.YOUR_SUBDOMAIN.workers.dev/api/events'
  };
</script>
<script src="/collector.js"></script>
```

Deploy on 2–3 vidharbor.com pages with videos 3+ minutes long for meaningful session data.

---

## Worker API Routes

### wrangler.toml
```toml
name = "vimeo-analytics"
main = "src/index.js"
compatibility_date = "2024-01-01"

[vars]
CORS_ORIGINS = "https://vidharbor.com,https://analytics.danecast.net,http://localhost:5173"
```

### Neon connection (Workers require HTTP driver, not TCP)
```javascript
import { neon } from '@neondatabase/serverless';
const sql = neon(env.DATABASE_URL);
```

`DATABASE_URL` = Neon **direct** connection string (not pooled). Set via `wrangler secret put DATABASE_URL`.

### Routes

```
OPTIONS *                          → CORS preflight 204
POST /api/events                   → ingest event, upsert session, upsert viewer
POST /api/identify                 → retroactive identity attribution
GET  /api/analytics/summary        → account-level KPIs, accepts ?from=&to=
GET  /api/analytics/daily          → sessions/seeks/captions by day
GET  /api/analytics/videos         → per-video rollup table
GET  /api/analytics/retention/:id  → timeupdate buckets → retention curve
GET  /api/analytics/hotspots/:id   → seek destinations → replay heatmap
GET  /api/analytics/quality        → quality distribution
GET  /api/analytics/sessions       → paginated list, accepts ?videoId=
GET  /api/analytics/sessions/:id   → full session with all events
GET  /api/analytics/viewers        → viewer list, accepts ?status=
GET  /api/analytics/viewers/:fp    → full viewer profile
GET  /api/analytics/recent-events  → last 20 events DESC (EventFeed)
```

---

## Seeded vs Live Data

- Seed data inserted into Neon via `seed.sql` — provides visual weight before real sessions exist
- Live sessions from vidharbor.com appear alongside seeded data
- Live sessions get a green `live` source badge in the Sessions tab
- EventFeed only shows real events (polls actual Worker)
- Dashboard code is identical for seeded and real data — all queries hit Neon

---

## Frontend Polling

```javascript
// usePolling(url, intervalMs) → { data, loading, error }
```
- Charts, tables, viewer list: **30 seconds**
- EventFeed: **3 seconds**

---

## Environment Variables

```
# Worker secret (wrangler secret put)
DATABASE_URL

# frontend/.env.local
VITE_API_BASE=http://localhost:8787

# frontend/.env.production
VITE_API_BASE=https://vimeo-analytics.YOUR_SUBDOMAIN.workers.dev
```

---

## Deploy Sequence

```bash
# 1. Run schema.sql in Neon console SQL editor
# 2. Run seed.sql in Neon console SQL editor

# 3. Deploy Worker
cd worker && npm install
wrangler secret put DATABASE_URL
wrangler deploy

# 4. Deploy frontend
cd frontend && npm install && npm run build
# Push to GitHub → Cloudflare Pages auto-deploys

# 5. Add collector snippet to 2–3 vidharbor.com pages
# 6. Set custom domains in Cloudflare dashboard (optional)
#    analytics.danecast.net → Pages
#    api.analytics.danecast.net → Worker
```

---

## Development Workflow

```bash
# Terminal 1
cd worker && wrangler dev        # localhost:8787

# Terminal 2
cd frontend && npm run dev       # localhost:5173
```

Test flow:
1. Start Worker
2. Open `collector/test.html` with embed + collector → `localhost:8787`
3. Interact with video
4. Check Neon: `SELECT * FROM events ORDER BY timestamp DESC LIMIT 10`
5. Verify EventFeed updates within 3s

---

## Demo Script

**Setup:** Dashboard open at `analytics.danecast.net`, Viewers tab active, EventFeed visible. vidharbor.com open in second tab.

1. **Viewers tab** → click `j.smith@corp.com` → point at green "Identity resolved" callout. *"Every session before we knew who this was is now attributed to them. Wistia calls this their killer feature."*

2. **Anonymous viewer fp_b7d2f9** → point at behavioral insight. *"Two failed attempts at Security Training, Spanish captions always on, 540p quality. This is a person who needs a different intervention — not a video problem, a viewer problem."*

3. **Sessions tab** → click #a3f9b2 → show scrubber + event timeline. *"Skipped forward, turned captions on, then rewound to rewatch the 8-minute mark. Something there didn't land the first time."*

4. **Live demo** → interact with vidharbor.com → watch session appear in Sessions list + EventFeed within 3 seconds. *"That was me, just now. None of this is mocked."*

5. **Overview tab** → retention chart → point at gap between dashed and solid lines. *"The dashed line is what Vimeo shows today. The solid line is what we actually captured."*

6. **Close:** *"Vimeo already controls the player. They instrument player.js once and every embed everywhere starts sending this data. Zero infrastructure cost until a customer pays for it. I built this to show you what it looks like the day it ships."*

---

## Competitive Context

**Wistia** is the primary competitive reference for the marketing video use case — session-level analytics, viewer identity stitching, engagement heatmaps.

**This project targets the L&D/internal comms use case** — Vimeo's home turf. The buyer is the L&D manager asking "did my employees actually watch the training?" SCORM covers LMS-tracked completions, not embedded players outside the LMS. This closes that gap natively.

**Business model argument:**
- Feature flag per account, off by default — zero cost until revenue
- Enterprise add-on pricing
- Raw event export (Postgres connection) for BI-equipped customers — no Vimeo BI buildout required
- Start with one design partner customer as proof point

---

## What This Is Not

- Not a replacement for Vimeo's native analytics — additive
- Not a product being sold — proof of concept and internal pitch tool
- Not a BI implementation — clean schema is the deliverable for client data teams
- Not dependent on Vimeo API credentials — runs off player.js browser events only
- Not a privacy risk — viewer_id null by default, fingerprinting uses only browser signals, no PII stored unless host page explicitly injects a viewer ID
