// Standalone script to fetch proxies and save them to utils/proxyList.js
// Usage: node scripts/fetchProxies.js

const path = require('path');
const fs = require('fs');
const { fetchAndTestProxies } = require('../src/utils/proxyFetcher');

const OUTPUT_PATH = path.join(__dirname, '../src/utils/proxyList.js');

(async () => {
  try {
    console.log('--- Starting Manual Proxy Fetch ---');
    const proxies = await fetchAndTestProxies();
    
    if (proxies.length > 0) {
      const content = `module.exports = ${JSON.stringify(proxies, null, 2)};\n`;
      fs.writeFileSync(OUTPUT_PATH, content, 'utf8');
      console.log(`Successfully saved ${proxies.length} proxies to ${OUTPUT_PATH}`);
    } else {
      console.error('No working proxies found. File not updated.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Fatal Error:', err);
    process.exit(1);
  }
})();
