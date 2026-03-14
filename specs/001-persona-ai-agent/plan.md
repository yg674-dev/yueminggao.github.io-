# Implementation Plan: Intelligent Persona Chat Agent

**Branch**: `001-persona-ai-agent` | **Date**: 2026-03-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-persona-ai-agent/spec.md`

## Summary

Build an intelligent web-based chat agent that expands the existing 32-persona
library, enforces intent-driven clarification before answering, auto-recommends
the best Claude Code skill + MCP server workflow per query, and dynamically
discovers new MCP servers via web search when no match exists. The system
extends the current HTML/CSS/JS app with a lightweight backend proxy to enable
server-side MCP discovery.

## Technical Context

**Language/Version**: JavaScript (ES2022+), HTML5, CSS3; Node.js 20 LTS (backend proxy)
**Primary Dependencies**: Anthropic SDK, OpenAI SDK, Puppeteer or Playwright (MCP discovery scraping), Express.js (lightweight proxy server)
**Storage**: localStorage (session state, API keys encrypted); in-memory cache (MCP discovery results per session)
**Testing**: Jest (unit), Playwright (e2e)
**Target Platform**: Web browser (modern); Node.js backend proxy for MCP discovery
**Project Type**: Web application (frontend + minimal backend proxy)
**Performance Goals**: Workflow recommendations within 3 seconds; MCP discovery within 10 seconds
**Constraints**: API keys never in plaintext; GitHub Pages for frontend; backend proxy deployable to Vercel/Render/Railway
**Scale/Scope**: Personal/small-team usage; 32+ personas; session-scoped state

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Persona-First | All new features work within the persona context; no generic fallback | ✅ Pass |
| II. Intent-Driven Clarification | Clarification layer enforced before any substantive answer | ✅ Pass |
| III. Workflow Intelligence | Recommendation engine designed as a first-class feature | ✅ Pass |
| IV. MCP Discovery | Dynamic discovery via web search is a core requirement | ✅ Pass |
| V. Multi-Provider | Both Claude and OpenAI providers supported | ✅ Pass |
| VI. Web-First UI | Responsive, dark/light mode, mobile-friendly | ✅ Pass |

No violations. All gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/001-persona-ai-agent/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── clarification-api.md
│   ├── workflow-recommendation-api.md
│   └── mcp-discovery-api.md
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── personas/          # Expanded persona definitions (32+)
│   ├── clarification/     # Intent-driven clarification engine
│   ├── workflow/          # Workflow recommendation engine
│   ├── mcp/               # MCP client + discovery cache
│   └── chat.js            # Main chat orchestrator
└── assets/

backend/                   # Lightweight Node.js proxy
├── server.js              # Express server entry point
├── routes/
│   ├── mcp-discovery.js   # Web scraping + MCP marketplace search
│   └── proxy.js           # API key proxy (optional)
└── package.json
```

## Complexity Tracking

| Decision | Why Needed | Simpler Alternative Rejected Because |
|----------|------------|--------------------------------------|
| Backend proxy | MCP discovery requires server-side scraping — browsers block cross-origin requests | Client-side fetch blocked by CORS on external MCP registries |
| In-memory cache | Prevent redundant scraping per session (SC-003 + FR-007) | No persistent DB needed; session scope is sufficient |

---

## Phase 0: Research

*See [research.md](./research.md) for full findings.*

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend stack | Vanilla JS (extend existing) | Avoids introducing React build pipeline into existing app; faster to ship |
| Backend framework | Express.js + Node.js 20 | Minimal; well-known; easy deploy to Vercel/Render |
| MCP discovery scraping | Playwright (headless) | Handles JS-rendered MCP marketplace pages; more reliable than fetch |
| MCP marketplace source | mcp.so + GitHub search + glama.ai | Three sources cover the majority of publicly listed MCP servers |
| Clarification engine | System prompt injection + response parsing | No separate ML model needed; Claude handles intent detection natively |
| Workflow matching | Keyword + semantic tag matching against skill/MCP metadata | Simple, fast, explainable; avoids over-engineering |
| API key storage | sessionStorage (encrypted with user passphrase) | Never persisted to server; user controls their keys |
| Deployment | Frontend → GitHub Pages; Backend → Vercel (free tier) | Existing deployment pattern preserved for frontend |

---

## Phase 1: Design & Contracts

*See [data-model.md](./data-model.md) and [contracts/](./contracts/) for full details.*

### Core Components

#### 1. Clarification Engine

- Injected into every persona's system prompt as a pre-answer gate
- Detects query ambiguity using Claude's own reasoning
- Returns structured JSON: `{ questions: string[], skip: boolean }`
- Skips clarification if query is fully self-contained (skip: true)

#### 2. Workflow Recommendation Engine

- Maintains a local registry of available Claude Code skills (from `.claude/commands/`)
- Queries backend for relevant MCP servers (connected + discovered)
- Scores each skill/server against confirmed user intent using tag matching
- Returns top 1–3 ranked recommendations with rationale strings

#### 3. MCP Discovery Service (Backend)

- Accepts a `topic` query from frontend
- Searches mcp.so, glama.ai, and GitHub (topic:mcp-server)
- Returns list of: `{ name, description, source_url, install_command, relevance_score }`
- Results cached in-memory per session for 30 minutes

#### 4. Persona Registry

- Extends existing 32 personas with structured schema
- Each persona: `{ id, name, category, icon, tagline, systemPrompt, starterQuestions, workflowTags }`
- `workflowTags` is new — used by recommendation engine to pre-filter relevant skills

### Agent Context Update

Run after Phase 1 completion:

```bash
.specify/scripts/bash/update-agent-context.sh claude
```
