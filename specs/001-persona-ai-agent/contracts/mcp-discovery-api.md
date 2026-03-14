# Contract: MCP Discovery API

**Type**: HTTP REST (backend proxy)
**Base URL**: `https://persona-ai-proxy.vercel.app/api` (or local `http://localhost:3001/api`)

## Endpoints

### `GET /mcp/discover?topic={topic}`

Searches mcp.so, glama.ai, and GitHub for MCP servers relevant to the given topic.
Returns cached results if available (30-min TTL).

**Query params**:
- `topic` (required): The domain/topic to search (e.g., `"code review"`, `"database"`)

**Response 200**:
```json
{
  "cached": false,
  "results": [
    {
      "id": "github-mcp-server",
      "name": "GitHub MCP Server",
      "description": "Provides GitHub repo access, PR review, issue tracking via MCP",
      "sourceUrl": "https://mcp.so/server/github",
      "installCommand": "npx @modelcontextprotocol/server-github",
      "tags": ["github", "code", "pull-request", "issues"],
      "relevanceScore": 0.88
    }
  ],
  "searchedAt": "2026-03-12T13:00:00Z"
}
```

**Response 429** (rate limited by upstream source):
```json
{
  "error": "rate_limited",
  "message": "Discovery temporarily unavailable. Try again in 60 seconds.",
  "retryAfter": 60
}
```

**Response 503** (all sources unavailable):
```json
{
  "error": "discovery_unavailable",
  "message": "Could not reach MCP registries. Check your connection.",
  "results": []
}
```

---

### `GET /mcp/cache/clear`

Clears the in-memory discovery cache (admin/debug use).

**Response 200**: `{ "status": "cleared" }`
