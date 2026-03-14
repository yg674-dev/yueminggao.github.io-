# Research: Intelligent Persona Chat Agent

**Branch**: `001-persona-ai-agent` | **Date**: 2026-03-12

## Clarification Engine

**Decision**: Use system prompt injection to enforce a clarification gate before
every substantive answer. Claude parses the user's query and decides whether
to ask clarifying questions or proceed directly.

**Rationale**: Claude natively handles ambiguity detection — no separate
classifier or ML model needed. System prompt injection is already the pattern
used for persona configuration.

**Implementation pattern**:
```
CLARIFICATION GATE (prepend to every persona system prompt):
Before answering any complex or ambiguous query, you MUST first assess whether
the user's intent is fully clear. If not, ask 1–3 short, direct clarifying
questions. Output them as a JSON block:
{"clarify": true, "questions": ["Q1", "Q2"]}
Only after receiving answers (or if intent is crystal clear), proceed with:
{"clarify": false}
```

**Alternatives considered**:
- Separate intent-classification API call → adds latency, cost; rejected
- Hardcoded question templates per persona → too rigid; rejected

---

## Workflow Recommendation Engine

**Decision**: Tag-based matching. Each Claude Code skill and MCP server gets
a set of semantic tags. User's confirmed intent is also tagged. Top matches
by tag overlap score surface as recommendations.

**Rationale**: Simple, fast, explainable to users. Avoids over-engineering
with embeddings/vector search for the initial version.

**Skill registry**: Read from `.claude/commands/*.md` (frontmatter `description`
field) at app load time. Parse description into tags using keyword extraction.

**MCP server tags**: Provided by the MCP discovery service or manually tagged
in the server registry.

**Scoring formula**: `score = (matching_tags / total_tags) * persona_boost`
where `persona_boost` is 1.2x if the server/skill aligns with active persona category.

**Alternatives considered**:
- Embeddings/semantic similarity → more accurate but requires vector DB or API call per query; over-engineered for v1
- LLM-based routing → adds latency; reserved for v2

---

## MCP Discovery

**Decision**: Backend proxy using Playwright to scrape mcp.so, glama.ai,
and GitHub (topic:mcp-server). Results cached in-memory (per session, 30 min TTL).

**Sources**:
- `https://mcp.so` — largest public MCP registry
- `https://glama.ai/mcp/servers` — curated list with descriptions
- GitHub API: `https://api.github.com/search/repositories?q=topic:mcp-server`
  (no auth needed for public search, 60 req/hr limit)

**Rationale**: Three sources provide broad coverage. GitHub API requires no
scraping (JSON API). mcp.so and glama.ai need Playwright due to JS rendering.

**Cache strategy**: Map of `topic_hash → [servers]` stored in Node.js process
memory. Cleared on server restart. 30-minute TTL per entry.

**Alternatives considered**:
- Client-side fetch → blocked by CORS on mcp.so and glama.ai; rejected
- Redis cache → overkill for session-scoped data; rejected
- Single source only → insufficient coverage; rejected

---

## Frontend Architecture

**Decision**: Extend existing vanilla JS app. No React migration.

**Rationale**: The existing app is working and deployed. Introducing a build
pipeline (webpack/vite) adds complexity without proportional benefit for
adding modules to an already-structured codebase. New modules added as
ES modules loaded via `<script type="module">`.

**New JS modules**:
- `js/clarification/engine.js` — clarification gate logic
- `js/workflow/recommender.js` — skill + MCP tag matching
- `js/mcp/discovery-client.js` — calls backend proxy, manages cache
- `js/mcp/runtime-connector.js` — connects/disconnects MCP servers at runtime
- `js/personas/registry.js` — extended persona definitions with workflowTags

---

## Backend Deployment

**Decision**: Vercel serverless functions (free tier).

**Rationale**: Zero-config deployment, free for personal use, integrates
with GitHub for auto-deploy. Serverless fits the bursty, low-volume nature
of MCP discovery requests.

**Alternative**: Render.com free tier → cold starts are slower (30s+); rejected.
Railway → requires credit card for free tier; rejected.

---

## API Key Security

**Decision**: Keys stored in `sessionStorage` only (cleared on tab close).
Optional: encrypt with a user-chosen passphrase using Web Crypto API before
storing.

**Rationale**: Never sent to our backend (calls go client-side directly to
Anthropic/OpenAI). Never persisted to localStorage (reduces exposure window).

**Alternatives considered**:
- Server-side key storage → requires user accounts + auth system; out of scope
- Plain localStorage → keys persist indefinitely; security risk; rejected
