# Vimeo Deep Analytics

A proof-of-concept analytics platform that captures granular player-level events from embedded Vimeo players and visualizes them in a dashboard that deliberately mimics Vimeo's native analytics UI. Built as an internal pitch tool to demonstrate what a "Deep Analytics" feature would look like if Vimeo shipped it natively.

**Live dashboard:** [analytics.danecast.net](https://analytics.danecast.net)
**Live collector demo:** [vidharbor.com/danecast](https://www.vidharbor.com/danecast) — real Vimeo embeds instrumented with the collector, generating live session data

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

## Live Data Flow

The dashboard displays **real, live data** — not mocked. Here's how it works end-to-end:

1. A Vimeo video is embedded on a page (e.g., [vidharbor.com/danecast](https://www.vidharbor.com/danecast))
2. A one-line JS loader injects the collector, which hooks into Vimeo's Player.js API
3. Every player interaction (play, pause, seek, caption toggle, quality change, buffer) fires an event to the Worker API via `sendBeacon`
4. The Worker ingests events into Neon Postgres, upserting session and viewer records
5. The dashboard at [analytics.danecast.net](https://analytics.danecast.net) polls the API and displays live data across all tabs

The collector is hosted by the Worker itself at `/collector.js`, so deploying to any page requires only a small inline script — no external file hosting needed.

---

## Features

### Six Dashboard Tabs — All Wired to Live API

**Overview** — Account-level KPIs pulled from `/api/analytics/summary`: views, unique viewers, total watch time, avg % watched, caption adoption, seek events, high buffer sessions (>3% buffer time threshold), quality changes. Includes a retention curve and event breakdown chart. All stats update in real time as new sessions come in.

**By Video** — Sortable table fetched from `/api/analytics/videos` with standard columns (views, unique viewers, avg %, finishes) plus deep analytics columns with caption adoption, seek events, and high buffer %. Click any video to drill into a detail page with aggregate stats and a filtered session list.

**Sessions** — Live session list from `/api/analytics/sessions` with drill-down into individual sessions. Sessions from instrumented pages (like vidharbor.com) get a green `live` badge. Each session detail page fetches full event data from `/api/analytics/sessions/:id` and includes:
- A visual "scrub map" showing exactly what was watched, skipped, and rewound
- A full event timeline with every player interaction
- Dynamic insight callouts based on actual patterns (e.g., multiple buffer events + early abandonment, or seeks combined with caption usage suggesting comprehension difficulty)

**Viewers** — Viewer list from `/api/analytics/viewers` with fingerprint-based tracking and retroactive identity resolution. Summary stats (total, identified, anonymous, avg engagement) come from the API. When a viewer logs in, all prior anonymous sessions are attributed to them. Per-viewer profiles fetch from `/api/analytics/viewers/:fp` with video history, session history, and engagement patterns.

**Live Events** — For Vimeo live streams. Shows currently-streaming events with a pulsing red LIVE badge, current viewer count, and a "Currently Watching" panel with per-viewer metrics (quality, captions, buffers, experience indicator). Past live events are listed in a table with aggregate stats and a retention chart once the stream ends. Polls `/api/analytics/live-events` every 10 seconds. To tag a stream as live, set `VimeoAnalyticsConfig.isLive = true` in the collector config.

**Engagement** — Seek heatmap (most replayed sections), caption adoption by video, quality distribution, and buffer rates with source badges.

### Live Event Feed
A toggleable real-time event feed that polls `/api/analytics/recent-events` every 3 seconds, showing the last 20 events with colored type badges, video IDs, playhead positions, and embed domains.

### Viewer Identity Resolution
1. Every session starts anonymous with a browser fingerprint
2. Sessions accumulate under the fingerprint
3. When a viewer identifies (login, form submit), the host page sets `window.VimeoAnalyticsConfig.viewerId`
4. Backend retroactively attributes all sessions under that fingerprint to the viewer via `POST /api/identify`

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
│       ├── index.js                   # Worker entry, routes + serves collector.js
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
        │   │   ├── OverviewTab.jsx     # Fetches /api/analytics/summary
        │   │   ├── RetentionChart.jsx
        │   │   └── EventBreakdown.jsx  # Fetches event counts from API
        │   ├── videos/
        │   │   ├── VideoTable.jsx      # Fetches /api/analytics/videos
        │   │   └── VideoDetail.jsx     # Video drill-down with stats + sessions
        │   ├── sessions/
        │   │   ├── SessionList.jsx     # Fetches /api/analytics/sessions
        │   │   ├── SessionDetail.jsx   # Fetches /api/analytics/sessions/:id
        │   │   └── SessionScrubber.jsx
        │   ├── viewers/
        │   │   ├── ViewerList.jsx      # Fetches /api/analytics/viewers
        │   │   └── ViewerDetail.jsx    # Fetches /api/analytics/viewers/:fp
        │   ├── live/
        │   │   └── LiveEventsTab.jsx   # Live events list + detail + retention chart
        │   ├── engagement/
        │   │   ├── SeekHeatmap.jsx
        │   │   ├── CaptionAdoption.jsx
        │   │   ├── QualityDistribution.jsx
        │   │   └── BufferRates.jsx
        │   └── EventFeed.jsx           # Fetches /api/analytics/recent-events (3s)
        └── constants/
            └── theme.js
```

---

## Collector Snippet

The collector is served directly by the Worker at `/collector.js`. For pages where you can inject a `<script>` tag:

```html
<script src="https://player.vimeo.com/api/player.js"></script>
<script>
  window.VimeoAnalyticsConfig = {
    endpoint: 'https://vimeo-analytics.hagemann-dane.workers.dev/api/events'
  };
</script>
<script src="https://vimeo-analytics.hagemann-dane.workers.dev/collector.js"></script>
```

For page builders that only allow a JS code block (no `<script>` tags), use this one-liner that dynamically loads everything:

```js
var p=document.createElement('script');p.src='https://player.vimeo.com/api/player.js';p.onload=function(){window.VimeoAnalyticsConfig={endpoint:'https://vimeo-analytics.hagemann-dane.workers.dev/api/events'};function tryLoad(){if(document.querySelector('iframe[src*="vimeo.com"]')){var c=document.createElement('script');c.src='https://vimeo-analytics.hagemann-dane.workers.dev/collector.js';document.head.appendChild(c)}else{setTimeout(tryLoad,500)}}tryLoad()};document.head.appendChild(p);
```

This version polls for the Vimeo iframe (in case the page builder renders it asynchronously) before loading the collector.

**Captured events:** play, pause, ended, seeked, timeupdate (every 5s), qualitychange, texttrackchange, volumechange, bufferstart, bufferend, session_end (via `navigator.sendBeacon` on page unload).

**For identified viewers** (after login or form submit):
```js
window.VimeoAnalyticsConfig = {
  endpoint: 'https://vimeo-analytics.hagemann-dane.workers.dev/api/events',
  viewerId: 'user@company.com'
};
```

**For live streams:**
```js
window.VimeoAnalyticsConfig = {
  endpoint: 'https://vimeo-analytics.hagemann-dane.workers.dev/api/events',
  isLive: true
};
```

---

## API Endpoints

### Ingest
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/events` | Ingest player event, upsert session + viewer + video |
| POST | `/api/identify` | Retroactive identity attribution |

### Analytics (Dashboard queries)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/analytics/summary` | Account-level KPIs. Accepts `?from=&to=` |
| GET | `/api/analytics/daily` | Sessions/seeks/captions by day |
| GET | `/api/analytics/videos` | Per-video rollup table |
| GET | `/api/analytics/retention/:id` | Retention curve buckets (100 per video) |
| GET | `/api/analytics/hotspots/:id` | Seek destination heatmap (20 buckets) |
| GET | `/api/analytics/quality` | Quality distribution |
| GET | `/api/analytics/sessions` | Paginated session list. Accepts `?videoId=&page=&limit=` |
| GET | `/api/analytics/sessions/:id` | Full session with all events |
| GET | `/api/analytics/viewers` | Viewer list with summary. Accepts `?status=all\|identified\|anonymous` |
| GET | `/api/analytics/viewers/:fp` | Full viewer profile with sessions, videos, recent events |
| GET | `/api/analytics/live-events` | Live event videos with active status and aggregate stats |
| GET | `/api/analytics/live-events/:id` | Live event detail with active viewers and per-session metrics |
| GET | `/api/analytics/recent-events` | Last 20 events (EventFeed) |

### Static Assets
| Method | Path | Description |
|--------|------|-------------|
| GET | `/collector.js` | Serves the collector snippet (cached 5 min) |

---

## Database Schema

Four tables in Neon serverless Postgres:

- **events** — Raw player events with session/video/viewer linkage and JSONB payload. UUIDs auto-generated by Postgres.
- **sessions** — Aggregated session records (not recomputed from events). Upserted on every event.
- **viewers** — Materialized viewer profiles updated on every event and on identity resolution.
- **videos** — Video metadata (title, duration, is_live flag). Upserted from event payloads. Once a video is tagged live, it stays live.

See `schema.sql` for the full schema with indexes.

---

## Design System

The UI uses a dark theme matching Vimeo's live analytics dashboard at vimeo.com/analytics, so it looks like it was built by Vimeo's design team. Color tokens were extracted directly from the production site.

| Token | Value | Usage |
|-------|-------|-------|
| `bg` | `#0e1216` | Page background |
| `white` | `#151b21` | Card/panel backgrounds |
| `tableHeaderBg` | `#1d242c` | Table headers, input backgrounds |
| `teal` | `#03c1eb` | Vimeo primary accent |
| `text` | `#f9fafb` | Primary text |
| `textMid` | `#e4e9ef` | Secondary text |
| `textMuted` | `#b6c0cc` | Muted text |
| `textLight` | `#7282a3` | Disabled/hint text |
| `border` | `rgba(114,130,163,0.12)` | All borders (subtle) |
| `active` | `rgba(190,227,248,0.16)` | Hover/active highlights |
| `purple` | `#8b5cf6` | Seek events |
| `red` | `#e5484d` | Buffer incidents |
| `green` | `#30a46c` | Completions, identified viewers |
| `amber` | `#f59e0b` | Quality changes, warnings |

Card border-radius: 12px. Font stack: Aktiv Grotesk, Nunito Sans, DM Sans, system sans-serif.

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
3. Optionally run `seed.sql` for demo data

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
# Push to GitHub — Cloudflare Pages auto-deploys from main
```

### Collector
Add the one-liner JS snippet (see Collector Snippet section above) to any page with a Vimeo embed. For page builders like VidHarbor, paste it into the custom JS section.

---

## Live Deployments

| Service | URL |
|---------|-----|
| Dashboard | [analytics.danecast.net](https://analytics.danecast.net) |
| Worker API | [vimeo-analytics.hagemann-dane.workers.dev](https://vimeo-analytics.hagemann-dane.workers.dev) |
| Collector demo | [vidharbor.com/danecast](https://www.vidharbor.com/danecast) |
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
