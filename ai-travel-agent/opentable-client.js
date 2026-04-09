/**
 * OpenTable MCP client.
 * Spawns the opentable-mcp subprocess and communicates via MCP stdio protocol.
 * Exposes clean async functions that our Express server can call directly.
 */
const path = require('path');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

const MCP_PATH = path.join(__dirname, 'opentable-mcp', 'build', 'index.js');

let client = null;
let connecting = null;

async function getClient() {
  if (client) return client;
  if (connecting) return connecting;

  connecting = (async () => {
    console.log('[opentable] spawning MCP subprocess…');
    const transport = new StdioClientTransport({
      command: 'node',
      args: [MCP_PATH],
      env: {
        ...process.env,
        OPENTABLE_BROWSER_CHANNEL: process.env.OPENTABLE_BROWSER_CHANNEL || '',
        OPENTABLE_LOCALE: process.env.OPENTABLE_LOCALE || 'en-US',
        OPENTABLE_TIMEZONE: process.env.OPENTABLE_TIMEZONE || Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    });

    const c = new Client({ name: 'ai-travel-agent', version: '1.0.0' }, { capabilities: {} });
    await c.connect(transport);
    console.log('[opentable] MCP subprocess connected');
    client = c;
    connecting = null;

    // Reconnect on unexpected disconnect
    transport.onclose = () => {
      console.warn('[opentable] MCP subprocess disconnected — will reconnect on next call');
      client = null;
      connecting = null;
    };

    return client;
  })();

  return connecting;
}

async function callTool(name, args) {
  const c = await getClient();
  const result = await c.callTool({ name, arguments: args });
  const text = result.content?.[0]?.text;
  if (!text) throw new Error('Empty response from OpenTable MCP');
  if (result.isError) throw new Error(text);
  return JSON.parse(text);
}

/* ── Public API ─────────────────────────────────────────── */

/**
 * Search restaurants on OpenTable.
 * @param {string} query        - "Italian", "sushi", restaurant name, etc.
 * @param {string} location     - "Paris", "Tokyo", "New York"
 * @param {string} [date]       - YYYY-MM-DD
 * @param {string} [time]       - HH:MM (24h)
 * @param {number} [partySize]
 */
async function searchRestaurants({ query, location, date, time, partySize }) {
  return callTool('search_restaurants', { query, location, date, time, partySize });
}

/**
 * Check real-time availability for a specific restaurant.
 * @param {string} restaurantUrl  - Full OpenTable URL
 * @param {string} date           - YYYY-MM-DD
 * @param {string} time           - HH:MM (24h)
 * @param {number} partySize
 */
async function checkAvailability({ restaurantUrl, date, time, partySize }) {
  return callTool('check_availability', { restaurantUrl, date, time, partySize });
}

/**
 * Get full details for a restaurant (hours, address, price range, etc.)
 */
async function getRestaurantDetails({ restaurantUrl }) {
  return callTool('get_restaurant_details', { restaurantUrl });
}

/**
 * Get menu sections and items.
 */
async function getRestaurantMenu({ restaurantUrl }) {
  return callTool('get_restaurant_menu', { restaurantUrl });
}

/**
 * Get ratings and reviews.
 */
async function getRestaurantReviews({ restaurantUrl, maxReviews = 5, sortBy = 'newest' }) {
  return callTool('get_restaurant_reviews', { restaurantUrl, maxReviews, sortBy });
}

/** Gracefully shut down the subprocess. */
async function shutdown() {
  if (client) {
    await client.close().catch(() => {});
    client = null;
  }
}

module.exports = { searchRestaurants, checkAvailability, getRestaurantDetails, getRestaurantMenu, getRestaurantReviews, shutdown };
