# Vimeo Deep Analytics

A proof-of-concept analytics platform that captures granular player-level events from embedded Vimeo players and visualizes them in a dashboard that deliberately mimics Vimeo's native analytics UI. Built as an internal pitch tool to demonstrate what a "Deep Analytics" feature would look like if Vimeo shipped it natively.

**Live dashboard:** [analytics.danecast.net](https://analytics.danecast.net)

---

## The Pitch

Vimeo's native analytics shows aggregate views, impressions, and rough retention estimates. This project captures what actually happens inside a viewing session — every seek, caption toggle, quality change, buffer event, and watch-progress tick — and visualizes it at the account, video, session, and viewer level.

**The argument:** Vimeo already controls `player.js`. They instrument it once and every embed everywhere starts sending this data. Zero infrastructure cost until a customer pays for it. This POC proves the data is valuable and shows what the UI looks like the day it ships.

**Target audience:**
- Vimeo product and engineering — internal pitch for a native Deep Analytics feature
- Enterprise L&D clients on intranets, LMS platforms, SharePoint — who need to know if employees are actually watching training content

---

## Architecture

```
┌──────────────────┐     ┌──────────────────────────┐     ┌──────────────┐
│  Embedded Vimeo  │     │  Cloudflare Worker (API)  │     │  Neon Postgres│
│  Player + snippet│────>│  vimeo-analytics.         │────>│  (serverless) │
│  (collector.js)  │     │  hagemann-dane.workers.dev│     │              │
└──────────────────┘     └──────────┬───────────────┘     └──────────────┘
                                    │
                         ┌──────────v───────────────┐
                         │  Cloudflare Pages (UI)    │
                         │  analytics.danecast.net   │
                         └──────────────────────────┘
```

**Stack:** Cloudflare Workers (API) + Cloudflare Pages (frontend) + Neon serverless Postgres (database). All free tier.

---

## Features

### Five Dashboard Tabs

**Overview** — Standard metrics (views, unique viewers, watch time, avg % watched) alongside new deep analytics metrics (caption adoption, seek events, buffer incidents, quality changes). Features a retention curve comparing Vimeo's standard estimate vs actual deep analytics data.

**By Video** — Sortable table with standard columns (views, unique viewers, avg %, finishes) plus new columns with caption adoption, seek events, and buffer rate per video.

**Sessions** — Filterable session list with drill-down into individual sessions. Each session detail page includes:
- A visual "scrub map" showing exactly what was watched, skipped, and rewound
- A full event timeline with every player interaction
- Insight callouts for notable patterns (rewinds suggesting confusion, buffer-related abandonment)

**Viewers** — Viewer identity management with fingerprint-based tracking and retroactive identity resolution. When a viewer logs in, all prior anonymous sessions are attributed to them. Includes per-viewer profiles with video history, engagement patterns, and behavioral insights.

**Engagement** — Seek heatmap (most replayed sections), caption adoption by video, quality distribution, and buffer rates with source badges.

### Live Event Feed
A toggleable real-time event feed that polls every 3 seconds, showing the last 20 events with colored type badges, video IDs, playhead positions, and embed domains.

### Viewer Identity Resolution
1. Every session starts anonymous with a browser fingerprint
2. Sessions accumulate under the fingerprint
3. When a viewer identifies (login, form submit), the host page sets `window.VimeoAnalyticsConfig.viewerId`
4. Backend retroactively attributes all sessions under that fingerprint to the viewer

---

## Repository Structure

```
vimeo-deep-analytics/
├── CLAUDE.md                          # AI assistant context file
├── README.md                          # This file
├── schema.sql                         # Full DB schema, run once against Neon
├── seed.sql                           # Seeded mock sessions for demo visual weight
├── .env.example
├── collector/
│   ├── collector.js                   # Snippet dropped on embed pages
│   ├── test.html                      # Local test page with embed + snippet
│   └── vimeo-deep-analytics-mockup.jsx # Full UI mockup, visual source of truth
├── worker/
│   ├── package.json
│   ├── wrangler.toml
│   └── src/
│       ├── index.js                   # Worker entry, routes all requests
│       └── routes/
│           ├── events.js              # POST /api/events (ingest) + /api/identify
│           └── analytics.js           # GET /api/analytics/* (all dashboard queries)
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                    # Tab routing, nav state
        ├── hooks/
        │   └── usePolling.js          # Polls analytics endpoints on interval
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

## Collector Snippet

The collector is a self-contained IIFE (`collector/collector.js`) that hooks into the Vimeo Player.js API. Drop it on any page with a Vimeo embed:

```html
<script src="https://player.vimeo.com/api/player.js"></script>
<script>
  window.VimeoAnalyticsConfig = {
    endpoint: 'https://vimeo-analytics.hagemann-dane.workers.dev/api/events'
  };
</script>
<script src="collector.js"></script>
```

**Captured events:** play, pause, ended, seeked, timeupdate (every 5s), qualitychange, texttrackchange, volumechange, bufferstart, bufferend, session_end (via `navigator.sendBeacon` on page unload).

**For identified viewers** (after login or form submit):
```html
<script>
  window.VimeoAnalyticsConfig = {
    endpoint: 'https://vimeo-analytics.hagemann-dane.workers.dev/api/events',
    viewerId: 'user@company.com'
  };
</script>
```

---

## API Endpoints

### Ingest
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/events` | Ingest player event, upsert session + viewer |
| POST | `/api/identify` | Retroactive identity attribution |

### Analytics (Dashboard queries)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/analytics/summary` | Account-level KPIs. Accepts `?from=&to=` |
| GET | `/api/analytics/daily` | Sessions/seeks/captions by day |
| GET | `/api/analytics/videos` | Per-video rollup table |
| GET | `/api/analytics/retention/:id` | Retention curve buckets |
| GET | `/api/analytics/hotspots/:id` | Seek destination heatmap |
| GET | `/api/analytics/quality` | Quality distribution |
| GET | `/api/analytics/sessions` | Paginated session list. Accepts `?videoId=` |
| GET | `/api/analytics/sessions/:id` | Full session with all events |
| GET | `/api/analytics/viewers` | Viewer list. Accepts `?status=` |
| GET | `/api/analytics/viewers/:fp` | Full viewer profile |
| GET | `/api/analytics/recent-events` | Last 20 events (EventFeed) |

---

## Database Schema

Four tables in Neon serverless Postgres:

- **events** — Raw player events with session/video/viewer linkage and JSONB payload
- **sessions** — Aggregated session records (not recomputed from events)
- **viewers** — Materialized viewer profiles updated on session end and identity resolution
- **videos** — Video metadata (title, duration)

See `schema.sql` for the full schema with indexes.

---

## Design System

The UI deliberately matches Vimeo's analytics dashboard so it looks like it was built by Vimeo's design team. Key tokens:

| Token | Value | Usage |
|-------|-------|-------|
| `teal` | `#1ab7ea` | Vimeo primary accent |
| `bg` | `#f2f2f0` | Page background |
| `white` | `#ffffff` | Card backgrounds |
| `border` | `#e5e5e3` | All borders |
| `purple` | `#8b5cf6` | Seek events |
| `red` | `#e5484d` | Buffer incidents |
| `green` | `#30a46c` | Completions, identified viewers |
| `amber` | `#f59e0b` | Quality changes, warnings |

Font stack: Aktiv Grotesk, Nunito Sans, DM Sans, system sans-serif.

---

## Development

```bash
# Terminal 1 — Worker
cd worker && npm install && wrangler dev    # localhost:8787

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev   # localhost:5173
```

Test the collector locally by opening `collector/test.html` — it has a Vimeo embed with the collector snippet and an on-page event log.

---

## Deployment

### Database
1. Create a Neon project at [console.neon.tech](https://console.neon.tech)
2. Run `schema.sql` in the SQL editor
3. Run `seed.sql` for demo data

### Worker
```bash
cd worker && npm install
wrangler secret put DATABASE_URL    # paste your Neon connection string
wrangler deploy
```

### Frontend
```bash
cd frontend && npm install
echo "VITE_API_BASE=https://your-worker.workers.dev" > .env.production
npm run build
wrangler pages deploy dist/ --project-name=vimeo-deep-analytics
```

---

## Live Deployments

| Service | URL |
|---------|-----|
| Dashboard | [analytics.danecast.net](https://analytics.danecast.net) |
| Worker API | [vimeo-analytics.hagemann-dane.workers.dev](https://vimeo-analytics.hagemann-dane.workers.dev) |
| Database | Neon serverless Postgres (us-east-1) |

---

## Competitive Context

**Wistia** is the primary competitive reference — session-level analytics, viewer identity stitching, engagement heatmaps. But Wistia targets marketing video.

**This project targets L&D/internal comms** — Vimeo's home turf. The buyer is the L&D manager asking "did my employees actually watch the training?" SCORM covers LMS-tracked completions, not embedded players outside the LMS. This closes that gap natively.

**Business model:**
- Feature flag per account, off by default — zero cost until revenue
- Enterprise add-on pricing
- Raw event export for BI-equipped customers
- Start with one design partner customer as proof point

---

## What This Is Not

- Not a replacement for Vimeo's native analytics — additive
- Not a product being sold — proof of concept and internal pitch tool
- Not dependent on Vimeo API credentials — runs off player.js browser events only
- Not a privacy risk — viewer_id null by default, fingerprinting uses only browser signals

---

## Critical Constraint

The collector snippet only works on pages you control. Videos watched directly on vimeo.com are out of scope for this POC. The native Vimeo version would close this gap entirely since Vimeo controls player.js.

---

Built by Dane Hagemann, Principal Solutions Engineer at Vimeo.
