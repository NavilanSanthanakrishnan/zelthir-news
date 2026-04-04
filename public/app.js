const refreshButton = document.getElementById("refreshButton");
const providerLabel = document.getElementById("providerLabel");
const generatedAtLabel = document.getElementById("generatedAtLabel");
const refreshModeLabel = document.getElementById("refreshModeLabel");
const providerNote = document.getElementById("providerNote");
const sectionCountLabel = document.getElementById("sectionCountLabel");
const clusterCountLabel = document.getElementById("clusterCountLabel");
const articlePoolCountLabel = document.getElementById("articlePoolCountLabel");
const leadCoverageLabel = document.getElementById("leadCoverageLabel");

const tickerTrack = document.getElementById("tickerTrack");
const liveRail = document.getElementById("liveRail");
const contentDeck = document.getElementById("contentDeck");
const workspaceTabs = document.getElementById("workspaceTabs");
const workspacePanels = [...document.querySelectorAll(".workspace-panel")];
const tabButtons = [...document.querySelectorAll(".tab-pill")];
const overviewCount = document.getElementById("overviewCount");
const personalizedCount = document.getElementById("personalizedCount");
const usaCount = document.getElementById("usaCount");
const worldCount = document.getElementById("worldCount");
const personalizedGrid = document.getElementById("personalizedGrid");
const digestGrid = document.getElementById("digestGrid");
const usaSectionHost = document.getElementById("usaSectionHost");
const worldSectionHost = document.getElementById("worldSectionHost");
const locationSelect = document.getElementById("locationSelect");
const roleSelect = document.getElementById("roleSelect");
const interestChips = document.getElementById("interestChips");

const leadImage = document.getElementById("leadImage");
const leadPlaceholder = document.getElementById("leadPlaceholder");
const leadStatus = document.getElementById("leadStatus");
const leadSection = document.getElementById("leadSection");
const leadTitle = document.getElementById("leadTitle");
const leadSummary = document.getElementById("leadSummary");
const leadWhy = document.getElementById("leadWhy");
const leadUpdated = document.getElementById("leadUpdated");
const leadSources = document.getElementById("leadSources");
const leadArticles = document.getElementById("leadArticles");
const leadSourceLinks = document.getElementById("leadSourceLinks");
const leadCoverageButton = document.getElementById("leadCoverageButton");

const coverageModal = document.getElementById("coverageModal");
const coverageBackdrop = document.getElementById("coverageBackdrop");
const coverageClose = document.getElementById("coverageClose");
const modalImage = document.getElementById("modalImage");
const modalPlaceholder = document.getElementById("modalPlaceholder");
const modalStatus = document.getElementById("modalStatus");
const modalSection = document.getElementById("modalSection");
const modalTitle = document.getElementById("modalTitle");
const modalSummary = document.getElementById("modalSummary");
const modalWhy = document.getElementById("modalWhy");
const modalUpdated = document.getElementById("modalUpdated");
const modalSources = document.getElementById("modalSources");
const modalArticles = document.getElementById("modalArticles");
const modalSourceLinks = document.getElementById("modalSourceLinks");
const modalArticlesList = document.getElementById("modalArticlesList");

const groundedBrief = document.getElementById("groundedBrief");
const groundedArticle = document.getElementById("groundedArticle");
const briefConfidence = document.getElementById("briefConfidence");
const claimLedger = document.getElementById("claimLedger");
const disputedClaims = document.getElementById("disputedClaims");
const coverageSplitSummary = document.getElementById("coverageSplitSummary");
const coverageSplitColumns = document.getElementById("coverageSplitColumns");
const framingMatrix = document.getElementById("framingMatrix");
const primarySourceLayer = document.getElementById("primarySourceLayer");
const undercoveredMix = document.getElementById("undercoveredMix");
const connectionGraph = document.getElementById("connectionGraph");
const storyTimeline = document.getElementById("storyTimeline");
const rippleEffects = document.getElementById("rippleEffects");
const watchSignals = document.getElementById("watchSignals");
const askStoryForm = document.getElementById("askStoryForm");
const askStoryInput = document.getElementById("askStoryInput");
const askStoryAnswer = document.getElementById("askStoryAnswer");

const tickerItemTemplate = document.getElementById("tickerItemTemplate");
const railItemTemplate = document.getElementById("railItemTemplate");
const personalizedCardTemplate = document.getElementById("personalizedCardTemplate");
const digestCardTemplate = document.getElementById("digestCardTemplate");
const sectionTemplate = document.getElementById("homepageSectionTemplate");
const storyCardTemplate = document.getElementById("storyListItemTemplate");
const modalArticleItemTemplate = document.getElementById("modalArticleItemTemplate");
const ledgerItemTemplate = document.getElementById("ledgerItemTemplate");
const frameItemTemplate = document.getElementById("frameItemTemplate");
const timelineItemTemplate = document.getElementById("timelineItemTemplate");
const forecastColumnTemplate = document.getElementById("forecastColumnTemplate");
const watchItemTemplate = document.getElementById("watchItemTemplate");
const coverageBucketTemplate = document.getElementById("coverageBucketTemplate");
const analysisTabButtons = [...document.querySelectorAll(".analysis-tab")];
const analysisPanels = [...document.querySelectorAll(".analysis-panel")];

const homepagePollMs = 30 * 1000;
const sectionOrder = ["usaDailyBriefing", "worldTopStories"];
const sectionLabels = {
  usaDailyBriefing: "USA Daily Briefing",
  worldTopStories: "World Top Stories",
};

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "that",
  "with",
  "from",
  "this",
  "have",
  "will",
  "into",
  "about",
  "after",
  "over",
  "amid",
  "says",
  "said",
  "they",
  "their",
  "its",
  "more",
  "than",
  "what",
  "when",
  "where",
  "which",
  "would",
  "could",
  "should",
  "because",
  "while",
  "under",
  "again",
  "just",
  "into",
  "across",
  "through",
  "around",
  "today",
  "live",
  "latest",
  "news",
  "briefing",
  "story",
  "stories",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "say",
]);

const UNCERTAINTY_PATTERNS = [
  /\bsources say\b/i,
  /\bofficials say\b/i,
  /\bunclear\b/i,
  /\bunder investigation\b/i,
  /\bsearch continues\b/i,
  /\bstill being verified\b/i,
  /\balleged\b/i,
  /\breportedly\b/i,
  /\bexclusive\b/i,
  /\bmay\b/i,
  /\bcould\b/i,
  /\bquestions remain\b/i,
];

const FRAME_RULES = [
  { id: "threat", label: "Threat / Escalation", keywords: ["attack", "war", "threat", "missile", "killed", "fighter", "crisis", "strike", "bomb", "escalation"] },
  { id: "accountability", label: "Accountability / Institutions", keywords: ["judge", "court", "lawsuit", "arrest", "charged", "policy", "blocked", "investigation", "senate", "department"] },
  { id: "human", label: "Human Impact", keywords: ["injured", "rescued", "families", "residents", "victims", "relatives", "crew", "students", "charity"] },
  { id: "diplomacy", label: "Diplomacy / Negotiation", keywords: ["deal", "talks", "summit", "minister", "allies", "diplomacy", "ceasefire", "reopen"] },
  { id: "markets", label: "Markets / Operations", keywords: ["market", "oil", "economy", "trade", "business", "supply", "tariff", "stocks"] },
  { id: "uncertainty", label: "Uncertainty / Verification", keywords: ["search", "missing", "reports", "officials", "sources", "latest", "unclear", "developing"] },
];

const INTEREST_RULES = {
  tech: ["ai", "technology", "startup", "software", "chip", "cloud", "digital", "app", "cyber"],
  ai: ["ai", "model", "openai", "chip", "compute", "automation", "agent"],
  politics: ["trump", "judge", "court", "policy", "senate", "election", "administration", "college", "department"],
  markets: ["market", "oil", "trade", "economy", "investor", "stocks", "business", "tariff", "embargo"],
  security: ["war", "fighter", "attack", "sanctions", "military", "missile", "border", "security"],
  climate: ["climate", "storm", "emissions", "energy", "wildfire", "flood", "weather"],
};

const ROLE_COPY = {
  founder: {
    disaster: "This matters because disasters can disrupt supply chains, infrastructure, insurance costs, and local operating conditions quickly.",
    conflict: "This can quickly alter investor mood, regulatory pressure, and the operating climate for teams building through uncertainty.",
    policy: "This can change compliance expectations, hiring constraints, and how fast institutions move around your market.",
    markets: "This has direct implications for capital availability, customer confidence, and sector-level volatility.",
    general: "This story is worth tracking because it can shift sentiment, policy timing, and what the market pays attention to next.",
  },
  engineer: {
    disaster: "This matters if you depend on infrastructure resilience, communications, logistics, or emergency-response systems.",
    conflict: "This matters if you build systems that depend on infrastructure stability, platform risk, or geopolitical resilience.",
    policy: "This can reshape platform rules, data practices, and the compliance surface that technical teams inherit.",
    markets: "This can move infrastructure costs, customer budgets, and product priorities faster than the headlines suggest.",
    general: "This matters because the downstream system effects usually show up before most people notice them.",
  },
  investor: {
    disaster: "This matters because disasters can hit insurers, infrastructure, commodities, and regional risk pricing very quickly.",
    conflict: "This is a risk signal story: it can move sectors, repricing, and appetite for near-term exposure.",
    policy: "This matters because policy and court shifts often reprice winners and losers before the full details settle.",
    markets: "This is directly tied to sentiment, sector rotation, and what risk markets think happens next.",
    general: "This matters because the secondary effects may matter more than the headline itself.",
  },
  resident: {
    disaster: "This matters because safety, services, and recovery conditions often become the real story after the first alert.",
    conflict: "This matters at a day-to-day level because safety, services, and public messaging usually change as the story evolves.",
    policy: "This affects how institutions behave around education, mobility, and public-facing services.",
    markets: "This can affect prices, services, and the kinds of public decisions people feel quickly.",
    general: "This matters because it shapes the public reality people live inside, not just the national conversation.",
  },
  student: {
    disaster: "This matters because travel, campus operations, and local safety guidance can change quickly during recovery.",
    conflict: "This matters because international conflict and policy shifts often ripple into campus life, travel, and opportunity.",
    policy: "This can touch admissions, campus policy, and the tone institutions set around risk and access.",
    markets: "This matters because job markets, internships, and industry priorities tend to move with stories like this.",
    general: "This matters because the next-order effects often hit education and opportunity sooner than expected.",
  },
};

const LOCATION_COPY = {
  sf: "In San Francisco, the most relevant angle is usually regulation, startup sentiment, AI infrastructure, and market tone.",
  dc: "In Washington, the key lens is institutional response: what agencies, lawmakers, or courts do next.",
  nyc: "In New York, the key lens is markets, media framing, and how capital or public attention shifts around the story.",
  global: "On a global lens, the key question is whether this becomes part of a broader narrative arc or remains a contained event.",
};

const THEME_RELEVANCE = {
  disaster: "human impact, infrastructure risk, and recovery signals",
  conflict: "geopolitical, supply-chain, and security spillover risk",
  policy: "regulatory and institutional change",
  markets: "market-moving operational and pricing signals",
  law: "enforcement, public-safety, and institutional-trust implications",
  general: "broad downstream implications beyond the first headline",
};

const SOURCE_BIAS = {
  "Fox News": "right",
  "New York Post": "right",
  "Daily Wire": "right",
  "Washington Examiner": "right",
  "Breitbart": "right",
  Newsmax: "right",
  "The Wall Street Journal": "center",
  Reuters: "center",
  "Associated Press": "center",
  AP: "center",
  BBC: "center",
  "BBC News": "center",
  CBS: "center",
  "CBS News": "center",
  ABC: "center",
  "ABC News": "center",
  NBC: "center",
  "NBC News": "center",
  USA: "center",
  Axios: "center",
  Politico: "center",
  NPR: "left",
  CNN: "left",
  MSNBC: "left",
  Guardian: "left",
  "The Guardian": "left",
  HuffPost: "left",
};

const MAJOR_SOURCE_NAMES = new Set([
  ...Object.keys(SOURCE_BIAS),
  "MSN",
  "Yahoo",
  "USA Today",
  "The New York Times",
  "Bloomberg",
  "CNBC",
  "Forbes",
  "The Hill",
  "Al Jazeera",
  "Daily Mail",
  "The Daily Beast",
  "Newsweek",
  "Politico Europe",
  "The Independent",
]);

const state = {
  sections: [],
  clustersById: new Map(),
  intelligenceCache: new Map(),
  activeClusterId: null,
  activePanel: "overview",
  activeAnalysisPanel: "summary",
  prefs: {
    location: "sf",
    role: "founder",
    interests: new Set(["tech", "ai", "politics"]),
  },
};

function setActivePanel(panelId, options = {}) {
  if (!panelId) return;

  state.activePanel = panelId;
  for (const panel of workspacePanels) {
    const isActive = panel.dataset.panel === panelId;
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);
  }

  for (const button of tabButtons) {
    const isActive = button.dataset.panel === panelId;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  }

  if (options.scroll && contentDeck) {
    contentDeck.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function renderTabCounts(sections, rankedEntries) {
  overviewCount.textContent = String(Math.max(0, Math.min(4, rankedEntries.length > 0 ? rankedEntries.length - 1 : 0)));
  personalizedCount.textContent = String(Math.min(4, rankedEntries.length));
  usaCount.textContent = String(sections.find((section) => section.id === "usaDailyBriefing")?.clusterCount || 0);
  worldCount.textContent = String(sections.find((section) => section.id === "worldTopStories")?.clusterCount || 0);
}

function setActiveAnalysisPanel(panelId) {
  state.activeAnalysisPanel = panelId;

  for (const button of analysisTabButtons) {
    const isActive = button.dataset.analysisPanel === panelId;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  }

  for (const panel of analysisPanels) {
    const isActive = panel.dataset.analysisPanel === panelId;
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);
  }
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso || "Unknown";
  }
}

function formatRelativeTime(iso) {
  const timestamp = new Date(iso).getTime();
  if (!timestamp || Number.isNaN(timestamp)) {
    return "Unknown";
  }

  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes <= 1) {
    return "Just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return `${Math.round(diffHours / 24)}d ago`;
}

function normalizeWhitespace(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function cleanText(text) {
  return normalizeWhitespace(text)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+([.,;:!?])/g, "$1");
}

function ensureSentence(text) {
  const cleaned = cleanText(text);
  if (!cleaned) return "";
  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
}

function stripDateline(text) {
  return cleanText(text).replace(/^[A-Z][A-Z\s().,'-]{2,}\s+[—-]\s+/, "");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function keywordPresent(text, keyword) {
  if (!keyword) return false;
  const pattern = new RegExp(`\\b${escapeRegExp(keyword.toLowerCase())}\\b`, "i");
  return pattern.test(text);
}

function tokenize(text) {
  return cleanText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token && token.length > 2 && !STOP_WORDS.has(token));
}

function titleToSentence(title) {
  const cleaned = cleanText(title).replace(/\s+-\s+[^-]+$/, "");
  if (!cleaned) {
    return "";
  }
  const sentence = ensureSentence(cleaned);
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

function sentenceOverlap(left, right) {
  return jaccard(tokenize(left), tokenize(right));
}

function toClause(text) {
  const cleaned = cleanText(text);
  if (!cleaned) return "";
  const firstWord = cleaned.split(/\s+/)[0] || "";
  if (/^[A-Z0-9.]{2,}$/.test(firstWord)) {
    return cleaned;
  }
  return cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
}

function toSentenceClause(text) {
  const clause = toClause(text);
  return clause ? ensureSentence(clause) : "";
}

function buildDisplaySummary(cluster) {
  const canonicalSentence = titleToSentence(getDisplayTitle(cluster));
  const summaryCandidates = [cluster.summary, ...uniqueArticles(cluster.articles).map((article) => article.snippet)]
    .map((value) => stripDateline(value || ""))
    .filter(Boolean);

  const rawSummary = summaryCandidates.find((candidate) => {
    const tokenCount = tokenize(candidate).length;
    return tokenCount >= 6 && candidate.length >= 48 && !/[#]|…/.test(candidate);
  });

  if (!rawSummary) {
    return canonicalSentence;
  }

  const summarySentence = ensureSentence(rawSummary.split(/(?<=[.!?])\s+/)[0] || "");

  if (!summarySentence || tokenize(summarySentence).length < 6) {
    return canonicalSentence;
  }

  if (sentenceOverlap(summarySentence, canonicalSentence) >= 0.72) {
    return canonicalSentence;
  }

  if (summarySentence.length > 240) {
    return ensureSentence(`${summarySentence.slice(0, 220).trimEnd()}…`);
  }

  return summarySentence;
}

function getBiasBucket(sourceName = "") {
  const normalized = cleanText(sourceName);
  if (!normalized) return "center";

  if (SOURCE_BIAS[normalized]) {
    return SOURCE_BIAS[normalized];
  }

  const matchedKey = Object.keys(SOURCE_BIAS).find((key) => normalized.includes(key));
  return matchedKey ? SOURCE_BIAS[matchedKey] : "center";
}

function uniqueArticles(articles = []) {
  const seen = new Set();
  return articles.filter((article) => {
    const key = `${article.source}::${article.url}`;
    if (!article.url || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getDisplayTitle(cluster) {
  const titles = uniqueArticles(cluster.articles)
    .map((article) => cleanText(article.title).replace(/\s+-\s+[^-]+$/, ""))
    .filter(Boolean);

  if (!titles.length) {
    return cleanText(cluster.canonicalTitle);
  }

  const summaryText = stripDateline(cluster.summary || "");
  const scoredTitles = titles.map((title, index) => {
    const consensusScore = titles.reduce((sum, otherTitle, otherIndex) => {
      if (index === otherIndex) return sum;
      return sum + (sentenceOverlap(title, otherTitle) >= 0.35 ? 1 : 0);
    }, 0);

    const summaryScore = summaryText ? sentenceOverlap(title, summaryText) * 10 : 0;
    const canonicalScore = sentenceOverlap(title, cluster.canonicalTitle) * 3;
    const lengthScore = title.length >= 32 && title.length <= 110 ? 1.5 : 0;

    return {
      title,
      score: consensusScore * 6 + summaryScore + canonicalScore + lengthScore,
    };
  });

  const best = scoredTitles.sort((left, right) => right.score - left.score)[0]?.title;
  return best || cleanText(cluster.canonicalTitle);
}

function buildSourceLinks(container, articles, limit = 6) {
  container.innerHTML = "";

  for (const article of uniqueArticles(articles).slice(0, limit)) {
    const link = document.createElement("a");
    link.className = "source-link";
    link.href = article.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = article.source;
    container.appendChild(link);
  }
}

function getStoryStatus(cluster) {
  const updatedMs = new Date(cluster.latestPublishedAt).getTime();
  if (!updatedMs || Number.isNaN(updatedMs)) {
    return null;
  }

  const ageMinutes = (Date.now() - updatedMs) / 60000;
  if (ageMinutes <= 90 && cluster.sourceCount >= 8) {
    return { label: "Live", tone: "live" };
  }

  if (ageMinutes <= 240 && cluster.sourceCount >= 10) {
    return { label: "Developing", tone: "developing" };
  }

  return null;
}

function applyStoryStatus(element, cluster) {
  const status = getStoryStatus(cluster);
  element.hidden = !status;

  if (!status) {
    element.textContent = "Live";
    element.classList.remove("status-pill--developing");
    return;
  }

  element.textContent = status.label;
  element.classList.toggle("status-pill--developing", status.tone === "developing");
}

function setImageState(imageEl, placeholderEl, imageUrl, alt) {
  const mediaEl = imageEl.parentElement;
  imageEl.onload = null;
  imageEl.onerror = null;
  imageEl.removeAttribute("src");
  const existingCanvas = mediaEl?.querySelector("[data-media-canvas]");
  if (existingCanvas) {
    existingCanvas.hidden = true;
  }
  if (mediaEl) {
    mediaEl.style.backgroundImage = "";
    mediaEl.style.backgroundSize = "";
    mediaEl.style.backgroundPosition = "";
  }

  if (!imageUrl) {
    imageEl.hidden = true;
    placeholderEl.hidden = false;
    return;
  }

  const proxiedUrl = `/api/image?url=${encodeURIComponent(imageUrl)}`;
  imageEl.alt = alt;
  imageEl.loading = "eager";
  imageEl.decoding = "async";
  imageEl.referrerPolicy = "no-referrer";
  imageEl.hidden = true;
  placeholderEl.hidden = false;

  const ensureCanvas = () => {
    if (!mediaEl) {
      return null;
    }

    let canvas = mediaEl.querySelector("[data-media-canvas]");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.dataset.mediaCanvas = "true";
      canvas.style.position = "absolute";
      canvas.style.inset = "0";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.display = "block";
      canvas.style.pointerEvents = "none";
      mediaEl.prepend(canvas);
    }

    return canvas;
  };

  const drawCover = (canvas, source) => {
    const bounds = mediaEl.getBoundingClientRect();
    const targetWidth = Math.max(1, Math.round(bounds.width || mediaEl.clientWidth || source.naturalWidth));
    const targetHeight = Math.max(1, Math.round(bounds.height || mediaEl.clientHeight || source.naturalHeight));
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    const imageWidth = source.naturalWidth || source.width || targetWidth;
    const imageHeight = source.naturalHeight || source.height || targetHeight;
    const scale = Math.max(targetWidth / imageWidth, targetHeight / imageHeight);
    const drawWidth = imageWidth * scale;
    const drawHeight = imageHeight * scale;
    const offsetX = (targetWidth - drawWidth) / 2;
    const offsetY = (targetHeight - drawHeight) / 2;

    context.clearRect(0, 0, targetWidth, targetHeight);
    context.drawImage(source, offsetX, offsetY, drawWidth, drawHeight);
    canvas.hidden = false;
    placeholderEl.hidden = true;
  };

  const reveal = (source) => {
    const canvas = ensureCanvas();
    if (!canvas) {
      imageEl.hidden = false;
      imageEl.src = source.src || source.currentSrc || "";
      placeholderEl.hidden = false;
      return;
    }

    drawCover(canvas, source);
    imageEl.hidden = true;
  };

  const tryPaintableImage = (src, onFailure) => {
    const loader = new Image();
    loader.decoding = "async";
    loader.referrerPolicy = "no-referrer";

    loader.onload = () => {
      reveal(loader);
    };

    loader.onerror = () => {
      if (onFailure) {
        onFailure();
        return;
      }
      imageEl.hidden = true;
      placeholderEl.hidden = false;
    };

    loader.src = src;
  };

  tryPaintableImage(proxiedUrl, () => {
    tryPaintableImage(imageUrl, null);
  });
}

function getOrderedSections(payload) {
  return sectionOrder
    .map((id) => payload.sections?.[id])
    .filter(Boolean);
}

function scoreCluster(section, cluster) {
  const updatedMs = new Date(cluster.latestPublishedAt).getTime();
  const ageMinutes = updatedMs ? Math.max(0, (Date.now() - updatedMs) / 60000) : 9999;
  const freshness = Math.max(0, 300 - ageMinutes);
  const scale = cluster.sourceCount * 11 + cluster.articleCount * 2.2;
  const sectionBoost = section.id === "worldTopStories" ? 8 : 0;
  const statusBoost = getStoryStatus(cluster)?.label === "Live" ? 80 : 0;
  return freshness + scale + sectionBoost + statusBoost;
}

function latestSectionUpdate(section) {
  const timestamps = (section.storyClusters || []).map((cluster) =>
    new Date(cluster.latestPublishedAt).getTime()
  );
  const latestMs = timestamps.length ? Math.max(...timestamps) : 0;
  if (!latestMs || Number.isNaN(latestMs)) {
    return "Unknown";
  }
  return formatRelativeTime(new Date(latestMs).toISOString());
}

function flattenClusters(sections) {
  return sections.flatMap((section) =>
    (section.storyClusters || []).map((cluster) => ({
      section,
      cluster,
      score: scoreCluster(section, cluster),
    }))
  );
}

function updateState(sections) {
  state.sections = sections;
  state.clustersById = new Map();

  for (const section of sections) {
    for (const cluster of section.storyClusters || []) {
      state.clustersById.set(cluster.clusterId, { cluster, section });
    }
  }
}

function jaccard(leftTokens, rightTokens) {
  const left = new Set(leftTokens);
  const right = new Set(rightTokens);
  if (!left.size || !right.size) {
    return 0;
  }

  const overlap = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union ? overlap / union : 0;
}

function extractCandidateSentences(cluster) {
  const candidates = [];

  for (const article of uniqueArticles(cluster.articles)) {
    const baseCandidates = [article.title, ...(article.snippet || "").split(/(?<=[.!?])\s+/)];

    for (const rawSentence of baseCandidates) {
      const sentence = cleanText(rawSentence);
      const wordCount = sentence.split(/\s+/).filter(Boolean).length;
      if (!sentence || wordCount < 5 || wordCount > 32) {
        continue;
      }

      candidates.push({
        sentence,
        tokens: tokenize(sentence),
        source: article.source,
        url: article.url,
        isTrusted: Boolean(article._isTrusted),
        isDirect: Boolean(article._isDirect),
      });
    }
  }

  return candidates;
}

function clusterSentences(cluster) {
  const sentenceClusters = [];

  for (const candidate of extractCandidateSentences(cluster)) {
    let best = null;
    let bestScore = 0;

    for (const group of sentenceClusters) {
      const score = jaccard(candidate.tokens, group.signatureTokens);
      if (score > bestScore) {
        bestScore = score;
        best = group;
      }
    }

    if (best && bestScore >= 0.38) {
      best.items.push(candidate);
      best.sources.add(candidate.source);
      candidate.tokens.slice(0, 9).forEach((token) => best.signatureTokens.add(token));
    } else {
      sentenceClusters.push({
        items: [candidate],
        sources: new Set([candidate.source]),
        signatureTokens: new Set(candidate.tokens.slice(0, 9)),
      });
    }
  }

  return sentenceClusters
    .map((group) => {
      const representative = [...group.items].sort((left, right) => {
        const leftScore = (left.isTrusted ? 2 : 0) + (left.isDirect ? 1 : 0);
        const rightScore = (right.isTrusted ? 2 : 0) + (right.isDirect ? 1 : 0);
        return rightScore - leftScore || right.tokens.length - left.tokens.length;
      })[0];

      return {
        text: titleToSentence(representative?.sentence || ""),
        tokens: [...group.signatureTokens],
        sources: [...group.sources],
        items: group.items,
        supportCount: group.sources.size,
      };
    })
    .filter((group) => group.text);
}

function sentenceSupportScore(sentenceCluster) {
  const trustedCount = sentenceCluster.items.filter((item) => item.isTrusted).length;
  const directCount = sentenceCluster.items.filter((item) => item.isDirect).length;
  return sentenceCluster.supportCount * 14 + trustedCount * 4 + directCount * 3;
}

function inferTheme(cluster) {
  const text = cleanText(
    [cluster.canonicalTitle, cluster.summary, ...cluster.articles.map((article) => `${article.title} ${article.snippet || ""}`)].join(" ")
  ).toLowerCase();

  if (/(attack|war|missile|fighter|iran|ukraine|israel|strait|military|drone|crisis)/.test(text)) {
    return "conflict";
  }
  if (/(earthquake|storm|wildfire|flood|hurricane|weather|quake|disaster|aftershock)/.test(text)) {
    return "disaster";
  }
  if (/(judge|court|lawsuit|admissions|policy|department|senate|college|administration)/.test(text)) {
    return "policy";
  }
  if (/(market|oil|economy|stocks|business|tariff|embargo|trade)/.test(text)) {
    return "markets";
  }
  if (/(arrest|charged|custody|police|investigation|suspect)/.test(text)) {
    return "law";
  }
  return "general";
}

function buildFallbackUncertainty(cluster, theme) {
  const uncertaintyByTheme = {
    disaster: "casualty counts, infrastructure damage, and how recovery or rescue efforts develop",
    conflict: "escalation, official confirmation, and what happens next",
    policy: "appeals, enforcement, and how institutions respond next",
    markets: "market duration, second-order business effects, and whether policymakers respond",
    law: "the investigation timeline, additional charges, and what authorities confirm next",
    general: "timing, follow-through, and which secondary effects end up mattering most",
  };

  return {
    title: uncertaintyByTheme[theme] || uncertaintyByTheme.general,
    sources: uniqueArticles(cluster.articles).slice(0, 3),
    meta: "No strong factual contradiction surfaced across the visible cluster, but several outlets still use provisional language.",
  };
}

function extractEntities(cluster) {
  const entityCounts = new Map();
  const blacklist = new Set(
    uniqueArticles(cluster.articles)
      .flatMap((article) => [article.source, article.source.replace(/\s+News$/i, "")])
      .map((value) => value.toLowerCase())
  );

  const text = [cluster.canonicalTitle, cluster.summary, ...cluster.articles.map((article) => `${article.title} ${article.snippet || ""}`)].join(" ");
  const matches = text.match(/\b(?:[A-Z]{2,}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g) || [];

  for (const match of matches) {
    const entity = cleanText(match);
    const normalized = entity.toLowerCase();
    if (
      entity.length < 3 ||
      blacklist.has(normalized) ||
      /^(The|A|An|US|U\.S|BBC|AP|Reuters|World|News|Live|Latest)$/i.test(entity)
    ) {
      continue;
    }

    entityCounts.set(entity, (entityCounts.get(entity) || 0) + 1);
  }

  return [...entityCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));
}

function buildEntityGraph(cluster, entities) {
  const nodes = [{ id: "event", label: getDisplayTitle(cluster).slice(0, 46), weight: cluster.sourceCount }];
  const edges = [];
  const articleTexts = uniqueArticles(cluster.articles).map((article) => `${article.title} ${article.snippet || ""}`);

  entities.forEach((entity, index) => {
    nodes.push({
      id: `entity-${index}`,
      label: entity.name,
      weight: entity.count,
    });

    edges.push({
      source: "event",
      target: `entity-${index}`,
      weight: Math.max(1, entity.count),
    });
  });

  for (let i = 0; i < entities.length; i += 1) {
    for (let j = i + 1; j < entities.length; j += 1) {
      const left = entities[i];
      const right = entities[j];
      const sharedArticles = articleTexts.filter(
        (text) => text.includes(left.name) && text.includes(right.name)
      ).length;

      if (sharedArticles > 0) {
        edges.push({
          source: `entity-${i}`,
          target: `entity-${j}`,
          weight: sharedArticles,
        });
      }
    }
  }

  return { nodes, edges };
}

function buildTimeline(cluster) {
  return uniqueArticles(cluster.articles)
    .slice()
    .sort((left, right) => new Date(right.publishedAt) - new Date(left.publishedAt))
    .slice(0, 5)
    .map((article) => ({
      time: formatRelativeTime(article.publishedAt),
      title: article.title,
      meta: `${article.source} • ${formatDate(article.publishedAt)}`,
    }));
}

function buildFrames(cluster) {
  const scores = FRAME_RULES.map((frame) => ({
    ...frame,
    count: uniqueArticles(cluster.articles).reduce((sum, article) => {
      const text = `${article.title} ${article.snippet || ""}`.toLowerCase();
      const hitCount = frame.keywords.reduce(
        (hits, keyword) => hits + (text.includes(keyword) ? 1 : 0),
        0
      );
      return sum + (hitCount > 0 ? 1 : 0);
    }, 0),
  }))
    .filter((frame) => frame.count > 0)
    .sort((left, right) => right.count - left.count);

  const total = uniqueArticles(cluster.articles).length || 1;
  return scores.slice(0, 4).map((frame) => ({
    ...frame,
    percent: Math.min(100, Math.round((frame.count / total) * 100)),
  }));
}

function buildForecast(theme, entities) {
  const leadEntity = entities[0]?.name || "the main actors";
  const secondEntity = entities[1]?.name || "institutions around the story";

  const templates = {
    disaster: {
      ripple: {
        "24h": [
          "Expect casualty counts, infrastructure damage, and rescue updates to keep tightening as reporting firms up.",
          `Watch whether ${leadEntity} becomes tied to transport, utilities, or emergency-response disruption beyond the initial event.`,
        ],
        "7d": [
          "The next week usually shifts toward recovery logistics, aid response, and whether the damage starts affecting broader daily life.",
          "Insurance, transport, or public-service consequences often become clearer once the first rescue phase ends.",
        ],
        "30d": [
          "Longer-term effects usually show up in rebuilding costs, public policy, and whether this becomes part of a broader climate or resilience story.",
          "The strongest long-tail signal is whether new stories keep linking back to recovery, preparedness, or institutional failure.",
        ],
      },
      watch: [
        { title: "Damage verification", copy: "Look for official counts, satellite imagery, or utility updates that firm up the scale of the damage." },
        { title: "Recovery constraints", copy: "Track whether roads, hospitals, power, or communications become the bottleneck in the next phase." },
        { title: "Aid and policy response", copy: "Watch how quickly governments, NGOs, and local agencies move from alerting into sustained recovery action." },
      ],
    },
    conflict: {
      ripple: {
        "24h": [
          `Expect faster updates from ${leadEntity} and official channels as the immediate situation stabilizes or escalates.`,
          "Watch for casualty, rescue, or infrastructure numbers to tighten as outlets converge on firmer sourcing.",
        ],
        "7d": [
          `The next week likely shifts from the event itself toward retaliation, diplomacy, or operational fallout involving ${secondEntity}.`,
          "Energy, transport, or security narratives may harden if the story keeps crossing into broader geopolitical coverage.",
        ],
        "30d": [
          "The longer arc is usually policy, sanctions, procurement, or public-opinion effects that outlive the initial headline.",
          "If this cluster remains dominant, the market and institutional response may matter more than the first incident.",
        ],
      },
      watch: [
        { title: "Official confirmation", copy: "Look for verified statements, briefings, or documents that narrow conflicting early reports." },
        { title: "Escalation signals", copy: "Track whether allied governments, military channels, or commodity routes start reacting in sync." },
        { title: "Narrative shift", copy: "Watch whether coverage moves from breaking updates into accountability, diplomacy, or public-blame framing." },
      ],
    },
    policy: {
      ripple: {
        "24h": [
          "Expect additional statements, legal positioning, or agency messaging as actors respond to the immediate ruling or policy move.",
          "Coverage usually consolidates around who is bound, who is exempt, and what enforcement looks like right now.",
        ],
        "7d": [
          "The next beat is appeals, new filings, or political escalation as institutions test the practical limits of the decision.",
          `Watch whether ${leadEntity} becomes a symbol for a wider institutional fight rather than a single legal moment.`,
        ],
        "30d": [
          "If the story persists, it can reshape compliance, education, hiring, or agency behavior beyond the original case.",
          "The real long-tail effect is often a change in institutional incentives, not just headline rhetoric.",
        ],
      },
      watch: [
        { title: "Court or policy documents", copy: "New filings, orders, or agency guidance will usually settle the most important uncertainty." },
        { title: "Enforcement reality", copy: "Watch whether institutions actually change behavior or whether the story stays mostly rhetorical." },
        { title: "Coalition response", copy: "Pay attention to who aligns around the decision, especially states, advocacy groups, or industry bodies." },
      ],
    },
    markets: {
      ripple: {
        "24h": [
          "Near-term movement is usually in pricing, sentiment, and analyst framing rather than a fully settled economic effect.",
          `Expect ${leadEntity} to be discussed through cost, supply, and investor-risk language quickly.`,
        ],
        "7d": [
          "The next week usually reveals whether the move is a temporary headline shock or a deeper operational signal.",
          "If the cluster grows, companies and policymakers may start framing it as a structural issue instead of one-off volatility.",
        ],
        "30d": [
          "Longer term, the impact shows up in earnings language, sector rotation, and what leaders start planning around.",
          "The real test is whether this changes capital allocation, regulation, or consumer behavior.",
        ],
      },
      watch: [
        { title: "Price action", copy: "Watch commodities, market commentary, and sector reaction for early evidence of durable impact." },
        { title: "Management tone", copy: "Look for executive, central-bank, or policy language that reframes the story from event to trend." },
        { title: "Second-order spillover", copy: "The bigger signal is usually where the shock lands next, not where it started." },
      ],
    },
    law: {
      ripple: {
        "24h": [
          "Expect identity, charge, and procedural details to become clearer before any broader narrative settles.",
          "The immediate question is whether authorities expand the case or keep it tightly scoped.",
        ],
        "7d": [
          "The next week often reveals whether this is an isolated incident or part of a wider enforcement or security pattern.",
          `Watch whether ${secondEntity} becomes central as the story shifts from event to motive or accountability.`,
        ],
        "30d": [
          "Longer-term effects typically show up in policy changes, community response, and institutional safeguards.",
          "The real follow-through usually becomes visible only after the first wave of arrests or statements fades.",
        ],
      },
      watch: [
        { title: "Charge updates", copy: "Watch for formal charges, revised timelines, and corrections to the earliest versions of the story." },
        { title: "Motive clarity", copy: "The key uncertainty is often motive or network context rather than the basic event itself." },
        { title: "Institutional response", copy: "Look for police, court, or community response to see how large the downstream effect may become." },
      ],
    },
    general: {
      ripple: {
        "24h": [
          "Expect the strongest overlap across sources to stabilize while details around timing and next steps continue to move.",
          "The fastest change is usually in emphasis: what outlets think matters most after the first headline lands.",
        ],
        "7d": [
          "The next week often determines whether this becomes a broader systems story or fades as a contained event.",
          `Watch whether ${leadEntity} becomes tied to larger institutional or economic themes.`,
        ],
        "30d": [
          "If the cluster holds, the longer-term impact usually shows up in policy, market behavior, or reputational narratives.",
          "The best signal is whether new stories start linking back to this one as context.",
        ],
      },
      watch: [
        { title: "Follow-on reporting", copy: "The clearest next signal is whether new stories keep referencing this event as context." },
        { title: "Sharper numbers", copy: "Look for verified counts, documents, or named sources that resolve the remaining uncertainty." },
        { title: "Perspective change", copy: "Watch if the dominant framing shifts from breaking updates to blame, policy, or consequences." },
      ],
    },
  };

  return templates[theme] || templates.general;
}

function buildGroundedBrief(cluster, agreed, disputes, theme) {
  const summarySentence = buildDisplaySummary(cluster);
  const displayTitle = getDisplayTitle(cluster);
  const topAgreement = agreed[0]?.title;
  const supportSentence = `Grounded grouped ${cluster.sourceCount} sources and ${cluster.articleCount} related articles into one developing event.`;
  const agreementSentence =
    topAgreement &&
    Math.max(
      sentenceOverlap(topAgreement, summarySentence),
      sentenceOverlap(topAgreement, displayTitle)
    ) < 0.62
      ? `Across the visible coverage, the clearest shared detail is that ${toSentenceClause(topAgreement)}`
      : "";
  const fallbackUncertainty = buildFallbackUncertainty(cluster, theme).title;
  const disagreementSentence = disputes.length
    ? `Open questions still center on ${toSentenceClause(disputes[0].title)}`
    : `Open questions still center on ${toSentenceClause(fallbackUncertainty)}`;

  return [summarySentence, supportSentence, agreementSentence, disagreementSentence]
    .filter(Boolean)
    .join(" ");
}

function buildGroundedArticle(cluster, intelligence) {
  const article = [];
  const summary = buildDisplaySummary(cluster);
  const agreedClaims = intelligence.agreed.slice(0, 3);
  const disputedClaims = intelligence.disputes.slice(0, 2);
  const primarySources = buildPrimarySourceItems(cluster).slice(0, 2);
  const leadingSources = uniqueArticles(cluster.articles).slice(0, 4).map((article) => article.source);
  const uniqueLeadingSources = [...new Set(leadingSources)];
  const primarySourceNames = [...new Set(primarySources.flatMap((item) => item.sources.map((source) => source.name)))];
  const sourcePhrase =
    uniqueLeadingSources.length > 1
      ? `${uniqueLeadingSources.slice(0, 3).join(", ")}${uniqueLeadingSources.length > 3 ? ", and others" : ""}`
      : uniqueLeadingSources[0] || "the clustered source set";
  const leadClaim = agreedClaims[0]?.title ? cleanText(agreedClaims[0].title).replace(/[.]+$/, "") : "";
  const rawSecondaryClaim = agreedClaims[1]?.title ? cleanText(agreedClaims[1].title).replace(/[.]+$/, "") : "";
  const secondaryClaim =
    rawSecondaryClaim && sentenceOverlap(rawSecondaryClaim, leadClaim) < 0.8 ? rawSecondaryClaim : "";

  article.push(summary);

  if (agreedClaims.length) {
    article.push(
      `Across ${cluster.articleCount} related articles from ${cluster.sourceCount} sources, Grounded found the clearest overlap around one core event: ${ensureSentence(
        leadClaim
      )}${secondaryClaim ? ` It also found repeated support for ${toClause(secondaryClaim)}.` : ""}`
    );
  } else {
    article.push(
      `Grounded reviewed ${cluster.articleCount} related articles from ${cluster.sourceCount} sources and drafted this brief from the highest-overlap reporting across the cluster.`
    );
  }

  article.push(
    `The current working account is supported most consistently by ${sourcePhrase}. Grounded gives this cluster a confidence score of ${intelligence.confidence}% based on repeated cross-source overlap, source breadth, and how often the core facts are described in similar terms.`
  );

  if (primarySources.length || disputedClaims.length) {
    const primaryLine = primarySources.length
      ? `The strongest direct signals currently come from ${primarySourceNames.join(" and ")}.`
      : "";
    const uncertaintyLine = disputedClaims.length
      ? `What remains unresolved is ${disputedClaims
          .map((claim) => toClause(claim.title))
          .join(" and ")}.`
      : "";

    article.push([primaryLine, uncertaintyLine].filter(Boolean).join(" "));
  }

  if (intelligence.watchSignals.length) {
    article.push(
      `What Grounded is watching next is ${toClause(intelligence.watchSignals[0].title)}. ${intelligence.watchSignals[0].copy}`
    );
  }

  return article.filter(Boolean);
}

function buildCoverageSplit(cluster) {
  const buckets = {
    left: { key: "left", label: "Left", sources: new Map(), articles: 0 },
    center: { key: "center", label: "Center", sources: new Map(), articles: 0 },
    right: { key: "right", label: "Right", sources: new Map(), articles: 0 },
  };

  for (const article of uniqueArticles(cluster.articles)) {
    const bucket = getBiasBucket(article.source);
    const target = buckets[bucket] || buckets.center;
    target.articles += 1;
    if (!target.sources.has(article.source)) {
      target.sources.set(article.source, article.url);
    }
  }

  const totalRatedSources = Object.values(buckets).reduce((sum, bucket) => sum + bucket.sources.size, 0) || 1;
  return Object.values(buckets).map((bucket) => ({
    ...bucket,
    sourceCount: bucket.sources.size,
    percent: Math.round((bucket.sources.size / totalRatedSources) * 100),
    sourceLinks: [...bucket.sources.entries()].slice(0, 8).map(([name, url]) => ({ name, url })),
  }));
}

function buildPrimarySourceItems(cluster) {
  const directArticles = uniqueArticles(cluster.articles)
    .filter((article) => {
      const url = article.url || "";
      const text = `${article.title} ${article.snippet || ""}`.toLowerCase();
      return (
        article._isDirect ||
        /\.(gov|mil|edu)\//i.test(url) ||
        /(statement|briefing|filing|transcript|order|press release|official|court|documents)/i.test(text)
      );
    })
    .slice(0, 4);

  return directArticles.map((article) => ({
    title: article.title,
    meta: `${article.source} • ${formatRelativeTime(article.publishedAt)} • direct or official signal`,
    sources: [{ name: article.source, url: article.url }],
  }));
}

function buildUndercoveredItems(cluster) {
  const grouped = new Map();

  for (const article of uniqueArticles(cluster.articles)) {
    const normalized = cleanText(article.source);
    if (!normalized) continue;
    if (MAJOR_SOURCE_NAMES.has(normalized)) continue;

    if (!grouped.has(normalized)) {
      grouped.set(normalized, []);
    }
    grouped.get(normalized).push(article);
  }

  return [...grouped.entries()]
    .sort((left, right) => right[1].length - left[1].length)
    .slice(0, 5)
    .map(([source, articles]) => ({
      title: source,
      meta: `${articles.length} article${articles.length === 1 ? "" : "s"} in this cluster from smaller or less-covered outlets`,
      sources: articles.slice(0, 3).map((article) => ({ name: article.source, url: article.url })),
    }));
}

function computeConfidence(cluster, agreed) {
  const trustedCount = cluster.articles.filter((article) => article._isTrusted).length;
  const directCount = cluster.articles.filter((article) => article._isDirect).length;
  const supportStrength = agreed.length
    ? agreed.reduce((sum, claim) => sum + claim.supportCount, 0) / agreed.length
    : 1;
  const score = Math.max(
    42,
    Math.min(
      96,
      Math.round(
        34 +
          cluster.sourceCount * 1.2 +
          trustedCount * 1.4 +
          directCount * 0.8 +
          supportStrength * 2.2
      )
    )
  );
  return score;
}

function getStoryIntelligence(cluster, section) {
  const cacheKey = cluster.clusterId;
  if (state.intelligenceCache.has(cacheKey)) {
    return state.intelligenceCache.get(cacheKey);
  }

  const sentenceClusters = clusterSentences(cluster);
  const agreed = sentenceClusters
    .filter((item) => item.supportCount >= 2)
    .sort((left, right) => sentenceSupportScore(right) - sentenceSupportScore(left))
    .slice(0, 4)
    .map((item) => ({
      title: item.text,
      supportCount: item.supportCount,
      sources: item.items.slice(0, 4).map((sourceItem) => ({
        name: sourceItem.source,
        url: sourceItem.url,
      })),
      meta: `${item.supportCount} supporting sources • ${Math.min(95, 42 + item.supportCount * 12)}% confidence`,
    }));

  const theme = inferTheme(cluster);
  const uncertainClusters = sentenceClusters
    .filter(
      (item) =>
        item.supportCount < 2 &&
        UNCERTAINTY_PATTERNS.some((pattern) => pattern.test(item.text))
    )
    .slice(0, 2)
    .map((item) => ({
      title: item.text,
      sources: item.items.slice(0, 3).map((sourceItem) => ({
        name: sourceItem.source,
        url: sourceItem.url,
      })),
      meta: item.sources.length
        ? `Still provisional in ${item.sources.length} visible source${item.sources.length === 1 ? "" : "s"}`
        : "Still provisional",
    }));

  const disputes = uncertainClusters.length
    ? uncertainClusters
    : [buildFallbackUncertainty(cluster, theme)];

  const frames = buildFrames(cluster);
  const entities = extractEntities(cluster);
  const graph = buildEntityGraph(cluster, entities);
  const timeline = buildTimeline(cluster);
  const forecast = buildForecast(theme, entities);
  const confidence = computeConfidence(cluster, agreed);
  const brief = buildGroundedBrief(cluster, agreed, disputes, theme);
  const headline = getDisplayTitle(cluster);

  const intelligence = {
    headline,
    theme,
    confidence,
    brief,
    agreed,
    disputes,
    frames,
    entities,
    graph,
    timeline,
    rippleEffects: forecast.ripple,
    watchSignals: forecast.watch,
    sectionTitle: sectionLabels[section.id] || section.title,
  };

  state.intelligenceCache.set(cacheKey, intelligence);
  return intelligence;
}

function getInterestScore(cluster, interests) {
  const text = cleanText(
    [cluster.canonicalTitle, cluster.summary, ...cluster.articles.map((article) => `${article.title} ${article.snippet || ""}`)].join(" ")
  ).toLowerCase();

  let score = 0;
  for (const interest of interests) {
    const keywords = INTEREST_RULES[interest] || [];
    score += keywords.reduce((sum, keyword) => sum + (keywordPresent(text, keyword) ? 1 : 0), 0);
  }
  return score;
}

function getMatchedInterests(cluster, interests) {
  const text = cleanText(
    [cluster.canonicalTitle, cluster.summary, ...cluster.articles.map((article) => `${article.title} ${article.snippet || ""}`)].join(" ")
  ).toLowerCase();

  return [...interests].filter((interest) =>
    (INTEREST_RULES[interest] || []).some((keyword) => keywordPresent(text, keyword))
  );
}

function buildPersonalWhy(entry, prefs, intelligence) {
  const matchedInterests = getMatchedInterests(entry.cluster, prefs.interests);
  const roleCopy =
    ROLE_COPY[prefs.role]?.[intelligence.theme] ||
    ROLE_COPY[prefs.role]?.general ||
    ROLE_COPY.founder.general;
  const locationCopy = LOCATION_COPY[prefs.location] || LOCATION_COPY.global;
  const interestSentence = matchedInterests.length
    ? `Why this is on your feed: it intersects with ${matchedInterests.slice(0, 3).join(", ")}.`
    : `Why this is on your feed: it carries strong ${THEME_RELEVANCE[intelligence.theme] || THEME_RELEVANCE.general}.`;

  return `${interestSentence} ${roleCopy} ${locationCopy}`;
}

function scorePersonalEntry(entry, prefs) {
  const intelligence = getStoryIntelligence(entry.cluster, entry.section);
  const interestScore = getInterestScore(entry.cluster, prefs.interests);
  const locationBoost = prefs.location === "global"
    ? 3
    : /san francisco|silicon valley|california|startup|ai|tech/i.test(
        `${entry.cluster.canonicalTitle} ${entry.cluster.summary}`
      ) && prefs.location === "sf"
      ? 6
      : /washington|white house|senate|court|judge|administration/i.test(
          `${entry.cluster.canonicalTitle} ${entry.cluster.summary}`
        ) && prefs.location === "dc"
        ? 6
        : /market|wall street|finance|investor|business/i.test(
            `${entry.cluster.canonicalTitle} ${entry.cluster.summary}`
          ) && prefs.location === "nyc"
          ? 6
          : 0;
  const roleBoost = intelligence.theme === "policy" && prefs.role === "founder"
    ? 4
    : intelligence.theme === "markets" && prefs.role === "investor"
      ? 5
      : intelligence.theme === "conflict" && prefs.role === "resident"
        ? 4
        : intelligence.theme === "policy" && prefs.role === "student"
          ? 4
          : intelligence.theme === "markets" && prefs.role === "engineer"
            ? 3
            : 0;

  return entry.score + interestScore * 12 + locationBoost * 10 + roleBoost * 10 + intelligence.confidence;
}

function setCoverageButton(button, clusterId, label) {
  button.dataset.clusterId = clusterId;
  if (label) {
    button.textContent = label;
  }
}

function compactSectionLabel(label = "") {
  return label
    .replace(" Daily Briefing", "")
    .replace(" Top Stories", "")
    .replace("Personalized ", "")
    .trim();
}

function renderLead(entry) {
  if (!entry) {
    return;
  }

  const { cluster, section } = entry;
  const intelligence = getStoryIntelligence(cluster, section);
  const leadCard = document.querySelector(".lead-card");

  setImageState(leadImage, leadPlaceholder, cluster.imageUrl, intelligence.headline);
  applyStoryStatus(leadStatus, cluster);
  leadSection.textContent = compactSectionLabel(section.title);
  leadTitle.textContent = intelligence.headline;
  leadSummary.textContent = buildDisplaySummary(cluster);
  leadWhy.textContent = intelligence.watchSignals[0]?.copy || cluster.whyItMatters;
  leadUpdated.textContent = `Updated ${formatRelativeTime(cluster.latestPublishedAt)}`;
  leadUpdated.title = formatDate(cluster.latestPublishedAt);
  leadSources.textContent = `${cluster.sourceCount} sources`;
  leadArticles.textContent = `${cluster.articleCount} articles`;
  buildSourceLinks(leadSourceLinks, cluster.articles, 8);
  setCoverageButton(leadCoverageButton, cluster.clusterId, "Open AI analysis");
  if (leadCard) {
    leadCard.dataset.clusterId = cluster.clusterId;
  }
}

function renderTicker(entries) {
  tickerTrack.innerHTML = "";

  if (!entries.length) {
    tickerTrack.innerHTML = '<span class="ticker__empty">No trending clusters yet.</span>';
    return;
  }

  for (const entry of entries.slice(0, 8)) {
    const node = tickerItemTemplate.content.firstElementChild.cloneNode(true);
    const intelligence = getStoryIntelligence(entry.cluster, entry.section);
    node.querySelector(".ticker__item-text").textContent = intelligence.headline;
    setCoverageButton(node, entry.cluster.clusterId);
    tickerTrack.appendChild(node);
  }
}

function renderLiveRail(entries, leadId) {
  liveRail.innerHTML = "";
  const items = entries.filter((entry) => entry.cluster.clusterId !== leadId).slice(0, 2);

  if (!items.length) {
    liveRail.innerHTML = '<div class="empty-state">No live clusters are available yet.</div>';
    return;
  }

  for (const entry of items) {
    const { cluster, section } = entry;
    const intelligence = getStoryIntelligence(cluster, section);
    const node = railItemTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.clusterId = cluster.clusterId;

    setImageState(
      node.querySelector(".rail-card__image"),
      node.querySelector(".rail-card__placeholder"),
      cluster.imageUrl,
      intelligence.headline
    );
    applyStoryStatus(node.querySelector(".rail-card__status"), cluster);
    node.querySelector(".rail-card__section").textContent = compactSectionLabel(section.title);
    node.querySelector(".rail-card__title").textContent = intelligence.headline;
    node.querySelector(".rail-card__summary").textContent = buildDisplaySummary(cluster);
    node.querySelector(".rail-card__updated").textContent = formatRelativeTime(cluster.latestPublishedAt);
    node.querySelector(".rail-card__sources").textContent = `${cluster.sourceCount} sources`;
    node.querySelector(".rail-card__articles").textContent = `${cluster.articleCount} articles`;
    buildSourceLinks(node.querySelector(".rail-card__sources-list"), cluster.articles, 4);
    setCoverageButton(node.querySelector(".rail-card__button"), cluster.clusterId, "Open AI analysis");

    liveRail.appendChild(node);
  }
}

function renderPersonalized(entries) {
  personalizedGrid.innerHTML = "";
  const ranked = entries
    .map((entry) => ({
      ...entry,
      personalScore: scorePersonalEntry(entry, state.prefs),
    }))
    .sort((left, right) => right.personalScore - left.personalScore)
    .slice(0, 4);

  if (!ranked.length) {
    personalizedGrid.innerHTML = '<div class="empty-state">No personalized stories are available yet.</div>';
    return;
  }

  for (const entry of ranked) {
    const { cluster, section } = entry;
    const intelligence = getStoryIntelligence(cluster, section);
    const node = personalizedCardTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.clusterId = cluster.clusterId;

    applyStoryStatus(node.querySelector(".personal-card__status"), cluster);
    node.querySelector(".personal-card__section").textContent = compactSectionLabel(section.title);
    node.querySelector(".personal-card__title").textContent = intelligence.headline;
    node.querySelector(".personal-card__summary").textContent = intelligence.brief;
    node.querySelector("[data-role-copy]").textContent = buildPersonalWhy(entry, state.prefs, intelligence);
    node.querySelector(".personal-card__updated").textContent = formatRelativeTime(cluster.latestPublishedAt);
    node.querySelector(".personal-card__sources").textContent = `${cluster.sourceCount} sources`;
    node.querySelector(".personal-card__articles").textContent = `${cluster.articleCount} articles`;
    buildSourceLinks(node.querySelector(".personal-card__sources-list"), cluster.articles, 4);
    setCoverageButton(node.querySelector(".personal-card__button"), cluster.clusterId, "Open story intelligence");

    personalizedGrid.appendChild(node);
  }
}

function renderDigest(entries, leadId) {
  digestGrid.innerHTML = "";
  const items = entries.filter((entry) => entry.cluster.clusterId !== leadId).slice(0, 6);

  if (!items.length) {
    digestGrid.innerHTML = '<div class="empty-state">No grouped cards are available yet.</div>';
    return;
  }

  for (const entry of items) {
    const { cluster, section } = entry;
    const intelligence = getStoryIntelligence(cluster, section);
    const node = digestCardTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.clusterId = cluster.clusterId;

    setImageState(
      node.querySelector(".digest-card__image"),
      node.querySelector(".digest-card__placeholder"),
      cluster.imageUrl,
      intelligence.headline
    );
    applyStoryStatus(node.querySelector(".digest-card__status"), cluster);
    node.querySelector(".digest-card__section").textContent = compactSectionLabel(section.title);
    node.querySelector(".digest-card__title").textContent = intelligence.headline;
    node.querySelector(".digest-card__summary").textContent = buildDisplaySummary(cluster);
    node.querySelector(".digest-card__updated").textContent = formatRelativeTime(cluster.latestPublishedAt);
    node.querySelector(".digest-card__sources").textContent = `${cluster.sourceCount} sources`;
    node.querySelector(".digest-card__articles").textContent = `${cluster.articleCount} articles`;
    buildSourceLinks(node.querySelector(".digest-card__source-links"), cluster.articles, 5);
    setCoverageButton(node.querySelector(".digest-card__button"), cluster.clusterId, "Open AI analysis");

    digestGrid.appendChild(node);
  }
}

function renderSection(section, host) {
  host.innerHTML = "";

  if (!section) {
    host.innerHTML = '<div class="empty-state">No grouped stories are available for this section yet.</div>';
    return;
  }

    const node = sectionTemplate.content.firstElementChild.cloneNode(true);
    node.id = section.id;
    node.querySelector(".section-kicker").textContent = section.kicker;
    node.querySelector(".section-title").textContent = section.title;
    node.querySelector(".section-note--stats").textContent =
      `${section.articlePoolCount} articles scanned • ${section.clusterCount} grouped stories • Updated ${latestSectionUpdate(section)}`;

  const [feature, ...rest] = section.storyClusters || [];
  if (!feature) {
    host.innerHTML = '<div class="empty-state">No grouped stories are available for this section yet.</div>';
    return;
  }

    const intelligence = getStoryIntelligence(feature, section);
    node.querySelector(".section-feature").dataset.clusterId = feature.clusterId;
    setImageState(
      node.querySelector(".section-feature__image"),
      node.querySelector(".section-feature__placeholder"),
      feature.imageUrl,
      intelligence.headline
    );
    applyStoryStatus(node.querySelector(".section-feature__status"), feature);
    node.querySelector(".section-feature__kicker").textContent = compactSectionLabel(section.title);
    node.querySelector(".section-feature__title").textContent = intelligence.headline;
    node.querySelector(".section-feature__summary").textContent = buildDisplaySummary(feature);
    node.querySelector(".section-feature__why").textContent = feature.whyItMatters;
    node.querySelector(".section-feature__updated").textContent = formatRelativeTime(feature.latestPublishedAt);
    node.querySelector(".section-feature__sources").textContent = `${feature.sourceCount} sources`;
    node.querySelector(".section-feature__articles").textContent = `${feature.articleCount} articles`;
    buildSourceLinks(node.querySelector(".section-feature__source-links"), feature.articles, 6);
    setCoverageButton(
      node.querySelector(".section-feature__button"),
      feature.clusterId,
      "Open AI analysis"
    );

    const list = node.querySelector(".section-list");
    for (const cluster of rest.slice(0, 4)) {
      const card = storyCardTemplate.content.firstElementChild.cloneNode(true);
      const storyIntel = getStoryIntelligence(cluster, section);
      card.dataset.clusterId = cluster.clusterId;

      setImageState(
        card.querySelector(".story-card__image"),
        card.querySelector(".story-card__placeholder"),
        cluster.imageUrl,
        storyIntel.headline
      );
      applyStoryStatus(card.querySelector(".story-card__status"), cluster);
      card.querySelector(".story-card__section").textContent = compactSectionLabel(section.title);
      card.querySelector(".story-card__title").textContent = storyIntel.headline;
      card.querySelector(".story-card__summary").textContent = buildDisplaySummary(cluster);
      card.querySelector(".story-card__updated").textContent = formatRelativeTime(cluster.latestPublishedAt);
      card.querySelector(".story-card__sources").textContent = `${cluster.sourceCount} sources`;
      card.querySelector(".story-card__articles").textContent = `${cluster.articleCount} articles`;
      buildSourceLinks(card.querySelector(".story-card__source-links"), cluster.articles, 4);
      setCoverageButton(card.querySelector(".story-card__button"), cluster.clusterId, "Open AI analysis");
      list.appendChild(card);
    }

    host.appendChild(node);
}

function renderSections(sections) {
  const usaSection = sections.find((section) => section.id === "usaDailyBriefing");
  const worldSection = sections.find((section) => section.id === "worldTopStories");
  renderSection(usaSection, usaSectionHost);
  renderSection(worldSection, worldSectionHost);
}

function renderSnapshots(sections, leadEntry) {
  const totalClusters = sections.reduce(
    (sum, section) => sum + (section.storyClusters?.length || 0),
    0
  );
  const totalArticlePool = sections.reduce(
    (sum, section) => sum + (section.articlePoolCount || 0),
    0
  );

  sectionCountLabel.textContent = String(sections.length);
  clusterCountLabel.textContent = String(totalClusters);
  articlePoolCountLabel.textContent = String(totalArticlePool);
  leadCoverageLabel.textContent = leadEntry
    ? `${leadEntry.cluster.sourceCount} sources`
    : "0 sources";
}

function renderLedger(container, items, fallbackTitle) {
  container.innerHTML = "";

  if (!items.length) {
    container.innerHTML = `<div class="empty-state">${fallbackTitle}</div>`;
    return;
  }

  for (const item of items) {
    const node = ledgerItemTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".ledger-item__title").textContent = item.title;
    node.querySelector(".ledger-item__meta").textContent = item.meta;
    const sourceContainer = node.querySelector(".ledger-item__sources");
    sourceContainer.innerHTML = "";

    for (const source of item.sources || []) {
      const link = document.createElement("a");
      link.className = "source-link";
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = source.name;
      sourceContainer.appendChild(link);
    }

    container.appendChild(node);
  }
}

function renderFrames(frames) {
  framingMatrix.innerHTML = "";

  if (!frames.length) {
    framingMatrix.innerHTML = '<div class="empty-state">No strong frame signal yet.</div>';
    return;
  }

  for (const frame of frames) {
    const node = frameItemTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".frame-item__label").textContent = frame.label;
    node.querySelector(".frame-item__value").textContent = `${frame.percent}%`;
    node.querySelector(".frame-item__fill").style.width = `${frame.percent}%`;
    framingMatrix.appendChild(node);
  }
}

function renderArticleProse(paragraphs) {
  groundedArticle.innerHTML = "";

  for (const paragraph of paragraphs.filter(Boolean)) {
    const node = document.createElement("p");
    node.textContent = paragraph;
    groundedArticle.appendChild(node);
  }
}

function renderCoverageSplit(split) {
  coverageSplitColumns.innerHTML = "";

  const ordered = ["left", "center", "right"]
    .map((key) => split.find((item) => item.key === key))
    .filter(Boolean);

  const dominant = ordered.reduce((best, item) => (item.sourceCount > (best?.sourceCount || 0) ? item : best), null);
  coverageSplitSummary.textContent = dominant
    ? `${dominant.label} coverage currently leads this cluster with ${dominant.sourceCount} rated sources. Source labels are publication-level, not claim-level truth scores.`
    : "Grounded could not identify enough rated publishers to summarize the coverage split.";

  for (const bucket of ordered) {
    const node = coverageBucketTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.biasBucket = bucket.key;
    node.querySelector(".coverage-bucket__title").textContent = bucket.label;
    node.querySelector(".coverage-bucket__count").textContent = `${bucket.percent}%`;
    node.querySelector(".coverage-bucket__meta").textContent =
      `${bucket.sourceCount} sources • ${bucket.articles} articles`;

    const links = node.querySelector(".coverage-bucket__sources");
    links.innerHTML = "";

    if (!bucket.sourceLinks.length) {
      const empty = document.createElement("span");
      empty.className = "coverage-bucket__empty";
      empty.textContent = "No rated sources in this bucket";
      links.appendChild(empty);
    } else {
      for (const source of bucket.sourceLinks) {
        const link = document.createElement("a");
        link.className = "source-link";
        link.href = source.url;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.textContent = source.name;
        links.appendChild(link);
      }
    }

    coverageSplitColumns.appendChild(node);
  }
}

function renderGraph(graph) {
  connectionGraph.innerHTML = "";
  const centerX = 260;
  const centerY = 160;
  const radiusX = 188;
  const radiusY = 118;
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];

  const coords = new Map();
  coords.set("event", { x: centerX, y: centerY, width: 172, height: 58 });

  const orbitNodes = nodes.filter((node) => node.id !== "event");
  orbitNodes.forEach((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(1, orbitNodes.length);
    const width = Math.min(136, Math.max(94, 78 + node.weight * 3));
    const height = 40;
    coords.set(node.id, {
      x: centerX + Math.cos(angle) * radiusX,
      y: centerY + Math.sin(angle) * radiusY,
      width,
      height,
    });
  });

  for (const edge of edges) {
    const start = coords.get(edge.source);
    const end = coords.get(edge.target);
    if (!start || !end) continue;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", start.x);
    line.setAttribute("y1", start.y);
    line.setAttribute("x2", end.x);
    line.setAttribute("y2", end.y);
    line.setAttribute("stroke", "rgba(241,238,230,0.18)");
    line.setAttribute("stroke-width", String(Math.max(1, edge.weight * 0.6)));
    connectionGraph.appendChild(line);
  }

  for (const node of nodes) {
    const point = coords.get(node.id);
    if (!point) continue;

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", point.x - point.width / 2);
    rect.setAttribute("y", point.y - point.height / 2);
    rect.setAttribute("width", point.width);
    rect.setAttribute("height", point.height);
    rect.setAttribute("rx", "0");
    rect.setAttribute("fill", node.id === "event" ? "rgba(241,238,230,0.08)" : "rgba(39,38,34,0.95)");
    rect.setAttribute("stroke", node.id === "event" ? "rgba(241,238,230,0.44)" : "rgba(241,238,230,0.16)");
    rect.setAttribute("stroke-width", node.id === "event" ? "1.5" : "1");

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", point.x);
    text.setAttribute("y", point.y + 4);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", node.id === "event" ? "11" : "10");
    text.setAttribute("font-family", "Inter, system-ui, sans-serif");
    text.setAttribute("font-weight", node.id === "event" ? "700" : "600");
    text.setAttribute("fill", node.id === "event" ? "#f1eee6" : "#ddd7ca");
    const maxLength = node.id === "event" ? 22 : 16;
    text.textContent = node.label.length > maxLength ? `${node.label.slice(0, maxLength)}…` : node.label;

    group.appendChild(rect);
    group.appendChild(text);
    connectionGraph.appendChild(group);
  }
}

function renderTimeline(timeline) {
  storyTimeline.innerHTML = "";

  if (!timeline.length) {
    storyTimeline.innerHTML = '<div class="empty-state">No timeline events available yet.</div>';
    return;
  }

  for (const item of timeline) {
    const node = timelineItemTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".timeline-item__time").textContent = item.time;
    node.querySelector(".timeline-item__title").textContent = item.title;
    node.querySelector(".timeline-item__meta").textContent = item.meta;
    storyTimeline.appendChild(node);
  }
}

function renderForecast(ripple, watch) {
  rippleEffects.innerHTML = "";
  watchSignals.innerHTML = "";

  for (const [windowLabel, items] of Object.entries(ripple || {})) {
    const column = forecastColumnTemplate.content.firstElementChild.cloneNode(true);
    column.querySelector(".forecast-column__title").textContent = windowLabel;
    const list = column.querySelector(".forecast-column__list");

    for (const item of items) {
      const watchNode = watchItemTemplate.content.firstElementChild.cloneNode(true);
      watchNode.querySelector(".watch-item__title").textContent = item;
      watchNode.querySelector(".watch-item__copy").remove();
      list.appendChild(watchNode);
    }

    rippleEffects.appendChild(column);
  }

  for (const signal of watch || []) {
    const node = watchItemTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".watch-item__title").textContent = signal.title;
    node.querySelector(".watch-item__copy").textContent = signal.copy;
    watchSignals.appendChild(node);
  }
}

function renderAskAnswer(text) {
  askStoryAnswer.textContent = text;
}

function getDefaultAnswer(intelligence) {
  const firstClaim = intelligence.agreed[0]?.title || "the cluster is still stabilizing";
  const openQuestion = intelligence.disputes[0]?.title || "how the next phase develops";
  const nextSignal = intelligence.watchSignals[0];
  const signalText = nextSignal
    ? `${nextSignal.title}: ${nextSignal.copy}`
    : "watch for stronger official confirmation";
  return `Grounded's current read: ${toSentenceClause(firstClaim)} The main open question is ${toSentenceClause(
    openQuestion
  )} Next signal to watch: ${signalText}`;
}

function answerStoryQuestion(question, intelligence) {
  const normalized = question.toLowerCase();
  if (/(agree|fact|confirmed|true|consensus)/.test(normalized)) {
    return intelligence.agreed.length
      ? `What most sources agree on: ${intelligence.agreed
          .map((claim) => `${claim.title} (${claim.supportCount} sources)`)
          .join(" ")}`
      : "The cluster does not yet show enough overlap to state a strong consensus beyond the lead brief.";
  }

  if (/(dispute|unclear|uncertain|open question|contested)/.test(normalized)) {
    return intelligence.disputes.length
      ? `What remains unsettled: ${intelligence.disputes.map((claim) => claim.title).join(" ")}`
      : "No major factual contradiction stands out across the visible sources; most variation is in emphasis and next-step framing.";
  }

  if (/(next|watch|predict|forecast|effect|impact)/.test(normalized)) {
    return `What to watch next: ${(intelligence.watchSignals || [])
      .map((signal) => `${signal.title}: ${signal.copy}`)
      .join(" ")}`
  }

  if (/(frame|perspective|outlet|narrative)/.test(normalized)) {
    return intelligence.frames.length
      ? `The dominant framing in this cluster is ${intelligence.frames
          .map((frame) => `${frame.label} (${frame.percent}%)`)
          .join(", ")}.`
      : "The framing spread is still weak, so Grounded is not surfacing a strong perspective split yet.";
  }

  if (/(why.*matter|why does this matter|so what)/.test(normalized)) {
    const roleText =
      ROLE_COPY[state.prefs.role]?.[intelligence.theme] || ROLE_COPY[state.prefs.role]?.general;
    return `${roleText} ${LOCATION_COPY[state.prefs.location] || LOCATION_COPY.global}`;
  }

  return getDefaultAnswer(intelligence);
}

function renderModal(clusterId) {
  const entry = state.clustersById.get(clusterId);
  if (!entry) return;

  const { cluster, section } = entry;
  const intelligence = getStoryIntelligence(cluster, section);
  state.activeClusterId = clusterId;

  setImageState(modalImage, modalPlaceholder, cluster.imageUrl, intelligence.headline);
  applyStoryStatus(modalStatus, cluster);
  modalSection.textContent = section.title;
  modalTitle.textContent = intelligence.headline;
  modalSummary.textContent = buildDisplaySummary(cluster);
  modalWhy.textContent = cluster.whyItMatters;
  modalUpdated.textContent = `Updated ${formatRelativeTime(cluster.latestPublishedAt)}`;
  modalUpdated.title = formatDate(cluster.latestPublishedAt);
  modalSources.textContent = `${cluster.sourceCount} sources`;
  modalArticles.textContent = `${cluster.articleCount} articles`;
  buildSourceLinks(modalSourceLinks, cluster.articles, 8);

  renderArticleProse(buildGroundedArticle(cluster, intelligence));
  groundedBrief.textContent = intelligence.brief;
  briefConfidence.textContent = `Confidence ${intelligence.confidence}%`;
  renderLedger(
    claimLedger,
    intelligence.agreed,
    "Grounded did not find enough repeated, source-backed overlap to surface a strong claim ledger yet."
  );
  renderLedger(
    disputedClaims,
    intelligence.disputes,
    "No significant disputed claim is visible in the current source set."
  );
  renderCoverageSplit(buildCoverageSplit(cluster));
  renderFrames(intelligence.frames);
  renderLedger(
    primarySourceLayer,
    buildPrimarySourceItems(cluster),
    "No direct filings, statements, or official documents surfaced in the current cluster."
  );
  renderLedger(
    undercoveredMix,
    buildUndercoveredItems(cluster),
    "This cluster is currently dominated by major national and international outlets."
  );
  renderGraph(intelligence.graph);
  renderTimeline(intelligence.timeline);
  renderForecast(intelligence.rippleEffects, intelligence.watchSignals);
  renderAskAnswer(getDefaultAnswer(intelligence));
  askStoryInput.value = "";
  setActiveAnalysisPanel(state.activeAnalysisPanel || "summary");

  modalArticlesList.innerHTML = "";
  for (const article of uniqueArticles(cluster.articles)) {
    const node = modalArticleItemTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".article-row__source").textContent = article.source;
    node.querySelector(".article-row__time").textContent = formatRelativeTime(article.publishedAt);
    node.querySelector(".article-row__title").textContent = article.title;
    node.querySelector(".article-row__summary").textContent =
      article.snippet || "No extracted snippet is available for this article yet.";
    node.querySelector(".article-row__link").href = article.url;
    modalArticlesList.appendChild(node);
  }

  coverageModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeModal() {
  coverageModal.hidden = true;
  document.body.classList.remove("modal-open");
  state.activeClusterId = null;
}

function renderHomepage(payload) {
  const sections = getOrderedSections(payload);
  updateState(sections);

  providerLabel.textContent = payload.provider || "unknown";
  generatedAtLabel.textContent = formatRelativeTime(payload.generatedAt);
  generatedAtLabel.title = formatDate(payload.generatedAt);
  refreshModeLabel.textContent = payload.refreshMode || "Auto + Cached";

  const rankedEntries = flattenClusters(sections).sort((left, right) => right.score - left.score);
  const leadEntry = rankedEntries[0];

  renderLead(leadEntry);
  renderTicker(rankedEntries);
  renderLiveRail(rankedEntries, leadEntry?.cluster.clusterId);
  renderPersonalized(rankedEntries);
  renderDigest(rankedEntries, leadEntry?.cluster.clusterId);
  renderSections(sections);
  renderTabCounts(sections, rankedEntries);
  renderSnapshots(sections, leadEntry);
  setActivePanel(state.activePanel);

  if (payload.fallbackReason) {
    providerNote.textContent =
      `Live refresh is active every ${payload.autoRefreshMinutes || 2} minutes. This run is using Google News plus direct publisher feeds because no NewsAPI key is configured.`;
  } else if ((payload.provider || "").includes("newsapi")) {
    providerNote.textContent =
      `Live refresh is active every ${payload.autoRefreshMinutes || 2} minutes. Discovery is widened with NewsAPI, Google News, and direct feeds before clustering.`;
  } else {
    providerNote.textContent =
      `Live refresh is active every ${payload.autoRefreshMinutes || 2} minutes. Stories are grouped from Google News expansion and direct publisher feeds.`;
  }

  if (state.activeClusterId) {
    renderModal(state.activeClusterId);
  }
}

async function loadHomepage() {
  const response = await fetch("/api/home");
  const payload = await response.json();
  renderHomepage(payload);
}

async function refreshHomepage() {
  refreshButton.disabled = true;
  refreshButton.textContent = "Refreshing...";

  try {
    const response = await fetch("/api/refresh", { method: "POST" });
    const payload = await response.json();
    renderHomepage(payload);
  } finally {
    refreshButton.disabled = false;
    refreshButton.textContent = "Refresh";
  }
}

function handleInterestToggle(target) {
  const interest = target.dataset.interest;
  if (!interest) return;

  if (state.prefs.interests.has(interest)) {
    state.prefs.interests.delete(interest);
  } else {
    state.prefs.interests.add(interest);
  }

  target.classList.toggle("is-active", state.prefs.interests.has(interest));
  const rankedEntries = flattenClusters(state.sections).sort((left, right) => right.score - left.score);
  renderPersonalized(rankedEntries);

  if (state.activeClusterId) {
    const entry = state.clustersById.get(state.activeClusterId);
    const intelligence = getStoryIntelligence(entry.cluster, entry.section);
    renderAskAnswer(answerStoryQuestion("why does this matter", intelligence));
  }
}

document.addEventListener("click", (event) => {
  if (event.target.closest("a:not([data-cluster-id])")) {
    return;
  }

  const panelTrigger = event.target.closest("[data-panel-target]");
  if (panelTrigger) {
    event.preventDefault();
    setActivePanel(panelTrigger.dataset.panelTarget, { scroll: true });
    return;
  }

  const tabButton = event.target.closest(".tab-pill");
  if (tabButton && workspaceTabs.contains(tabButton)) {
    setActivePanel(tabButton.dataset.panel);
    return;
  }

  const analysisButton = event.target.closest(".analysis-tab");
  if (analysisButton && analysisButton.dataset.analysisPanel) {
    setActiveAnalysisPanel(analysisButton.dataset.analysisPanel);
    return;
  }

  const clusterButton = event.target.closest("[data-cluster-id]");
  if (clusterButton) {
    renderModal(clusterButton.dataset.clusterId);
    return;
  }

  const interestButton = event.target.closest(".interest-chip");
  if (interestButton) {
    handleInterestToggle(interestButton);
  }
});

refreshButton.addEventListener("click", refreshHomepage);
coverageClose.addEventListener("click", closeModal);
coverageBackdrop.addEventListener("click", closeModal);
locationSelect.addEventListener("change", () => {
  state.prefs.location = locationSelect.value;
  const rankedEntries = flattenClusters(state.sections).sort((left, right) => right.score - left.score);
  renderPersonalized(rankedEntries);
});
roleSelect.addEventListener("change", () => {
  state.prefs.role = roleSelect.value;
  const rankedEntries = flattenClusters(state.sections).sort((left, right) => right.score - left.score);
  renderPersonalized(rankedEntries);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !coverageModal.hidden) {
    closeModal();
  }
});

askStoryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!state.activeClusterId) {
    renderAskAnswer("Open a story cluster first, then ask about what happened, what is disputed, or what to watch next.");
    return;
  }

  const question = cleanText(askStoryInput.value);
  if (!question) {
    renderAskAnswer("Ask about agreement, disputes, perspectives, or what to watch next.");
    return;
  }

  const entry = state.clustersById.get(state.activeClusterId);
  const intelligence = getStoryIntelligence(entry.cluster, entry.section);
  renderAskAnswer(answerStoryQuestion(question, intelligence));
});

leadCoverageButton.dataset.clusterId = "";
setActivePanel(state.activePanel);

loadHomepage();
setInterval(loadHomepage, homepagePollMs);
