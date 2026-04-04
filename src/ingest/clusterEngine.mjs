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
  "world",
  "today",
  "why",
  "how",
]);

const TRUSTED_OUTLET_PATTERNS = [
  /reuters/i,
  /associated press/i,
  /\bap news\b/i,
  /\bbbc\b/i,
  /\bnpr\b/i,
  /\bcnn\b/i,
  /\babc news\b/i,
  /\bcbs news\b/i,
  /\bnbc\b/i,
  /politico/i,
  /axios/i,
  /the hill/i,
  /the guardian/i,
  /wall street journal|\bwsj\b/i,
  /new york times/i,
  /washington post/i,
  /bloomberg/i,
  /al jazeera/i,
  /fox news/i,
  /forbes/i,
  /economist/i,
  /usa today/i,
];

function normalizeWhitespace(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

export function slugify(text) {
  return normalizeWhitespace(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export function tokenize(text) {
  return normalizeWhitespace(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token && token.length > 2 && !STOP_WORDS.has(token));
}

function jaccard(leftTokens, rightTokens) {
  const left = new Set(leftTokens);
  const right = new Set(rightTokens);
  if (!left.size || !right.size) return 0;

  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

function sharedTokenCount(leftTokens, rightTokens) {
  const right = new Set(rightTokens);
  return [...new Set(leftTokens)].filter((token) => right.has(token)).length;
}

function tokenizeSnippet(text) {
  return tokenize((text || "").slice(0, 240));
}

function computeTimeScore(left, right) {
  const leftTime = new Date(left).getTime();
  const rightTime = new Date(right).getTime();
  const diffHours = Math.abs(leftTime - rightTime) / 36e5;

  if (diffHours > 96) return 0;
  return Math.max(0, 1 - diffHours / 96);
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clusterNewestMs(cluster) {
  return Math.max(...cluster.articles.map((article) => article._publishedMs));
}

function hasMeaningfulSnippet(article) {
  return normalizeWhitespace(article?.snippet || "").length >= 40;
}

function isGoogleLink(article) {
  return (article?.url || "").includes("news.google.com/");
}

function isTrustedOutlet(article) {
  const text = `${article?.source || ""} ${article?.host || ""}`;
  return TRUSTED_OUTLET_PATTERNS.some((pattern) => pattern.test(text));
}

export function normalizeArticle(rawArticle) {
  const title = normalizeWhitespace(rawArticle.title);
  const snippet = normalizeWhitespace(rawArticle.snippet || rawArticle.description || "");
  const publishedAt = rawArticle.publishedAt || new Date().toISOString();
  const host = rawArticle.host || safeHost(rawArticle.url);
  const publishedMs = new Date(publishedAt).getTime();

  return {
    id: rawArticle.id || `${host}-${slugify(title)}-${publishedAt}`,
    source: rawArticle.source || "Unknown source",
    title,
    url: rawArticle.url,
    publishedAt,
    snippet,
    imageUrl: rawArticle.imageUrl || null,
    section: rawArticle.section,
    language: rawArticle.language || "en",
    host,
    _titleTokens: tokenize(title),
    _snippetTokens: tokenizeSnippet(snippet),
    _publishedMs: Number.isNaN(publishedMs) ? Date.now() : publishedMs,
    _isDirect: typeof rawArticle.isDirect === "boolean" ? rawArticle.isDirect : !isGoogleLink(rawArticle),
    _isTrusted: isTrustedOutlet({
      source: rawArticle.source || "Unknown source",
      host,
    }),
  };
}

export function safeHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

export function dedupeArticles(rawArticles) {
  const normalized = rawArticles.map(normalizeArticle);
  const urlSeen = new Set();
  const titleSeen = new Set();
  const deduped = [];

  for (const article of normalized.sort((left, right) => right._publishedMs - left._publishedMs)) {
    if (!article.url) continue;

    const canonicalUrl = article.url.split("?")[0];
    if (urlSeen.has(canonicalUrl)) {
      continue;
    }

    const timeBucket = Math.floor(article._publishedMs / 36e5 / 6);
    const titleKey = `${article.source.toLowerCase()}::${slugify(article.title)}::${timeBucket}`;

    if (titleSeen.has(titleKey)) {
      continue;
    }

    urlSeen.add(canonicalUrl);
    titleSeen.add(titleKey);
    deduped.push(article);
  }

  return deduped;
}

function pairScore(left, right) {
  const titleScore = jaccard(left._titleTokens, right._titleTokens);
  const snippetScore = jaccard(left._snippetTokens, right._snippetTokens);
  const timeScore = computeTimeScore(left.publishedAt, right.publishedAt);
  return titleScore * 0.56 + snippetScore * 0.16 + timeScore * 0.28;
}

function clusterScore(article, cluster) {
  const representativeScores = cluster.articles
    .slice(0, 6)
    .map((candidate) => pairScore(article, candidate));

  const clusterTokenScore = jaccard(article._titleTokens, [...cluster.signatureTokens]);
  const diversityBonus = cluster.sources.has(article.source) ? 0 : 0.06;
  return average(representativeScores) * 0.78 + clusterTokenScore * 0.22 + diversityBonus;
}

function chooseCanonicalArticle(cluster) {
  return [...cluster.articles]
    .map((article) => ({
      article,
      score:
        average(cluster.articles.filter((candidate) => candidate.id !== article.id).map((candidate) => pairScore(article, candidate))) +
        (cluster.sources.has(article.source) ? 0.08 : 0) +
        (hasMeaningfulSnippet(article) ? 0.12 : 0) +
        (article.imageUrl ? 0.08 : 0) +
        (article._isDirect ? 0.16 : 0) +
        (article._isTrusted ? 0.18 : 0),
    }))
    .sort((left, right) => right.score - left.score || right.article._publishedMs - left.article._publishedMs)[0]?.article;
}

function chooseSummary(cluster, canonical) {
  const bestSnippet = [canonical, ...cluster.articles]
    .filter(Boolean)
    .sort((left, right) => {
      const leftScore = (left._isTrusted ? 2 : 0) + (left._isDirect ? 1 : 0) + (hasMeaningfulSnippet(left) ? 1 : 0);
      const rightScore = (right._isTrusted ? 2 : 0) + (right._isDirect ? 1 : 0) + (hasMeaningfulSnippet(right) ? 1 : 0);
      return rightScore - leftScore || right._publishedMs - left._publishedMs;
    })
    .find((article) => hasMeaningfulSnippet(article));

  if (bestSnippet) {
    return bestSnippet.snippet;
  }

  return `${cluster.sources.size} outlets are currently covering this story.`;
}

function visibleArticlePriority(article) {
  return (article._isTrusted ? 4 : 0) + (article._isDirect ? 2 : 0) + (hasMeaningfulSnippet(article) ? 1 : 0);
}

function mergeClusters(left, right) {
  for (const article of right.articles) {
    left.articles.push(article);
  }

  for (const source of right.sources) {
    left.sources.add(source);
  }

  for (const host of right.hosts) {
    left.hosts.add(host);
  }

  for (const token of right.signatureTokens) {
    left.signatureTokens.add(token);
  }

  return left;
}

function clusterMergeScore(left, right) {
  const leftTokens = [...left.signatureTokens];
  const rightTokens = [...right.signatureTokens];
  const signatureScore = jaccard(leftTokens, rightTokens);
  const sharedSignatureCount = sharedTokenCount(leftTokens, rightTokens);
  const timeScore = computeTimeScore(
    new Date(clusterNewestMs(left)).toISOString(),
    new Date(clusterNewestMs(right)).toISOString()
  );
  const pairScores = left.articles
    .slice(0, 5)
    .flatMap((leftArticle) =>
      right.articles.slice(0, 5).map((rightArticle) => pairScore(leftArticle, rightArticle))
    );
  const pairAverage = average(pairScores);
  const sourceOverlapPenalty = [...left.sources].some((source) => right.sources.has(source)) ? -0.03 : 0.04;
  const sharedSignatureBoost = sharedSignatureCount >= 4 ? 0.14 : sharedSignatureCount >= 3 ? 0.08 : 0;

  return pairAverage * 0.5 + signatureScore * 0.24 + timeScore * 0.16 + sharedSignatureBoost + sourceOverlapPenalty;
}

function collapseClusters(clusters) {
  const merged = [];

  for (const cluster of [...clusters].sort((left, right) => clusterNewestMs(right) - clusterNewestMs(left))) {
    let target = null;
    let bestScore = 0;

    for (const candidate of merged) {
      const score = clusterMergeScore(cluster, candidate);
      if (score > bestScore) {
        bestScore = score;
        target = candidate;
      }
    }

    if (target && bestScore >= 0.44) {
      mergeClusters(target, cluster);
    } else {
      merged.push(cluster);
    }
  }

  return merged;
}

function scoreRank(cluster) {
  const newestMs = Math.max(...cluster.articles.map((article) => article._publishedMs));
  const ageHours = Math.max(0, (Date.now() - newestMs) / 36e5);
  const freshness = Math.max(0, 36 - ageHours * 1.4);
  const sourceBreadth = cluster.sources.size * 15;
  const articleDepth = Math.min(cluster.articles.length, 40) * 2.4;
  const domainDiversity = cluster.hosts.size * 1.5;
  const trustedCoverage = cluster.articles.filter((article) => article._isTrusted).length * 2.8;
  const directCoverage = cluster.articles.filter((article) => article._isDirect).length * 1.8;
  return Math.round(sourceBreadth + articleDepth + freshness + domainDiversity + trustedCoverage + directCoverage);
}

function scoreQuality(cluster) {
  const trustedCount = cluster.articles.filter((article) => article._isTrusted).length;
  const directCount = cluster.articles.filter((article) => article._isDirect).length;
  const snippetCount = cluster.articles.filter((article) => hasMeaningfulSnippet(article)).length;

  return trustedCount * 8 + directCount * 5 + snippetCount * 2 + cluster.hosts.size;
}

function passesQualityGate(section, cluster) {
  const trustedCount = cluster.articles.filter((article) => article._isTrusted).length;
  const directCount = cluster.articles.filter((article) => article._isDirect).length;
  const qualityCount = cluster.articles.filter(
    (article) => article._isTrusted || article._isDirect
  ).length;
  const sourceCount = cluster.sourceCount || cluster.sources?.size || 0;

  if (section === "worldTopStories") {
    return trustedCount >= 2 || directCount >= 2 || qualityCount >= 3 || sourceCount >= 6;
  }

  return trustedCount >= 1 || directCount >= 2 || qualityCount >= 3 || sourceCount >= 5;
}

function buildWhyItMatters(section, cluster) {
  if (section === "usaDailyBriefing") {
    return `This story is breaking through across ${cluster.sources.size} U.S. sources, making it part of the domestic briefing that general readers would expect on a national news homepage.`;
  }

  return `This event is appearing across ${cluster.sources.size} international sources, which makes it strong enough to anchor the global top stories rail.`;
}

export function clusterArticlePool(rawArticles, section, { maxClusters = 8 } = {}) {
  const articles = dedupeArticles(rawArticles);
  const clusters = [];

  for (const article of articles.sort((left, right) => right._publishedMs - left._publishedMs)) {
    let bestCluster = null;
    let bestScore = 0;

    for (const cluster of clusters) {
      const tokenOverlap = jaccard(article._titleTokens, [...cluster.signatureTokens]);
      const sharedTitles = sharedTokenCount(article._titleTokens, [...cluster.signatureTokens]);

      if (tokenOverlap < 0.18 && sharedTitles < 2) {
        continue;
      }

      const score = clusterScore(article, cluster);
      if (score > bestScore) {
        bestScore = score;
        bestCluster = cluster;
      }
    }

    if (bestCluster && bestScore >= 0.37) {
      bestCluster.articles.push(article);
      bestCluster.sources.add(article.source);
      bestCluster.hosts.add(article.host);
      for (const token of article._titleTokens.slice(0, 8)) {
        bestCluster.signatureTokens.add(token);
      }
    } else {
      clusters.push({
        articles: [article],
        sources: new Set([article.source]),
        hosts: new Set([article.host]),
        signatureTokens: new Set(article._titleTokens.slice(0, 8)),
      });
    }
  }

  const rankedClusters = collapseClusters(clusters)
    .map((cluster, index) => {
      const canonical = chooseCanonicalArticle(cluster) || cluster.articles[0];
      const visibleArticles = [...cluster.articles]
        .sort((left, right) => {
          const priorityDiff = visibleArticlePriority(right) - visibleArticlePriority(left);
          if (priorityDiff !== 0) {
            return priorityDiff;
          }

          return right._publishedMs - left._publishedMs;
        })
        .slice(0, 18)
        .map(({ _titleTokens, _snippetTokens, _publishedMs, ...article }) => article);

      return {
        clusterId: `${section}-${index + 1}-${slugify(canonical.title)}`,
        section,
        canonicalTitle: canonical.title,
        summary: chooseSummary(cluster, canonical),
        whyItMatters: buildWhyItMatters(section, cluster),
        imageUrl: canonical.imageUrl || cluster.articles.find((article) => article.imageUrl)?.imageUrl || null,
        sourceCount: cluster.sources.size,
        articleCount: cluster.articles.length,
        latestPublishedAt: new Date(
          Math.max(...cluster.articles.map((article) => article._publishedMs))
        ).toISOString(),
        rankScore: scoreRank(cluster),
        qualityScore: scoreQuality(cluster),
        articles: visibleArticles,
      };
    })
    .sort((left, right) => {
      return (
        right.qualityScore - left.qualityScore ||
        right.rankScore - left.rankScore ||
        right.sourceCount - left.sourceCount
      );
    });

  const gatedClusters = rankedClusters.filter((cluster) => passesQualityGate(section, cluster));
  const selected = [...gatedClusters];

  for (const cluster of rankedClusters) {
    if (selected.length >= maxClusters) {
      break;
    }

    if (selected.some((candidate) => candidate.clusterId === cluster.clusterId)) {
      continue;
    }

    selected.push(cluster);
  }

  return selected.slice(0, maxClusters);
}
