const app = require('./app');
const { PORT } = require('./config/env');
const { ensureYtDlp } = require('./services/youtubeService');
const { initAutoProxyRefresh } = require('./utils/proxyManager');

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🎵 Sangatamizh Music Backend Ready!`);
    
    // Async setup (non-blocking)
    ensureYtDlp().catch(err => console.error('YTDLP Setup Failed:', err));
    
    // Initialize Proxy Refresh System (non-blocking)
    initAutoProxyRefresh().catch(err => {
        console.warn('Proxy Init Failed:', err.message);
        console.log('Server will use direct connections');
    });
});
