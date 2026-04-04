import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const GoogleNewsDecoder = require("google-news-decoder");

const decoder = new GoogleNewsDecoder();
const userAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const decodeCache = new Map();
const metadataCache = new Map();

function withTimeout(ms) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);

  return {
    signal: controller.signal,
    clear() {
      clearTimeout(timeout);
    },
  };
}

function normalizeWhitespace(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function decodeEntities(text) {
  return normalizeWhitespace(
    (text || "")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&apos;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&#x27;/gi, "'")
  );
}

function isGoogleNewsUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes("news.google.com");
  } catch {
    return false;
  }
}

function absoluteUrl(value, baseUrl) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}

function escapePattern(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pickMetaContentFromHtml(html, key) {
  const escaped = escapePattern(key);
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeEntities(match[1]);
    }
  }

  return "";
}

function pickLinkHrefFromHtml(html, rel, baseUrl) {
  const escaped = escapePattern(rel);
  const patterns = [
    new RegExp(
      `<link[^>]+rel=["']${escaped}["'][^>]+href=["']([^"']+)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<link[^>]+href=["']([^"']+)["'][^>]+rel=["']${escaped}["'][^>]*>`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    const resolved = absoluteUrl(match?.[1], baseUrl);
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

function hasMeaningfulSnippet(snippet) {
  return normalizeWhitespace(snippet).split(/\s+/).filter(Boolean).length >= 8;
}

async function resolveGoogleNewsUrl(url) {
  if (!isGoogleNewsUrl(url)) {
    return url;
  }

  if (decodeCache.has(url)) {
    return decodeCache.get(url);
  }

  try {
    const decoded = await decoder.decodeGoogleNewsUrl(url);
    const resolved = decoded?.status && decoded?.decodedUrl ? decoded.decodedUrl : url;
    decodeCache.set(url, resolved);
    return resolved;
  } catch {
    decodeCache.set(url, url);
    return url;
  }
}

export async function getArticleMetadata(url, { timeoutMs = 3500 } = {}) {
  if (!url) {
    return null;
  }

  const cached = metadataCache.get(url);
  if (cached) {
    return cached;
  }

  const resolvedUrl = await resolveGoogleNewsUrl(url);
  const request = withTimeout(timeoutMs);

  try {
    const response = await fetch(resolvedUrl, {
      redirect: "follow",
      headers: {
        "user-agent": userAgent,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: request.signal,
    });

    if (!response.ok) {
      throw new Error(`metadata fetch failed with ${response.status}`);
    }

    const finalUrl = response.url || resolvedUrl;
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("text/html")) {
      const metadata = { finalUrl, title: "", description: "", imageUrl: null };
      metadataCache.set(url, metadata);
      metadataCache.set(finalUrl, metadata);
      return metadata;
    }

    const html = await response.text();

    const title =
      pickMetaContentFromHtml(html, "og:title") ||
      pickMetaContentFromHtml(html, "twitter:title") ||
      decodeEntities(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "");
    const description =
      pickMetaContentFromHtml(html, "og:description") ||
      pickMetaContentFromHtml(html, "twitter:description") ||
      pickMetaContentFromHtml(html, "description");
    const imageUrl =
      absoluteUrl(
        pickMetaContentFromHtml(html, "og:image") ||
          pickMetaContentFromHtml(html, "twitter:image") ||
          pickMetaContentFromHtml(html, "og:image:url"),
        finalUrl
      ) ||
      pickLinkHrefFromHtml(html, "image_src", finalUrl);
    const canonicalUrl =
      pickLinkHrefFromHtml(html, "canonical", finalUrl) ||
      absoluteUrl(
        pickMetaContentFromHtml(html, "og:url"),
        finalUrl
      ) ||
      finalUrl;

    const metadata = {
      finalUrl: canonicalUrl,
      title,
      description,
      imageUrl,
    };

    metadataCache.set(url, metadata);
    metadataCache.set(canonicalUrl, metadata);
    return metadata;
  } catch {
    const metadata = {
      finalUrl: resolvedUrl,
      title: "",
      description: "",
      imageUrl: null,
    };
    metadataCache.set(url, metadata);
    metadataCache.set(resolvedUrl, metadata);
    return metadata;
  } finally {
    request.clear();
  }
}

function dedupeArticles(articles = []) {
  const seen = new Set();
  const unique = [];

  for (const article of articles) {
    const key = article.url || `${article.source}-${article.title}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(article);
  }

  return unique;
}

function isGenericSummary(summary) {
  return /\boutlets?\s+are\s+currently\s+covering\s+this\s+story\b/i.test(summary || "");
}

async function enrichArticle(article) {
  const metadata = await getArticleMetadata(article.url);
  if (!metadata) {
    return article;
  }

  article.url = metadata.finalUrl || article.url;

  if (!article.imageUrl && metadata.imageUrl) {
    article.imageUrl = metadata.imageUrl;
  }

  if (!hasMeaningfulSnippet(article.snippet) && metadata.description) {
    article.snippet = metadata.description.slice(0, 280);
  }

  if ((!article.title || article.title.length < 12) && metadata.title) {
    article.title = metadata.title;
  }

  return article;
}

async function mapWithLimit(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length || 1) }, () => worker())
  );

  return results;
}

export async function hydrateSectionClusters(storyClusters, { concurrency = 4 } = {}) {
  if (!Array.isArray(storyClusters) || !storyClusters.length) {
    return storyClusters;
  }

  await mapWithLimit(storyClusters, concurrency, async (cluster) => {
    const candidates = dedupeArticles(cluster.articles).slice(0, cluster.imageUrl ? 4 : 8);
    const needsSummary = isGenericSummary(cluster.summary || "");

    for (const article of candidates) {
      const shouldEnrich =
        !article.imageUrl ||
        !hasMeaningfulSnippet(article.snippet) ||
        isGoogleNewsUrl(article.url) ||
        needsSummary;

      if (!shouldEnrich) {
        if (!cluster.imageUrl && article.imageUrl) {
          cluster.imageUrl = article.imageUrl;
        }
        if (!cluster.primaryUrl && !isGoogleNewsUrl(article.url)) {
          cluster.primaryUrl = article.url;
        }
        continue;
      }

      await enrichArticle(article);

      if (!cluster.imageUrl && article.imageUrl) {
        cluster.imageUrl = article.imageUrl;
      }

      if (needsSummary && hasMeaningfulSnippet(article.snippet)) {
        cluster.summary = article.snippet;
      }

      if (!cluster.primaryUrl && !isGoogleNewsUrl(article.url)) {
        cluster.primaryUrl = article.url;
      }

      if (cluster.imageUrl && cluster.primaryUrl && !isGenericSummary(cluster.summary || "")) {
        break;
      }
    }

    if (!cluster.imageUrl) {
      cluster.imageUrl = candidates.find((article) => article.imageUrl)?.imageUrl || null;
    }

    if (isGenericSummary(cluster.summary || "")) {
      cluster.summary =
        candidates.find((article) => hasMeaningfulSnippet(article.snippet))?.snippet ||
        cluster.summary;
    }

    if (!cluster.primaryUrl) {
      const bestDirectUrl = candidates.find((article) => !isGoogleNewsUrl(article.url))?.url;
      if (bestDirectUrl) {
        cluster.primaryUrl = bestDirectUrl;
      }
    }
  });

  return storyClusters;
}
