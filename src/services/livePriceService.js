/**
 * ShopEZ Live Price Service (v7.1)
 * 
 * Uses the QuickCommerce API (quickcommerceapi.com) to fetch REAL prices
 * from Blinkit, Zepto, Swiggy Instamart, BigBasket, and Flipkart.
 * 
 * One single API call via /v1/groupsearch returns structured JSON with
 * real-time prices, product names, deeplinks, and delivery ETAs —
 * using your actual GPS lat/lon coordinates.
 * 
 * Free tier: 50 credits on signup (1 credit per platform per search).
 * A group search across 5 platforms = 5 credits per item.
 */

// ─── CONSTANTS ──────────────────────────────────────────────────────────

const API_BASE = 'https://api.quickcommerceapi.com';
const API_KEY_STORAGE = 'shopez_qc_api_key';
const CACHE_KEY = 'shopez_live_price_cache_v2';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const REQUEST_TIMEOUT_MS = 15000; // 15 seconds

// Platform name mapping: QuickCommerce API names → ShopEZ internal keys
const PLATFORM_MAP = {
  'BlinkIt':    'blinkit',
  'Zepto':      'zepto',
  'Swiggy':     'instamart',
  'BigBasket':  'bigbasket',
};

// Reverse mapping for API request
const PLATFORMS_PARAM = 'BlinkIt,Zepto,Swiggy,BigBasket';

// ─── API KEY MANAGEMENT ─────────────────────────────────────────────────

export function getApiKey() {
  try {
    return localStorage.getItem(API_KEY_STORAGE) || '4c8f8696-51bd-4489-8b3a-29ecadfcba89';
  } catch {
    return '4c8f8696-51bd-4489-8b3a-29ecadfcba89';
  }
}

export function setApiKey(key) {
  try {
    localStorage.setItem(API_KEY_STORAGE, (key || '').trim());
  } catch {
    // localStorage unavailable
  }
}

export function hasApiKey() {
  return getApiKey().length > 0;
}

// ─── CACHE MANAGEMENT ───────────────────────────────────────────────────

function getCacheKey(query, lat, lon) {
  return `${query.toLowerCase().trim()}|${lat?.toFixed(2)}|${lon?.toFixed(2)}`;
}

function getCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* full */ }
}

function getCachedResult(query, lat, lon) {
  const cache = getCache();
  const key = getCacheKey(query, lat, lon);
  const entry = cache[key];
  if (entry && (Date.now() - entry.timestamp) < CACHE_TTL_MS) {
    return entry.data;
  }
  return null;
}

function setCachedResult(query, lat, lon, data) {
  const cache = getCache();
  const key = getCacheKey(query, lat, lon);
  cache[key] = { data, timestamp: Date.now() };

  // Evict oldest entries if cache grows too large
  const keys = Object.keys(cache);
  if (keys.length > 100) {
    const sorted = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
    for (let i = 0; i < keys.length - 100; i++) {
      delete cache[sorted[i]];
    }
  }

  setCache(cache);
}


// ─── SEARCH URL HELPERS ─────────────────────────────────────────────────

function getPlatformSearchUrl(platformKey, query) {
  const q = encodeURIComponent(query);
  switch (platformKey) {
    case 'blinkit':   return `https://blinkit.com/s/?q=${q}`;
    case 'zepto':     return `https://www.zeptonow.com/search?query=${q}`;
    case 'instamart': return `https://www.swiggy.com/instamart/search?query=${q}`;
    case 'bigbasket': return `https://www.bigbasket.com/ps/?q=${q}`;
    case 'flipkart':  return `https://www.flipkart.com/search?q=${q}&marketplace=GROCERY`;
    default: return '';
  }
}


// ─── MAIN EXPORT ────────────────────────────────────────────────────────

/**
 * Fetches live prices from all platforms via QuickCommerce API's /v1/groupsearch.
 * 
 * @param {string} query       - The grocery item to search for (e.g. "amul butter")
 * @param {number|null} lat    - User's latitude (from GPS)
 * @param {number|null} lon    - User's longitude (from GPS)
 * @param {string} locationSeed - Fallback location name (not used for API, only for cache key if no GPS)
 * @returns {Promise<Object>}  - { prices, comparisonList, cheapestPlatform, cheapestPrice, liveCount, creditsRemaining }
 */
export async function fetchLivePrices(query, lat = null, lon = null, locationSeed = '') {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.warn('[ShopEZ] No QuickCommerce API key configured. Prices will not be fetched.');
    return emptyResult();
  }

  // Use default Bangalore coordinates if GPS not available
  const useLat = lat || 12.9716;
  const useLon = lon || 77.5946;

  // Check cache first
  const cached = getCachedResult(query, useLat, useLon);
  if (cached) {
    return cached;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const url = `${API_BASE}/v1/groupsearch?q=${encodeURIComponent(query)}&lat=${useLat}&lon=${useLon}&platforms=${PLATFORMS_PARAM}&api_key=${apiKey}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`[ShopEZ] API error ${response.status}:`, errorText);
      return emptyResult();
    }

    const json = await response.json();

    if (json.status !== 'success' || !json.data?.results) {
      console.warn('[ShopEZ] API returned unexpected format:', json);
      return emptyResult();
    }

    // Parse the grouped results into ShopEZ's price format
    const prices = {};
    const comparisonList = [];

    for (const [apiPlatformName, products] of Object.entries(json.data.results)) {
      const shopezKey = PLATFORM_MAP[apiPlatformName];
      if (!shopezKey || !Array.isArray(products) || products.length === 0) continue;

      // Take the first (most relevant) product result
      const topProduct = products[0];
      const price = topProduct.offer_price || topProduct.mrp || 0;
      
      if (price > 0) {
        prices[shopezKey] = price;
        comparisonList.push({
          name: shopezKey,
          price,
          mrp: topProduct.mrp || price,
          isLive: true,
          productName: topProduct.name || query,
          brand: topProduct.brand || '',
          quantity: topProduct.quantity || '',
          deeplink: topProduct.deeplink || getPlatformSearchUrl(shopezKey, query),
          url: getPlatformSearchUrl(shopezKey, query),
          available: topProduct.available !== false,
          deliveryEta: topProduct.platform?.sla || '',
        });
      }
    }

    // Sort by price (cheapest first)
    comparisonList.sort((a, b) => a.price - b.price);
    const cheapest = comparisonList.length > 0 ? comparisonList[0] : null;

    const result = {
      prices,
      comparisonList,
      cheapestPlatform: cheapest ? cheapest.name : null,
      cheapestPrice: cheapest ? cheapest.price : 0,
      liveCount: comparisonList.length,
      totalPlatforms: Object.keys(PLATFORM_MAP).length,
      creditsRemaining: json.credits_remaining,
    };

    // Cache successful results
    if (comparisonList.length > 0) {
      setCachedResult(query, useLat, useLon, result);
    }

    return result;

  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('[ShopEZ] API request timed out for:', query);
    } else {
      console.error('[ShopEZ] API request failed:', err.message);
    }
    return emptyResult();
  }
}

function emptyResult() {
  return {
    prices: {},
    comparisonList: [],
    cheapestPlatform: null,
    cheapestPrice: 0,
    liveCount: 0,
    totalPlatforms: Object.keys(PLATFORM_MAP).length,
    creditsRemaining: null,
  };
}
