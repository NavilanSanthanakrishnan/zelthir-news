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
import { SECTION_CONFIG } from "./sourceRegistry.mjs";

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

async function discoverBroadSection(sectionConfig) {
  const [googleArticles, rssArticles] = await Promise.all([
    discoverSectionFromGoogleNews(sectionConfig).catch(() => []),
    discoverSectionFromRss(sectionConfig).catch(() => []),
  ]);

  return {
    rawArticles: mergeArticlePools(googleArticles, rssArticles),
    provider: googleArticles.length ? "google-news+rss" : "rss-fallback",
    fallbackReason: googleArticles.length ? null : "Google News expansion returned no articles",
  };
}

async function buildSection(sectionConfig, provider) {
  let rawArticles = [];
  let fallbackReason = null;
  let actualProvider = provider;

  if (provider === "newsapi") {
    try {
      const newsApiArticles = await discoverSectionFromNewsApi(sectionConfig);
      if (!newsApiArticles.length) {
        throw new Error(discoveryConfig.newsApiKey ? "NewsAPI returned no articles" : "NEWS_API_KEY missing");
      }

      const broadSupplement = await discoverBroadSection(sectionConfig);
      rawArticles = mergeArticlePools(
        newsApiArticles,
        broadSupplement.rawArticles
      );
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
    }
  } else {
    const broadFallback = await discoverBroadSection(sectionConfig);
    actualProvider = broadFallback.provider;
    fallbackReason = broadFallback.fallbackReason;
    rawArticles = broadFallback.rawArticles;
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

  const payload = {
    ok: true,
    provider: [...new Set(sectionResults.map((result) => result.provider).filter(Boolean))].join(" | "),
    generatedAt: new Date().toISOString(),
    fallbackReason: fallbackReasons || null,
    sections: Object.fromEntries(
      sectionResults.map((result) => [result.section.id, result.section])
    ),
  };

  await writeCache(payload).catch(() => {});
  return payload;
}
