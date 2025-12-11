const { HttpsProxyAgent } = require('https-proxy-agent');
const { fetchAndTestProxies } = require('./proxyFetcher');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// CONFIG
const CONFIG = {
  REFRESH_INTERVAL_MS: 6 * 60 * 60 * 1000, // 6 hours
  COOLDOWN_MS: 30 * 60 * 1000, // 30 minutes
  PROXY_LIST_PATH: path.join(__dirname, 'proxyList.js')
};

// STATE
let proxyPool = []; // Array of proxy URLs
let currentIndex = 0;
let deadUntil = new Map(); // Map<proxyUrl, timestamp>
let lastRefreshTime = null;
let refreshTimer = null;

// Initial load from file if exists
try {
  if (fs.existsSync(CONFIG.PROXY_LIST_PATH)) {
    const savedList = require(CONFIG.PROXY_LIST_PATH);
    if (Array.isArray(savedList) && savedList.length > 0) {
      proxyPool = savedList;
      console.log(`[ProxyManager] Loaded ${proxyPool.length} proxies from local file.`);
    }
  }
} catch (e) {
  console.warn('[ProxyManager] Could not load local proxy list:', e.message);
}

/**
 * Initialize auto-refresh of proxies
 * @param {Object} options - { intervalMs, onRefreshComplete }
 */
async function initAutoProxyRefresh(options = {}) {
  const interval = options.intervalMs || CONFIG.REFRESH_INTERVAL_MS;

  console.log('[ProxyManager] Initializing auto-refresh system...');

  // Immediate fetch if pool is empty or very low
  if (proxyPool.length < 5) {
    await refreshPool();
  }

  // Set up interval
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(async () => {
    await refreshPool();
  }, interval);
}

/**
 * Fetch new proxies and update the pool
 */
async function refreshPool() {
  console.log('[ProxyManager] Refreshing proxy pool...');
  try {
    const newProxies = await fetchAndTestProxies();
    if (newProxies.length > 0) {
      proxyPool = newProxies;
      currentIndex = 0;
      deadUntil.clear();
      lastRefreshTime = Date.now();
      
      // Save to disk for persistence across restarts
      saveProxiesToDisk(newProxies);
      
      console.log(`[ProxyManager] Pool refreshed. New size: ${proxyPool.length}`);
    } else {
      console.warn('[ProxyManager] No working proxies found via fetch. Keeping existing pool.');
    }
  } catch (err) {
    console.error(`[ProxyManager] Refresh failed: ${err.message}`);
  }
}

/**
 * Save valid proxies to a local file
 */
function saveProxiesToDisk(proxies) {
  try {
    const content = `module.exports = ${JSON.stringify(proxies, null, 2)};\n`;
    fs.writeFileSync(CONFIG.PROXY_LIST_PATH, content, 'utf8');
    console.log('[ProxyManager] Saved proxy list to disk.');
  } catch (err) {
    console.error('[ProxyManager] Failed to save proxy list:', err.message);
  }
}

/**
 * Check if a proxy is currently cool (not dead)
 */
function isProxyReady(proxy) {
  const deadTime = deadUntil.get(proxy);
  if (deadTime && deadTime > Date.now()) {
    return false;
  }
  return true;
}

/**
 * Get the current HttpsProxyAgent
 * @param {boolean} forceRotate - Force moving to the next proxy
 */
function getProxyAgent(forceRotate = false) {
  if (proxyPool.length === 0) {
    console.warn('[ProxyManager] Pool is empty! Returning null (DIRECT).');
    return null; // Implies direct connection
  }

  if (forceRotate) {
    rotateProxy();
  }

  // Find a usable proxy
  let tried = 0;
  while (tried < proxyPool.length) {
    const proxy = proxyPool[currentIndex];
    
    if (isProxyReady(proxy)) {
      try {
        const agent = new HttpsProxyAgent(proxy);
        return agent;
      } catch (err) {
        console.error(`[ProxyManager] Invalid proxy URL ${proxy}: ${err.message}`);
        rotateProxy(); // Invalid URL, skip it
      }
    } else {
      // Current proxy is dead, try next
      rotateProxy(); 
    }
    tried++;
  }

  console.warn('[ProxyManager] All proxies are on cooldown or invalid! Returning null (DIRECT).');
  return null;
}

/**
 * Rotate to the next proxy in the list
 */
function rotateProxy() {
  const currentProxy = proxyPool[currentIndex];
  
  // Mark current as dead for a while if it exists
  if (currentProxy) {
    deadUntil.set(currentProxy, Date.now() + CONFIG.COOLDOWN_MS);
    // console.log(`[ProxyManager] Marked ${currentProxy} as dead until ${new Date(deadUntil.get(currentProxy)).toLocaleTimeString()}`);
  }

  // Move index
  currentIndex = (currentIndex + 1) % proxyPool.length;
  // console.log(`[ProxyManager] Rotated to index ${currentIndex}: ${proxyPool[currentIndex]}`);
}

/**
 * Get current proxy string
 */
function getCurrentProxyUrl() {
  if (proxyPool.length === 0) {
    return 'DIRECT';
  }
  return proxyPool[currentIndex];
}

module.exports = {
  initAutoProxyRefresh,
  getProxyAgent,
  rotateProxy,
  getCurrentProxyUrl
};
