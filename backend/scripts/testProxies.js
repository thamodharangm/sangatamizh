// Test script to verify ProxyManager logic
// Usage: node scripts/testProxies.js

const { initAutoProxyRefresh, getProxyAgent, rotateProxy, getCurrentProxyUrl } = require('../src/utils/proxyManager');
const axios = require('axios');

(async () => {
  console.log('--- Testing Proxy Manager ---');

  // 1. Initialize (will load from disk if available, or fetch)
  // We pass a very long interval so it doesn't loop during this short test
  await initAutoProxyRefresh({ intervalMs: 24 * 60 * 60 * 1000 });

  const startProxy = getCurrentProxyUrl();
  console.log('Current Proxy:', startProxy);

  if (startProxy === 'DIRECT' || !startProxy) {
    console.warn('WARNING: running in DIRECT mode. If you expected proxies, run "node scripts/fetchProxies.js" first.');
  }

  // 2. Perform a test request
  const agent = getProxyAgent();
  const testUrl = 'https://httpbin.org/ip'; // simple IP echo service

  console.log(`Testing request to ${testUrl}...`);
  try {
    const res = await axios.get(testUrl, {
      httpsAgent: agent || undefined,
      timeout: 10000
    });
    console.log('Response Status:', res.status);
    console.log('Response Data:', res.data);
  } catch (err) {
    console.error('Request failed:', err.message);
  }

  // 3. Test Rotation
  console.log('Testing rotation...');
  rotateProxy();
  const newProxy = getCurrentProxyUrl();
  console.log('New Proxy after rotation:', newProxy);

  if (startProxy === newProxy && startProxy !== 'DIRECT') {
    console.log('NOTE: Proxy did not change. Accessing the same proxy or only 1 proxy available.');
  }

  console.log('--- Test Complete ---');
  process.exit(0);
})();
