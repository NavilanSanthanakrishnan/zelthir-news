import Parser from "rss-parser";

import { US_ACTIVE_RSS_SOURCES, US_SOURCE_CANDIDATES } from "../src/ingest/sourceRegistry.mjs";

const parser = new Parser();
const includeCandidates = process.argv.includes("--include-candidates");
const sources = includeCandidates
  ? [...US_ACTIVE_RSS_SOURCES, ...US_SOURCE_CANDIDATES.map((source) => ({ ...source, isCandidate: true }))]
  : US_ACTIVE_RSS_SOURCES;

function matchesAllowedHost(url, allowedHosts = []) {
  if (!allowedHosts.length) return true;

  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return allowedHosts.some((allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`));
  } catch {
    return false;
  }
}

async function checkSource(source) {
  const feedUrl = source.feedUrl || source.candidateFeedUrl;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(feedUrl, {
      headers: {
        "user-agent": "Mozilla/5.0",
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const feed = await parser.parseString(await response.text());
    const items = feed.items || [];
    const acceptedItems = items.filter((item) => {
      return item.title && item.link && matchesAllowedHost(item.link, source.allowedHosts);
    });

    return {
      source,
      ok: acceptedItems.length > 0,
      feedItemCount: items.length,
      acceptedItemCount: acceptedItems.length,
      error: acceptedItems.length > 0 ? null : "No accepted article links",
    };
  } catch (error) {
    return {
      source,
      ok: false,
      feedItemCount: 0,
      acceptedItemCount: 0,
      error: error instanceof Error ? error.message : "Unknown feed check error",
    };
  } finally {
    clearTimeout(timeout);
  }
}

const results = await Promise.all(sources.map(checkSource));
const failures = results.filter((result) => !result.ok && !result.source.isCandidate);

for (const result of results) {
  const label = result.ok ? "OK " : "BAD";
  const candidate = result.source.isCandidate ? " candidate" : "";
  console.log(
    `${label} ${result.source.id}${candidate} items=${result.feedItemCount} accepted=${result.acceptedItemCount}${result.error ? ` error=${result.error}` : ""}`
  );
}

console.log(`Checked ${results.length} sources; ${failures.length} active failures.`);

if (failures.length) {
  process.exitCode = 1;
}
