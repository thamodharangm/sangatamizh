const express = require('express');
const axios = require('axios');
const { getProxyAgent, rotateProxy, getCurrentProxyUrl } = require('../utils/proxyManager');

const router = express.Router();

// Helper to perform request with retries
async function fetchWithProxy(url, retries = 1) {
  let attempt = 0;
  
  while (attempt <= retries) {
    const proxyAgent = getProxyAgent(attempt > 0); // Rotate on retry
    const currentProxy = getCurrentProxyUrl();
    
    // Headers setup (Example: mimic actual browser)
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };
    
    // Optional: Add Cookie if env var is set (DO NOT log this)
    if (process.env.YOUTUBE_COOKIES) {
      headers['Cookie'] = process.env.YOUTUBE_COOKIES;
    }

    console.log(`[YouTubeRoute] Attempt ${attempt + 1}: Fetching via ${currentProxy || 'DIRECT'}...`);

    try {
      const response = await axios.get(url, {
        httpsAgent: proxyAgent || undefined, // undefined means use default (direct)
        headers: headers,
        timeout: 15000 // 15 seconds timeout
      });
      
      return {
        success: true,
        data: response.data,
        proxyUsed: currentProxy || 'DIRECT'
      };

    } catch (err) {
      console.warn(`[YouTubeRoute] Failed via ${currentProxy || 'DIRECT'}: ${err.message}`);
      
      // If we used a proxy and it failed, rotate it out for next time
      if (proxyAgent) {
        rotateProxy();
      }
      
      attempt++;
    }
  }

  throw new Error('All attempts failed');
}

// Example Endpoint
router.get('/test-proxy', async (req, res) => {
  const videoUrl = req.query.url || 'https://www.youtube.com';

  try {
    const result = await fetchWithProxy(videoUrl, 1);
    
    // We don't return the full HTML usually, just metadata, but for this 'test' we return some info
    res.json({
      status: 'success',
      proxy_used: result.proxyUsed,
      message: 'Successfully fetched page',
      preview: result.data.substring(0, 100) + '...'
    });

  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch video page after retries',
      detail: err.message
    });
  }
});

module.exports = router;
