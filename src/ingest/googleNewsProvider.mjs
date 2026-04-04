import Parser from "rss-parser";

import { tokenize, slugify } from "./clusterEngine.mjs";
import { discoveryConfig } from "./config.mjs";
import { LOW_SIGNAL_PATTERNS } from "./sourceRegistry.mjs";

const parser = new Parser({
  customFields: {
    item: [
      "description",
      "pubDate",
      ["source", "source"],
      "media:content",
      "media:thumbnail",
      "enclosure",
    ],
  },
});

function normalizeWhitespace(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function stripHtml(text) {
  return normalizeWhitespace(
    (text || "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&#39;/gi, "'")
      .replace(/&quot;/gi, '"')
      .replace(/<[^>]+>/g, " ")
  );
}

function pickImage(item) {
  if (item.enclosure?.url) {
    return item.enclosure.url;
  }

  if (Array.isArray(item["media:content"]) && item["media:content"][0]?.$?.url) {
    return item["media:content"][0].$.url;
  }

  if (item["media:content"]?.$?.url) {
    return item["media:content"].$.url;
  }

  if (Array.isArray(item["media:thumbnail"]) && item["media:thumbnail"][0]?.$?.url) {
    return item["media:thumbnail"][0].$.url;
  }

  if (item["media:thumbnail"]?.$?.url) {
    return item["media:thumbnail"].$.url;
  }

  return null;
}

function toIso(value) {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function parseSourceFromDescription(description) {
  const match = description?.match(/<font[^>]*>([^<]+)<\/font>/i);
  return normalizeWhitespace(match?.[1] || "");
}

function normalizeSourceValue(source) {
  if (!source) {
    return "";
  }

  if (typeof source === "string") {
    return normalizeWhitespace(source);
  }

  if (typeof source === "object") {
    return normalizeWhitespace(source._ || source["#"] || source.$text || "");
  }

  return "";
}

function splitTitleAndSource(rawTitle, rawSource, description) {
  const source =
    normalizeSourceValue(rawSource) ||
    parseSourceFromDescription(description) ||
    "Google News";
  const cleanedTitle = normalizeWhitespace(rawTitle);
  const suffix = ` - ${source}`;

  if (cleanedTitle.toLowerCase().endsWith(suffix.toLowerCase())) {
    return {
      title: cleanedTitle.slice(0, Math.max(0, cleanedTitle.length - suffix.length)).trim(),
      source,
    };
  }

  const titlePieces = cleanedTitle.split(" - ");
  if (!normalizeSourceValue(rawSource) && titlePieces.length > 1) {
    return {
      title: titlePieces.slice(0, -1).join(" - ").trim(),
      source: titlePieces.at(-1)?.trim() || source,
    };
  }

  return {
    title: cleanedTitle,
    source,
  };
}

function isLowSignal(text) {
  return LOW_SIGNAL_PATTERNS.some((pattern) => pattern.test(text));
}

function sourceHost(source) {
  const normalized = source.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)) {
    return normalized;
  }

  return `source-${slugify(source || "google-news")}`;
}

function uniqueQueryTokens(title) {
  return [...new Set(tokenize(title).filter((token) => token.length > 3))];
}

function buildPhraseQuery(title) {
  const phrase = uniqueQueryTokens(title).slice(0, 8).join(" ");
  if (phrase.split(" ").length < 3) {
    return null;
  }

  return `"${phrase}" when:1d`;
}

function buildTokenQuery(title) {
  const tokenQuery = uniqueQueryTokens(title).slice(0, 5).join(" ");
  if (tokenQuery.split(" ").length < 2) {
    return null;
  }

  return `${tokenQuery} when:1d`;
}

function buildExpansionQueries(seed) {
  return [...new Set([buildPhraseQuery(seed.title), buildTokenQuery(seed.title)].filter(Boolean))];
}

function jaccard(leftTokens, rightTokens) {
  const left = new Set(leftTokens);
  const right = new Set(rightTokens);

  if (!left.size || !right.size) {
    return 0;
  }

  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

function sharedTokenCount(leftTokens, rightTokens) {
  const right = new Set(rightTokens);
  return [...new Set(leftTokens)].filter((token) => right.has(token)).length;
}

function isRelevantToSeed(seed, candidate) {
  const seedTokens = uniqueQueryTokens(seed.title);
  const candidateTokens = uniqueQueryTokens(candidate.title);
  const overlap = jaccard(seedTokens, candidateTokens);
  const shared = sharedTokenCount(seedTokens, candidateTokens);

  return overlap >= 0.2 || shared >= 2;
}

function makeGoogleSearchUrl(query) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
}

async function parseFeed(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), discoveryConfig.refreshTimeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Google News feed failed with ${response.status}`);
    }

    const xml = await response.text();
    return await parser.parseString(xml);
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeGoogleNewsItem(item, sectionId, provenance) {
  const { title, source } = splitTitleAndSource(item.title || "", item.source, item.description || "");
  const rawSnippet = stripHtml(item.description || "");
  const snippet = "";

  if (!item.link || !title || isLowSignal(`${title} ${rawSnippet}`)) {
    return null;
  }

  return {
    id: `${provenance}-${slugify(source)}-${Buffer.from(item.link).toString("base64").slice(0, 12)}`,
    source,
    title,
    url: item.link,
    publishedAt: toIso(item.pubDate),
    snippet,
    imageUrl: pickImage(item),
    section: sectionId,
    language: "en",
    host: sourceHost(source),
  };
}

export async function discoverGoogleSeeds(sectionConfig) {
  const topicUrls = sectionConfig.googleTopicUrls || [];
  const feeds = await Promise.all(topicUrls.map((url) => parseFeed(url).catch(() => null)));
  const rawSeeds = feeds
    .flatMap((feed) => feed?.items || [])
    .map((item, index) => normalizeGoogleNewsItem(item, sectionConfig.id, `google-seed-${index}`))
    .filter(Boolean);

  const seenTitles = new Set();
  const seeds = [];

  for (const article of rawSeeds) {
    const titleKey = slugify(article.title);
    if (seenTitles.has(titleKey)) {
      continue;
    }

    seenTitles.add(titleKey);
    seeds.push(article);

    if (seeds.length >= discoveryConfig.googleSeedCount) {
      break;
    }
  }

  return seeds;
}

export async function expandGoogleSeed(seed, sectionConfig) {
  const queries = buildExpansionQueries(seed);
  const feeds = await Promise.all(
    queries.map((query) => parseFeed(makeGoogleSearchUrl(query)).catch(() => null))
  );

  return feeds.flatMap((feed, index) =>
    (feed?.items || [])
      .map((item) => normalizeGoogleNewsItem(item, sectionConfig.id, `google-expand-${index}`))
      .filter((article) => article && isRelevantToSeed(seed, article))
  );
}

export async function discoverSectionFromGoogleNews(sectionConfig) {
  const seeds = await discoverGoogleSeeds(sectionConfig);
  const articlePool = [...seeds];
  const expansions = await Promise.all(seeds.map((seed) => expandGoogleSeed(seed, sectionConfig)));
  articlePool.push(...expansions.flat());

  return articlePool;
}
