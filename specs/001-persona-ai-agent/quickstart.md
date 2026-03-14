# Quickstart: Intelligent Persona Chat Agent

**Branch**: `001-persona-ai-agent` | **Date**: 2026-03-12

## Prerequisites

- Node.js 20 LTS
- A Vercel account (free tier) for backend deployment
- Anthropic and/or OpenAI API keys

## Local Development

### 1. Frontend (GitHub Pages / static)

No build step needed. Open `index.html` in your browser or serve locally:

```bash
npx serve . -p 8080
# Visit http://localhost:8080
```

### 2. Backend Proxy (MCP Discovery)

```bash
cd backend
npm install
node server.js
# Runs on http://localhost:3001
```

Set environment variable for development:
```bash
FRONTEND_ORIGIN=http://localhost:8080 node server.js
```

### 3. Configure Frontend → Backend URL

In `js/mcp/discovery-client.js`, update:
```js
const DISCOVERY_API = process.env.NODE_ENV === 'production'
  ? 'https://persona-ai-proxy.vercel.app/api'
  : 'http://localhost:3001/api';
```

## Deployment

### Frontend → GitHub Pages

```bash
git push origin main
# GitHub Pages auto-deploys from /docs or root
```

### Backend → Vercel

```bash
cd backend
npx vercel --prod
```

Set environment variable in Vercel dashboard:
- `FRONTEND_ORIGIN` → `https://yg674-dev.github.io`

## Adding a New Persona

Edit `js/personas/registry.js` and add an entry:

```js
{
  id: "prompt-engineer",
  name: "Prompt Engineer",
  category: "Tech",
  icon: "✍️",
  tagline: "Craft precise prompts for any AI model",
  systemPrompt: "You are an expert prompt engineer...",
  starterQuestions: [
    "What model are you prompting?",
    "What task do you want to accomplish?",
    "What output format do you need?"
  ],
  workflowTags: ["prompt", "ai", "llm", "fine-tuning"]
}
```

## Key Architecture Notes

- **Clarification gate**: Controlled by the system prompt prefix in
  `js/clarification/engine.js`. Adjust aggressiveness by editing the gate prompt.
- **Workflow tags**: Each persona's `workflowTags` array is the primary signal
  for recommendation engine scoring. Keep tags specific and consistent.
- **MCP cache**: Stored in `backend/routes/mcp-discovery.js` as a module-level
  Map. Cleared on server restart or via `GET /api/mcp/cache/clear`.
