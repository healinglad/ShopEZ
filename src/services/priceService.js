/**
 * ShopEZ Price Service (v7.0)
 * 
 * Orchestrates LIVE price discovery from real quick-commerce platforms.
 * No simulated/estimated prices — only real discovered prices are returned.
 * 
 * Uses livePriceService which makes native HTTP requests via CapacitorHttp
 * to bypass CORS restrictions on the native Android build.
 */

import { fetchLivePrices } from './livePriceService';

/**
 * Helper to get search URLs for each platform (used for deep-linking chips).
 */
export const getPlatformSearchUrl = (platformKey, query) => {
  const q = encodeURIComponent(query);
  switch (platformKey) {
    case 'blinkit':
      return `https://blinkit.com/s/?q=${q}`;
    case 'zepto':
      return `https://www.zeptonow.com/search?query=${q}`;
    case 'instamart':
      return `https://www.swiggy.com/instamart/search?query=${q}`;
    case 'bigbasket':
      return `https://www.bigbasket.com/ps/?q=${q}`;
    case 'flipkart':
      return `https://www.flipkart.com/search?q=${q}&marketplace=GROCERY`;
    default:
      return '';
  }
};

/**
 * Fetches prices for a given grocery item across all 5 platforms.
 * 
 * This function ONLY returns prices that were actually discovered from
 * live platform searches. If a platform doesn't respond or the price
 * can't be extracted, it is excluded from the results.
 * 
 * @param {string} query - The grocery item to search for
 * @param {string} locationSeed - User's location (city/pincode) for caching
 * @param {function} onPlatformResult - Optional callback as each platform responds
 * @returns {Promise<Object>} Price discovery results (only live prices)
 */
export const fetchPrices = async (query, locationSeed = '', onPlatformResult = null) => {
  try {
    const result = await fetchLivePrices(query, locationSeed, onPlatformResult);
    return result;
  } catch (err) {
    console.error('[ShopEZ] Price discovery failed entirely:', err);
    // Return empty result — no prices discovered
    return {
      prices: {},
      comparisonList: [],
      cheapestPlatform: null,
      cheapestPrice: 0,
      liveCount: 0,
      totalPlatforms: 5,
    };
  }
};
