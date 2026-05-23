/**
 * ShopEZ Live Price Service (v7.0)
 * 
 * Fetches REAL prices from quick-commerce platforms by making native HTTP
 * requests via Capacitor's CapacitorHttp plugin, which bypasses CORS entirely
 * because the requests are routed through the native Android/iOS layer.
 * 
 * When running in a regular browser (dev mode), fetch() is used directly
 * and will likely be blocked by CORS — this is expected. Live prices only
 * work on the native Android build.
 */

// ─── CONSTANTS ──────────────────────────────────────────────────────────

const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.165 Mobile Safari/537.36';

const PLATFORM_TIMEOUT_MS = 12000; // 12 seconds per platform

const CACHE_KEY = 'shopez_live_price_cache';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ─── PRICE EXTRACTION UTILITIES ─────────────────────────────────────────

/**
 * Extracts all price-like numbers from raw text/HTML.
 * Looks for patterns like ₹123, ₹1,234, "price":123, "sp":45.00, MRP 99, etc.
 * Returns an array of parsed float values sorted ascending.
 */
function extractPricesFromText(html) {
  const prices = new Set();

  // Pattern 1: ₹ followed by digits (with optional comma/decimal)
  const rupeePattern = /₹\s*([\d,]+(?:\.\d{1,2})?)/g;
  let m;
  while ((m = rupeePattern.exec(html)) !== null) {
    const val = parseFloat(m[1].replace(/,/g, ''));
    if (val > 0 && val < 50000) prices.add(val);
  }

  // Pattern 2: "price": 123 or "sp": 45 or "sellingPrice": 99 (JSON fields)
  const jsonPricePattern = /["'](price|sp|selling_price|sellingPrice|offer_price|offerPrice|final_price|finalPrice|mrp|sale_price|salePrice)["']\s*:\s*["']?([\d.]+)["']?/gi;
  while ((m = jsonPricePattern.exec(html)) !== null) {
    const val = parseFloat(m[2]);
    if (val > 0 && val < 50000) prices.add(val);
  }

  // Pattern 3: Rs or Rs. or INR followed by digits
  const rsPattern = /(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/gi;
  while ((m = rsPattern.exec(html)) !== null) {
    const val = parseFloat(m[1].replace(/,/g, ''));
    if (val > 0 && val < 50000) prices.add(val);
  }

  return [...prices].sort((a, b) => a - b);
}

/**
 * Try to extract structured product data from JSON-LD script blocks.
 * These are often included for SEO/Google Shopping and contain accurate prices.
 */
function extractFromJsonLd(html) {
  const results = [];
  const jsonLdPattern = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = jsonLdPattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item['@type'] === 'Product' && item.offers) {
          const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
          for (const offer of offers) {
            const price = parseFloat(offer.price || offer.lowPrice || 0);
            if (price > 0 && price < 50000) {
              results.push({
                name: item.name || '',
                price,
                isLive: true
              });
            }
          }
        }
      }
    } catch (e) {
      // Invalid JSON-LD, skip
    }
  }
  return results;
}

/**
 * Try to extract product data from Next.js __NEXT_DATA__ script blocks.
 * Flipkart and some other sites embed initial page data here.
 */
function extractFromNextData(html, query) {
  try {
    const nextDataPattern = /<script[^>]*id\s*=\s*["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i;
    const match = html.match(nextDataPattern);
    if (!match) return [];

    const data = JSON.parse(match[1]);
    const jsonStr = JSON.stringify(data);
    
    // Find all price fields in the stringified JSON
    const prices = extractPricesFromText(jsonStr);
    if (prices.length > 0) {
      // The lowest reasonable price is likely the selling price
      return [{ name: query, price: prices[0], isLive: true }];
    }
  } catch (e) {
    // Parse error, skip
  }
  return [];
}

/**
 * Generic HTML price extractor — scans the full HTML for price patterns,
 * filters for reasonable grocery price ranges, and returns the lowest.
 */
function extractGenericPrice(html, query) {
  const prices = extractPricesFromText(html);
  // Filter to reasonable grocery price range (₹5 to ₹5000)
  const groceryPrices = prices.filter(p => p >= 5 && p <= 5000);
  if (groceryPrices.length > 0) {
    return [{ name: query, price: groceryPrices[0], isLive: true }];
  }
  return [];
}


// ─── PLATFORM FETCHERS ──────────────────────────────────────────────────

/**
 * Makes a native HTTP GET request via fetch() (which CapacitorHttp patches
 * on native builds to bypass CORS). Returns the response text/HTML.
 */
async function nativeFetch(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PLATFORM_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': MOBILE_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Fetch price from BigBasket search results.
 */
async function fetchBigBasket(query) {
  const url = `https://www.bigbasket.com/ps/?q=${encodeURIComponent(query)}`;
  const html = await nativeFetch(url);

  // Try JSON-LD first (BigBasket sometimes includes structured product data)
  let results = extractFromJsonLd(html);
  if (results.length > 0) return results[0];

  // Try generic price extraction
  results = extractGenericPrice(html, query);
  if (results.length > 0) return results[0];

  return null;
}

/**
 * Fetch price from Flipkart Grocery search results.
 * Flipkart uses Next.js SSR — prices may be in __NEXT_DATA__ or HTML.
 */
async function fetchFlipkart(query) {
  const url = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}&marketplace=GROCERY`;
  const html = await nativeFetch(url);

  // Try __NEXT_DATA__ first
  let results = extractFromNextData(html, query);
  if (results.length > 0) return results[0];

  // Try JSON-LD
  results = extractFromJsonLd(html);
  if (results.length > 0) return results[0];

  // Try generic
  results = extractGenericPrice(html, query);
  if (results.length > 0) return results[0];

  return null;
}

/**
 * Fetch price from Blinkit search results.
 */
async function fetchBlinkit(query) {
  const url = `https://blinkit.com/s/?q=${encodeURIComponent(query)}`;
  const html = await nativeFetch(url);

  // Try JSON-LD
  let results = extractFromJsonLd(html);
  if (results.length > 0) return results[0];

  // Try generic extraction from the HTML
  results = extractGenericPrice(html, query);
  if (results.length > 0) return results[0];

  return null;
}

/**
 * Fetch price from Zepto search results.
 */
async function fetchZepto(query) {
  const url = `https://www.zeptonow.com/search?query=${encodeURIComponent(query)}`;
  const html = await nativeFetch(url);

  // Try JSON-LD
  let results = extractFromJsonLd(html);
  if (results.length > 0) return results[0];

  // Try generic
  results = extractGenericPrice(html, query);
  if (results.length > 0) return results[0];

  return null;
}

/**
 * Fetch price from Swiggy Instamart search results.
 */
async function fetchInstamart(query) {
  const url = `https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(query)}`;
  const html = await nativeFetch(url);

  // Try JSON-LD
  let results = extractFromJsonLd(html);
  if (results.length > 0) return results[0];

  // Try generic
  results = extractGenericPrice(html, query);
  if (results.length > 0) return results[0];

  return null;
}


// ─── CACHE MANAGEMENT ───────────────────────────────────────────────────

function getCacheKey(query, locationSeed) {
  return `${query.toLowerCase().trim()}|${(locationSeed || '').toLowerCase().trim()}`;
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
  } catch {
    // localStorage full, ignore
  }
}

function getCachedPrices(query, locationSeed) {
  const cache = getCache();
  const key = getCacheKey(query, locationSeed);
  const entry = cache[key];
  if (entry && (Date.now() - entry.timestamp) < CACHE_TTL_MS) {
    return entry.prices;
  }
  return null;
}

function setCachedPrices(query, locationSeed, prices) {
  const cache = getCache();
  const key = getCacheKey(query, locationSeed);
  cache[key] = { prices, timestamp: Date.now() };

  // Evict old entries if cache gets too large (keep latest 100)
  const keys = Object.keys(cache);
  if (keys.length > 100) {
    const sorted = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
    for (let i = 0; i < keys.length - 100; i++) {
      delete cache[sorted[i]];
    }
  }

  setCache(cache);
}


// ─── MAIN EXPORT ────────────────────────────────────────────────────────

/**
 * Fetches live prices from all 5 platforms in parallel.
 * 
 * @param {string} query - The grocery item to search for
 * @param {string} locationSeed - The user's location (city/pincode) for cache keying
 * @param {function} onPlatformResult - Optional callback fired as each platform responds:
 *        (platformName, result) => void
 * @returns {Promise<Object>} - { prices, comparisonList, cheapestPlatform, cheapestPrice }
 *          Only includes platforms that returned a real live price.
 */
export async function fetchLivePrices(query, locationSeed = '', onPlatformResult = null) {
  // Check cache first
  const cached = getCachedPrices(query, locationSeed);
  if (cached) {
    return cached;
  }

  const platformFetchers = [
    { key: 'blinkit',   name: 'Blinkit',   fetcher: fetchBlinkit,   color: '#F8CB46' },
    { key: 'zepto',     name: 'Zepto',      fetcher: fetchZepto,     color: '#36096d' },
    { key: 'instamart', name: 'Instamart',  fetcher: fetchInstamart, color: '#FC8019' },
    { key: 'bigbasket', name: 'BigBasket',  fetcher: fetchBigBasket, color: '#84C225' },
    { key: 'flipkart',  name: 'Flipkart',   fetcher: fetchFlipkart,  color: '#2874F0' },
  ];

  // Fire all fetchers in parallel, each wrapped with its own error handling
  const results = await Promise.allSettled(
    platformFetchers.map(async ({ key, name, fetcher }) => {
      try {
        const result = await fetcher(query);
        if (onPlatformResult) onPlatformResult(name, result);
        return { key, name, result };
      } catch (err) {
        console.warn(`[ShopEZ] Live fetch failed for ${name}:`, err.message);
        if (onPlatformResult) onPlatformResult(name, null);
        return { key, name, result: null };
      }
    })
  );

  // Build the prices object — ONLY include platforms that returned real prices
  const prices = {};
  const comparisonList = [];

  for (const settledResult of results) {
    if (settledResult.status === 'fulfilled') {
      const { key, name, result } = settledResult.value;
      if (result && result.price > 0) {
        prices[key] = result.price;
        comparisonList.push({
          name: key,
          price: result.price,
          isLive: true,
          productName: result.name || query,
          url: getPlatformSearchUrl(key, query),
        });
      }
    }
  }

  // Sort by price (cheapest first)
  comparisonList.sort((a, b) => a.price - b.price);
  const cheapest = comparisonList.length > 0 ? comparisonList[0] : null;

  const output = {
    prices,
    comparisonList,
    cheapestPlatform: cheapest ? cheapest.name : null,
    cheapestPrice: cheapest ? cheapest.price : 0,
    liveCount: comparisonList.length,
    totalPlatforms: platformFetchers.length,
  };

  // Cache the result if we got at least one live price
  if (comparisonList.length > 0) {
    setCachedPrices(query, locationSeed, output);
  }

  return output;
}

/**
 * Helper: get the web search URL for a platform (used for deep-linking).
 */
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
