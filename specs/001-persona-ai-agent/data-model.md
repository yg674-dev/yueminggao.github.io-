# Data Model: Intelligent Persona Chat Agent

**Branch**: `001-persona-ai-agent` | **Date**: 2026-03-12

## Entities

### Persona

Represents an expert agent profile.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique slug (e.g., `software-engineer`) |
| name | string | Display name (e.g., "Software Engineer") |
| category | enum | `Tech \| Business \| Product \| Creative` |
| icon | string | Emoji or icon identifier |
| tagline | string | One-line description |
| systemPrompt | string | Full expert persona system prompt |
| starterQuestions | string[] | 3–5 suggested opening questions |
| workflowTags | string[] | Semantic tags for workflow matching (e.g., `["code-review", "debugging", "architecture"]`) |

**Validation**: `id` must be unique; `workflowTags` must have at least 1 entry; `starterQuestions` must have 3–5 entries.

---

### Session

Represents a single user conversation instance.

| Field | Type | Description |
|-------|------|-------------|
| id | string | UUID, generated client-side |
| personaId | string | Active persona reference |
| provider | enum | `claude \| openai` |
| model | string | Model identifier (e.g., `claude-sonnet-4-6`) |
| messages | Message[] | Ordered conversation history |
| connectedMcpServers | McpServer[] | Currently connected MCP servers |
| clarificationState | ClarificationState | Current gate status |
| createdAt | ISO8601 | Session start time |

---

### Message

A single turn in the conversation.

| Field | Type | Description |
|-------|------|-------------|
| id | string | UUID |
| role | enum | `user \| assistant \| system` |
| content | string | Message text (may include markdown/code) |
| timestamp | ISO8601 | When message was sent |
| workflowUsed | string? | Skill or MCP server ID used (if any) |

---

### ClarificationState

Tracks the clarification gate status for a session turn.

| Field | Type | Description |
|-------|------|-------------|
| status | enum | `pending \| questioning \| resolved \| skipped` |
| questions | string[] | Questions asked (1–3) |
| answers | string[] | User's answers (parallel array to questions) |
| confirmedIntent | string? | Resolved intent summary after clarification |

---

### WorkflowRecommendation

A ranked recommendation surfaced by the recommendation engine.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Skill slug or MCP server ID |
| type | enum | `skill \| mcp-server` |
| name | string | Display name |
| rationale | string | One-line explanation of why recommended |
| score | number | Relevance score 0–1 |
| accepted | boolean? | Whether user accepted this recommendation |

---

### McpServer

An MCP server — either pre-configured or dynamically discovered.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier (slug or URL hash) |
| name | string | Display name |
| description | string | What this server provides |
| sourceUrl | string | Where it was found (marketplace URL or GitHub) |
| installCommand | string? | CLI command to install (if available) |
| tags | string[] | Semantic tags for matching |
| status | enum | `connected \| available \| discovered` |
| discoveredAt | ISO8601? | When it was found via auto-discovery |

---

## State Transitions

### ClarificationState

```
[user sends query]
       ↓
   pending
       ↓ (agent assesses query)
  ┌────┴────┐
  │         │
questioning  skipped
  │         │
  ↓         ↓
(user     resolved
answers)
  │
  ↓
resolved
```

### McpServer.status

```
discovered → available → connected
                              ↓
                        (user disconnects)
                              ↓
                          available
```
