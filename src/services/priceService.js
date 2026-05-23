/**
 * ShopEZ Price Service (v7.1)
 * 
 * Orchestrates LIVE price discovery via QuickCommerce API.
 * No simulated prices — only real prices from actual platforms.
 */

import { fetchLivePrices, hasApiKey, getApiKey, setApiKey } from './livePriceService';

// Re-export API key helpers for use in App.jsx
export { hasApiKey, getApiKey, setApiKey };

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
 * Fetches REAL live prices for a grocery item across all platforms.
 * 
 * @param {string} query - The grocery item to search for
 * @param {string} locationSeed - User's location label (for display only)
 * @param {number|null} lat - GPS latitude
 * @param {number|null} lon - GPS longitude
 * @returns {Promise<Object>} Price discovery results (only real live prices)
 */
export const fetchPrices = async (query, locationSeed = '', lat = null, lon = null) => {
  try {
    const result = await fetchLivePrices(query, lat, lon, locationSeed);
    return result;
  } catch (err) {
    console.error('[ShopEZ] Price discovery failed:', err);
    return {
      prices: {},
      comparisonList: [],
      cheapestPlatform: null,
      cheapestPrice: 0,
      liveCount: 0,
      totalPlatforms: 4,
    };
  }
};
