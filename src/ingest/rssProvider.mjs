import Parser from "rss-parser";

import { LOW_SIGNAL_PATTERNS } from "./sourceRegistry.mjs";

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

function isLowSignalText(title, snippet) {
  const text = `${title} ${snippet}`;
  return LOW_SIGNAL_PATTERNS.some((pattern) => pattern.test(text));
}

async function fetchFeed(source, sectionId) {
  try {
    const feed = await parser.parseURL(source.feedUrl);
    return (feed.items || []).slice(0, 30).flatMap((item, index) => {
      const title = item.title?.trim() || "";
      const snippet = (item.contentSnippet || item.content || item.description || "").replace(/\s+/g, " ").trim();

      if (
        !item.link ||
        !title ||
        !matchesAllowedHost(item.link, source.allowedHosts) ||
        /\/video\//i.test(item.link) ||
        /\/opinions?\//i.test(item.link) ||
        isLowSignalText(title, snippet)
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
        },
      ];
    });
  } catch {
    return [];
  }
}

export async function discoverSectionFromRss(sectionConfig) {
  const articleLists = await Promise.all(
    sectionConfig.rssSources.map((source) => fetchFeed(source, sectionConfig.id))
  );

  return articleLists.flat();
}
