const now = new Date().toISOString();

function createCluster(id, section, canonicalTitle, summary, whyItMatters, sourceNames) {
  return {
    clusterId: id,
    section,
    canonicalTitle,
    summary,
    whyItMatters,
    imageUrl: null,
    sourceCount: sourceNames.length,
    articleCount: sourceNames.length + 2,
    latestPublishedAt: now,
    articles: sourceNames.map((source, index) => ({
      id: `${id}-${index}`,
      source,
      title: `${canonicalTitle} coverage from ${source}`,
      url: "https://example.com/",
      publishedAt: now,
      snippet: `Representative coverage from ${source}.`,
      imageUrl: null,
      language: "en",
      host: "example.com",
    })),
  };
}

export const SAMPLE_HOME_PAYLOAD = {
  ok: true,
  provider: "sample",
  generatedAt: now,
  fallbackReason: null,
  sections: {
    usaDailyBriefing: {
      id: "usaDailyBriefing",
      title: "USA Daily Briefing",
      kicker: "Daily Briefing",
      description: "The most-covered U.S. stories right now, clustered across publishers.",
      articlePoolCount: 18,
      clusterCount: 2,
      storyClusters: [
        createCluster(
          "sample-usa-ai",
          "usaDailyBriefing",
          "Washington braces for another wave of AI policy battles",
          "New reporting across U.S. political and business desks points to a growing clash over how fast AI oversight should move.",
          "This is the kind of policy story that can shift startup compliance, procurement, and public trust in one move.",
          ["Politico", "Axios", "NPR", "ABC News", "The Hill"]
        ),
        createCluster(
          "sample-usa-markets",
          "usaDailyBriefing",
          "Markets stay focused on infrastructure spend and demand signals",
          "Business outlets are tying capital spend, hiring, and AI infrastructure bets together as one of the day’s strongest economic narratives.",
          "For founders and operators, this cluster points to where capital and competition are intensifying.",
          ["Reuters", "CBS News", "CNN", "Axios"]
        ),
      ],
    },
    worldTopStories: {
      id: "worldTopStories",
      title: "World Top Stories",
      kicker: "Top News Stories",
      description: "International stories breaking across major global publishers.",
      articlePoolCount: 16,
      clusterCount: 2,
      storyClusters: [
        createCluster(
          "sample-world-diplomacy",
          "worldTopStories",
          "Fresh diplomatic pressure builds around a widening regional conflict",
          "Global publishers are converging on one story: diplomatic and military responses are moving together as the conflict deepens.",
          "This matters because it touches energy markets, shipping routes, and broader geopolitical stability.",
          ["BBC News", "Reuters", "Al Jazeera", "The Guardian"]
        ),
        createCluster(
          "sample-world-economy",
          "worldTopStories",
          "Central banks and inflation signals dominate the global economic briefing",
          "Coverage from financial and general-interest outlets points to synchronized attention on rates, inflation, and economic slowdown risks.",
          "This affects everything from venture financing to supply chains and consumer demand.",
          ["Reuters", "BBC News", "CNN", "The Guardian"]
        ),
      ],
    },
  },
};
