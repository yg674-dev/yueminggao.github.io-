/**
 * OpenTable MCP client — @striderlabs/mcp-opentable
 * https://mcpmarket.com/server/opentable
 *
 * Spawns the striderlabs MCP subprocess via npx and communicates over MCP stdio.
 * Supports real reservation booking, session management, and cancellation.
 */
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

let client = null;
let connecting = null;

async function getClient() {
  if (client) return client;
  if (connecting) return connecting;

  connecting = (async () => {
    console.log('[opentable] starting @striderlabs/mcp-opentable subprocess…');
    const transport = new StdioClientTransport({
      command: 'npx',
      args: ['-y', '@striderlabs/mcp-opentable'],
      env: { ...process.env },
    });

    const c = new Client({ name: 'ai-travel-agent', version: '1.0.0' }, { capabilities: {} });
    await c.connect(transport);
    console.log('[opentable] MCP connected ✓');
    client = c;
    connecting = null;

    transport.onclose = () => {
      console.warn('[opentable] subprocess disconnected — will reconnect on next call');
      client = null;
      connecting = null;
    };

    return client;
  })();

  return connecting;
}

async function callTool(name, args = {}) {
  const c = await getClient();
  const result = await c.callTool({ name, arguments: args });
  const text = result.content?.[0]?.text;
  if (!text) throw new Error('Empty response from OpenTable MCP');
  if (result.isError) throw new Error(text);
  // Some responses are JSON, some are plain text
  try { return JSON.parse(text); } catch { return { message: text }; }
}

/* ── Public API ─────────────────────────────────────────── */

/** Check if user is logged in to OpenTable. */
async function getStatus() {
  return callTool('opentable_status');
}

/** Get OpenTable login URL so the user can authenticate. */
async function getLoginUrl() {
  return callTool('opentable_login');
}

/** Clear stored session cookies (logout). */
async function logout() {
  return callTool('opentable_logout');
}

/**
 * Search for restaurants.
 * @param {string} location   - "Paris", "New York", "Tokyo"
 * @param {string} [cuisine]  - "Italian", "sushi", etc.
 * @param {string} [date]     - YYYY-MM-DD
 * @param {string} [time]     - HH:MM (24h)
 * @param {number} [partySize]
 */
async function searchRestaurants({ location, cuisine, date, time, partySize }) {
  return callTool('opentable_search', { location, cuisine, date, time, partySize });
}

/**
 * Get detailed info about a restaurant.
 * @param {string} restaurantId - ID or profile URL from search results
 */
async function getRestaurantDetails({ restaurantId }) {
  return callTool('opentable_get_restaurant', { restaurantId });
}

/**
 * Check real-time availability.
 * @param {string} restaurantId
 * @param {string} date       - YYYY-MM-DD
 * @param {string} time       - HH:MM
 * @param {number} partySize
 */
async function checkAvailability({ restaurantId, date, time, partySize }) {
  return callTool('opentable_check_availability', { restaurantId, date, time, partySize });
}

/**
 * Make a reservation (set confirm=false to preview, confirm=true to book).
 * Requires user to be logged in.
 */
async function makeReservation({ restaurantId, date, time, partySize, specialRequests, confirm }) {
  return callTool('opentable_make_reservation', { restaurantId, date, time, partySize, specialRequests, confirm });
}

/** Get all upcoming reservations for the logged-in user. */
async function getReservations() {
  return callTool('opentable_get_reservations');
}

/** Cancel a reservation. */
async function cancelReservation({ reservationId }) {
  return callTool('opentable_cancel_reservation', { reservationId });
}

/** Gracefully shut down the subprocess. */
async function shutdown() {
  if (client) {
    await client.close().catch(() => {});
    client = null;
  }
}

module.exports = {
  getStatus, getLoginUrl, logout,
  searchRestaurants, getRestaurantDetails,
  checkAvailability, makeReservation,
  getReservations, cancelReservation,
  shutdown,
};
