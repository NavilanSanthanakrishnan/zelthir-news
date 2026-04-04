import { discoveryConfig } from "./config.mjs";
import {
  LOW_SIGNAL_PATTERNS,
  LOW_SIGNAL_SOURCE_CATEGORIES,
  NEWS_API_WORLD_SOURCE_IDS,
} from "./sourceRegistry.mjs";

const NEWS_API_BASE_URL = "https://newsapi.org/v2";
let sourceMetaPromise = null;

function makeHeaders() {
  return {
    "X-Api-Key": discoveryConfig.newsApiKey,
  };
}

function normalizeWhitespace(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function slugText(text) {
  return normalizeWhitespace(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickQueryTokens(title) {
  const tokens = slugText(title)
    .split(" ")
    .filter((token) => token.length > 3)
    .filter((token) => !["after", "about", "amid", "with", "from", "this"].includes(token));

  return [...new Set(tokens)].slice(0, 4);
}

function createExpansionQuery(title) {
  const tokens = pickQueryTokens(title);
  if (tokens.length < 2) {
    return null;
  }

  return tokens.join(" AND ");
}

function isLowSignal(text, sourceCategory) {
  return (
    LOW_SIGNAL_SOURCE_CATEGORIES.has((sourceCategory || "").toLowerCase()) ||
    LOW_SIGNAL_PATTERNS.some((pattern) => pattern.test(text))
  );
}

async function fetchJson(endpoint, params) {
  const search = new URLSearchParams(params);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), discoveryConfig.refreshTimeoutMs);

  try {
    const response = await fetch(`${NEWS_API_BASE_URL}/${endpoint}?${search.toString()}`, {
      headers: makeHeaders(),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`NewsAPI ${endpoint} failed with ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeNewsApiArticle(article, sectionId, sourceMetaById) {
  const sourceName = article.source?.name || sourceMetaById.get(article.source?.id)?.name || "Unknown source";
  const sourceCategory = sourceMetaById.get(article.source?.id)?.category || "";
  const snippet = normalizeWhitespace(article.description || article.content || "");
  const title = normalizeWhitespace(article.title || "");

  if (!article.url || !title || isLowSignal(`${title} ${snippet}`, sourceCategory)) {
    return null;
  }

  return {
    id: `${article.source?.id || slugText(sourceName)}-${Buffer.from(article.url).toString("base64").slice(0, 12)}`,
    source: sourceName,
    title,
    url: article.url,
    publishedAt: article.publishedAt || new Date().toISOString(),
    snippet: snippet.slice(0, 260),
    imageUrl: article.urlToImage || null,
    section: sectionId,
    language: "en",
  };
}

async function fetchSourceMeta() {
  if (!sourceMetaPromise) {
    sourceMetaPromise = fetchJson("top-headlines/sources", {
      language: "en",
    }).then((payload) => new Map((payload.sources || []).map((source) => [source.id, source])));
  }

  return sourceMetaPromise;
}

export async function discoverSeeds(sectionConfig) {
  if (!discoveryConfig.newsApiKey) {
    return [];
  }

  const sourceMetaById = await fetchSourceMeta();
  let params;

  if (sectionConfig.newsApiMode === "country") {
    params = {
      country: sectionConfig.newsApiCountry,
      pageSize: "100",
    };
  } else {
    const availableWorldSourceIds = NEWS_API_WORLD_SOURCE_IDS.filter((id) => sourceMetaById.has(id));
    const sourceIds = (sectionConfig.newsApiSourceIds || availableWorldSourceIds).filter((id) =>
      sourceMetaById.has(id)
    );

    if (!sourceIds.length) {
      return [];
    }

    params = {
      sources: sourceIds.slice(0, 12).join(","),
      pageSize: "100",
    };
  }

  const payload = await fetchJson("top-headlines", params);
  return (payload.articles || [])
    .map((article) => normalizeNewsApiArticle(article, sectionConfig.id, sourceMetaById))
    .filter(Boolean);
}

export async function expandSeed(seedArticle, sectionConfig) {
  if (!discoveryConfig.newsApiKey) {
    return [];
  }

  const query = createExpansionQuery(seedArticle.title);
  if (!query) {
    return [];
  }

  const sourceMetaById = await fetchSourceMeta();
  const since = new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString();
  const payload = await fetchJson("everything", {
    q: query,
    language: "en",
    searchIn: "title,description",
    sortBy: "publishedAt",
    pageSize: "100",
    from: since,
  });

  return (payload.articles || [])
    .map((article) => normalizeNewsApiArticle(article, sectionConfig.id, sourceMetaById))
    .filter(Boolean);
}

export async function discoverSectionFromNewsApi(sectionConfig) {
  const seeds = await discoverSeeds(sectionConfig);
  if (!seeds.length) {
    return [];
  }

  const uniqueSeedTitles = new Set();
  const expansionSeeds = [];

  for (const seed of seeds) {
    const titleKey = slugText(seed.title);
    if (uniqueSeedTitles.has(titleKey)) {
      continue;
    }

    uniqueSeedTitles.add(titleKey);
    expansionSeeds.push(seed);

    if (expansionSeeds.length >= discoveryConfig.expansionSeedCount) {
      break;
    }
  }

  const expansions = await Promise.all(
    expansionSeeds.map((seed) => expandSeed(seed, sectionConfig))
  );

  return [...seeds, ...expansions.flat()];
}
