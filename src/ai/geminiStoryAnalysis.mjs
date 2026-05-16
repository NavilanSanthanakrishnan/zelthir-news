import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { GoogleGenAI } from "@google/genai";

import { discoveryConfig } from "../ingest/config.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.resolve(__dirname, "../../schemas/story-analysis.schema.json");
export const storyAnalysisSchema = JSON.parse(readFileSync(schemaPath, "utf8"));
const geminiResponseSchema = compactSchemaForGemini(storyAnalysisSchema);
const responseCache = new Map();
const topicTypes = new Set([
  "actor",
  "place",
  "policy",
  "public_safety",
  "economy",
  "culture",
  "sport",
  "health",
  "education",
  "climate",
  "technology",
  "legal",
  "community",
  "unknown",
]);
const relationships = new Set([
  "causes",
  "responds_to",
  "depends_on",
  "escalates",
  "constrains",
  "funds",
  "regulates",
  "affects",
  "contradicts",
  "clarifies",
  "related_to",
]);
let geminiClient;

export class StoryAnalysisProviderError extends Error {
  constructor(message, { statusCode = 502, code = "AI_ANALYSIS_FAILED" } = {}) {
    super(message);
    this.name = "StoryAnalysisProviderError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function compactSchemaForGemini(value) {
  if (Array.isArray(value)) {
    return value.map(compactSchemaForGemini);
  }
  if (!value || typeof value !== "object") {
    return value;
  }

  const compact = {};
  for (const [key, item] of Object.entries(value)) {
    if (["$schema", "additionalProperties", "minimum", "maximum", "minItems", "maxItems"].includes(key)) {
      continue;
    }
    compact[key] = compactSchemaForGemini(item);
  }
  return compact;
}

function uniqueArticles(articles = []) {
  const seen = new Set();
  const unique = [];

  for (const article of Array.isArray(articles) ? articles : []) {
    const key = article.url || `${article.source}-${article.title}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(article);
  }

  return unique;
}

function sanitizeText(text = "") {
  if (text === null || text === undefined) {
    return "";
  }

  return String(text).replace(/\s+/g, " ").trim();
}

function clampInteger(value, min, max, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function toId(value, fallback) {
  const id = sanitizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return id || fallback;
}

function normalizeStringArray(items = [], limit = Infinity) {
  return (Array.isArray(items) ? items : [])
    .map(sanitizeText)
    .filter(Boolean)
    .slice(0, limit);
}

function firstSourceNames(cluster, limit = 4) {
  const names = [];

  for (const article of uniqueArticles(cluster?.articles)) {
    const name = sanitizeText(article.source);
    if (name && !names.includes(name)) {
      names.push(name);
    }
    if (names.length >= limit) {
      break;
    }
  }

  return names;
}

function sourcesToLinks(sourceNames = [], cluster) {
  const articles = uniqueArticles(cluster?.articles);
  return normalizeStringArray(sourceNames, 4)
    .map((name) => {
      const match = articles.find(
        (article) => sanitizeText(article.source).toLowerCase() === name.toLowerCase()
      );
      return match
        ? {
            name: match.source,
            url: match.url,
          }
        : null;
    })
    .filter(Boolean);
}

function buildPrompt(cluster, section) {
  const articles = uniqueArticles(cluster.articles)
    .slice(0, 12)
    .map((article, index) => {
      const snippet = sanitizeText(article.snippet || "No snippet available.");
      const evidence = article._isDirect ? "direct article" : "aggregated headline or wrapper";
      return [
        `Article ${index + 1}`,
        `Source: ${article.source}`,
        `Title: ${sanitizeText(article.title)}`,
        `URL: ${article.url}`,
        `Published: ${article.publishedAt}`,
        `Evidence type: ${evidence}`,
        `Snippet: ${snippet}`,
      ].join("\n");
    })
    .join("\n\n");

  return `You are generating story intelligence for a news product called Zelthir.

Goal:
- Read the clustered reporting below.
- Write the best-supported account of what happened.
- Use only information present in the provided coverage.
- Do not invent facts, locations, actors, casualty counts, timelines, or causal links.
- If details conflict or remain unverified, surface them as disputed claims.
- Treat aggregated Google News wrapper headlines with no snippets as low-evidence unless confirmed by direct or trusted articles.
- Return a connected topic map, not a chronological timeline.
- Keep the writing crisp, journalistic, and understandable to non-technical readers.

Story metadata:
- Section: ${section.title}
- Canonical title: ${sanitizeText(cluster.canonicalTitle)}
- Existing cluster summary: ${sanitizeText(cluster.summary)}
- Sources in cluster: ${cluster.sourceCount}
- Articles in cluster: ${cluster.articleCount}

Coverage set:
${articles}

Return ONLY a compact JSON object that satisfies the supplied schema.

Topic map rules:
- The center must describe the main event.
- Topics should be connected concepts around the event, not timeline steps.
- Topic type must be one of: actor, place, policy, public_safety, economy, culture, sport, health, education, climate, technology, legal, community, unknown.
- Edge relationship must be one of: causes, responds_to, depends_on, escalates, constrains, funds, regulates, affects, contradicts, clarifies, related_to.
- Use source_names only from the provided coverage set.

General rules:
- No markdown.
- No prose before or after the JSON.
- Use integer confidence 0-100.
- If a field is weak, return an empty array rather than inventing details.`;
}

function fallbackArticleParagraphs(cluster) {
  const title = sanitizeText(cluster?.canonicalTitle) || "This story is still developing.";
  const summary = sanitizeText(cluster?.summary) || title;
  const sourceCount = clampInteger(cluster?.sourceCount, 0, 999, 0);
  const articleCount = clampInteger(cluster?.articleCount, 0, 999, 0);
  const latest = sanitizeText(cluster?.latestPublishedAt);
  const coverageLine = latest
    ? `Current coverage includes ${articleCount} articles from ${sourceCount} sources, with the latest item published at ${latest}.`
    : `Current coverage includes ${articleCount} articles from ${sourceCount} sources.`;
  return [
    summary,
    coverageLine,
    "Details that appear only in headlines should be treated as provisional until they are repeated in fuller reporting.",
  ];
}

function normalizeLedger(items = [], cluster) {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const sourceNames = item.source_names || item.sourceNames || item.sources || [];
      return {
        title: sanitizeText(item.title || item.claim),
        meta: sanitizeText(item.meta || ""),
        sources: sourcesToLinks(sourceNames, cluster),
      };
    })
    .filter((item) => item.title);
}

function fallbackAgreedClaims(cluster) {
  const summary = sanitizeText(cluster?.summary);
  const sourceNames = firstSourceNames(cluster, 4);

  if (!summary || !sourceNames.length) {
    return [];
  }

  return [
    {
      title: summary,
      meta: "Supported by the current clustered coverage.",
      sources: sourcesToLinks(sourceNames, cluster),
    },
  ];
}

function normalizeFrames(frames = []) {
  return (Array.isArray(frames) ? frames : [])
    .map((frame) => ({
      label: sanitizeText(typeof frame === "string" ? frame : frame.label),
      percent: clampInteger(typeof frame === "string" ? 0 : frame.percent, 0, 100),
    }))
    .filter((frame) => frame.label)
    .slice(0, 4);
}

function normalizeWatchSignals(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      title: sanitizeText(typeof item === "string" ? item : item.title),
      copy: sanitizeText(typeof item === "string" ? "" : item.copy),
    }))
    .filter((item) => item.title || item.copy)
    .slice(0, 4);
}

function normalizeRippleEffects(ripple = {}) {
  if (Array.isArray(ripple)) {
    return {
      "24h": normalizeStringArray(ripple.slice(0, 2), 4),
      "7d": normalizeStringArray(ripple.slice(2, 4), 4),
      "30d": normalizeStringArray(ripple.slice(4), 4),
    };
  }

  return {
    "24h": normalizeStringArray(ripple?.["24h"], 4),
    "7d": normalizeStringArray(ripple?.["7d"], 4),
    "30d": normalizeStringArray(ripple?.["30d"], 4),
  };
}

function fallbackTopicMap(cluster, section) {
  const sourceNames = firstSourceNames(cluster, 4);
  const center = {
    id: "event",
    label: sanitizeText(cluster?.canonicalTitle) || "Main event",
    summary: sanitizeText(cluster?.summary) || sanitizeText(cluster?.whyItMatters) || "Current coverage cluster",
  };
  const sectionLabel = sanitizeText(section?.title || cluster?.section) || "Coverage context";
  const topics = [
    {
      id: "coverage-context",
      label: sectionLabel,
      type: "unknown",
      summary: sanitizeText(cluster?.whyItMatters) || `This story is grouped under ${sectionLabel}.`,
      weight: 50,
      sourceNames,
      sources: sourcesToLinks(sourceNames, cluster),
    },
  ];
  return {
    center,
    topics,
    edges: [
      {
        source: center.id,
        target: topics[0].id,
        relationship: "related_to",
        summary: "The event is connected to the surrounding coverage context.",
        supportCount: sourceNames.length,
      },
    ],
  };
}

function normalizeTopicMap(topicMap = {}, cluster, section) {
  const fallback = fallbackTopicMap(cluster, section);
  const raw = topicMap && typeof topicMap === "object" && !Array.isArray(topicMap) ? topicMap : {};
  const rawCenter = raw.center && typeof raw.center === "object" ? raw.center : {};
  const center = {
    id: toId(rawCenter.id, fallback.center.id),
    label: sanitizeText(rawCenter.label) || fallback.center.label,
    summary: sanitizeText(rawCenter.summary) || fallback.center.summary,
  };
  const topics = (Array.isArray(raw.topics) ? raw.topics : [])
    .map((topic, index) => {
      const label = sanitizeText(topic?.label);
      const id = toId(topic?.id || label, `topic-${index + 1}`);
      const type = topicTypes.has(topic?.type) ? topic.type : "unknown";
      const sourceNames = normalizeStringArray(topic?.source_names || topic?.sourceNames, 4);
      return {
        id,
        label,
        type,
        summary: sanitizeText(topic?.summary),
        weight: clampInteger(topic?.weight, 0, 100, 50),
        sourceNames,
        sources: sourcesToLinks(sourceNames, cluster),
      };
    })
    .filter((topic) => topic.label)
    .slice(0, 8);
  const resolvedTopics = topics.length ? topics : fallback.topics;
  const ids = new Set([center.id, ...resolvedTopics.map((topic) => topic.id)]);
  const edges = (Array.isArray(raw.edges) ? raw.edges : [])
    .map((edge) => {
      const source = toId(edge?.source, "");
      const target = toId(edge?.target, "");
      const relationship = relationships.has(edge?.relationship) ? edge.relationship : "related_to";
      return {
        source,
        target,
        relationship,
        summary: sanitizeText(edge?.summary),
        supportCount: clampInteger(edge?.support_count || edge?.supportCount, 0, 12),
      };
    })
    .filter((edge) => ids.has(edge.source) && ids.has(edge.target) && edge.source !== edge.target)
    .slice(0, 12);
  const resolvedEdges = edges.length
    ? edges
    : resolvedTopics.map((topic) => ({
        source: center.id,
        target: topic.id,
        relationship: "related_to",
        summary: topic.summary || "This topic is connected to the main event.",
        supportCount: topic.sourceNames.length,
      }));
  return {
    center,
    topics: resolvedTopics,
    edges: resolvedEdges,
  };
}

function ensureArticleParagraphs(paragraphs, cluster) {
  const fallback = fallbackArticleParagraphs(cluster);
  const merged = [...paragraphs, ...fallback].map(sanitizeText).filter(Boolean);
  return [...new Set(merged)].slice(0, 6);
}

function normalizeAnalysis(raw, cluster, section) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new StoryAnalysisProviderError("Gemini returned invalid analysis", {
      statusCode: 502,
      code: "GEMINI_SCHEMA_INVALID",
    });
  }

  const agreed = normalizeLedger(raw.agreed_claims || raw.agreed || [], cluster);
  const articleParagraphs = ensureArticleParagraphs(
    normalizeStringArray(raw.article_paragraphs || raw.articleParagraphs, 6),
    cluster
  );
  const confidence = Number(raw.confidence) <= 1
    ? clampInteger(Number(raw.confidence || 0) * 100, 0, 100)
    : clampInteger(raw.confidence, 0, 100);
  return {
    provider: "gemini",
    headline: sanitizeText(raw.headline) || sanitizeText(cluster?.canonicalTitle),
    brief: sanitizeText(raw.brief) || sanitizeText(cluster?.summary),
    confidence,
    articleParagraphs,
    agreed: agreed.length ? agreed : fallbackAgreedClaims(cluster),
    disputes: normalizeLedger(raw.disputed_claims || raw.disputes || [], cluster),
    frames: normalizeFrames(raw.frames || []),
    topicMap: normalizeTopicMap(raw.topic_map || raw.topicMap || {}, cluster, section),
    watchSignals: normalizeWatchSignals(raw.watch_signals || raw.watchSignals || []),
    rippleEffects: normalizeRippleEffects(raw.ripple_effects || raw.rippleEffects || {}),
  };
}

function ledgerToSchema(items = []) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    title: sanitizeText(item.title),
    meta: sanitizeText(item.meta),
    source_names: normalizeStringArray(
      item.source_names || item.sourceNames || item.sources?.map((source) => source.name),
      4
    ),
  }));
}

export function analysisToSchemaPayload(analysis = {}) {
  const topicMap = analysis.topicMap || {};
  return {
    headline: sanitizeText(analysis.headline),
    brief: sanitizeText(analysis.brief),
    confidence: clampInteger(analysis.confidence, 0, 100),
    article_paragraphs: normalizeStringArray(analysis.articleParagraphs, 6),
    agreed_claims: ledgerToSchema(analysis.agreed).slice(0, 4),
    disputed_claims: ledgerToSchema(analysis.disputes).slice(0, 3),
    frames: (Array.isArray(analysis.frames) ? analysis.frames : []).slice(0, 4).map((frame) => ({
      label: sanitizeText(frame.label),
      percent: clampInteger(frame.percent, 0, 100),
    })),
    topic_map: {
      center: {
        id: sanitizeText(topicMap.center?.id),
        label: sanitizeText(topicMap.center?.label),
        summary: sanitizeText(topicMap.center?.summary),
      },
      topics: (Array.isArray(topicMap.topics) ? topicMap.topics : []).slice(0, 8).map((topic) => ({
        id: sanitizeText(topic.id),
        label: sanitizeText(topic.label),
        type: topicTypes.has(topic.type) ? topic.type : "unknown",
        summary: sanitizeText(topic.summary),
        weight: clampInteger(topic.weight, 0, 100, 50),
        source_names: normalizeStringArray(
          topic.source_names || topic.sourceNames || topic.sources?.map((source) => source.name),
          4
        ),
      })),
      edges: (Array.isArray(topicMap.edges) ? topicMap.edges : []).slice(0, 12).map((edge) => ({
        source: sanitizeText(edge.source),
        target: sanitizeText(edge.target),
        relationship: relationships.has(edge.relationship) ? edge.relationship : "related_to",
        summary: sanitizeText(edge.summary),
        support_count: clampInteger(edge.support_count || edge.supportCount, 0, 12),
      })),
    },
    watch_signals: (Array.isArray(analysis.watchSignals) ? analysis.watchSignals : [])
      .slice(0, 4)
      .map((item) => ({
        title: sanitizeText(item.title),
        copy: sanitizeText(item.copy),
      })),
    ripple_effects: {
      "24h": normalizeStringArray(analysis.rippleEffects?.["24h"], 4),
      "7d": normalizeStringArray(analysis.rippleEffects?.["7d"], 4),
      "30d": normalizeStringArray(analysis.rippleEffects?.["30d"], 4),
    },
  };
}

function expectObject(value, path, errors) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${path} must be an object`);
    return false;
  }

  return true;
}

function expectString(value, path, errors) {
  if (typeof value !== "string") {
    errors.push(`${path} must be a string`);
  }
}

function expectInteger(value, path, min, max, errors) {
  if (!Number.isInteger(value) || value < min || value > max) {
    errors.push(`${path} must be an integer from ${min} to ${max}`);
  }
}

function expectStringArray(value, path, maxItems, errors, minItems = 0) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }

  if (value.length < minItems || value.length > maxItems) {
    errors.push(`${path} must contain ${minItems}-${maxItems} items`);
  }
  value.forEach((item, index) => expectString(item, `${path}[${index}]`, errors));
}

function validateLedger(items, path, maxItems, errors) {
  if (!Array.isArray(items)) {
    errors.push(`${path} must be an array`);
    return;
  }

  if (items.length > maxItems) {
    errors.push(`${path} must contain at most ${maxItems} items`);
  }
  items.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    if (!expectObject(item, itemPath, errors)) {
      return;
    }
    expectString(item.title, `${itemPath}.title`, errors);
    expectString(item.meta, `${itemPath}.meta`, errors);
    expectStringArray(item.source_names, `${itemPath}.source_names`, 4, errors);
  });
}

export function validateStoryAnalysisPayload(payload) {
  const errors = [];
  if (!expectObject(payload, "$", errors)) {
    return errors;
  }

  expectString(payload.headline, "$.headline", errors);
  expectString(payload.brief, "$.brief", errors);
  expectInteger(payload.confidence, "$.confidence", 0, 100, errors);
  expectStringArray(payload.article_paragraphs, "$.article_paragraphs", 6, errors, 3);
  validateLedger(payload.agreed_claims, "$.agreed_claims", 4, errors);
  validateLedger(payload.disputed_claims, "$.disputed_claims", 3, errors);
  if (!Array.isArray(payload.frames)) {
    errors.push("$.frames must be an array");
  } else {
    if (payload.frames.length > 4) {
      errors.push("$.frames must contain at most 4 items");
    }
    payload.frames.forEach((frame, index) => {
      const pathPrefix = `$.frames[${index}]`;
      if (!expectObject(frame, pathPrefix, errors)) {
        return;
      }
      expectString(frame.label, `${pathPrefix}.label`, errors);
      expectInteger(frame.percent, `${pathPrefix}.percent`, 0, 100, errors);
    });
  }
  validateTopicMap(payload.topic_map, "$.topic_map", errors);
  if (!Array.isArray(payload.watch_signals)) {
    errors.push("$.watch_signals must be an array");
  } else {
    if (payload.watch_signals.length > 4) {
      errors.push("$.watch_signals must contain at most 4 items");
    }
    payload.watch_signals.forEach((item, index) => {
      const pathPrefix = `$.watch_signals[${index}]`;
      if (!expectObject(item, pathPrefix, errors)) {
        return;
      }
      expectString(item.title, `${pathPrefix}.title`, errors);
      expectString(item.copy, `${pathPrefix}.copy`, errors);
    });
  }
  if (!expectObject(payload.ripple_effects, "$.ripple_effects", errors)) {
    return errors;
  }
  expectStringArray(payload.ripple_effects["24h"], '$.ripple_effects["24h"]', 4, errors);
  expectStringArray(payload.ripple_effects["7d"], '$.ripple_effects["7d"]', 4, errors);
  expectStringArray(payload.ripple_effects["30d"], '$.ripple_effects["30d"]', 4, errors);
  return errors;
}

function validateTopicMap(topicMap, path, errors) {
  if (!expectObject(topicMap, path, errors)) {
    return;
  }

  if (expectObject(topicMap.center, `${path}.center`, errors)) {
    expectString(topicMap.center.id, `${path}.center.id`, errors);
    expectString(topicMap.center.label, `${path}.center.label`, errors);
    expectString(topicMap.center.summary, `${path}.center.summary`, errors);
  }
  if (!Array.isArray(topicMap.topics)) {
    errors.push(`${path}.topics must be an array`);
  } else {
    if (topicMap.topics.length > 8) {
      errors.push(`${path}.topics must contain at most 8 items`);
    }
    topicMap.topics.forEach((topic, index) => {
      const topicPath = `${path}.topics[${index}]`;
      if (!expectObject(topic, topicPath, errors)) {
        return;
      }
      expectString(topic.id, `${topicPath}.id`, errors);
      expectString(topic.label, `${topicPath}.label`, errors);
      if (!topicTypes.has(topic.type)) {
        errors.push(`${topicPath}.type must be a supported topic type`);
      }
      expectString(topic.summary, `${topicPath}.summary`, errors);
      expectInteger(topic.weight, `${topicPath}.weight`, 0, 100, errors);
      expectStringArray(topic.source_names, `${topicPath}.source_names`, 4, errors);
    });
  }
  if (!Array.isArray(topicMap.edges)) {
    errors.push(`${path}.edges must be an array`);
  } else {
    if (topicMap.edges.length > 12) {
      errors.push(`${path}.edges must contain at most 12 items`);
    }
    topicMap.edges.forEach((edge, index) => {
      const edgePath = `${path}.edges[${index}]`;
      if (!expectObject(edge, edgePath, errors)) {
        return;
      }
      expectString(edge.source, `${edgePath}.source`, errors);
      expectString(edge.target, `${edgePath}.target`, errors);
      if (!relationships.has(edge.relationship)) {
        errors.push(`${edgePath}.relationship must be a supported relationship`);
      }
      expectString(edge.summary, `${edgePath}.summary`, errors);
      expectInteger(edge.support_count, `${edgePath}.support_count`, 0, 12, errors);
    });
  }
}

function getGeminiClient() {
  if (!discoveryConfig.geminiApiKey) {
    throw new StoryAnalysisProviderError("Gemini is not configured", {
      statusCode: 503,
      code: "GEMINI_NOT_CONFIGURED",
    });
  }

  geminiClient ||= new GoogleGenAI({ apiKey: discoveryConfig.geminiApiKey });
  return geminiClient;
}

async function withTimeout(promise, timeoutMs) {
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => {
      reject(
        new StoryAnalysisProviderError("Gemini analysis timed out", {
          statusCode: 504,
          code: "GEMINI_TIMEOUT",
        })
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonResponse(response) {
  const text = typeof response?.text === "function" ? response.text() : response?.text;
  if (!sanitizeText(text)) {
    throw new StoryAnalysisProviderError("Gemini returned no analysis", {
      statusCode: 502,
      code: "GEMINI_EMPTY_RESPONSE",
    });
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new StoryAnalysisProviderError("Gemini returned invalid JSON", {
      statusCode: 502,
      code: "GEMINI_INVALID_JSON",
    });
  }
}

async function requestGeminiAnalysis(prompt) {
  const client = getGeminiClient();

  try {
    return await withTimeout(
      client.models.generateContent({
        model: discoveryConfig.geminiModel,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: geminiResponseSchema,
          temperature: 0.2,
        },
      }),
      discoveryConfig.aiTimeoutMs
    );
  } catch (error) {
    if (error instanceof StoryAnalysisProviderError) {
      throw error;
    }

    throw new StoryAnalysisProviderError("Gemini analysis failed", {
      statusCode: 502,
      code: "GEMINI_REQUEST_FAILED",
    });
  }
}

function buildFallbackAnalysis(cluster, section) {
  const fallback = normalizeAnalysis({}, cluster, section);
  const validationErrors = validateStoryAnalysisPayload(analysisToSchemaPayload(fallback));

  if (validationErrors.length) {
    throw new StoryAnalysisProviderError("Gemini fallback analysis failed schema validation", {
      statusCode: 502,
      code: "GEMINI_FALLBACK_SCHEMA_INVALID",
    });
  }

  return fallback;
}

export async function analyzeClusterWithGemini(cluster, section) {
  const cacheKey = `${cluster.clusterId}:${cluster.latestPublishedAt}`;
  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }

  let normalized;
  try {
    const response = await requestGeminiAnalysis(buildPrompt(cluster, section));
    const raw = parseJsonResponse(response);
    normalized = normalizeAnalysis(raw, cluster, section);
    const validationErrors = validateStoryAnalysisPayload(analysisToSchemaPayload(normalized));

    if (validationErrors.length) {
      throw new StoryAnalysisProviderError("Gemini returned analysis in an unsupported shape", {
        statusCode: 502,
        code: "GEMINI_SCHEMA_INVALID",
      });
    }
  } catch (error) {
    if (error instanceof StoryAnalysisProviderError && error.code === "GEMINI_NOT_CONFIGURED") {
      throw error;
    }

    normalized = buildFallbackAnalysis(cluster, section);
  }

  responseCache.set(cacheKey, normalized);
  return normalized;
}
