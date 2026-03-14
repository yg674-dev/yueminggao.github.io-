# Contract: Workflow Recommendation Engine

**Type**: Internal JS module contract
**Module**: `js/workflow/recommender.js`

## Interface

### `getRecommendations(confirmedIntent, personaId, connectedMcpServers)`

Matches confirmed intent against available skills and MCP servers. Returns
ranked recommendations (max 3).

**Input**:
```json
{
  "confirmedIntent": "User needs help reviewing Python code for performance issues",
  "personaId": "software-engineer",
  "connectedMcpServers": [
    { "id": "github-mcp", "tags": ["git", "code", "pull-request"] }
  ]
}
```

**Output**:
```json
{
  "recommendations": [
    {
      "id": "code-review",
      "type": "skill",
      "name": "Code Review",
      "rationale": "Directly matches code review intent with performance focus",
      "score": 0.92
    },
    {
      "id": "github-mcp",
      "type": "mcp-server",
      "name": "GitHub MCP",
      "rationale": "Can pull PR diff for review context",
      "score": 0.74
    }
  ]
}
```

---

### `acceptRecommendation(recommendationId)`

Records user acceptance of a recommendation for future scoring improvement.

**Input**: `{ "recommendationId": "code-review" }`
**Output**: `{ "status": "accepted" }`

---

### `overrideRecommendation(recommendationId, userSelectedId)`

Records a user override for feedback loop.

**Input**: `{ "recommendationId": "code-review", "userSelectedId": "simplify" }`
**Output**: `{ "status": "overridden" }`
