import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { hydrateSectionClusters } from "./articleMetadata.mjs";
import { clusterArticlePool } from "./clusterEngine.mjs";
import { discoveryConfig } from "./config.mjs";
import { discoverSectionFromGoogleNews } from "./googleNewsProvider.mjs";
import { SAMPLE_HOME_PAYLOAD } from "./homeSample.mjs";
import { discoverSectionFromNewsApi } from "./newsApiProvider.mjs";
import { discoverSectionFromRss } from "./rssProvider.mjs";
import { buildSectionSourceCoverage, SECTION_CONFIG } from "./sourceRegistry.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");
const cacheFile = path.join(rootDir, "data", "homepage-cache.json");

async function ensureDataDir() {
  await fs.mkdir(path.join(rootDir, "data"), { recursive: true });
}

async function writeCache(payload) {
  await ensureDataDir();
  const tempFile = `${cacheFile}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(payload, null, 2));
  await fs.rename(tempFile, cacheFile);
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

export async function getCachedHome() {
  try {
    return await readJson(cacheFile);
  } catch {
    return SAMPLE_HOME_PAYLOAD;
  }
}

function mergeArticlePools(...articleLists) {
  return articleLists.flat().filter(Boolean);
}

function userFacingDiscoveryReason(reason) {
  if (!reason) {
    return null;
  }

  if (/NEWS_API_KEY|NewsAPI/i.test(reason)) {
    return "The primary news source is unavailable, so coverage is using public feeds.";
  }

  if (/Google News|rss-fallback|feed/i.test(reason)) {
    return "Some live feeds were unavailable, so coverage may be narrower than usual.";
  }

  return "Some live sources were unavailable, so coverage may be narrower than usual.";
}

function userFacingProviderLabel(providers) {
  const providerSet = new Set(providers.filter(Boolean));

  if (!providerSet.size) {
    return "Live news feeds";
  }

  if ([...providerSet].some((provider) => provider.includes("newsapi"))) {
    return "Live news coverage";
  }

  return "Public news feeds";
}

async function discoverBroadSection(sectionConfig) {
  const [googleArticles, nationalRss, localRss] = await Promise.all([
    discoverSectionFromGoogleNews(sectionConfig).catch(() => []),
    discoverSectionFromRss(sectionConfig, {
      sources: sectionConfig.rssSources || [],
      includeDiagnostics: true,
    }).catch(() => ({ articles: [], diagnostics: [] })),
    discoverSectionFromRss(sectionConfig, {
      sources: sectionConfig.localRssSources || [],
      includeDiagnostics: true,
    }).catch(() => ({ articles: [], diagnostics: [] })),
  ]);
  const rssArticles = mergeArticlePools(nationalRss.articles, localRss.articles);

  return {
    rawArticles: mergeArticlePools(googleArticles, rssArticles),
    provider: googleArticles.length ? "google-news+rss" : "rss-fallback",
    fallbackReason: googleArticles.length ? null : "Google News expansion returned no articles",
    feedDiagnostics: [...nationalRss.diagnostics, ...localRss.diagnostics],
  };
}

async function buildSection(sectionConfig, provider) {
  let rawArticles = [];
  let fallbackReason = null;
  let actualProvider = provider;
  let feedDiagnostics = [];

  if (provider === "newsapi") {
    try {
      const newsApiArticles = await discoverSectionFromNewsApi(sectionConfig);
      if (!newsApiArticles.length) {
        throw new Error(discoveryConfig.newsApiKey ? "NewsAPI returned no articles" : "NewsAPI unavailable");
      }

      const broadSupplement = await discoverBroadSection(sectionConfig);
      rawArticles = mergeArticlePools(
        newsApiArticles,
        broadSupplement.rawArticles
      );
      feedDiagnostics = broadSupplement.feedDiagnostics;
      actualProvider = broadSupplement.rawArticles.length
        ? "newsapi+google-news+rss"
        : "newsapi";
    } catch (error) {
      const broadFallback = await discoverBroadSection(sectionConfig);
      actualProvider = broadFallback.provider;
      fallbackReason = error instanceof Error ? error.message : "NewsAPI discovery failed";

      if (broadFallback.fallbackReason) {
        fallbackReason = `${fallbackReason} | ${broadFallback.fallbackReason}`;
      }

      rawArticles = broadFallback.rawArticles;
      feedDiagnostics = broadFallback.feedDiagnostics;
    }
  } else {
    const broadFallback = await discoverBroadSection(sectionConfig);
    actualProvider = broadFallback.provider;
    fallbackReason = broadFallback.fallbackReason;
    rawArticles = broadFallback.rawArticles;
    feedDiagnostics = broadFallback.feedDiagnostics;
  }

  const storyClusters = clusterArticlePool(rawArticles, sectionConfig.id, {
    maxClusters: discoveryConfig.maxSectionClusters,
  });
  await hydrateSectionClusters(storyClusters);

  return {
    section: {
      id: sectionConfig.id,
      title: sectionConfig.title,
      kicker: sectionConfig.kicker,
      description: sectionConfig.description,
      storyClusters,
      articlePoolCount: rawArticles.length,
      clusterCount: storyClusters.length,
      sourceCoverage: buildSectionSourceCoverage(sectionConfig, rawArticles, feedDiagnostics),
    },
    provider: actualProvider,
    fallbackReason,
  };
}

export async function runHomepageDiscovery() {
  const provider = discoveryConfig.discoveryProvider === "rss" ? "rss" : "newsapi";
  const sectionConfigs = [SECTION_CONFIG.usaDailyBriefing, SECTION_CONFIG.worldTopStories];
  const sectionResults = await Promise.all(sectionConfigs.map((config) => buildSection(config, provider)));

  const fallbackReasons = sectionResults
    .map((result) => result.fallbackReason)
    .filter(Boolean)
    .join(" | ");
  const providers = sectionResults.map((result) => result.provider);

  const payload = {
    ok: true,
    provider: userFacingProviderLabel(providers),
    generatedAt: new Date().toISOString(),
    fallbackReason: userFacingDiscoveryReason(fallbackReasons),
    sections: Object.fromEntries(
      sectionResults.map((result) => [result.section.id, result.section])
    ),
  };

  await writeCache(payload).catch(() => {});
  return payload;
}
