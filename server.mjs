import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { discoveryConfig } from "./src/ingest/config.mjs";
import { getCachedHome, runHomepageDiscovery } from "./src/ingest/discoveryAgent.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3210);
const autoRefreshMs = discoveryConfig.autoRefreshMinutes * 60 * 1000;
const staleAfterMs = discoveryConfig.staleAfterMinutes * 60 * 1000;
let refreshPromise = null;

app.use(express.json({ limit: "1mb" }));
app.use("/app", express.static(path.join(__dirname, "public")));
app.use("/docs", express.static(__dirname));

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
  res.redirect("/app/");
});

app.get("/api/home", async (_req, res) => {
  const home = await getCachedHome();
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

app.listen(port, async () => {
  console.log(`Grounded prototype running at http://127.0.0.1:${port}/app/`);

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
});

setInterval(() => {
  void refreshHome("interval");
}, autoRefreshMs);
