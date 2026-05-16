import { buildSourceRegistryDiagnostics } from "../ingest/sourceRegistry.mjs";

export function buildSourcesPayload() {
  return buildSourceRegistryDiagnostics();
}

export function registerSourceRoutes(app) {
  app.get("/api/sources", (_req, res) => {
    res.json(buildSourcesPayload());
  });
}
