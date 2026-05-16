import Parser from "rss-parser";

import { discoveryConfig } from "./config.mjs";
import { isLowSignalContent } from "./sourceRegistry.mjs";

const parser = new Parser({
  customFields: {
    item: [
      "description",
      "media:content",
      "media:thumbnail",
      "content:encoded",
      "category",
      "enclosure",
    ],
  },
});

function toIso(value) {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
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

  return null;
}

function matchesAllowedHost(url, allowedHosts = []) {
  if (!allowedHosts.length) return true;

  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return allowedHosts.some((allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`));
  } catch {
    return false;
  }
}

function normalizeCategoryValue(category) {
  if (!category) {
    return "";
  }

  if (typeof category === "string") {
    return category.trim();
  }

  if (typeof category === "object") {
    return String(category._ || category["#"] || category.$text || "").trim();
  }

  return String(category).trim();
}

function normalizeCategories(...categoryGroups) {
  return categoryGroups
    .flatMap((group) => (Array.isArray(group) ? group : [group]))
    .map(normalizeCategoryValue)
    .filter(Boolean);
}

function sourceMetadata(source) {
  return {
    sourceId: source.id,
    sourceScope: source.scope || null,
    sourceCountry: source.country || null,
    sourceState: source.state || null,
    sourceCity: source.city || null,
    sourceMetro: source.metro || null,
    sourceCategories: source.categories || [],
    sourcePriority: source.priority || 0,
    sourceRequired: Boolean(source.required),
    sourceSiteUrl: source.siteUrl || null,
  };
}

function sourceDiagnostic(source, overrides = {}) {
  return {
    sourceId: source.id,
    sourceName: source.name,
    sourceScope: source.scope || null,
    sourceState: source.state || null,
    sourceCity: source.city || null,
    ok: false,
    feedItemCount: 0,
    articleCount: 0,
    error: null,
    ...overrides,
  };
}

async function parseFeed(source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), discoveryConfig.refreshTimeoutMs);

  try {
    const response = await fetch(source.feedUrl, {
      headers: {
        "user-agent": "Mozilla/5.0",
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Feed returned HTTP ${response.status}`);
    }

    return await parser.parseString(await response.text());
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchFeed(source, sectionId) {
  try {
    const feed = await parseFeed(source);
    const feedItems = feed.items || [];
    const articles = feedItems.slice(0, 30).flatMap((item, index) => {
      const title = item.title?.trim() || "";
      const snippet = (item.contentSnippet || item.content || item.description || "").replace(/\s+/g, " ").trim();
      const itemCategories = normalizeCategories(item.category, item.categories);
      const filterCategories = normalizeCategories(source.categories, itemCategories);

      if (
        !item.link ||
        !title ||
        !matchesAllowedHost(item.link, source.allowedHosts) ||
        /\/video\//i.test(item.link) ||
        /\/opinions?\//i.test(item.link) ||
        isLowSignalContent(title, snippet, filterCategories)
      ) {
        return [];
      }

      return [
        {
          id: `${source.id}-${index}-${Buffer.from(item.link).toString("base64").slice(0, 12)}`,
          source: source.name,
          title,
          url: item.link,
          publishedAt: toIso(item.isoDate || item.pubDate),
          snippet: snippet.slice(0, 260),
          imageUrl: pickImage(item),
          section: sectionId,
          language: "en",
          isDirect: true,
          ...sourceMetadata(source),
        },
      ];
    });

    return {
      articles,
      diagnostic: sourceDiagnostic(source, {
        ok: true,
        feedItemCount: feedItems.length,
        articleCount: articles.length,
      }),
    };
  } catch (error) {
    return {
      articles: [],
      diagnostic: sourceDiagnostic(source, {
        error: error instanceof Error ? error.message : "Feed fetch or parse failed",
      }),
    };
  }
}

export async function discoverSectionFromRss(sectionConfig, options = {}) {
  const sources = options.sources || sectionConfig.rssSources || [];
  const results = await Promise.all(
    sources.map((source) => fetchFeed(source, sectionConfig.id))
  );
  const articles = results.flatMap((result) => result.articles);

  if (options.includeDiagnostics) {
    return {
      articles,
      diagnostics: results.map((result) => result.diagnostic),
    };
  }

  return articles;
}
