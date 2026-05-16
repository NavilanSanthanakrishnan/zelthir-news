import { analyzeClusterWithCodex } from "./codexStoryAnalysis.mjs";
import { analyzeClusterWithGemini, StoryAnalysisProviderError } from "./geminiStoryAnalysis.mjs";
import { discoveryConfig } from "../ingest/config.mjs";

export async function analyzeCluster(cluster, section) {
  const provider = discoveryConfig.aiProvider.toLowerCase();

  if (provider === "gemini") {
    return analyzeClusterWithGemini(cluster, section);
  }

  if (provider === "codex-cli") {
    return analyzeClusterWithCodex(cluster, section);
  }

  throw new StoryAnalysisProviderError("Unsupported AI provider", {
    statusCode: 400,
    code: "UNSUPPORTED_AI_PROVIDER",
  });
}
