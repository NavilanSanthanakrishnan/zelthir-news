const now = new Date().toISOString();

export const SAMPLE_TOP_STORIES = {
  ok: true,
  provider: "sample",
  generatedAt: now,
  scope: {
    edition: "USA",
    category: "Top Stories",
    description: "Seed data used while live discovery is still warming up.",
  },
  clusters: [
    {
      id: "sample-ai-regulation",
      title: "AI regulation debate accelerates across Washington",
      category: "Politics",
      headline:
        "Lawmakers, companies, and watchdog groups are converging on a fresh debate over how aggressively AI should be regulated in the U.S.",
      whyItMatters:
        "This kind of story affects startup compliance, infrastructure costs, and what founders should expect from federal guidance in the next few months.",
      publishedAt: now,
      sourceCount: 4,
      articleCount: 4,
      confidence: "medium",
      rankScore: 87,
      keywords: ["AI", "regulation", "Washington", "policy"],
      commonFacts: [
        "Multiple outlets report new pressure on lawmakers to define AI safety and disclosure rules.",
        "Companies and public-interest groups are both trying to shape the policy response.",
      ],
      disputedPoints: [
        "Coverage differs on how quickly any rulemaking could actually be enforced.",
      ],
      articles: [
        {
          source: "Politico",
          title: "Congress weighs next AI policy push",
          url: "https://www.politico.com/",
          publishedAt: now,
          notes: "Focuses on federal legislative momentum.",
        },
        {
          source: "Axios",
          title: "AI policy pressure rises in D.C.",
          url: "https://www.axios.com/",
          publishedAt: now,
          notes: "Emphasizes startup and enterprise implications.",
        },
        {
          source: "NPR",
          title: "Why AI oversight is back at the center of Washington",
          url: "https://www.npr.org/",
          publishedAt: now,
          notes: "Highlights public trust and safety concerns.",
        },
        {
          source: "The Hill",
          title: "New scrutiny lands on AI companies and lawmakers",
          url: "https://thehill.com/",
          publishedAt: now,
          notes: "Frames the issue through the political response.",
        }
      ]
    },
    {
      id: "sample-market-tech",
      title: "Big Tech spending and infrastructure bets stay in focus",
      category: "Business",
      headline:
        "Fresh reporting across business desks points to continued market attention on AI infrastructure spend, data centers, and hiring strategy.",
      whyItMatters:
        "For founders and engineers, these stories hint at where capital is moving and which parts of the stack may get more expensive or competitive.",
      publishedAt: now,
      sourceCount: 3,
      articleCount: 3,
      confidence: "medium",
      rankScore: 74,
      keywords: ["Big Tech", "AI infrastructure", "markets"],
      commonFacts: [
        "Large companies are still treating compute and AI infrastructure as strategic priorities.",
        "Investors are reading infra spend as a signal for future competitive positioning.",
      ],
      disputedPoints: [
        "Some coverage frames the spending as strategic expansion, while other pieces frame it as margin pressure.",
      ],
      articles: [
        {
          source: "CBS News",
          title: "Markets keep watching AI infrastructure spending",
          url: "https://www.cbsnews.com/",
          publishedAt: now
        },
        {
          source: "NBC News",
          title: "Big Tech doubles down on AI buildout",
          url: "https://www.nbcnews.com/",
          publishedAt: now
        },
        {
          source: "ABC News",
          title: "Why AI spending is still moving markets",
          url: "https://abcnews.go.com/",
          publishedAt: now
        }
      ]
    }
  ],
};
