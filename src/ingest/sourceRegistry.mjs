export const LOW_SIGNAL_PATTERNS = [
  /\bcelebrity\b/i,
  /\bbikini\b/i,
  /\bmovie\b/i,
  /\btrailer\b/i,
  /\bbox office\b/i,
  /\bred carpet\b/i,
  /\bconcert\b/i,
  /\bfashion\b/i,
  /\bsports\b/i,
  /\bgame\b/i,
  /\bmatch\b/i,
  /\bscore\b/i,
  /\bplayer\b/i,
  /\bcoach\b/i,
  /\bopinion\b/i,
  /\beditorial\b/i,
  /\breview\b/i,
  /\bmotion sickness\b/i,
  /\bhow your\b/i,
  /\bhow to\b/i,
  /\bwhat to know\b/i,
  /\bexplained\b/i,
];

export const LOW_SIGNAL_SOURCE_CATEGORIES = new Set(["entertainment", "sports"]);

export const NEWS_API_WORLD_SOURCE_IDS = [
  "associated-press",
  "bbc-news",
  "cnn",
  "the-guardian-uk",
  "al-jazeera-english",
  "abc-news",
  "cbc-news",
];

export const USA_RSS_SOURCES = [
  {
    id: "reuters-domestic",
    name: "Reuters",
    feedUrl: "https://feeds.reuters.com/reuters/domesticNews",
    allowedHosts: ["reuters.com"],
  },
  {
    id: "npr-us",
    name: "NPR",
    feedUrl: "https://feeds.npr.org/1003/rss.xml",
    allowedHosts: ["npr.org"],
  },
  {
    id: "politico",
    name: "Politico",
    feedUrl: "https://www.politico.com/rss/politicopicks.xml",
    allowedHosts: ["politico.com"],
  },
  {
    id: "axios",
    name: "Axios",
    feedUrl: "https://api.axios.com/feed/",
    allowedHosts: ["axios.com"],
  },
  {
    id: "abc-us",
    name: "ABC News",
    feedUrl: "https://abcnews.go.com/abcnews/usheadlines",
    allowedHosts: ["abcnews.go.com", "abcnews.com"],
  },
  {
    id: "cbs-politics",
    name: "CBS News",
    feedUrl: "https://www.cbsnews.com/latest/rss/politics",
    allowedHosts: ["cbsnews.com"],
  },
  {
    id: "cnn-us",
    name: "CNN",
    feedUrl: "http://rss.cnn.com/rss/cnn_us.rss",
    allowedHosts: ["cnn.com"],
  },
  {
    id: "thehill-news",
    name: "The Hill",
    feedUrl: "https://thehill.com/news/feed/",
    allowedHosts: ["thehill.com"],
  },
];

export const WORLD_RSS_SOURCES = [
  {
    id: "reuters-world",
    name: "Reuters",
    feedUrl: "https://feeds.reuters.com/reuters/worldNews",
    allowedHosts: ["reuters.com"],
  },
  {
    id: "bbc-world",
    name: "BBC News",
    feedUrl: "http://feeds.bbci.co.uk/news/world/rss.xml",
    allowedHosts: ["bbc.com", "bbc.co.uk"],
  },
  {
    id: "guardian-world",
    name: "The Guardian",
    feedUrl: "https://www.theguardian.com/world/rss",
    allowedHosts: ["theguardian.com"],
  },
  {
    id: "aljazeera-world",
    name: "Al Jazeera",
    feedUrl: "https://www.aljazeera.com/xml/rss/all.xml",
    allowedHosts: ["aljazeera.com"],
  },
  {
    id: "cnn-world",
    name: "CNN",
    feedUrl: "http://rss.cnn.com/rss/edition_world.rss",
    allowedHosts: ["cnn.com"],
  },
  {
    id: "npr-world",
    name: "NPR",
    feedUrl: "https://feeds.npr.org/1004/rss.xml",
    allowedHosts: ["npr.org"],
  },
];

export const SECTION_CONFIG = {
  usaDailyBriefing: {
    id: "usaDailyBriefing",
    title: "USA Daily Briefing",
    kicker: "Daily Briefing",
    description: "The most-covered U.S. stories right now, clustered across publishers.",
    refreshLabel: "USA",
    newsApiMode: "country",
    newsApiCountry: "us",
    googleTopicUrls: [
      "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en",
      "https://news.google.com/rss/headlines/section/topic/NATION?hl=en-US&gl=US&ceid=US:en",
      "https://news.google.com/rss/headlines/section/topic/POLITICS?hl=en-US&gl=US&ceid=US:en",
    ],
    rssSources: USA_RSS_SOURCES,
  },
  worldTopStories: {
    id: "worldTopStories",
    title: "World Top Stories",
    kicker: "Top News Stories",
    description: "International stories breaking across major global publishers.",
    refreshLabel: "World",
    newsApiMode: "sources",
    newsApiSourceIds: NEWS_API_WORLD_SOURCE_IDS,
    googleTopicUrls: [
      "https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en",
    ],
    rssSources: WORLD_RSS_SOURCES,
  },
};
