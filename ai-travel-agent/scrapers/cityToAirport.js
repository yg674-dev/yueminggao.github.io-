/**
 * City name → IATA airport code lookup.
 * Covers the most common travel destinations and departure hubs.
 */
const CITY_TO_IATA = {
  // North America
  'new york': 'JFK', 'nyc': 'JFK', 'new york city': 'JFK',
  'los angeles': 'LAX', 'la': 'LAX',
  'chicago': 'ORD',
  'san francisco': 'SFO', 'sf': 'SFO',
  'miami': 'MIA',
  'boston': 'BOS',
  'seattle': 'SEA',
  'washington': 'DCA', 'washington dc': 'IAD',
  'dallas': 'DFW',
  'houston': 'IAH',
  'atlanta': 'ATL',
  'denver': 'DEN',
  'las vegas': 'LAS',
  'orlando': 'MCO',
  'toronto': 'YYZ',
  'vancouver': 'YVR',
  'montreal': 'YUL',
  'mexico city': 'MEX',
  'cancun': 'CUN',

  // Europe
  'london': 'LHR',
  'paris': 'CDG',
  'amsterdam': 'AMS',
  'frankfurt': 'FRA',
  'madrid': 'MAD',
  'barcelona': 'BCN',
  'rome': 'FCO',
  'milan': 'MXP',
  'lisbon': 'LIS',
  'athens': 'ATH',
  'vienna': 'VIE',
  'zurich': 'ZRH',
  'brussels': 'BRU',
  'dublin': 'DUB',
  'prague': 'PRG',
  'istanbul': 'IST',
  'berlin': 'BER',
  'munich': 'MUC',
  'copenhagen': 'CPH',
  'stockholm': 'ARN',
  'oslo': 'OSL',
  'helsinki': 'HEL',

  // Asia & Pacific
  'tokyo': 'NRT',
  'osaka': 'KIX',
  'seoul': 'ICN',
  'beijing': 'PEK',
  'shanghai': 'PVG',
  'hong kong': 'HKG',
  'singapore': 'SIN',
  'bangkok': 'BKK',
  'bali': 'DPS', 'denpasar': 'DPS',
  'kuala lumpur': 'KUL',
  'dubai': 'DXB',
  'abu dhabi': 'AUH',
  'mumbai': 'BOM',
  'delhi': 'DEL',
  'sydney': 'SYD',
  'melbourne': 'MEL',
  'auckland': 'AKL',

  // Latin America & Caribbean
  'sao paulo': 'GRU',
  'rio de janeiro': 'GIG', 'rio': 'GIG',
  'buenos aires': 'EZE',
  'bogota': 'BOG',
  'lima': 'LIM',
  'havana': 'HAV',
  'punta cana': 'PUJ',
  'nassau': 'NAS',

  // Africa & Middle East
  'cairo': 'CAI',
  'nairobi': 'NBO',
  'cape town': 'CPT',
  'johannesburg': 'JNB',
  'tel aviv': 'TLV',
  'doha': 'DOH',
  'casablanca': 'CMN',
  'marrakech': 'RAK',
};

/**
 * Convert a city name or IATA code to a 3-letter IATA code.
 * Falls back to the first 3 uppercase chars if unknown.
 */
function toIATA(input) {
  if (!input) return 'JFK';
  const clean = input.trim().toLowerCase();
  // Already an IATA code (3 letters)
  if (/^[a-z]{3}$/.test(clean)) return clean.toUpperCase();
  return CITY_TO_IATA[clean] || input.trim().slice(0, 3).toUpperCase();
}

module.exports = { toIATA, CITY_TO_IATA };
