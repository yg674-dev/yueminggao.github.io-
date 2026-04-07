# AI Travel Agent

An AI-powered travel itinerary builder with Yelp restaurant discovery and reservations.

**Live demo:** https://yg674-dev.github.io/yueminggao.github.io-/ai-travel-agent/

---

## What it does

The app walks you through four steps to plan a complete trip:

1. **Search** — Enter your destination, travel dates, and number of travelers
2. **Compare** — Browse and compare packages from 6 travel providers (flights, hotel, car rental, perks)
3. **Preferences** — Answer 5 questions about accommodation style, activities, pace, budget, and dining
4. **Itinerary** — Get a personalized day-by-day schedule, package summary, and Yelp-powered restaurant discovery

In the itinerary step, a Yelp panel automatically searches for restaurants at your destination. You can chat with it in natural language, browse business cards with photos and reviews, and request table reservations — all powered by [Yelp Fusion AI](https://business.yelp.com/data/products/fusion-ai/).

---

## Project structure

```
ai-travel-agent/
├── index.html       # Full frontend — React 18 (CDN), Tailwind CSS, Babel standalone
├── server.js        # Express proxy — forwards requests to Yelp Fusion AI API
├── package.json
├── .env.example     # Copy to .env and add your Yelp API key
└── README.md
```

The frontend is a single self-contained HTML file with no build step. The backend proxy is needed only to keep your Yelp API key off the client.

---

## Getting started

### 1. Get a Yelp Fusion AI API key

Create a free app at https://www.yelp.com/developers/v3/manage_app — this starts your trial.

### 2. Clone and configure

```bash
git clone https://github.com/yg674-dev/yueminggao.github.io-.git
cd yueminggao.github.io-/ai-travel-agent

cp .env.example .env
# Open .env and paste your YELP_API_KEY
```

### 3. Start the proxy server

```bash
npm install
npm start
```

You should see:

```
✅  AI Travel Agent proxy running at http://localhost:3001
   Yelp API key: ✓ loaded
```

### 4. Open the app

Open `ai-travel-agent/index.html` directly in your browser (no server needed for the frontend).

---

## Yelp integration

The Yelp panel in the itinerary step is built on the [Yelp MCP server](https://github.com/Yelp/yelp-mcp). Rather than running the Python MCP process, the Express proxy calls the same underlying API endpoint (`https://api.yelp.com/ai/chat/v2`) directly.

**Supported out of the box:**
- Natural language business search ("best ramen in Tokyo", "rooftop bars near me")
- Multi-turn conversations — ask follow-up questions using the same chat session
- Business cards with photos, ratings, price, address, hours, and review highlights
- Direct links to Yelp pages

**Reservations (requires Yelp approval):**

Table reservations via natural language ("Reserve a table for 4 at [restaurant] on Friday at 8pm") are processed by Yelp Reservations. This feature must be enabled on your API key — contact Yelp at https://business.yelp.com/data/products/fusion-ai/ to request access.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (CDN), Tailwind CSS (CDN), Babel standalone |
| Backend proxy | Node.js 20, Express, dotenv |
| AI — Yelp | Yelp Fusion AI API (`/ai/chat/v2`) |
| Hosting | GitHub Pages (static frontend only) |

---

## Running in development

```bash
npm run dev   # uses Node's built-in --watch flag, no extra dependencies
```

---

## Notes

- The frontend works on GitHub Pages without the backend — Yelp features show a setup prompt when the proxy isn't reachable.
- The `.env` file is gitignored. Never commit your API key.
- All travel package data (prices, providers) is mock/generated for demo purposes.
