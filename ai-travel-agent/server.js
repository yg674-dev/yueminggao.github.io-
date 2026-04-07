/**
 * AI Travel Agent — Yelp Fusion AI Proxy
 * Keeps YELP_API_KEY server-side and forwards requests to Yelp's API.
 * Mirrors exactly what the Yelp MCP server does (yelp-mcp/src/yelp_agent/api.py).
 *
 * Run:  npm start          (production)
 *       npm run dev        (watch mode)
 *
 * Then open ai-travel-agent/index.html in your browser.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { buildPackages } = require('./scrapers/index');

const app = express();
const PORT = process.env.PORT || 3001;
const YELP_API_KEY = process.env.YELP_API_KEY;
const YELP_AI_ENDPOINT = 'https://api.yelp.com/ai/chat/v2';

app.use(cors());
app.use(express.json());

/* ── Health check ───────────────────────────────────────── */
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    yelp_configured: !!YELP_API_KEY,
  });
});

/* ── Travel packages (Booking.com hotels + Kayak flights) ─ */
app.post('/api/packages', async (req, res) => {
  const { destination, origin, startDate, endDate, travelers } = req.body;
  if (!destination || !startDate || !endDate) {
    return res.status(400).json({ error: 'destination, startDate, endDate required' });
  }
  try {
    console.log(`[/api/packages] ${origin || 'LAX'} → ${destination} | ${startDate}–${endDate} | ${travelers} travelers`);
    const packages = await buildPackages({ destination, origin: origin || 'Los Angeles', startDate, endDate, travelers: travelers || 2 });
    if (!packages) {
      return res.json({ packages: null, fallback: true, message: 'Scrapers returned no data — using mock packages.' });
    }
    res.json({ packages, fallback: false });
  } catch (err) {
    console.error('[/api/packages]', err.message);
    res.status(500).json({ error: err.message, fallback: true });
  }
});

/* ── Yelp Fusion AI chat proxy ──────────────────────────── */
app.post('/api/yelp/chat', async (req, res) => {
  if (!YELP_API_KEY) {
    return res.status(503).json({
      error: 'YELP_API_KEY is not set. Add it to your .env file and restart the server.',
    });
  }

  const { query, chat_id, latitude, longitude } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query is required' });
  }

  const body = { query };
  if (chat_id) body.chat_id = chat_id;
  if (latitude != null && longitude != null) {
    body.user_context = { latitude, longitude };
  }

  try {
    const upstream = await fetch(YELP_AI_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${YELP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      console.error('[Yelp API error]', upstream.status, data);
      return res.status(upstream.status).json({ error: data });
    }

    res.json(data);
  } catch (err) {
    console.error('[Proxy error]', err.message);
    res.status(500).json({ error: 'Failed to reach Yelp API', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅  AI Travel Agent proxy running at http://localhost:${PORT}`);
  console.log(`   Yelp API key: ${YELP_API_KEY ? '✓ loaded' : '✗ MISSING — add YELP_API_KEY to .env'}`);
  console.log(`\n   Open ai-travel-agent/index.html in your browser.\n`);
});
