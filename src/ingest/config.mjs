import dotenv from "dotenv";

dotenv.config();

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const discoveryConfig = {
  newsApiKey: process.env.NEWS_API_KEY?.trim() || "",
  discoveryProvider: process.env.DISCOVERY_PROVIDER?.trim() || "newsapi",
  refreshTimeoutMs: toNumber(process.env.NEWS_REFRESH_TIMEOUT_MS, 12000),
  expansionSeedCount: toNumber(process.env.NEWS_EXPANSION_SEED_COUNT, 5),
  maxSectionClusters: toNumber(process.env.NEWS_MAX_SECTION_CLUSTERS, 8),
  googleSeedCount: toNumber(process.env.GOOGLE_NEWS_SEED_COUNT, 8),
  autoRefreshMinutes: toNumber(process.env.NEWS_AUTO_REFRESH_MINUTES, 2),
  staleAfterMinutes: toNumber(process.env.NEWS_STALE_AFTER_MINUTES, 4),
  aiProvider: process.env.AI_PROVIDER?.trim() || "codex-cli",
  aiTimeoutMs: toNumber(process.env.AI_TIMEOUT_MS, 90000),
};
