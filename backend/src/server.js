const app = require('./app');
const { PORT } = require('./config/env');
const { ensureYtDlp } = require('./services/youtubeService');
const { initAutoProxyRefresh } = require('./utils/proxyManager');
const { exec } = require('child_process');

console.log('🚀 Starting Backend...');

// Start Server Immediately
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🎵 Sangatamizh Music Backend Ready!`);
    
    // Async setup (non-blocking)
    ensureYtDlp().catch(err => console.error('YTDLP Setup Failed:', err));
    
    // Initialize Proxy Refresh System (non-blocking, delayed)
    setTimeout(() => {
        initAutoProxyRefresh().catch(err => {
            console.warn('Proxy Init Failed:', err.message);
            console.log('Server will use direct connections');
        });
    }, 5000);
});