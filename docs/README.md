# Zelthir Docs

This directory contains the product-facing technical documentation for Zelthir.

## Included Documents

- `ARCHITECTURE.md`
  System architecture, data flow, runtime components, AI path, and operational behavior.
- `screenshots/`
  Local screenshots captured during development and verification.

## In-App Docs Surface

The repository serves its own docs viewer at:

- `http://127.0.0.1:3210/docs/index.html`

That viewer renders the source PRD from:

- `TECHNICAL_PRD.md`

## Scope

These docs are meant to describe the current Zelthir platform as implemented in this repository:

- live news ingestion and clustering
- newsroom UI
- Codex-backed story intelligence
- predictive watch-signal and ripple-effect generation

They do not document a separate MiroFish runtime because that integration is not currently part of the shipped codebase.
