# Zelthir

Zelthir is an AI news intelligence platform with an agentic story analysis layer. It reads coverage from across the media spectrum, groups articles about the same event, extracts the facts multiple sources agree on, flags disputed claims, and generates a source-backed brief of the best-supported account of what happened. Instead of pushing one outlet's framing, it shows how different sources describe the same story, maps connections between related events and actors, and highlights likely ripple effects so users can understand not just the headline, but what it means and what may happen next.

This workspace snapshot was assembled on April 4, 2026. The product spec in [TECHNICAL_PRD.md](./TECHNICAL_PRD.md) and the earliest file timestamps in this folder both point to that same build date.

## At a Glance

- Zelthir pulls live coverage from multiple APIs and RSS feeds.
- The ingestion and clustering pipeline groups related reporting into event-level story clusters.
- Codex-backed analysis turns each cluster into a best-supported brief, agreement ledger, dispute ledger, framing breakdown, and ripple-effect watchlist.
- The product surfaces multiple perspectives, source links, and story context rather than collapsing everything into one unsourced summary.
- The UI can upgrade a story from heuristic intelligence to live AI intelligence on demand.

## What It Does

- Serves a live news intelligence homepage at `/app/` with a lead story, grouped coverage cards, and deeper analysis panels.
- Pulls stories from NewsAPI, Google News RSS, and direct RSS feeds, then clusters related coverage into event-level story groups.
- Enriches articles with canonical URLs, improved images, and stronger snippets when possible.
- Generates source-backed story briefs, agreed facts, disputed claims, framing breakdowns, watch signals, and ripple effects.
- Uses Codex-backed analysis on demand, with heuristic fallbacks so the UI remains usable when live AI is unavailable.
- Serves a readable PRD viewer at `/docs/index.html` for the product and architecture spec.

## Why It Is Agentic

- The ingestion pipeline acts as a discovery agent that gathers and normalizes coverage from multiple providers.
- The clustering layer turns raw articles into a story object that the intelligence layer can reason over.
- The Codex analysis path generates structured story intelligence from the clustered evidence set instead of a single-article summary.
- The UI upgrades a story from heuristic intelligence to live AI intelligence as soon as structured analysis is returned.

## Screenshots

### Homepage

![Zelthir homepage](docs/screenshots/zelthir-homepage.png)

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Open:

- `http://127.0.0.1:3210/app/`
- `http://127.0.0.1:3210/docs/index.html`

## Environment

The app runs in degraded mode with no secrets. If you want fresher live discovery and live AI story analysis, set the relevant providers in `.env`.

```bash
NEWS_API_KEY=
DISCOVERY_PROVIDER=newsapi
NEWS_REFRESH_TIMEOUT_MS=12000
NEWS_EXPANSION_SEED_COUNT=5
NEWS_MAX_SECTION_CLUSTERS=8
GOOGLE_NEWS_SEED_COUNT=8
NEWS_AUTO_REFRESH_MINUTES=2
NEWS_STALE_AFTER_MINUTES=4
AI_PROVIDER=codex-cli
AI_TIMEOUT_MS=90000
```

Notes:

- If `NEWS_API_KEY` is empty, the server still works and can render bundled sample data.
- `DISCOVERY_PROVIDER=rss` forces an RSS-first mode.
- `AI_PROVIDER=codex-cli` enables live story intelligence generation through the Codex CLI.
- If the AI provider is unavailable, Zelthir falls back to heuristic story intelligence in the UI.
- Cached live payloads are treated as generated runtime data and are not committed.

## Scripts

- `npm run dev` starts the local Express server.
- `npm run start` starts the production-mode server.
- `npm run ingest` runs one homepage discovery pass and prints the payload JSON.

## Project Layout

```text
.
|-- TECHNICAL_PRD.md
|-- app.js
|-- index.html
|-- server.mjs
|-- styles.css
|-- public/
|   |-- app.js
|   |-- index.html
|   `-- styles.css
|-- schemas/
|   |-- story-analysis.schema.json
|   `-- top-stories.schema.json
|-- scripts/
|   `-- run-ingest.mjs
|-- src/
|   |-- ai/
|   |   `-- codexStoryAnalysis.mjs
|   `-- ingest/
|       |-- articleExtractor.mjs
|       |-- articleMetadata.mjs
|       |-- clusterEngine.mjs
|       |-- config.mjs
|       |-- discoveryAgent.mjs
|       |-- googleNewsProvider.mjs
|       |-- homeSample.mjs
|       |-- newsApiProvider.mjs
|       |-- rssDiscovery.mjs
|       |-- rssProvider.mjs
|       `-- sourceRegistry.mjs
`-- docs/
    |-- ARCHITECTURE.md
    `-- screenshots/
```

## How It Works

1. `server.mjs` serves the homepage UI, the PRD viewer, and API endpoints like `/api/home`, `/api/refresh`, `/api/image`, and `/api/ai/story`.
2. `src/ingest/discoveryAgent.mjs` coordinates section discovery for U.S. and world news.
3. Providers in `src/ingest/` fetch seeds from NewsAPI, Google News, and curated RSS feeds.
4. `clusterEngine.mjs` deduplicates articles and groups similar coverage into story clusters.
5. `src/ai/codexStoryAnalysis.mjs` turns a cluster into structured intelligence through Codex and normalizes the result for the UI.
6. `articleMetadata.mjs` resolves Google News links and hydrates better metadata when possible.
7. The frontend in `public/` renders grouped coverage, layered intelligence panels, and on-demand AI analysis, while the root `index.html` view renders the technical PRD.

## Main Surfaces

- `/app/`: the live Zelthir homepage with grouped coverage, tabs, relevance controls, and analysis panels.
- `/docs/index.html`: a polished viewer for the markdown PRD.
- `TECHNICAL_PRD.md`: the product spec source rendered by the docs viewer.

## Current Status

- Stage: Team-facing internal release
- Owner in spec: Team Zelthir
- Package name: `zelthir`
- GitHub repo: `NavilanSanthanakrishnan/ZelthirApp`
- Intelligence stack: multi-source ingestion, event clustering, Codex-backed story analysis, and heuristic fallback rendering

## Production Notes

- `npm run start` boots the production-mode Express server used for team and deployment environments.
- Refresh cadence, cache staleness, provider selection, and AI timeout behavior are configurable through environment variables.
- Zelthir keeps the product surface available when live feeds or live AI are unavailable by degrading to cached or bundled intelligence.
- The server exposes explicit endpoints for homepage data, manual refresh, image proxying, article preview hydration, and on-demand AI story analysis.

## Limitations

- There is no automated test suite in the repo yet.
- Story clustering remains heuristic rather than fully model-native.
- Freshness depends on third-party feeds and API limits.
- Some publisher images may fail hotlinking, so the app includes image proxying and fallbacks.

## More Detail

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for a concise code and data-flow walkthrough.
