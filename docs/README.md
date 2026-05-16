# Zelthir Docs

This directory holds product and deployment documentation for the current Zelthir app.

## Included Files

- `ARCHITECTURE.md`: Architecture notes for the deployed app, including runtime components, data flow, ingestion, analysis, auth, and operational behavior.
- `screenshots/`: Local screenshots captured during product and verification passes.

## Served Docs

The backend serves the documentation viewer at:

- `http://127.0.0.1:3210/docs/`

That viewer is implemented by the root `index.html`, `app.js`, and `styles.css` files and renders `PRODUCT_ARCHITECTURE.md`.

## Scope

These docs should describe the app that exists in this repository: the news UI, deployment flow, Postgres-backed auth and profiles, source ingestion, Gemini story analysis, and operational checks.

Keep this directory focused on product, architecture, deployment, and verification notes. Local work plans, scratch logs, and one-off implementation notes should stay out of tracked docs.
