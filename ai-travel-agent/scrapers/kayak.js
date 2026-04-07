/**
 * Kayak flight scraper using Puppeteer + stealth.
 * Returns cheapest round-trip flight prices for a given route.
 */
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteerExtra.use(StealthPlugin());

/**
 * @param {string} originIATA       - e.g. "LAX"
 * @param {string} destinationIATA  - e.g. "CDG"
 * @param {string} departDate       - YYYY-MM-DD
 * @param {string} returnDate       - YYYY-MM-DD
 * @param {number} adults
 * @param {number} limit
 */
async function scrapeFlights(originIATA, destinationIATA, departDate, returnDate, adults = 2, limit = 6) {
  // Kayak URL format: /flights/LAX-CDG/2026-05-10/2026-05-17/2adults
  const url = `https://www.kayak.com/flights/${originIATA}-${destinationIATA}/${departDate}/${returnDate}/${adults}adults`;

  const browser = await puppeteerExtra.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for results to load — Kayak loads results dynamically
    await new Promise(r => setTimeout(r, 7000));

    const flights = await page.evaluate((limit) => {
      const results = [];

      // Primary selector: .nrc6 result rows
      const rows = document.querySelectorAll('.nrc6, [class*="resultInner"], [class*="result-mod-"]');
      rows.forEach(row => {
        if (results.length >= limit) return;

        // Price
        const priceText = row.querySelector(
          '.nrc6-price-section, [class*="price-text"], [class*="Price-display"], .f8F1-price-text'
        )?.textContent || '';
        const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10);
        if (!price || price < 50) return;

        // Airline
        const airline = row.querySelector(
          '.c-stateful-provider-name, [class*="providerName"], [class*="carrier-name"], .VY2U'
        )?.textContent?.trim() || null;

        // Duration
        const duration = row.querySelector(
          '[class*="duration"], .xdW8 .vmXl'
        )?.textContent?.trim() || null;

        // Stops
        const stops = row.querySelector(
          '[class*="stops"], [class*="Stops"]'
        )?.textContent?.trim() || null;

        if (!results.find(r => r.price === price)) {
          results.push({ price, airline, duration, stops });
        }
      });

      // Fallback: pick any prices visible on page
      if (!results.length) {
        const priceEls = document.querySelectorAll('[class*="price"]');
        priceEls.forEach(el => {
          if (results.length >= limit) return;
          const m = el.textContent.match(/\$([\d,]+)/);
          if (m) {
            const price = parseInt(m[1].replace(',', ''), 10);
            if (price > 50 && !results.find(r => r.price === price)) {
              results.push({ price, airline: null, duration: null, stops: null });
            }
          }
        });
      }

      return results.slice(0, limit);
    }, limit);

    return flights.filter(f => f.price);
  } catch (err) {
    console.error('[kayak scraper]', err.message);
    return [];
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeFlights };
