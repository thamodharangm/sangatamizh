const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { HttpsProxyAgent } = require('https-proxy-agent');

const CONFIG = {
  BATCH_SIZE: 150, // High concurrency for speed
  TEST_TIMEOUT: 3500, // 3.5 seconds max/proxy
  TEST_URL: 'https://www.youtube.com', 
  MAX_PROXIES: 120, 
  SOURCES: {
    PROXYSCRAPE_HTTP: 'https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=2000&country=all&simplified=true',
    PROXYSCRAPE_HTTPS: 'https://api.proxyscrape.com/v2/?request=getproxies&protocol=https&timeout=2000&country=all&simplified=true',
    GEONODE: 'https://proxylist.geonode.com/api/proxy-list?limit=500&page=1&sort_by=lastChecked&sort_type=desc&protocols=http%2Chttps'
  }
};

// Helper: Normalize proxy to "http://ip:port"
function normalizeProxy(proxy) {
  if (!proxy) return null;
  let url = proxy.trim();
  if (!url.startsWith('http')) {
    url = `http://${url}`;
  }
  return url;
}

// Fisher-Yates Shuffle
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Fetch proxies from all sources
 */
async function fetchRawProxies() {
  const allProxies = new Set();
  console.log('[ProxyFetcher] Fetching raw proxies from sources...');

  const fetchSource = async (url, name) => {
    try {
      const { data } = await axios.get(url, { timeout: 5000 });
      if (typeof data === 'string') {
        data.split('\n').forEach(line => {
          if (line.trim()) allProxies.add(normalizeProxy(line));
        });
      } else if (data && data.data) { // Geonode structure
        data.data.forEach(p => {
          allProxies.add(`http://${p.ip}:${p.port}`);
        });
      }
      console.log(`[ProxyFetcher] ${name}: Fetched.`);
    } catch (err) {
      console.warn(`[ProxyFetcher] Failed to fetch ${name}: ${err.message}`);
    }
  };

  await Promise.all([
    fetchSource(CONFIG.SOURCES.PROXYSCRAPE_HTTP, 'ProxyScrape HTTP'),
    fetchSource(CONFIG.SOURCES.PROXYSCRAPE_HTTPS, 'ProxyScrape HTTPS'),
    fetchSource(CONFIG.SOURCES.GEONODE, 'Geonode')
  ]);

  const list = Array.from(allProxies);
  console.log(`[ProxyFetcher] Total unique raw proxies fetched: ${list.length}`);
  return shuffle(list); // Randomize to avoid stuck clumps of bad proxies
}

/**
 * Test a single proxy
 */
async function testProxy(proxyUrl) {
  try {
    const agent = new HttpsProxyAgent(proxyUrl);
    const start = Date.now();
    await axios.get(CONFIG.TEST_URL, {
      httpsAgent: agent,
      timeout: CONFIG.TEST_TIMEOUT,
      validateStatus: status => status >= 200 && status < 400
    });
    const latency = Date.now() - start;
    return { url: proxyUrl, working: true, latency };
  } catch (err) {
    return { url: proxyUrl, working: false, error: err.message };
  }
}

/**
 * Main function to fetch, test, and filter proxies
 */
async function fetchAndTestProxies() {
  const rawList = await fetchRawProxies();
  const workingProxies = [];
  
  console.log(`[ProxyFetcher] Testing ${rawList.length} proxies (concurrent: ${CONFIG.BATCH_SIZE})...`);

  for (let i = 0; i < rawList.length; i += CONFIG.BATCH_SIZE) {
    if (workingProxies.length >= CONFIG.MAX_PROXIES) break;

    const batch = rawList.slice(i, i + CONFIG.BATCH_SIZE);
    const results = await Promise.all(batch.map(p => testProxy(p)));

    results.forEach(res => {
      if (res.working) {
        workingProxies.push(res);
        // Log immediately on find so user sees progress
        if (workingProxies.length % 10 === 0 || workingProxies.length === 1) {
             console.log(`[ProxyFetcher] Found ${workingProxies.length} working proxies so far...`);
        }
      }
    });

    if (i % 1000 === 0 && i > 0) {
      console.log(`[ProxyFetcher] Scanned ${i}/${rawList.length}...`);
    }
  }

  // Sort by latency (lowest first)
  workingProxies.sort((a, b) => a.latency - b.latency);

  const finalProxyList = workingProxies.slice(0, CONFIG.MAX_PROXIES).map(p => p.url);
  console.log(`[ProxyFetcher] Completed. Found ${workingProxies.length} total. Keeping top ${finalProxyList.length}.`);
  
  return finalProxyList;
}

module.exports = { fetchAndTestProxies };
