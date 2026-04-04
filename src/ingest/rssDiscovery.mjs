import Parser from "rss-parser";

import { USA_TOP_NEWS_SOURCES } from "./sourceRegistry.mjs";
import { extractArticleExcerpt } from "./articleExtractor.mjs";

const parser = new Parser({
  customFields: {
    item: ["media:content", "description"],
  },
});

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "of",
  "for",
  "in",
  "on",
  "at",
  "from",
  "by",
  "with",
  "after",
  "before",
  "over",
  "under",
  "latest",
  "breaking",
  "live",
  "says",
  "say",
  "amid",
  "new",
  "news",
  "us",
]);

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token && !STOP_WORDS.has(token));
}

function similarity(a, b) {
  const aTokens = new Set(normalizeTitle(a));
  const bTokens = new Set(normalizeTitle(b));
  const intersection = [...aTokens].filter((token) => bTokens.has(token)).length;
  const union = new Set([...aTokens, ...bTokens]).size;
  if (!union) return 0;
  return intersection / union;
}

function toIso(value) {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

async function fetchFeed(source) {
  try {
    const feed = await parser.parseURL(source.feedUrl);
    return (feed.items || []).slice(0, 8).map((item, index) => ({
      id: `${source.id}-${index}-${Buffer.from(item.link || item.title || "").toString("base64").slice(0, 10)}`,
      source: source.name,
      sourceId: source.id,
      title: item.title?.trim() || "Untitled article",
      url: item.link,
      publishedAt: toIso(item.isoDate || item.pubDate),
      description: item.contentSnippet || item.content || item.description || "",
    }));
  } catch {
    return [];
  }
}

function chooseRepresentativeArticle(articles) {
  return [...articles].sort((a, b) => {
    const aScore = new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    return aScore;
  })[0];
}

function scoreCluster(cluster) {
  const newest = cluster.articles.reduce((latest, article) => {
    const current = new Date(article.publishedAt).getTime();
    return Math.max(latest, current);
  }, 0);

  const ageHours = Math.max(0, (Date.now() - newest) / 36e5);
  const freshness = Math.max(0, 30 - ageHours * 2);

  return (
    cluster.sources.size * 12 +
    cluster.articles.length * 4 +
    freshness
  );
}

function buildSummary(articles) {
  const representative = chooseRepresentativeArticle(articles);
  const description =
    representative.description?.replace(/\s+/g, " ").trim().slice(0, 220) ||
    "Multiple outlets are covering the same developing event.";

  return description;
}

async function enrichCluster(cluster) {
  const representative = chooseRepresentativeArticle(cluster.articles);
  const excerpt = representative?.url
    ? await extractArticleExcerpt(representative.url)
    : null;

  const topArticles = cluster.articles
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 5)
    .map((article) => ({
      source: article.source,
      title: article.title,
      url: article.url,
      publishedAt: article.publishedAt,
      notes: article.description?.slice(0, 160) || "",
      excerpt: article === representative ? excerpt || undefined : undefined,
    }));

  return {
    id: `rss-${cluster.id}`,
    title: representative.title,
    category: "Top Stories",
    headline: buildSummary(cluster.articles),
    whyItMatters: `Coverage from ${[...cluster.sources].slice(0, 3).join(", ")} indicates this is one of the most broadly covered U.S. stories right now.`,
    publishedAt: representative.publishedAt,
    sourceCount: cluster.sources.size,
    articleCount: cluster.articles.length,
    confidence: cluster.sources.size >= 4 ? "high" : cluster.sources.size >= 2 ? "medium" : "low",
    rankScore: Math.round(scoreCluster(cluster)),
    keywords: normalizeTitle(representative.title).slice(0, 5),
    commonFacts: [
      `At least ${cluster.sources.size} outlets are covering the same event.`,
      `The most recent coverage in this cluster was published at ${new Date(representative.publishedAt).toLocaleString()}.`,
    ],
    disputedPoints: [
      "Full claim-level disputes are not generated in the RSS fallback mode yet.",
    ],
    articles: topArticles,
  };
}

export async function discoverTopStoriesFromRss() {
  const articleLists = await Promise.all(USA_TOP_NEWS_SOURCES.map(fetchFeed));
  const articles = articleLists.flat().filter((article) => article.url && article.title);

  const clusters = [];

  for (const article of articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))) {
    let bestCluster = null;
    let bestScore = 0;

    for (const cluster of clusters) {
      const score = similarity(cluster.anchorTitle, article.title);
      if (score > bestScore) {
        bestScore = score;
        bestCluster = cluster;
      }
    }

    if (bestCluster && bestScore >= 0.42) {
      bestCluster.articles.push(article);
      bestCluster.sources.add(article.source);
      if (new Date(article.publishedAt) > new Date(bestCluster.latestPublishedAt)) {
        bestCluster.latestPublishedAt = article.publishedAt;
        bestCluster.anchorTitle = article.title;
      }
    } else {
      clusters.push({
        id: `${clusters.length + 1}`,
        anchorTitle: article.title,
        latestPublishedAt: article.publishedAt,
        sources: new Set([article.source]),
        articles: [article],
      });
    }
  }

  const ranked = await Promise.all(
    (() => {
      const sorted = clusters.sort((a, b) => scoreCluster(b) - scoreCluster(a));
      const multiSource = sorted.filter((cluster) => cluster.sources.size >= 2);
      const singleSource = sorted.filter((cluster) => cluster.sources.size < 2);

      const selected = [...multiSource];
      for (const cluster of singleSource) {
        if (selected.length >= 8) break;
        selected.push(cluster);
      }

      return selected.slice(0, 8).map(enrichCluster);
    })()
  );

  return {
    ok: true,
    provider: "rss-fallback",
    generatedAt: new Date().toISOString(),
    scope: {
      edition: "USA",
      category: "Top Stories",
      description: "Live U.S. top stories discovered from curated outlet feeds and clustered by headline similarity.",
    },
    clusters: ranked,
  };
}
