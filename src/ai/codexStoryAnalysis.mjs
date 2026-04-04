import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { discoveryConfig } from "../ingest/config.mjs";

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");
const responseCache = new Map();

function uniqueArticles(articles = []) {
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

function sanitizeText(text = "") {
  return String(text).replace(/\s+/g, " ").trim();
}

function buildPrompt(cluster, section) {
  const articles = uniqueArticles(cluster.articles)
    .slice(0, 12)
    .map((article, index) => {
      const snippet = sanitizeText(article.snippet || "No snippet available.");
      return [
        `Article ${index + 1}`,
        `Source: ${article.source}`,
        `Title: ${sanitizeText(article.title)}`,
        `URL: ${article.url}`,
        `Published: ${article.publishedAt}`,
        `Snippet: ${snippet}`,
      ].join("\n");
    })
    .join("\n\n");

  return `You are generating story intelligence for a news product called Zelthir.

Goal:
- Read the clustered reporting below.
- Write the best-supported account of what happened.
- Use only information present in the provided coverage.
- Do not invent facts.
- If details conflict or remain unverified, surface them as disputed claims.
- Keep the writing crisp, journalistic, and product-ready.

Story metadata:
- Section: ${section.title}
- Canonical title: ${sanitizeText(cluster.canonicalTitle)}
- Existing cluster summary: ${sanitizeText(cluster.summary)}
- Sources in cluster: ${cluster.sourceCount}
- Articles in cluster: ${cluster.articleCount}

Coverage set:
${articles}

Return ONLY a compact JSON object with this exact shape:
{
  "headline": "string",
  "brief": "string",
  "confidence": 84,
  "article_paragraphs": ["paragraph 1", "paragraph 2", "paragraph 3"],
  "agreed_claims": [
    { "title": "claim", "meta": "support wording", "source_names": ["CBS News", "NPR"] }
  ],
  "disputed_claims": [
    { "title": "open question", "meta": "why unresolved", "source_names": ["Source A"] }
  ],
  "frames": [
    { "label": "Threat / Escalation", "percent": 40 }
  ],
  "watch_signals": [
    { "title": "Signal title", "copy": "Why it matters" }
  ],
  "ripple_effects": {
    "24h": ["effect"],
    "7d": ["effect"],
    "30d": ["effect"]
  }
}

Rules:
- No markdown.
- No prose before or after the JSON.
- Use integer confidence 0-100.
- Use only source names that appear in the provided coverage.
- If a field is weak, return an empty array rather than inventing details.`;
}

function sourcesToLinks(sourceNames = [], cluster) {
  const articles = uniqueArticles(cluster.articles);
  return sourceNames
    .map((name) => {
      const match = articles.find(
        (article) => article.source.toLowerCase() === String(name).toLowerCase()
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

function normalizeLedger(items = [], cluster) {
  return items.map((item) => ({
    title: sanitizeText(item.title || item.claim),
    meta: sanitizeText(item.meta || ""),
    sources: sourcesToLinks(item.source_names || item.sources || [], cluster),
  }));
}

function normalizeFrames(frames = []) {
  return frames
    .map((frame) => ({
      label: sanitizeText(typeof frame === "string" ? frame : frame.label),
      percent: Math.max(
        0,
        Math.min(100, Number(typeof frame === "string" ? 0 : frame.percent) || 0)
      ),
    }))
    .filter((frame) => frame.label);
}

function normalizeWatchSignals(items = []) {
  return items.map((item) => ({
    title: sanitizeText(typeof item === "string" ? item : item.title),
    copy: sanitizeText(typeof item === "string" ? "" : item.copy),
  }));
}

function normalizeRippleEffects(ripple = {}) {
  if (Array.isArray(ripple)) {
    return {
      "24h": ripple.slice(0, 2).map(sanitizeText).filter(Boolean),
      "7d": ripple.slice(2, 4).map(sanitizeText).filter(Boolean),
      "30d": ripple.slice(4).map(sanitizeText).filter(Boolean),
    };
  }

  return {
    "24h": (ripple["24h"] || []).map(sanitizeText).filter(Boolean),
    "7d": (ripple["7d"] || []).map(sanitizeText).filter(Boolean),
    "30d": (ripple["30d"] || []).map(sanitizeText).filter(Boolean),
  };
}

function normalizeAnalysis(raw, cluster) {
  return {
    provider: "codex-cli",
    headline: sanitizeText(raw.headline),
    brief: sanitizeText(raw.brief),
    confidence: Math.max(
      0,
      Math.min(
        100,
        Number(raw.confidence) <= 1
          ? Math.round(Number(raw.confidence || 0) * 100)
          : Math.round(Number(raw.confidence) || 0)
      )
    ),
    articleParagraphs: (raw.article_paragraphs || []).map(sanitizeText).filter(Boolean),
    agreed: normalizeLedger(raw.agreed_claims || [], cluster),
    disputes: normalizeLedger(raw.disputed_claims || [], cluster),
    frames: normalizeFrames(raw.frames || []),
    watchSignals: normalizeWatchSignals(raw.watch_signals || []),
    rippleEffects: normalizeRippleEffects(raw.ripple_effects || {}),
  };
}

function extractTrailingJson(text = "") {
  const trimmed = String(text).trim();
  const candidates = [];
  for (let index = 0; index < trimmed.length; index += 1) {
    if (trimmed[index] === "{") {
      candidates.push(index);
    }
  }

  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const candidate = trimmed.slice(candidates[index]).trim();
    try {
      return JSON.parse(candidate);
    } catch {
      continue;
    }
  }

  return null;
}

export async function analyzeClusterWithCodex(cluster, section) {
  const cacheKey = `${cluster.clusterId}:${cluster.latestPublishedAt}`;
  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }

  const outputFile = path.join(
    os.tmpdir(),
    `zelthir-ai-${Date.now()}-${Math.random().toString(36).slice(2)}.json`
  );

  try {
    const prompt = buildPrompt(cluster, section);
    const { stdout } = await execFileAsync(
      "codex",
      [
        "exec",
        "--skip-git-repo-check",
        "--ephemeral",
        "--sandbox",
        "read-only",
        "-o",
        outputFile,
        prompt,
      ],
      {
        cwd: rootDir,
        timeout: discoveryConfig.aiTimeoutMs,
        maxBuffer: 16 * 1024 * 1024,
      }
    );

    let raw;
    try {
      raw = JSON.parse(await fs.readFile(outputFile, "utf8"));
    } catch {
      raw = extractTrailingJson(stdout);
    }

    if (!raw) {
      throw new Error("Codex returned no structured analysis payload");
    }

    const normalized = normalizeAnalysis(raw, cluster);
    responseCache.set(cacheKey, normalized);
    return normalized;
  } finally {
    await fs.rm(outputFile, { force: true }).catch(() => {});
  }
}
