/**
 * Booking.com hotel scraper using Puppeteer + stealth.
 * Returns top hotel results for a given destination and dates.
 */
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteerExtra.use(StealthPlugin());

const BOOKING_URL = 'https://www.booking.com/searchresults.html';

/**
 * @param {string} destination  - e.g. "Paris"
 * @param {string} checkin      - YYYY-MM-DD
 * @param {string} checkout     - YYYY-MM-DD
 * @param {number} adults
 * @param {number} limit        - max results
 */
async function scrapeHotels(destination, checkin, checkout, adults = 2, limit = 6) {
  const params = new URLSearchParams({
    ss: destination,
    checkin,
    checkout,
    group_adults: adults,
    no_rooms: 1,
    selected_currency: 'USD',
    nflt: 'review_score=70',
  });
  const url = `${BOOKING_URL}?${params}`;

  const browser = await puppeteerExtra.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Dismiss cookie banner if present
    await page.evaluate(() => {
      document.querySelector('[data-testid="accept-banner"]')?.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    const hotels = await page.evaluate((limit) => {
      const cards = document.querySelectorAll('[data-testid="property-card"]');
      return Array.from(cards).slice(0, limit).map(card => {
        const name = card.querySelector('[data-testid="title"]')?.textContent?.trim() || null;

        // Price: total for the stay
        const priceText = card.querySelector('[data-testid="price-and-discounted-price"]')?.textContent || '';
        const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10) || null;

        // Review score (e.g. "8.4")
        const scoreEl = card.querySelector('[data-testid="review-score"]');
        const score = parseFloat(scoreEl?.textContent?.match(/[\d.]+/)?.[0]) || null;

        // Review count
        const reviewText = scoreEl?.textContent || '';
        const reviews = parseInt(reviewText.match(/([\d,]+)\s*reviews?/i)?.[1]?.replace(',', ''), 10) || null;

        // Category label e.g. "Hotel", "Apartment"
        const category = card.querySelector('[data-testid="property-card-deal"]')?.textContent?.trim() || null;

        // Location
        const location = card.querySelector('[data-testid="address"]')?.textContent?.trim() || null;

        // Image
        const img = card.querySelector('img[data-testid]')?.src
          || card.querySelector('img')?.src
          || null;

        // Link
        const link = card.querySelector('a[data-testid="title-link"]')?.href || null;

        return { name, price, score, reviews, category, location, img, link };
      });
    }, limit);

    return hotels.filter(h => h.name && h.price);
  } catch (err) {
    console.error('[booking scraper]', err.message);
    return [];
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeHotels };
