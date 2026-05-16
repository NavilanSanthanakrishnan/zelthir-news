import dotenv from "dotenv";

dotenv.config();

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const discoveryConfig = {
  databaseUrl: process.env.DATABASE_URL?.trim() || "",
  frontendOrigin: process.env.FRONTEND_ORIGIN?.trim() || "http://127.0.0.1:5173",
  apiBaseUrl: process.env.API_BASE_URL?.trim() || "http://127.0.0.1:3210",
  serveStatic: process.env.SERVE_STATIC?.trim() !== "false",
  sessionCookieName: process.env.SESSION_COOKIE_NAME?.trim() || "zelthir_session",
  sessionDays: toNumber(process.env.SESSION_DAYS, 30),
  hasGoogleOAuthClientId: Boolean(process.env.GOOGLE_CLIENT_ID?.trim()),
  hasGoogleOAuthClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim()),
  googleOAuthConfigured: Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
  ),
  newsApiKey: process.env.NEWS_API_KEY?.trim() || "",
  discoveryProvider: process.env.DISCOVERY_PROVIDER?.trim() || "newsapi",
  refreshTimeoutMs: toNumber(process.env.NEWS_REFRESH_TIMEOUT_MS, 12000),
  expansionSeedCount: toNumber(process.env.NEWS_EXPANSION_SEED_COUNT, 5),
  maxSectionClusters: toNumber(process.env.NEWS_MAX_SECTION_CLUSTERS, 8),
  googleSeedCount: toNumber(process.env.GOOGLE_NEWS_SEED_COUNT, 8),
  autoRefreshMinutes: toNumber(process.env.NEWS_AUTO_REFRESH_MINUTES, 2),
  staleAfterMinutes: toNumber(process.env.NEWS_STALE_AFTER_MINUTES, 4),
  geminiApiKey: process.env.GEMINI_API_KEY?.trim() || "",
  geminiModel: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
  aiProvider: process.env.AI_PROVIDER?.trim() || "gemini",
  aiTimeoutMs: toNumber(process.env.AI_TIMEOUT_MS, 90000),
};
