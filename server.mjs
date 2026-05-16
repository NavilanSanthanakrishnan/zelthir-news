import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { analyzeCluster } from "./src/ai/storyAnalysisProvider.mjs";
import { discoveryConfig } from "./src/ingest/config.mjs";
import { getArticleMetadata } from "./src/ingest/articleMetadata.mjs";
import { getCachedHome, runHomepageDiscovery } from "./src/ingest/discoveryAgent.mjs";
import healthRoutes from "./src/server/healthRoutes.mjs";
import { createAuthRouter } from "./src/server/authRoutes.mjs";
import { createProfileRouter } from "./src/server/profileRoutes.mjs";
import { registerSourceRoutes } from "./src/server/sourceRoutes.mjs";
import createTaxonomyRouter from "./src/server/taxonomyRoutes.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3210);
const frontendOrigin = process.env.FRONTEND_ORIGIN?.trim() || "http://127.0.0.1:5173";
const serveStatic = process.env.SERVE_STATIC?.trim() !== "false";
const autoRefreshMs = discoveryConfig.autoRefreshMinutes * 60 * 1000;
const staleAfterMs = discoveryConfig.staleAfterMinutes * 60 * 1000;
let refreshPromise = null;

app.disable("x-powered-by");
app.use(applyProductionHeaders);
app.use(applyCorsHeaders);
app.use(express.json({ limit: "1mb" }));
app.use(healthRoutes);
app.use(createAuthRouter());
app.use(createProfileRouter());
app.use(createTaxonomyRouter());
registerSourceRoutes(app);

if (serveStatic) {
  app.use("/app", express.static(path.join(__dirname, "public")));
  app.use("/docs", express.static(__dirname));
}

function isCacheStale(home) {
  const generatedMs = home?.generatedAt ? new Date(home.generatedAt).getTime() : 0;
  if (!generatedMs || Number.isNaN(generatedMs)) {
    return true;
  }

  return Date.now() - generatedMs > staleAfterMs;
}

function decorateHome(home) {
  return {
    ...home,
    refreshMode: "Auto + Cached",
    isRefreshing: Boolean(refreshPromise),
    isStale: isCacheStale(home),
    autoRefreshMinutes: discoveryConfig.autoRefreshMinutes,
    staleAfterMinutes: discoveryConfig.staleAfterMinutes,
  };
}

function countClusterImages(home) {
  return Object.values(home?.sections || {}).reduce((total, section) => {
    return (
      total +
      (section.storyClusters || []).filter((cluster) => Boolean(cluster.imageUrl)).length
    );
  }, 0);
}

function shouldRefreshBeforeResponding(home) {
  return (
    process.env.VERCEL &&
    (home?.provider === "sample" ||
      !home?.sections?.usaDailyBriefing?.storyClusters?.length ||
      countClusterImages(home) < 3)
  );
}

function findClusterById(home, clusterId) {
  for (const section of Object.values(home?.sections || {})) {
    for (const cluster of section.storyClusters || []) {
      if (cluster.clusterId === clusterId) {
        return { cluster, section };
      }
    }
  }

  return null;
}

async function refreshHome(reason = "scheduled") {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      return await runHomepageDiscovery();
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function ensureFreshHome(home) {
  if (isCacheStale(home)) {
    void refreshHome("stale-cache");
  }
}

app.get("/favicon.ico", (_req, res) => {
  res.status(204).end();
});

app.get("/", (_req, res) => {
  if (!serveStatic) {
    res.status(404).json({ ok: false, error: "Static serving is disabled" });
    return;
  }

  res.redirect("/app/");
});

app.get("/api/home", async (_req, res) => {
  let home = await getCachedHome();
  if (shouldRefreshBeforeResponding(home)) {
    home = await refreshHome("request");
  }
  await ensureFreshHome(home);
  res.json(decorateHome(home));
});

app.get("/api/image", async (req, res) => {
  const rawUrl = typeof req.query.url === "string" ? req.query.url : "";

  if (!rawUrl) {
    res.status(400).json({ ok: false, error: "Missing image url" });
    return;
  }

  let targetUrl;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    res.status(400).json({ ok: false, error: "Invalid image url" });
    return;
  }

  if (!["http:", "https:"].includes(targetUrl.protocol)) {
    res.status(400).json({ ok: false, error: "Unsupported protocol" });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
        accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        referer: targetUrl.origin,
      },
      redirect: "follow",
    });

    if (!response.ok) {
      res.status(response.status).end();
      return;
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      res.status(415).end();
      return;
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=900");
    res.send(bytes);
  } catch (_error) {
    res.status(502).end();
  } finally {
    clearTimeout(timeout);
  }
});

app.get("/api/article-preview", async (req, res) => {
  const rawUrl = typeof req.query.url === "string" ? req.query.url : "";

  if (!rawUrl) {
    res.status(400).json({ ok: false, error: "Missing article url" });
    return;
  }

  try {
    const metadata = await getArticleMetadata(rawUrl, { timeoutMs: 5000 });
    res.json({
      ok: true,
      finalUrl: metadata?.finalUrl || rawUrl,
      imageUrl: metadata?.imageUrl || null,
      title: metadata?.title || "",
      description: metadata?.description || "",
    });
  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error instanceof Error ? error.message : "Preview lookup failed",
    });
  }
});

app.get("/api/ai/story", async (req, res) => {
  const clusterId = typeof req.query.clusterId === "string" ? req.query.clusterId : "";

  if (!clusterId) {
    res.status(400).json({ ok: false, error: "Missing clusterId" });
    return;
  }

  try {
    const home = await getCachedHome();
    const match = findClusterById(home, clusterId);

    if (!match) {
      res.status(404).json({ ok: false, error: "Cluster not found" });
      return;
    }

    const analysis = await analyzeCluster(match.cluster, match.section);
    res.json({
      ok: true,
      provider: discoveryConfig.aiProvider,
      clusterId,
      analysis,
    });
  } catch (error) {
    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    res.status(statusCode).json({
      ok: false,
      error: error?.publicMessage || error?.message || "AI analysis failed",
    });
  }
});

app.post("/api/refresh", async (_req, res) => {
  try {
    const home = await refreshHome("manual");
    res.json(decorateHome(home));
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown discovery error",
    });
  }
});

async function warmHomeCache() {
  try {
    const cached = await getCachedHome();
    if (
      !cached.ok ||
      !cached.sections?.usaDailyBriefing?.storyClusters?.length ||
      isCacheStale(cached)
    ) {
      await refreshHome("startup");
    }
  } catch (error) {
    console.error("Startup discovery failed:", error);
  }
}

if (!process.env.VERCEL) {
  app.listen(port, async () => {
    console.log(`Zelthir API running at http://127.0.0.1:${port}`);
    await warmHomeCache();
  });

  setInterval(() => {
    void refreshHome("interval");
  }, autoRefreshMs);
}

export default app;

function applyProductionHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
}

function applyCorsHeaders(req, res, next) {
  const origin = req.headers.origin;
  if (origin && getAllowedOrigins().has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", appendVary(res.getHeader("Vary"), "Origin"));
  }

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.status(204).end();
    return;
  }

  next();
}

function getAllowedOrigins() {
  return new Set([
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:3210",
    "http://localhost:3210",
    frontendOrigin,
    process.env.API_BASE_URL?.trim(),
    process.env.BACKEND_PUBLIC_URL?.trim(),
  ].filter(Boolean).map(trimTrailingSlash));
}

function appendVary(currentValue, value) {
  const values = String(currentValue || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return values.includes(value) ? values.join(", ") : [...values, value].join(", ");
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}
