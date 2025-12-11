# Proxy Management System for YouTube Downloads

This system fetches, tests, and rotates free public proxies to bypass YouTube's bot detection.

## Quick Start

1. **Install Dependencies** (if not already done):

   ```bash
   npm install axios https-proxy-agent node-schedule
   ```

2. **Fetch Initial Proxies**:
   Run this script to populate `src/utils/proxyList.js` with working proxies.

   ```bash
   node scripts/fetchProxies.js
   ```

3. **Verify Configuration**:
   Run the test script to ensure proxies are being used and rotated.

   ```bash
   node scripts/testProxies.js
   ```

4. **Integration**:
   The system is automatically initialized in `src/server.js`.
   It refreshes the pool every 6 hours.

## Configuration

You can customize behavior in `src/utils/proxyFetcher.js` and `src/utils/proxyManager.js`.

- **BATCH_SIZE**: Number of proxies to test concurrently (default: 20).
- **MAX_PROXIES**: Max number of working proxies to keep (default: 120).
- **REFRESH_INTERVAL_MS**: How often to fetch new proxies (default: 6 hours).
- **COOLDOWN_MS**: How long to ban a failed proxy (default: 30 mins).

## Usage in Code

To use a proxy in your routes:

```javascript
const { getProxyAgent, rotateProxy } = require("../utils/proxyManager");
const axios = require("axios");

async function download(url) {
  try {
    const agent = getProxyAgent(); // Get current working proxy
    const res = await axios.get(url, { httpsAgent: agent });
    return res.data;
  } catch (err) {
    rotateProxy(); // Mark current as bad and rotate
    // Retry...
  }
}
```

## Environment Variables

- `YOUTUBE_COOKIES`: (Optional) String of cookies to pass to YouTube requests.
