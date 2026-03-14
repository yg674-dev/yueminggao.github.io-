# Tasks: Intelligent Persona Chat Agent

**Input**: Design documents from `/specs/001-persona-ai-agent/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for both frontend and backend.

- [x] T001 Create frontend directory structure: `frontend/js/clarification/`, `frontend/js/workflow/`, `frontend/js/mcp/`, `frontend/js/personas/`
- [ ] T002 Create backend directory structure: `backend/routes/`, `backend/` with `server.js` and `package.json`
- [ ] T003 [P] Initialize backend Node.js project in `backend/package.json` with Express, Playwright, cors dependencies
- [ ] T004 [P] Add `backend/` to `.gitignore` secrets exclusions; create `backend/.env.example` with `FRONTEND_ORIGIN` placeholder
- [x] T005 [P] Create `frontend/js/personas/registry.js` scaffold with extended Persona schema (id, name, category, icon, tagline, systemPrompt, starterQuestions, workflowTags)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure required by all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T006 Migrate existing 32 personas from current app into `frontend/js/personas/registry.js` with `workflowTags` field added to each entry
- [x] T007 [P] Create `frontend/js/chat.js` orchestrator scaffold that wires together clarification, workflow, and MCP modules (empty stubs, no logic yet)
- [ ] T008 [P] Create `backend/server.js` Express app with CORS configured for `FRONTEND_ORIGIN`, health check route `GET /api/health`, and error handler middleware
- [ ] T009 [P] Create `frontend/js/mcp/discovery-client.js` with `DISCOVERY_API` URL constant (dev vs prod) and fetch wrapper stub
- [ ] T010 Create `frontend/js/utils/session-storage.js` for secure sessionStorage helpers (get, set, clear API keys — never to localStorage)

**Checkpoint**: Foundation ready — user story phases can now begin.

---

## Phase 3: User Story 1 — Persona Selection + Clarification Loop (Priority: P1) 🎯 MVP

**Goal**: User selects a persona, sends a query, receives 1–3 clarifying questions, answers them, and gets a substantive response.

**Independent Test**: Select "Data Scientist" persona → type "help me with my model" → verify agent returns clarifying questions before any answer.

### Implementation

- [x] T011 [P] [US1] Implement clarification gate system prompt prefix in `frontend/js/clarification/engine.js` — produces structured JSON `{clarify, questions}` via Claude API call
- [x] T012 [P] [US1] Implement `resolveIntent(questions, answers, personaId)` in `frontend/js/clarification/engine.js` — returns `{confirmedIntent: string}`
- [x] T013 [US1] Integrate clarification engine into `frontend/js/chat.js` orchestrator — gate fires on every new query, blocks answer until `clarify: false` or intent resolved
- [x] T014 [P] [US1] Add clarification UI to `frontend/index.html` and `frontend/css/styles.css` — inline question cards rendered below user message, answer input fields, "Submit Answers" button
- [x] T015 [US1] Wire clarification UI to engine in `frontend/js/chat.js` — render questions, collect answers, call `resolveIntent`, proceed to answer
- [x] T016 [US1] Handle edge case: query is fully self-contained (`clarify: false`) — skip UI and go straight to answer in `frontend/js/chat.js`
- [x] T017 [US1] Handle mid-conversation refinement — detect ambiguity signals in follow-up messages and re-trigger clarification gate in `frontend/js/chat.js`

**Checkpoint**: US1 fully functional. Persona + clarification loop works end-to-end.

---

## Phase 4: User Story 2 — Workflow Auto-Recommendation (Priority: P2)

**Goal**: After clarification, agent recommends relevant Claude Code skills and MCP servers with rationale. User can accept, modify, or override.

**Independent Test**: Confirm intent "code review for performance" via Software Engineer persona → verify 1–3 ranked recommendations appear with rationale before the answer.

### Implementation

- [x] T018 [P] [US2] Create `frontend/js/workflow/skill-registry.js` — reads available Claude Code skills from `.claude/commands/*.md` frontmatter descriptions; parses each into `{id, name, description, tags[]}`
- [x] T019 [P] [US2] Implement tag-based scoring in `frontend/js/workflow/recommender.js` — `getRecommendations(confirmedIntent, personaId, connectedMcpServers)` returns top 3 ranked `WorkflowRecommendation[]`
- [x] T020 [US2] Implement `acceptRecommendation(id)` and `overrideRecommendation(id, selectedId)` in `frontend/js/workflow/recommender.js`
- [x] T021 [US2] Integrate recommendation engine into `frontend/js/chat.js` — fires after `resolveIntent`, before generating answer
- [x] T022 [P] [US2] Add recommendation UI to `frontend/index.html` and `frontend/css/styles.css` — recommendation cards showing name, rationale, score badge; "Use This" (accept) and "Choose Different" (override) buttons
- [x] T023 [US2] Wire recommendation UI to recommender in `frontend/js/chat.js` — render cards, handle accept/override, inject selected workflow into answer generation prompt

**Checkpoint**: US2 fully functional. Workflow recommendations appear and are actionable after clarification.

---

## Phase 5: User Story 3 — Dynamic MCP Discovery (Priority: P3)

**Goal**: When no connected MCP server matches, backend searches mcp.so, glama.ai, and GitHub for candidates. User can preview and connect with one click.

**Independent Test**: Ask domain-specific query with no connected MCP server → verify 1–3 discovered servers appear within 10 seconds with name, description, and Connect button.

### Implementation

- [ ] T024 [P] [US3] Implement `backend/routes/mcp-discovery.js` — `GET /api/mcp/discover?topic=` handler; searches GitHub API (no auth needed), mcp.so, glama.ai via Playwright; returns `McpServer[]` sorted by relevance score
- [ ] T025 [P] [US3] Add in-memory cache to `backend/routes/mcp-discovery.js` — Map of `topicHash → {results, expiresAt}` with 30-min TTL; cache hit returns immediately
- [ ] T026 [US3] Register discovery route in `backend/server.js` — `app.use('/api/mcp', require('./routes/mcp-discovery'))`
- [ ] T027 [P] [US3] Implement `discoverServers(topic)` in `frontend/js/mcp/discovery-client.js` — calls `GET /api/mcp/discover?topic=`, returns `McpServer[]`
- [ ] T028 [P] [US3] Implement `connectServer(server)` and `disconnectServer(serverId)` in `frontend/js/mcp/runtime-connector.js` — manages session-scoped connected server list
- [ ] T029 [US3] Integrate discovery into `frontend/js/chat.js` — triggers discovery when recommendation engine finds no connected MCP match
- [ ] T030 [P] [US3] Add MCP discovery UI to `frontend/index.html` and `frontend/css/styles.css` — discovery result cards with name, description, source badge, "Connect" button; loading spinner during search
- [ ] T031 [US3] Wire discovery UI to client in `frontend/js/chat.js` — render discovered servers, handle Connect click (calls `connectServer`, updates sidebar, re-runs recommendation)
- [ ] T032 [US3] Handle graceful degradation in `frontend/js/chat.js` — if discovery returns empty or errors, show friendly message and proceed without MCP tool

**Checkpoint**: US3 fully functional. MCP discovery finds and connects servers dynamically.

---

## Phase 6: User Story 4 — Multi-Provider Model Selection (Priority: P4)

**Goal**: Users can switch between Claude and OpenAI models mid-session without losing conversation history.

**Independent Test**: Switch from Claude Sonnet to GPT-4o mid-conversation → verify next message uses GPT-4o and prior messages are preserved.

### Implementation

- [ ] T033 [P] [US4] Create `frontend/js/providers/provider-manager.js` — manages active provider (`claude | openai`), model ID, and API key (via `session-storage.js`); exposes `setProvider(provider, model)` and `getActiveClient()`
- [ ] T034 [P] [US4] Create `frontend/js/providers/claude-client.js` — wraps Anthropic SDK calls; reads API key from sessionStorage
- [ ] T035 [P] [US4] Create `frontend/js/providers/openai-client.js` — wraps OpenAI SDK calls; reads API key from sessionStorage
- [ ] T036 [US4] Integrate provider manager into `frontend/js/chat.js` — replace any hardcoded Claude calls with `provider-manager.getActiveClient()`
- [ ] T037 [P] [US4] Update model selector UI in `frontend/index.html` and `frontend/css/styles.css` — dropdown showing Claude (Opus/Sonnet/Haiku) and OpenAI (GPT-4o, GPT-4o-mini) options; API key input prompt for new provider
- [ ] T038 [US4] Wire model selector to provider manager in `frontend/js/chat.js` — on selection change, call `setProvider`, preserve conversation history, show confirmation toast

**Checkpoint**: US4 fully functional. Provider switching works mid-session.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Finalize UX, security hardening, mobile responsiveness, and deployment.

- [ ] T039 [P] Audit all JS files for API key exposure — confirm keys never logged, never sent to backend proxy, never in `localStorage`
- [ ] T040 [P] Test dark/light mode toggle with all new UI components (clarification cards, recommendation cards, discovery cards) in `frontend/css/styles.css`
- [ ] T041 [P] Mobile responsiveness pass — test sidebar collapse, clarification cards, recommendation cards on viewport < 768px in `frontend/css/styles.css`
- [ ] T042 [P] Add syntax highlighting for code blocks in chat output — verify existing highlight.js or equivalent handles new message types in `frontend/js/chat.js`
- [ ] T043 Deploy backend to Vercel — run `npx vercel --prod` from `backend/`, set `FRONTEND_ORIGIN` env var in Vercel dashboard
- [ ] T044 Update `frontend/js/mcp/discovery-client.js` `DISCOVERY_API` constant with live Vercel URL
- [ ] T045 [P] Validate full quickstart.md flow end-to-end: local dev, persona selection, clarification, recommendation, MCP discovery, model switch
- [ ] T046 [P] Update `README.md` with new architecture overview, setup instructions, and persona contribution guide

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **blocks all user stories**
- **Phase 3 (US1)**: Depends on Phase 2 — this is the MVP
- **Phase 4 (US2)**: Depends on Phase 2; integrates with US1 clarification output
- **Phase 5 (US3)**: Depends on Phase 2; integrates with US2 recommendation engine
- **Phase 6 (US4)**: Depends on Phase 2; can be developed in parallel with US2/US3
- **Phase 7 (Polish)**: Depends on all desired stories complete

### User Story Dependencies

- **US1 (P1)**: Independent after Phase 2 ✅
- **US2 (P2)**: Requires `confirmedIntent` from US1 clarification engine
- **US3 (P3)**: Requires `WorkflowRecommendation[]` from US2 recommendation engine
- **US4 (P4)**: Independent after Phase 2 — can run in parallel with US1/US2/US3 ✅

### Parallel Opportunities

- T003, T004, T005 — all Phase 1 setup tasks run in parallel
- T007, T008, T009, T010 — all Phase 2 foundation tasks run in parallel
- T011, T012 — clarification engine functions run in parallel
- T018, T019 — skill registry and recommender run in parallel
- T024, T025 — discovery handler and cache run in parallel
- T033, T034, T035 — provider manager and clients run in parallel
- US4 (T033–T038) can be worked entirely in parallel with US2/US3

---

## Parallel Example: User Story 1

```bash
# These tasks can launch simultaneously:
Task T011: "Implement clarification gate system prompt prefix in frontend/js/clarification/engine.js"
Task T012: "Implement resolveIntent() in frontend/js/clarification/engine.js"
Task T014: "Add clarification UI to frontend/index.html and frontend/css/styles.css"

# Then sequentially:
Task T013: "Integrate clarification engine into frontend/js/chat.js" (after T011, T012)
Task T015: "Wire clarification UI to engine in frontend/js/chat.js" (after T013, T014)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks everything)
3. Complete Phase 3: User Story 1 (T011–T017)
4. **STOP and VALIDATE**: Select a persona, ask an ambiguous query, confirm clarifying questions appear
5. Ship MVP — the clarification loop is the core value

### Incremental Delivery

1. Setup + Foundational → base app extended with new modules
2. US1 → persona + clarification loop → **MVP**
3. US2 → workflow recommendations → smarter answers
4. US3 → MCP discovery → unlimited tool reach
5. US4 → multi-provider → user choice and flexibility
6. Polish → production-ready

### Parallel Team Strategy

- Developer A: US1 (clarification) + US2 (workflow)
- Developer B: US3 (MCP discovery backend) + US4 (provider switching) in parallel

---

## Notes

- [P] tasks touch different files — safe to run in parallel
- [Story] label maps each task to its user story for full traceability
- API keys: sessionStorage only — enforce at code review
- Commit after each checkpoint (end of each phase)
- Stop at Phase 3 checkpoint to validate MVP before continuing
