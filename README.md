# Zelthir

Zelthir isis an AI news intelligence platform that reads coverage from across the media spectrum, groups articles about the same event, extracts the facts they agree on, flags disputed claims, and generates a source-backed brief of the best-supported account of what happened. Instead of pushing one outlet’s framing, it shows how different sources describe the same story, maps the connections between related events and actors, and highlights the likely ripple effects so users can understand not just the headline, but what it means and what may happen next.

This workspace snapshot was assembled on April 4, 2026. The product spec in [TECHNICAL_PRD.md](./TECHNICAL_PRD.md) and the earliest file timestamps in this folder both point to that same build date.
# How it Works
- Live pulls news from various sources using APIs
- AI live clusters them into the proper categories (e.g. which news article cluster its part of)
- AI runs the algorthim, which does analysis, rewrites the article with factors of what it thinks is most true
- AI shows you various perspectives of it
- AI forms connections and shows you a timeline with previous articles
- AI runs a predictive based on the current data (currently using own algorthm planned was mirofish), and predicts what can happen next

## What It Does

- Serves a live news homepage at `/app/` with a lead story, grouped coverage cards, and deeper analysis panels.
- Pulls stories from NewsAPI, Google News RSS, and direct RSS feeds, then clusters related coverage together.
- Enriches articles with metadata like canonical URLs, images, and better snippets when possible.
- Serves a readable PRD viewer at `/docs/index.html` for the product and architecture spec.
- Boots without a live API key by falling back to bundled sample data, so the UI is still demoable locally.
- Currently Using Codex O auth but can be changed to other API Keys

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

The app runs with no secrets for demo mode. If you want fresher live discovery, set a NewsAPI key in `.env`.

```bash
NEWS_API_KEY=
DISCOVERY_PROVIDER=newsapi
NEWS_REFRESH_TIMEOUT_MS=12000
NEWS_EXPANSION_SEED_COUNT=5
NEWS_MAX_SECTION_CLUSTERS=8
GOOGLE_NEWS_SEED_COUNT=8
NEWS_AUTO_REFRESH_MINUTES=2
NEWS_STALE_AFTER_MINUTES=4
```

Notes:

- If `NEWS_API_KEY` is empty, the server still works and can render bundled sample data.
- `DISCOVERY_PROVIDER=rss` forces an RSS-first mode.
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
|   `-- top-stories.schema.json
|-- scripts/
|   `-- run-ingest.mjs
|-- src/
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

1. `server.mjs` serves the homepage UI, the PRD viewer, and API endpoints like `/api/home`, `/api/refresh`, and `/api/image`.
2. `src/ingest/discoveryAgent.mjs` coordinates section discovery for U.S. and world news.
3. Providers in `src/ingest/` fetch seeds from NewsAPI, Google News, and curated RSS feeds.
4. `clusterEngine.mjs` deduplicates articles and groups similar coverage into story clusters.
5. `articleMetadata.mjs` resolves Google News links and hydrates better metadata when possible.
6. The frontend in `public/` renders the grouped news experience, while the root `index.html` view renders the technical PRD.

## Main Surfaces

- `/app/`: the live Zelthir homepage with grouped coverage, tabs, relevance controls, and analysis panels.
- `/docs/index.html`: a polished viewer for the markdown PRD.
- `TECHNICAL_PRD.md`: the product spec source rendered by the docs viewer.

## Current Status
- GitHub repo target: `navilankrishnan/Zelthir`

## Limitations

- There is no automated test suite in the repo yet.
- Freshness depends on third-party feeds and API limits.
- Some publisher images may fail hotlinking, so the app includes image proxying and fallbacks.

## More Detail

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for a concise code and data-flow walkthrough.
