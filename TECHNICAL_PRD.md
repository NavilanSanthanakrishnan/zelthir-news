# Zelthir Technical PRD

Date: April 4, 2026
Stage: Production implementation baseline
Owner: Team Zelthir

## 1. Product Summary

Zelthir is an AI news intelligence platform with one shared intelligence engine and two user-facing surfaces:

- `Pulse`: a standard news experience with the most important stories across categories like Politics, Tech, Business, and World.
- `Explore`: a personalized discovery experience showing stories, connections, and effects relevant to the user's location, interests, and role.

Both surfaces are powered by the same backend pipeline:

- multi-source article ingestion
- story clustering
- claim extraction
- evidence scoring
- Zelthir brief generation
- framing analysis
- connection mapping
- ripple-effect prediction
- personalization ranking

The core promise is:

Zelthir turns fragmented news coverage into a best-supported account of events, shows what claims are agreed or disputed, connects stories to related actors and prior events, and forecasts what may happen next.

## 2. Are We Using MiroFish?

Short answer: `No, not as a product dependency. Yes, as a product inspiration.`

We should borrow the strongest ideas from MiroFish:

- graph-native world modeling
- entity and relationship extraction
- prediction as structured scenarios, not magic certainty
- readable reports with confidence signals

We should not build or depend on a literal MiroFish-style swarm simulation for the initial production baseline because:

- it adds major engineering and prompt complexity
- it is hard to explain and validate in one day
- judges will care more about clear value and working output than agent count

Implementation decision:

- use a `story graph + analog-based forecast` instead of a giant multi-agent social simulation
- present prediction as `Likely Ripple Effects` and `What To Watch`

Reference: [MiroFish official site](https://mirofish.my/)

## 3. Problem Statement

Current AI news products have three major weaknesses:

1. They summarize quickly but often blur sourced fact, interpretation, and guesswork.
2. They compare outlets at a high level but do not reconcile claim-by-claim agreement and dispute.
3. They stop at "what happened" instead of helping users understand relevance, system effects, and likely next developments.

Zelthir solves this by:

- extracting claims instead of only summarizing prose
- building a support/conflict ledger across sources
- generating a `Best-Supported Account` from supported claims only
- isolating disputed claims rather than hiding uncertainty
- connecting the event to related actors, earlier events, and likely consequences
- personalizing why the story matters to a specific user

## 4. Goals

### Primary Goals

- Deliver a clean, trustworthy news experience in under 10 seconds of user attention.
- Show one major story transformed from many articles into one structured event.
- Make uncertainty visible instead of pretending certainty.
- Give users a reason to return via personalized relevance.
- Demonstrate real agentic workflow and real backend state in the shipped product.

### Secondary Goals

- Support voice or narrated briefing if time remains.
- Support saved topics or followed entities if time remains.

## 5. Non-Goals For Initial Release

- Full social product
- Live comments or community moderation
- Perfect political bias scoring
- Fully automated long-range forecasting
- Full-blown MiroFish-style agent swarm simulation
- Original reporting or investigative journalism
- Hundreds of sources with custom scrapers

## 6. User Personas

### Persona A: General News Consumer

Needs:

- a fast overview of the most important stories
- a simpler path through noisy coverage

Uses:

- `Pulse`

### Persona B: Context-Hungry Power User

Needs:

- source comparison
- agreement vs dispute
- deeper understanding of what matters next

Uses:

- `Story Intelligence`

### Persona C: Personalized Relevance User

Example:

- based in San Francisco
- interested in Tech, AI, Startups, and Policy

Needs:

- stories relevant to their world
- explanation of downstream impact

Uses:

- `Explore`

## 7. Product Surfaces

## 7.1 Pulse

Purpose:

- broad news home page
- top stories across major categories

Core UI blocks:

- category tabs
- top story cards
- confidence indicator
- source count
- why it matters globally

## 7.2 Explore

Purpose:

- personalized discovery surface
- relevant stories based on profile and context

Core UI blocks:

- interest chips
- location-aware story cards
- "why this is relevant to you"
- connected stories
- expected ripple effects

## 7.3 Story Intelligence

Purpose:

- deep dive into one event

Core UI blocks:

- `Best-Supported Account`
- `Agreed Facts`
- `Disputed Claims`
- `Framing Differences`
- `Connection Map`
- `Historical Analogs`
- `Likely Ripple Effects`
- `What To Watch`
- source evidence panel
- `Ask This Story`

## 8. Core User Flows

### Flow A: Pulse

1. User lands on `Pulse`.
2. User sees major stories across categories.
3. User taps a story.
4. User sees `Story Intelligence`.

### Flow B: Explore

1. User selects location and interests.
2. User lands on `Explore`.
3. User sees personalized relevant stories.
4. User taps one story.
5. User sees why it matters to them, what it connects to, and likely effects.

### Flow C: Ask This Story

1. User opens story page.
2. User asks a story question.
3. System answers using the story cluster and claim ledger only.
4. System cites supporting sources.

## 9. System Boundaries

### In Scope

- ingest external article metadata and text from curated sources
- cluster related coverage into one story object
- extract claims, entities, topics, and framing labels
- compute evidence support and contradiction
- generate Zelthir summaries and forecast blocks
- rank stories for Pulse and Explore
- persist outputs for quick UI rendering

### Out Of Scope

- direct publisher integrations
- user-generated content
- human newsroom workflow
- ad stack
- subscription billing
- enterprise analytics

### Trust Boundaries

- external news source data is untrusted input
- model output is untrusted until validated against source evidence rules
- user profile data is sensitive and should be minimally stored

## 10. Architecture Summary

Frontend:

- `Next.js`
- `React`
- `Tailwind CSS`

Backend:

- `InsForge DB` for relational storage
- `InsForge Edge Functions` for orchestration
- `InsForge AI Gateway` for LLM calls

Optional:

- `OpenAI` model via AI Gateway for extraction and synthesis
- `pgvector` or embedding support for clustering

Data ingestion:

- RSS feeds
- a small curated source list
- optional simple news API if available

### Architecture Diagram

```text
                        +----------------------+
                        |     External News    |
                        | RSS / feeds / APIs   |
                        +----------+-----------+
                                   |
                                   v
                    +--------------+---------------+
                    |       Ingest Edge Function   |
                    | normalize + dedupe + store   |
                    +--------------+---------------+
                                   |
                                   v
                    +--------------+---------------+
                    |      Cluster / Entity Layer  |
                    | embeddings + entity overlap  |
                    +--------------+---------------+
                                   |
                                   v
        +----------------+---------+---------+----------------+
        |                |                   |                |
        v                v                   v                v
 +------+-----+   +------+-----+      +------+-----+   +------+------+
 | Claim Agent |   | Framing    |      | Forecast   |   | Personalize |
 | extract JSON|   | analysis   |      | effects    |   | rank        |
 +------+-----+   +------+-----+      +------+-----+   +------+------+
        |                |                   |                |
        +----------------+---------+---------+----------------+
                                   |
                                   v
                    +--------------+---------------+
                    |   Brief / Evidence Builder   |
                    | summary + support ledger     |
                    +--------------+---------------+
                                   |
                                   v
                    +--------------+---------------+
                    |          InsForge DB         |
                    +--------------+---------------+
                                   |
                                   v
               +-------------------+-------------------+
               |                                       |
               v                                       v
       +-------+--------+                     +--------+-------+
       | Pulse Frontend |                     | Explore Frontend|
       +----------------+                     +-----------------+
                                   |
                                   v
                           +-------+--------+
                           | Story Detail   |
                           | Ask This Story |
                           +----------------+
```

## 11. Data Flow

### Pipeline Sequence

```text
Fetch articles
  -> Normalize article metadata
  -> Deduplicate near-identical items
  -> Cluster into story events
  -> Extract entities and claims
  -> Compare claims across sources
  -> Build support/conflict ledger
  -> Generate Best-Supported Account
  -> Generate disputed claims
  -> Generate framing and narrative labels
  -> Generate ripple effects and watch signals
  -> Rank for Pulse and Explore
  -> Store outputs for UI
```

### Story State Transitions

```text
RAW
 -> INGESTED
 -> CLUSTERED
 -> CLAIMS_EXTRACTED
 -> SCORED
 -> BRIEF_READY
 -> FORECAST_READY
 -> PUBLISHED_TO_UI

Failure states:
 - INGEST_FAILED
 - EXTRACTION_FAILED
 - LOW_CONFIDENCE
 - PARTIAL_OUTPUT
```

## 12. Agent Workflow

We should frame these as specialized agents, but implement them as deterministic steps plus model calls.

### 12.1 Ingest Agent

Input:

- RSS/API article records

Output:

- normalized articles

Responsibilities:

- fetch source content
- clean title/body
- capture source, timestamp, category, URL
- dedupe obvious duplicates

### 12.2 Cluster Agent

Input:

- normalized articles

Output:

- story clusters

Responsibilities:

- group related coverage into one event
- use embeddings plus named entity overlap and recency windows

### 12.3 Claim Agent

Input:

- article text

Output:

- structured claim JSON

Responsibilities:

- extract atomic claims
- extract entities, locations, dates, numbers, quotes

Sample schema:

```json
{
  "claims": [
    {
      "text": "Company X laid off 300 employees",
      "type": "employment",
      "actors": ["Company X"],
      "location": "San Francisco",
      "time_ref": "2026-04-04",
      "confidence": 0.82
    }
  ]
}
```

### 12.4 Evidence Agent

Input:

- claims by article

Output:

- claim support/conflict ledger

Responsibilities:

- merge semantically similar claims
- count supporting sources
- identify conflicting statements
- score confidence using source diversity and clarity

### 12.5 Brief Agent

Input:

- high-confidence supported claims

Output:

- best-supported account

Responsibilities:

- write concise Zelthir story brief
- include only well-supported claims
- exclude unresolved claims from main body

### 12.6 Framing Agent

Input:

- article set in cluster

Output:

- framing labels per article and cluster summary

Responsibilities:

- label narrative style
- detect blame focus, uncertainty, threat, institutional trust, sympathy

### 12.7 Forecast Agent

Input:

- cluster claims
- entities
- historical analog signals

Output:

- likely ripple effects
- what to watch

Responsibilities:

- infer near-term consequences
- provide alternate scenario
- provide confidence and watch signals

### 12.8 Personalization Agent

Input:

- story outputs
- user profile

Output:

- ranked Explore feed

Responsibilities:

- rank based on location, interests, followed entities, and role
- generate "why this matters to you"

## 13. Prediction Model Design

Prediction should be narrow and defensible.

We are not predicting exact future headlines.

We are predicting:

- likely immediate effects
- who may be affected
- what adjacent systems may move next
- which signals would confirm or weaken the current forecast

### Forecast Structure

- `Most likely next step`
- `Alternative scenario`
- `Affected stakeholders`
- `Confidence`
- `What to watch`

### Example

If the story is a new AI regulation proposal:

- most likely next step: market and founder discussion accelerates within 24h
- alternative scenario: proposal stalls due to legal or political pushback
- affected stakeholders: startups, cloud vendors, enterprise buyers
- what to watch: regulator statement, company responses, implementation language

## 14. Personalization Design

### Profile Inputs

- location
- interests
- professional role
- followed companies, people, or topics

### Pulse Ranking Inputs

- story size
- cross-source volume
- recency
- source diversity
- category weight

### Explore Ranking Inputs

- topic overlap with user interests
- local relevance
- industry relevance
- follow graph match
- predicted impact on user profile

### Explore Card Design

Each card should include:

- headline
- 2-line Zelthir brief
- why this is relevant to you
- likely effect
- confidence
- connected stories

## 15. Data Model

### Tables

`sources`
- id
- name
- url
- leaning_label nullable
- factuality_label nullable

`articles`
- id
- source_id
- title
- body
- url
- published_at
- category
- fetched_at
- dedupe_hash

`story_clusters`
- id
- title
- category
- canonical_event_time
- cluster_score
- status

`story_articles`
- story_cluster_id
- article_id

`entities`
- id
- name
- type

`story_entities`
- story_cluster_id
- entity_id
- role

`claims`
- id
- story_cluster_id
- normalized_text
- claim_type
- status
- support_score
- dispute_score

`claim_evidence`
- id
- claim_id
- article_id
- stance
- evidence_snippet

`story_briefs`
- story_cluster_id
- best_supported_account
- agreed_facts_json
- disputed_claims_json
- framing_json
- forecast_json
- watch_signals_json
- generated_at

`user_profiles`
- id
- location
- role

`user_interests`
- id
- user_id
- interest

`explore_rankings`
- user_id
- story_cluster_id
- relevance_score
- reason_text

## 16. API / Function Contracts

### `POST /ingest/run`
- fetch latest stories

### `POST /cluster/run`
- cluster fresh articles into story events

### `POST /extract/run`
- extract claims and entities for new clusters

### `POST /score/run`
- score claim support and conflict

### `POST /brief/run`
- generate story brief, disputes, framing, and forecast

### `GET /pulse`
- return ranked top stories by category

### `GET /explore?user_id=...`
- return personalized relevant stories

### `GET /story/:id`
- return full story intelligence object

### `POST /story/:id/ask`
- Zelthir Q&A over story cluster

## 17. Prompting Rules

All model outputs must be structured and constrained.

### Claim Extraction Prompt Rules

- return JSON only
- no invented claims
- separate claims from interpretation
- include uncertainty when article language is unclear

### Brief Generation Prompt Rules

- use only supported claims above threshold
- do not merge disputed claims into the main brief
- mention uncertainty explicitly where relevant
- output concise news-style prose

### Forecast Prompt Rules

- do not predict exact outcomes as certainty
- provide scenario + confidence + watch signals
- anchor to current event facts and historical analog hints

## 18. Failure Modes And Degraded States

### Failure Modes

1. Bad clustering merges two different stories.
2. Claim extraction overgeneralizes or drops nuance.
3. Forecast sounds too speculative.
4. A model hallucinates a connection not present in sources.
5. Too few diverse sources create false confidence.
6. Source fetch fails or returns partial content.
7. Personalization feels random or shallow.

### Mitigations

- require minimum source diversity before high-confidence brief
- show `Low Confidence` state when evidence is weak
- separate `Agreed Facts` from `Disputed Claims`
- keep forecast short and confidence-scored
- cache previous valid output if generation fails
- expose source count and evidence origin

### Degraded UI States

- brief available, forecast unavailable
- forecast available with low confidence warning
- story visible with partial source set
- explore card visible without personalized rationale fallback

## 19. Observability

### Logs

- ingestion success/failure by source
- cluster size distribution
- extraction failure rate
- confidence score distribution
- prompt latency and token cost
- per-story generation trace IDs

### Metrics

- articles fetched per run
- duplicate ratio
- stories generated
- percentage of stories with disputed claims
- percentage of low-confidence stories
- average time from ingest to published story
- ask-this-story answer latency

### Alerts

- ingestion pipeline failure
- generation failure spike
- zero stories published in run
- unusually high low-confidence rate

## 20. Security And Compliance

- do not store secrets in code or logs
- keep source URLs and citations intact
- store minimal user profile data
- sanitize HTML and scraped content
- treat all model output as untrusted until validated by business rules
- avoid republishing large copyrighted article bodies
- store extracted claims and generated summaries, not full scraped archives where avoidable

## 21. Test Matrix

| Area | Scenario | Expected Result |
|------|----------|-----------------|
| Ingestion | valid RSS source | articles stored successfully |
| Ingestion | source timeout | pipeline retries or marks source failed |
| Clustering | two similar articles same event | one cluster created |
| Clustering | two unrelated stories same entities | separate clusters |
| Claims | article with explicit facts | structured claims extracted |
| Claims | article with opinion-heavy language | opinion not promoted to fact |
| Evidence | multiple sources support same claim | support score rises |
| Evidence | one source contradicts claim | disputed state visible |
| Brief | strong evidence set | Zelthir brief generated |
| Brief | weak evidence set | low-confidence or partial brief |
| Forecast | clear stakeholder impact story | ripple effects generated |
| Forecast | speculative event with weak data | forecast downgraded |
| Pulse | major story across many sources | story ranks highly |
| Explore | user in SF interested in Tech | tech and local-impact stories rank higher |
| Story Q&A | user asks story question | answer cites only story evidence |
| UI | story has partial outputs | page still renders gracefully |

## 22. Review Readiness Dashboard

- Product framing: `Ready`
- Initial release scope: `Ready`
- Technical architecture: `Ready`
- Data model: `Ready`
- Prompt strategy: `Ready`
- Failure/degraded states: `Ready`
- Test plan: `Ready`
- Implementation backlog: `Needs execution`
- Visual design system: `Needs execution`
- Demo dataset prep: `Needs execution`

## 23. Implementation Phases

### Phase 1: Foundation

- scaffold Next.js app
- create Pulse, Explore, Story pages
- define DB tables
- set up edge functions

### Phase 2: Intelligence Core

- ingest curated sources
- implement clustering
- implement claim extraction
- implement evidence scoring
- generate Zelthir brief

### Phase 3: Differentiation

- add framing differences
- add ripple effects
- add explore ranking
- add "why this matters to you"

### Phase 4: Demo Polish

- polish one story page heavily
- polish Explore cards
- record demo with one strong story walkthrough

## 24. Open Questions

1. What exact source set do we want for the demo: broad mainstream, local, independent, or mixed ideological?
2. Are we using live feeds during judging or a curated cached set from earlier in the day?
3. Do we want login, or should Explore start from a lightweight onboarding form?
4. Do we want to include voice narration with ElevenLabs if time allows?
5. Should the first demo persona be `SF founder`, since that is probably the strongest story for this room?

## 25. Final Product Positioning

Zelthir is a personalized AI news intelligence platform with two modes:

- `Pulse` for what matters broadly
- `Explore` for what matters to you

It does not just summarize the news. It turns conflicting coverage into a best-supported account, shows disputed claims and framing differences, maps connections to related events, and forecasts what to watch next.
