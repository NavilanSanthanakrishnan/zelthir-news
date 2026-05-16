export const LOW_SIGNAL_PATTERNS = [
  /\bbikini\b/i,
  /\bopinion\b/i,
  /\beditorial\b/i,
  /\bmotion sickness\b/i,
  /\bhow your\b/i,
  /\bhow to\b/i,
  /\bwhat to know\b/i,
  /\bexplained\b/i,
];

export const CATEGORY_LOW_SIGNAL_PATTERNS = {
  culture: [
    /\bcelebrity\b/i,
    /\bmovie\b/i,
    /\btrailer\b/i,
    /\bbox office\b/i,
    /\bred carpet\b/i,
    /\bconcert\b/i,
    /\bfashion\b/i,
    /\breview\b/i,
  ],
  sports: [
    /\bsports\b/i,
    /\bgame\b/i,
    /\bmatch\b/i,
    /\bscore\b/i,
    /\bplayer\b/i,
    /\bcoach\b/i,
  ],
};

export const LOW_SIGNAL_SOURCE_CATEGORIES = new Set();

const CATEGORY_ALIASES = {
  culture: new Set([
    "arts",
    "books",
    "culture",
    "entertainment",
    "fashion",
    "film",
    "food",
    "lifestyle",
    "media",
    "movie",
    "movies",
    "music",
    "theater",
    "theatre",
  ]),
  sports: new Set([
    "baseball",
    "basketball",
    "college football",
    "college sports",
    "football",
    "hockey",
    "mlb",
    "nba",
    "nfl",
    "nhl",
    "soccer",
    "sport",
    "sports",
  ]),
};

function normalizeCategory(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCategories(categories = []) {
  const categoryList = Array.isArray(categories) ? categories : [categories];
  return categoryList
    .flatMap((category) => (Array.isArray(category) ? category : [category]))
    .map(normalizeCategory)
    .filter(Boolean);
}

function hasCategory(category, categories) {
  const aliases = CATEGORY_ALIASES[category] || new Set([category]);
  return normalizeCategories(categories).some((candidate) => aliases.has(candidate));
}

export function isLowSignalContent(title, snippet, categories = []) {
  const text = `${title || ""} ${snippet || ""}`;
  if (LOW_SIGNAL_PATTERNS.some((pattern) => pattern.test(text))) {
    return true;
  }

  return Object.entries(CATEGORY_LOW_SIGNAL_PATTERNS).some(([category, patterns]) => {
    return !hasCategory(category, categories) && patterns.some((pattern) => pattern.test(text));
  });
}

function usSource(source) {
  return {
    country: "US",
    state: null,
    city: null,
    metro: null,
    categories: ["general"],
    priority: 50,
    required: false,
    ...source,
  };
}

export const NEWS_API_WORLD_SOURCE_IDS = [
  "associated-press",
  "bbc-news",
  "cnn",
  "the-guardian-uk",
  "al-jazeera-english",
  "abc-news",
  "cbc-news",
];

export const US_NATIONAL_RSS_SOURCES = [
  usSource({
    id: "npr-us",
    name: "NPR",
    scope: "national",
    categories: ["general", "politics", "health", "culture"],
    feedUrl: "https://feeds.npr.org/1003/rss.xml",
    siteUrl: "https://www.npr.org/sections/national/",
    allowedHosts: ["npr.org"],
    priority: 92,
    required: true,
  }),
  usSource({
    id: "axios",
    name: "Axios",
    scope: "national",
    categories: ["general", "politics", "business", "technology"],
    feedUrl: "https://api.axios.com/feed/",
    siteUrl: "https://www.axios.com",
    allowedHosts: ["axios.com"],
    priority: 86,
    required: true,
  }),
  usSource({
    id: "abc-us",
    name: "ABC News",
    scope: "national",
    categories: ["general", "politics"],
    feedUrl: "https://abcnews.go.com/abcnews/usheadlines",
    siteUrl: "https://abcnews.go.com/US",
    allowedHosts: ["abcnews.go.com", "abcnews.com"],
    priority: 84,
    required: true,
  }),
  usSource({
    id: "cbs-politics",
    name: "CBS News",
    scope: "national",
    categories: ["politics"],
    feedUrl: "https://www.cbsnews.com/latest/rss/politics",
    siteUrl: "https://www.cbsnews.com/politics/",
    allowedHosts: ["cbsnews.com"],
    priority: 78,
    required: true,
  }),
  usSource({
    id: "cnn-us",
    name: "CNN",
    scope: "national",
    categories: ["general", "politics"],
    feedUrl: "http://rss.cnn.com/rss/cnn_us.rss",
    siteUrl: "https://www.cnn.com/us",
    allowedHosts: ["cnn.com"],
    priority: 82,
    required: true,
  }),
  usSource({
    id: "thehill-news",
    name: "The Hill",
    scope: "national",
    categories: ["politics"],
    feedUrl: "https://thehill.com/news/feed/",
    siteUrl: "https://thehill.com/news/",
    allowedHosts: ["thehill.com"],
    priority: 76,
    required: true,
  }),
  usSource({
    id: "nbc-news",
    name: "NBC News",
    scope: "national",
    categories: ["general", "politics", "health"],
    feedUrl: "https://feeds.nbcnews.com/nbcnews/public/news",
    siteUrl: "https://www.nbcnews.com",
    allowedHosts: ["nbcnews.com"],
    priority: 84,
    required: true,
  }),
  usSource({
    id: "pbs-newshour",
    name: "PBS NewsHour",
    scope: "national",
    categories: ["general", "politics", "health", "science"],
    feedUrl: "https://www.pbs.org/newshour/feeds/rss/headlines",
    siteUrl: "https://www.pbs.org/newshour/",
    allowedHosts: ["pbs.org"],
    priority: 80,
    required: true,
  }),
];

export const US_LOCAL_RSS_SOURCES = [
  usSource({
    id: "calmatters",
    name: "CalMatters",
    scope: "state",
    state: "CA",
    categories: ["politics", "education", "housing", "climate", "health"],
    feedUrl: "https://calmatters.org/feed/",
    siteUrl: "https://calmatters.org",
    allowedHosts: ["calmatters.org"],
    priority: 92,
    required: true,
  }),
  usSource({
    id: "latimes-california",
    name: "Los Angeles Times",
    scope: "city",
    state: "CA",
    city: "Los Angeles",
    metro: "Los Angeles",
    categories: ["general", "politics", "culture", "sports", "housing"],
    feedUrl: "https://www.latimes.com/california/rss2.0.xml",
    siteUrl: "https://www.latimes.com/california",
    allowedHosts: ["latimes.com"],
    priority: 82,
    required: true,
  }),
  usSource({
    id: "sfchronicle-bay-area",
    name: "San Francisco Chronicle",
    scope: "city",
    state: "CA",
    city: "San Francisco",
    metro: "San Francisco Bay Area",
    categories: ["general", "politics", "culture", "sports", "housing"],
    feedUrl: "https://www.sfchronicle.com/bayarea/feed/Bay-Area-News-429.php",
    siteUrl: "https://www.sfchronicle.com/bayarea/",
    allowedHosts: ["sfchronicle.com"],
    priority: 76,
    required: true,
  }),
  usSource({
    id: "laist",
    name: "LAist",
    scope: "city",
    state: "CA",
    city: "Los Angeles",
    metro: "Los Angeles",
    categories: ["general", "culture", "transportation", "housing", "climate"],
    feedUrl: "https://laist.com/index.rss",
    siteUrl: "https://laist.com",
    allowedHosts: ["laist.com"],
    priority: 78,
    required: true,
  }),
  usSource({
    id: "texastribune",
    name: "The Texas Tribune",
    scope: "state",
    state: "TX",
    categories: ["politics", "education", "health", "immigration", "energy"],
    feedUrl: "https://www.texastribune.org/feeds/main/",
    siteUrl: "https://www.texastribune.org",
    allowedHosts: ["texastribune.org"],
    priority: 92,
    required: true,
  }),
  usSource({
    id: "austinmonitor",
    name: "Austin Monitor",
    scope: "city",
    state: "TX",
    city: "Austin",
    metro: "Austin",
    categories: ["politics", "housing", "transportation", "civic"],
    feedUrl: "https://www.austinmonitor.com/feed/",
    siteUrl: "https://www.austinmonitor.com",
    allowedHosts: ["austinmonitor.com"],
    priority: 72,
    required: true,
  }),
  usSource({
    id: "thecity",
    name: "THE CITY",
    scope: "city",
    state: "NY",
    city: "New York",
    metro: "New York City",
    categories: ["politics", "housing", "transportation", "education", "public safety"],
    feedUrl: "https://www.thecity.nyc/rss/index.xml",
    siteUrl: "https://www.thecity.nyc",
    allowedHosts: ["thecity.nyc"],
    priority: 88,
    required: true,
  }),
  usSource({
    id: "gothamist",
    name: "Gothamist",
    scope: "city",
    state: "NY",
    city: "New York",
    metro: "New York City",
    categories: ["general", "politics", "culture", "transportation"],
    feedUrl: "https://gothamist.com/feed/",
    siteUrl: "https://gothamist.com",
    allowedHosts: ["gothamist.com"],
    priority: 78,
    required: true,
  }),
  usSource({
    id: "wtop",
    name: "WTOP",
    scope: "city",
    state: "DC",
    city: "Washington",
    metro: "Washington, DC",
    categories: ["general", "politics", "transportation", "public safety", "sports"],
    feedUrl: "https://wtop.com/feed/",
    siteUrl: "https://wtop.com",
    allowedHosts: ["wtop.com"],
    priority: 76,
    required: true,
  }),
  usSource({
    id: "washingtoncitypaper",
    name: "Washington City Paper",
    scope: "city",
    state: "DC",
    city: "Washington",
    metro: "Washington, DC",
    categories: ["culture", "politics", "food", "civic"],
    feedUrl: "https://washingtoncitypaper.com/feed/",
    siteUrl: "https://washingtoncitypaper.com",
    allowedHosts: ["washingtoncitypaper.com"],
    priority: 68,
    required: true,
  }),
  usSource({
    id: "wamu",
    name: "WAMU",
    scope: "public_radio",
    state: "DC",
    city: "Washington",
    metro: "Washington, DC",
    categories: ["general", "politics", "culture", "transportation"],
    feedUrl: "https://wamu.org/feed/",
    siteUrl: "https://wamu.org",
    allowedHosts: ["wamu.org"],
    priority: 74,
    required: true,
  }),
  usSource({
    id: "chicago-suntimes",
    name: "Chicago Sun-Times",
    scope: "city",
    state: "IL",
    city: "Chicago",
    metro: "Chicago",
    categories: ["general", "politics", "sports", "culture"],
    feedUrl: "https://chicago.suntimes.com/rss/index.xml",
    siteUrl: "https://chicago.suntimes.com",
    allowedHosts: ["chicago.suntimes.com", "suntimes.com"],
    priority: 78,
    required: true,
  }),
  usSource({
    id: "blockclubchicago",
    name: "Block Club Chicago",
    scope: "city",
    state: "IL",
    city: "Chicago",
    metro: "Chicago",
    categories: ["neighborhood", "politics", "culture", "housing"],
    feedUrl: "https://blockclubchicago.org/feed/",
    siteUrl: "https://blockclubchicago.org",
    allowedHosts: ["blockclubchicago.org"],
    priority: 76,
    required: true,
  }),
  usSource({
    id: "tampabay",
    name: "Tampa Bay Times",
    scope: "city",
    state: "FL",
    city: "Tampa",
    metro: "Tampa Bay",
    categories: ["general", "politics", "climate", "sports"],
    feedUrl: "https://www.tampabay.com/arc/outboundfeeds/rss/category/news/?outputType=xml",
    siteUrl: "https://www.tampabay.com/news/",
    allowedHosts: ["tampabay.com"],
    priority: 78,
    required: true,
  }),
  usSource({
    id: "floridapolitics",
    name: "Florida Politics",
    scope: "state",
    state: "FL",
    categories: ["politics"],
    feedUrl: "https://floridapolitics.com/feed/",
    siteUrl: "https://floridapolitics.com",
    allowedHosts: ["floridapolitics.com"],
    priority: 72,
    required: true,
  }),
  usSource({
    id: "crosscut",
    name: "Cascade PBS / Crosscut",
    scope: "state",
    state: "WA",
    metro: "Seattle",
    categories: ["politics", "civic", "culture", "climate"],
    feedUrl: "https://www.cascadepbs.org/news/feed",
    siteUrl: "https://www.cascadepbs.org/news",
    allowedHosts: ["cascadepbs.org"],
    priority: 74,
    required: true,
  }),
  usSource({
    id: "coloradosun",
    name: "The Colorado Sun",
    scope: "state",
    state: "CO",
    categories: ["politics", "climate", "housing", "education"],
    feedUrl: "https://coloradosun.com/feed/",
    siteUrl: "https://coloradosun.com",
    allowedHosts: ["coloradosun.com"],
    priority: 84,
    required: true,
  }),
  usSource({
    id: "cpr",
    name: "Colorado Public Radio",
    scope: "public_radio",
    state: "CO",
    categories: ["general", "politics", "climate", "culture"],
    feedUrl: "https://www.cpr.org/feed/",
    siteUrl: "https://www.cpr.org",
    allowedHosts: ["cpr.org"],
    priority: 78,
    required: true,
  }),
  usSource({
    id: "azmirror",
    name: "Arizona Mirror",
    scope: "state",
    state: "AZ",
    categories: ["politics", "education", "immigration"],
    feedUrl: "https://www.azmirror.com/feed/",
    siteUrl: "https://www.azmirror.com",
    allowedHosts: ["azmirror.com"],
    priority: 78,
    required: true,
  }),
  usSource({
    id: "phoenixnewtimes",
    name: "Phoenix New Times",
    scope: "city",
    state: "AZ",
    city: "Phoenix",
    metro: "Phoenix",
    categories: ["culture", "food", "music", "politics"],
    feedUrl: "https://www.phoenixnewtimes.com/index.rss",
    siteUrl: "https://www.phoenixnewtimes.com",
    allowedHosts: ["phoenixnewtimes.com"],
    priority: 66,
    required: true,
  }),
  usSource({
    id: "gpb",
    name: "GPB News",
    scope: "public_radio",
    state: "GA",
    categories: ["general", "politics", "health", "education"],
    feedUrl: "https://www.gpb.org/news/rss.xml",
    siteUrl: "https://www.gpb.org/news",
    allowedHosts: ["gpb.org"],
    priority: 76,
    required: true,
  }),
  usSource({
    id: "atlanta-civic-circle",
    name: "Atlanta Civic Circle",
    scope: "city",
    state: "GA",
    city: "Atlanta",
    metro: "Atlanta",
    categories: ["civic", "politics", "housing"],
    feedUrl: "https://www.atlantaciviccircle.org/feed/",
    siteUrl: "https://www.atlantaciviccircle.org",
    allowedHosts: ["atlantaciviccircle.org"],
    priority: 70,
    required: true,
  }),
  usSource({
    id: "philadelphia-inquirer",
    name: "The Philadelphia Inquirer",
    scope: "city",
    state: "PA",
    city: "Philadelphia",
    metro: "Philadelphia",
    categories: ["general", "politics", "sports", "culture"],
    feedUrl: "https://www.inquirer.com/arc/outboundfeeds/rss/category/news/?outputType=xml",
    siteUrl: "https://www.inquirer.com/news/",
    allowedHosts: ["inquirer.com"],
    priority: 82,
    required: true,
  }),
  usSource({
    id: "billypenn",
    name: "Billy Penn",
    scope: "city",
    state: "PA",
    city: "Philadelphia",
    metro: "Philadelphia",
    categories: ["civic", "culture", "politics", "food"],
    feedUrl: "https://billypenn.com/feed/",
    siteUrl: "https://billypenn.com",
    allowedHosts: ["billypenn.com"],
    priority: 70,
    required: true,
  }),
  usSource({
    id: "bostonglobe-metro",
    name: "The Boston Globe",
    scope: "city",
    state: "MA",
    city: "Boston",
    metro: "Boston",
    categories: ["general", "politics", "sports", "culture"],
    feedUrl: "https://www.bostonglobe.com/metro/?outputType=rss",
    siteUrl: "https://www.bostonglobe.com/metro/",
    allowedHosts: ["bostonglobe.com"],
    priority: 82,
    required: true,
  }),
  usSource({
    id: "wbur",
    name: "WBUR",
    scope: "public_radio",
    state: "MA",
    city: "Boston",
    metro: "Boston",
    categories: ["general", "politics", "health", "culture"],
    feedUrl: "https://www.wbur.org/feed",
    siteUrl: "https://www.wbur.org",
    allowedHosts: ["wbur.org"],
    priority: 78,
    required: true,
  }),
  usSource({
    id: "commonwealthbeacon",
    name: "CommonWealth Beacon",
    scope: "state",
    state: "MA",
    categories: ["politics", "civic", "education", "housing"],
    feedUrl: "https://commonwealthbeacon.org/feed/",
    siteUrl: "https://commonwealthbeacon.org",
    allowedHosts: ["commonwealthbeacon.org"],
    priority: 74,
    required: true,
  }),
];

export const US_LOCAL_SOURCE_CANDIDATES = [
  usSource({
    id: "kqed",
    name: "KQED",
    scope: "public_radio",
    state: "CA",
    city: "San Francisco",
    metro: "San Francisco Bay Area",
    categories: ["general", "politics", "culture", "climate"],
    siteUrl: "https://www.kqed.org/news",
    allowedHosts: ["kqed.org"],
    candidateFeedUrl: "https://www.kqed.org/news/rss.xml",
    candidateReason: "Feed returned malformed XML during verification.",
  }),
  usSource({
    id: "houstonchronicle",
    name: "Houston Chronicle",
    scope: "city",
    state: "TX",
    city: "Houston",
    metro: "Houston",
    categories: ["general", "politics", "sports", "culture"],
    siteUrl: "https://www.houstonchronicle.com",
    allowedHosts: ["houstonchronicle.com"],
    candidateFeedUrl: "https://www.houstonchronicle.com/news/houston-texas/feed/Houston-News-267.php",
    candidateReason: "Feed parsed but returned no items during verification.",
  }),
  usSource({
    id: "dallasnews",
    name: "Dallas Morning News",
    scope: "city",
    state: "TX",
    city: "Dallas",
    metro: "Dallas",
    categories: ["general", "politics", "sports", "culture"],
    siteUrl: "https://www.dallasnews.com",
    allowedHosts: ["dallasnews.com"],
    candidateFeedUrl: "https://www.dallasnews.com/feed/",
    candidateReason: "Known feed paths returned 404 during verification.",
  }),
  usSource({
    id: "kut",
    name: "KUT",
    scope: "public_radio",
    state: "TX",
    city: "Austin",
    metro: "Austin",
    categories: ["general", "politics", "culture", "housing"],
    siteUrl: "https://www.kut.org",
    allowedHosts: ["kut.org"],
    candidateFeedUrl: "https://www.kut.org/news/rss.xml",
    candidateReason: "Feed returned malformed XML during verification.",
  }),
  usSource({
    id: "nydailynews",
    name: "New York Daily News",
    scope: "city",
    state: "NY",
    city: "New York",
    metro: "New York City",
    categories: ["general", "sports", "culture", "public safety"],
    siteUrl: "https://www.nydailynews.com",
    allowedHosts: ["nydailynews.com"],
    candidateFeedUrl: "https://www.nydailynews.com/feed/",
    candidateReason: "Feed returned 403 during verification.",
  }),
  usSource({
    id: "ny1",
    name: "Spectrum News NY1",
    scope: "city",
    state: "NY",
    city: "New York",
    metro: "New York City",
    categories: ["general", "politics", "transportation"],
    siteUrl: "https://ny1.com/nyc/all-boroughs",
    allowedHosts: ["ny1.com"],
    candidateFeedUrl: "https://ny1.com/services/contentfeed.nyc|rss",
    candidateReason: "Feed returned malformed XML during verification.",
  }),
  usSource({
    id: "dcist",
    name: "DCist",
    scope: "city",
    state: "DC",
    city: "Washington",
    metro: "Washington, DC",
    categories: ["general", "culture", "transportation", "housing"],
    siteUrl: "https://dcist.com",
    allowedHosts: ["dcist.com"],
    candidateFeedUrl: "https://dcist.com/feed/",
    candidateReason: "Feed returned 404 during verification.",
  }),
  usSource({
    id: "chicagotribune",
    name: "Chicago Tribune",
    scope: "city",
    state: "IL",
    city: "Chicago",
    metro: "Chicago",
    categories: ["general", "politics", "sports", "culture"],
    siteUrl: "https://www.chicagotribune.com",
    allowedHosts: ["chicagotribune.com"],
    candidateFeedUrl: "https://www.chicagotribune.com/arc/outboundfeeds/rss/category/news/?outputType=xml",
    candidateReason: "Feed was blocked or returned malformed XML during verification.",
  }),
  usSource({
    id: "miamiherald",
    name: "Miami Herald",
    scope: "city",
    state: "FL",
    city: "Miami",
    metro: "Miami",
    categories: ["general", "politics", "sports", "culture"],
    siteUrl: "https://www.miamiherald.com",
    allowedHosts: ["miamiherald.com"],
    candidateFeedUrl: "https://www.miamiherald.com/latest-news/?widgetName=rssfeed&widgetContentId=712015&getXmlFeed=true",
    candidateReason: "Feed returned XML that rss-parser could not parse during verification.",
  }),
  usSource({
    id: "orlandosentinel",
    name: "Orlando Sentinel",
    scope: "city",
    state: "FL",
    city: "Orlando",
    metro: "Orlando",
    categories: ["general", "politics", "sports", "culture"],
    siteUrl: "https://www.orlandosentinel.com",
    allowedHosts: ["orlandosentinel.com"],
    candidateFeedUrl: "https://www.orlandosentinel.com/arc/outboundfeeds/rss/category/news/?outputType=xml",
    candidateReason: "Feed was blocked or returned malformed XML during verification.",
  }),
  usSource({
    id: "seattletimes",
    name: "The Seattle Times",
    scope: "city",
    state: "WA",
    city: "Seattle",
    metro: "Seattle",
    categories: ["general", "politics", "sports", "culture"],
    siteUrl: "https://www.seattletimes.com",
    allowedHosts: ["seattletimes.com"],
    candidateFeedUrl: "https://www.seattletimes.com/seattle-news/feed/",
    candidateReason: "Feed returned XML that rss-parser could not parse during verification.",
  }),
  usSource({
    id: "kuow",
    name: "KUOW",
    scope: "public_radio",
    state: "WA",
    city: "Seattle",
    metro: "Seattle",
    categories: ["general", "politics", "culture"],
    siteUrl: "https://www.kuow.org",
    allowedHosts: ["kuow.org"],
    candidateFeedUrl: "https://www.kuow.org/rss.xml",
    candidateReason: "Known feed paths returned 404 during verification.",
  }),
  usSource({
    id: "denverpost",
    name: "The Denver Post",
    scope: "city",
    state: "CO",
    city: "Denver",
    metro: "Denver",
    categories: ["general", "politics", "sports", "culture"],
    siteUrl: "https://www.denverpost.com",
    allowedHosts: ["denverpost.com"],
    candidateFeedUrl: "https://www.denverpost.com/feed/",
    candidateReason: "Feed returned 403 or unparseable XML during verification.",
  }),
  usSource({
    id: "azcentral",
    name: "Arizona Republic",
    scope: "state",
    state: "AZ",
    categories: ["general", "politics", "sports", "culture"],
    siteUrl: "https://www.azcentral.com",
    allowedHosts: ["azcentral.com"],
    candidateFeedUrl: "https://www.azcentral.com/arcio/rss/category/news/local/arizona/?outputType=xml",
    candidateReason: "Known feed paths returned 404 during verification.",
  }),
  usSource({
    id: "ajc",
    name: "Atlanta Journal-Constitution",
    scope: "city",
    state: "GA",
    city: "Atlanta",
    metro: "Atlanta",
    categories: ["general", "politics", "sports", "culture"],
    siteUrl: "https://www.ajc.com",
    allowedHosts: ["ajc.com"],
    candidateFeedUrl: "https://www.ajc.com/news/?outputType=rss",
    candidateReason: "Known feed paths returned 404 or non-feed content during verification.",
  }),
  usSource({
    id: "spotlightpa",
    name: "Spotlight PA",
    scope: "state",
    state: "PA",
    categories: ["politics", "civic", "education"],
    siteUrl: "https://www.spotlightpa.org",
    allowedHosts: ["spotlightpa.org"],
    candidateFeedUrl: "https://www.spotlightpa.org/feed/",
    candidateReason: "Known feed paths returned 404 during verification.",
  }),
];

export const US_NATIONAL_SOURCE_CANDIDATES = [
  usSource({
    id: "reuters-domestic",
    name: "Reuters",
    scope: "national",
    categories: ["general", "politics", "business"],
    siteUrl: "https://www.reuters.com/world/us/",
    allowedHosts: ["reuters.com"],
    candidateFeedUrl: "https://feeds.reuters.com/reuters/domesticNews",
    candidateReason: "Legacy feed failed during verification.",
  }),
  usSource({
    id: "politico",
    name: "Politico",
    scope: "national",
    categories: ["politics"],
    siteUrl: "https://www.politico.com",
    allowedHosts: ["politico.com"],
    candidateFeedUrl: "https://www.politico.com/rss/politicopicks.xml",
    candidateReason: "Feed returned 403 during verification.",
  }),
  usSource({
    id: "usa-today",
    name: "USA Today",
    scope: "national",
    categories: ["general", "sports", "culture"],
    siteUrl: "https://www.usatoday.com",
    allowedHosts: ["usatoday.com"],
    candidateFeedUrl: "https://rssfeeds.usatoday.com/usatoday-NewsTopStories",
    candidateReason: "Feed returned XML that rss-parser could not parse during verification.",
  }),
];

export const USA_RSS_SOURCES = US_NATIONAL_RSS_SOURCES;
export const US_ACTIVE_RSS_SOURCES = [...US_NATIONAL_RSS_SOURCES, ...US_LOCAL_RSS_SOURCES];
export const US_SOURCE_CANDIDATES = [...US_NATIONAL_SOURCE_CANDIDATES, ...US_LOCAL_SOURCE_CANDIDATES];

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

export function sourceCoverageKey(scope) {
  if (scope === "public_radio") {
    return "publicRadio";
  }

  return scope || "unknown";
}

function createCoverageCounts() {
  return {
    national: 0,
    state: 0,
    city: 0,
    metro: 0,
    publicRadio: 0,
    specialty: 0,
    unknown: 0,
  };
}

export function getSectionRssSources(sectionConfig) {
  return [
    ...(sectionConfig.rssSources || []),
    ...(sectionConfig.localRssSources || []),
  ];
}

export function buildSectionSourceCoverage(sectionConfig, articles = [], feedDiagnostics = []) {
  const articleCounts = createCoverageCounts();
  const sourceCounts = createCoverageCounts();
  const sectionSources = getSectionRssSources(sectionConfig);
  const requiredSources = sectionSources.filter((source) => source.required);
  const seenSourceIds = new Set(articles.map((article) => article.sourceId).filter(Boolean));

  for (const source of sectionSources) {
    const key = sourceCoverageKey(source.scope);
    sourceCounts[key] = (sourceCounts[key] || 0) + 1;
  }

  for (const article of articles) {
    const key = sourceCoverageKey(article.sourceScope);
    articleCounts[key] = (articleCounts[key] || 0) + 1;
  }

  return {
    ...articleCounts,
    sourceCounts,
    requiredSourcesSeen: requiredSources
      .filter((source) => seenSourceIds.has(source.id))
      .map((source) => source.name),
    requiredSourcesMissing: requiredSources
      .filter((source) => !seenSourceIds.has(source.id))
      .map((source) => source.name),
    feedDiagnostics,
  };
}

export function buildSourceRegistryDiagnostics() {
  const coverage = createCoverageCounts();

  for (const source of US_ACTIVE_RSS_SOURCES) {
    const key = sourceCoverageKey(source.scope);
    coverage[key] = (coverage[key] || 0) + 1;
  }

  return {
    ok: true,
    sources: US_ACTIVE_RSS_SOURCES,
    candidates: US_SOURCE_CANDIDATES,
    coverage,
    sourceCount: US_ACTIVE_RSS_SOURCES.length,
    candidateCount: US_SOURCE_CANDIDATES.length,
    requiredCount: US_ACTIVE_RSS_SOURCES.filter((source) => source.required).length,
  };
}

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
    rssSources: US_NATIONAL_RSS_SOURCES,
    localRssSources: US_LOCAL_RSS_SOURCES,
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
