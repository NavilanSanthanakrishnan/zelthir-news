# Zelthir Product Architecture

Date: May 16, 2026
Stage: Production implementation baseline
Owner: Team Zelthir

## 1. Product Summary

Zelthir is a news intelligence app that discovers current coverage, clusters articles about the same event, and turns each story cluster into a structured intelligence view.

The current app has three user-facing surfaces:

- `Pulse`: a news homepage with top clustered stories across sections.
- `Explore`: a personalized discovery flow based on the reader profile.
- `Story Intelligence`: a story detail modal with a grounded brief, claims, disputes, framing, Event Map, watch signals, and ripple effects.

The production baseline uses:

- Express in `server.mjs` for API routes, static serving, refresh orchestration, and Vercel entrypoint behavior.
- Gemini for structured story analysis.
- Postgres for users, sessions, OAuth accounts, login codes, and reader profiles.
- Google OAuth for production sign-in, with development email-code sign-in when enabled.
- NewsAPI, Google News, and RSS discovery providers.

## 2. Current Product Promise

Zelthir turns fragmented news coverage into a best-supported account of events, shows what claims are agreed or disputed, maps related topics and actors, and explains likely near-term effects without presenting speculation as certainty.

## 3. Goals

### Primary Goals

- Deliver a fast, trustworthy news homepage.
- Group related coverage into readable story clusters.
- Show source diversity, evidence confidence, and uncertainty.
- Generate useful story intelligence with Gemini.
- Persist authentication and profile state in Postgres.
- Support production sign-in through Google OAuth.

### Secondary Goals

- Improve personalization as profile data gets richer.
- Expand source coverage without adding fragile custom scraping.
- Keep generated analysis constrained to source-backed story context.

## 4. Non-Goals

- Social feeds, comments, or community moderation.
- Original reporting or investigative journalism.
- Subscription billing or ad infrastructure.
- Dedicated graph database orchestration.
- Local model runtime orchestration.
- Long-range prediction as a separate forecasting product.

## 5. User Personas

### General News Reader

Needs:

- a fast overview of major stories
- a simpler path through repeated coverage

Uses:

- `Pulse`

### Context-Heavy Reader

Needs:

- source comparison
- agreement versus dispute
- a clear explanation of what may happen next

Uses:

- `Story Intelligence`

### Personalized Relevance Reader

Needs:

- stories relevant to their location, interests, and role
- a reason a story matters to them

Uses:

- `Explore`

## 6. Product Surfaces

### Pulse

Purpose:

- broad news homepage
- top stories across major sections

Core UI blocks:

- lead story
- grouped story cards
- source and article counts
- confidence indicator
- refresh state

### Explore

Purpose:

- personalized story discovery
- profile-aware relevance

Core UI blocks:

- sign-in and onboarding state
- interest and location profile data
- personalized story cards
- relevance explanations

### Story Intelligence

Purpose:

- deep dive into one clustered event

Core UI blocks:

- grounded article brief
- agreed claims
- disputed claims
- coverage framing
- Event Map
- watch signals
- ripple effects
- source evidence

## 7. Core User Flows

### Pulse

1. User opens the app.
2. Backend returns cached or refreshed clustered stories.
3. User opens a story.
4. Story Intelligence requests Gemini analysis for that cluster.

### Explore

1. User signs in or continues with available profile state.
2. User provides interests, persona, and locations.
3. Profile persists in Postgres.
4. Explore ranks and explains relevant stories.

### Google OAuth Sign-In

1. User starts Google sign-in.
2. Backend redirects to Google with a state cookie.
3. Callback verifies the code and identity token.
4. Backend creates or links the OAuth account.
5. Backend creates a session cookie and returns the user to the app.

## 8. System Boundaries

### In Scope

- ingest article metadata and snippets from configured providers
- normalize and dedupe provider payloads
- cluster related coverage into event-level story objects
- hydrate missing article metadata and imagery when possible
- generate structured story intelligence with Gemini
- render Event Map, claims, disputes, framing, watch signals, and ripple effects
- persist users, sessions, OAuth accounts, and profiles in Postgres
- serve production through the Express/Vercel entrypoint

### Out Of Scope

- direct publisher integrations
- user-generated content
- human newsroom workflow
- graph database runtime
- local model runtime
- storing full scraped article archives where avoidable

### Trust Boundaries

- external news source data is untrusted input
- generated analysis is untrusted until shaped and validated for the UI
- user profile and OAuth data are sensitive and should be minimally stored
- raw secrets must remain outside docs, code, and logs

## 9. Architecture Summary

Local development uses three services:

- Postgres from Docker Compose for persisted auth and profile state.
- Express backend on `http://127.0.0.1:3210` for APIs, ingestion, auth, Gemini story analysis, static serving, and health checks.
- Vite frontend on `http://127.0.0.1:5173` when running the frontend separately.

Production routes through `server.mjs` as the Vercel entrypoint. Static serving can also come from the Express app unless `SERVE_STATIC=false`.

### Architecture Diagram

```text
External News
  -> Discovery Providers
  -> Normalize / Dedupe / Cluster
  -> Homepage Cache
  -> Express API
  -> Public UI

Story Cluster
  -> Gemini Story Analysis
  -> Structured Story Intelligence
  -> Story Intelligence UI

Google OAuth / Profile Forms
  -> Express Auth + Profile Routes
  -> Postgres
  -> Personalized Explore
```

## 10. Data Flow

```text
Fetch articles
  -> normalize article metadata
  -> dedupe near-identical items
  -> cluster into story events
  -> hydrate article metadata and images
  -> cache homepage payload
  -> generate story intelligence on demand
  -> render Pulse, Explore, and Story Intelligence
```

## 11. Runtime Components

### Discovery Providers

Located under `src/ingest/`.

Responsibilities:

- fetch source coverage from NewsAPI, Google News, and RSS
- broaden story candidates beyond one feed
- return enough source diversity for clustering

### Clustering And Cache

Primary files:

- `src/ingest/discoveryAgent.mjs`
- `src/ingest/clusterEngine.mjs`

Responsibilities:

- normalize article records
- remove duplicates
- group related reporting into story clusters
- write and read homepage cache data
- refresh cache on startup, interval, and manual request

### Gemini Story Analysis

Primary files:

- `src/ai/storyAnalysisProvider.mjs`
- `src/ai/geminiStoryAnalysis.mjs`

Responsibilities:

- build evidence-constrained story context
- call Gemini when `AI_PROVIDER=gemini`
- return schema-shaped JSON for the UI
- validate and normalize model output
- provide structured fallbacks when analysis is partial

### Auth And Profiles

Primary files:

- `src/server/authRoutes.mjs`
- `src/server/profileRoutes.mjs`
- `src/server/sessionCookies.mjs`
- `src/storage/postgresStore.mjs`

Responsibilities:

- expose sign-in options
- support Google OAuth production sign-in
- support development email-code sign-in when configured
- create and validate session cookies
- persist users, sessions, OAuth accounts, and profiles in Postgres

### API Layer

Primary file: `server.mjs`

Current endpoints include:

- `GET /api/home`
- `POST /api/refresh`
- `GET /api/image?url=...`
- `GET /api/article-preview?url=...`
- `GET /api/ai/story?clusterId=...`
- `GET /api/health`
- `GET /api/auth/options`
- `POST /api/auth/start`
- `POST /api/auth/verify`
- `GET /api/auth/google/start`
- `GET /api/auth/google/callback`
- `GET /api/me`
- `PUT /api/me/profile`
- `POST /api/logout`
- `GET /api/taxonomy`
- `GET /api/sources`

### Frontend

Primary files:

- `public/index.html`
- `public/app.js`
- `public/styles.css`

Responsibilities:

- render Pulse, Explore, and Story Intelligence
- manage sign-in and profile flows
- request homepage, taxonomy, profile, and story analysis data
- render article cards, source rails, claims, disputes, framing, Event Map, watch signals, and ripple effects
- degrade gracefully when imagery or generated analysis is unavailable

## 12. Data Model

Postgres currently stores auth and profile state.

Implemented tables:

- `users`
- `login_codes`
- `sessions`
- `profiles`
- `profile_interests`
- `profile_locations`
- `oauth_accounts`

Story and article data are currently served from the discovery/cache path rather than normalized into Postgres story tables.

## 13. Configuration

Required for production:

- `DATABASE_URL`
- `GEMINI_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AUTH_HASH_SECRET`
- `SESSION_SECRET`
- `API_BASE_URL`
- `FRONTEND_ORIGIN`
- `NODE_ENV=production`

Common optional settings:

- `GOOGLE_OAUTH_REDIRECT_URI`
- `BACKEND_PUBLIC_URL`
- `NEWS_API_KEY`
- `DISCOVERY_PROVIDER`
- `GOOGLE_NEWS_SEED_COUNT`
- `NEWS_AUTO_REFRESH_MINUTES`
- `NEWS_STALE_AFTER_MINUTES`
- `GEMINI_MODEL`
- `AI_PROVIDER`
- `AI_TIMEOUT_MS`
- `SERVE_STATIC`

No raw secret values belong in this document.

## 14. Failure Modes And Degraded States

### Failure Modes

1. Provider fetch fails or returns partial coverage.
2. Clustering merges distinct stories or splits a shared event.
3. Metadata hydration cannot recover imagery.
4. Gemini returns invalid, partial, or timed-out analysis.
5. OAuth configuration is missing or the callback URL does not match production settings.
6. Postgres is unavailable.
7. Personalization has too little profile data to feel specific.

### Mitigations

- use fallback discovery providers where available
- serve stale cache while refresh is in progress
- proxy and hydrate images where possible
- validate generated story analysis before rendering
- expose health status for backend, database, and Gemini configuration
- store minimal profile data and keep sessions server-validated

### Degraded UI States

- story visible with heuristic or partial intelligence
- story visible without image metadata
- Explore visible with general relevance copy
- sign-in unavailable when OAuth or development auth is not configured

## 15. Checks

Useful local checks:

- `npm run dev:db`
- `npm run db:migrate`
- `npm run dev:backend`
- `npm run dev:frontend`
- `npm run check:health`
- `npm run check:production`
- `node scripts/check-gemini-analysis.mjs`

## 16. Review Readiness

- Product framing: `Ready`
- Local runtime: `Ready`
- Gemini analysis path: `Ready`
- Postgres auth/profile persistence: `Ready`
- Google OAuth production sign-in: `Ready`
- Event Map story surface: `Ready`
- Automated test suite: `Not yet present`

## 17. Final Product Positioning

Zelthir is a personalized news intelligence app with two main modes:

- `Pulse` for what matters broadly.
- `Explore` for what matters to the reader.

It turns repeated and conflicting coverage into a structured account, shows disputed claims and framing differences, maps related topics with the Event Map, and highlights watch signals for what may happen next.
