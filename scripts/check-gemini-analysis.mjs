import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { analyzeCluster } from "../src/ai/storyAnalysisProvider.mjs";
import {
  analysisToSchemaPayload,
  StoryAnalysisProviderError,
  validateStoryAnalysisPayload,
} from "../src/ai/geminiStoryAnalysis.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function findFirstCluster(home) {
  for (const section of Object.values(home?.sections || {})) {
    const cluster = section.storyClusters?.[0];
    if (cluster) {
      return { section, cluster };
    }
  }

  return null;
}

function safeErrorMessage(error) {
  if (error instanceof StoryAnalysisProviderError) {
    return error.message;
  }

  return "Gemini analysis check failed";
}

try {
  const cachePath = path.join(rootDir, "data/homepage-cache.json");
  const home = JSON.parse(await readFile(cachePath, "utf8"));
  const match = findFirstCluster(home);

  if (!match) {
    throw new StoryAnalysisProviderError("No cached story cluster found", {
      statusCode: 404,
      code: "NO_CACHED_CLUSTER",
    });
  }

  const analysis = await analyzeCluster(match.cluster, match.section);
  const schemaPayload = analysisToSchemaPayload(analysis);
  const validationErrors = validateStoryAnalysisPayload(schemaPayload);

  if (validationErrors.length) {
    throw new StoryAnalysisProviderError("Analysis failed schema validation", {
      statusCode: 502,
      code: "SCHEMA_VALIDATION_FAILED",
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        provider: analysis.provider,
        clusterId: match.cluster.clusterId,
        section: match.section.title,
        checks: {
          headline: Boolean(schemaPayload.headline),
          brief: Boolean(schemaPayload.brief),
          confidence: schemaPayload.confidence,
          articleParagraphs: schemaPayload.article_paragraphs.length,
          agreedClaims: schemaPayload.agreed_claims.length,
          disputedClaims: schemaPayload.disputed_claims.length,
          frames: schemaPayload.frames.length,
          topicMap: {
            center: Boolean(schemaPayload.topic_map.center.label),
            topics: schemaPayload.topic_map.topics.length,
            edges: schemaPayload.topic_map.edges.length,
          },
          watchSignals: schemaPayload.watch_signals.length,
          rippleEffects: {
            "24h": schemaPayload.ripple_effects["24h"].length,
            "7d": schemaPayload.ripple_effects["7d"].length,
            "30d": schemaPayload.ripple_effects["30d"].length,
          },
        },
      },
      null,
      2
    )
  );
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: safeErrorMessage(error),
      },
      null,
      2
    )
  );
  process.exitCode = 1;
}
