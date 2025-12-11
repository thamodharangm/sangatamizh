const app = require('./app');
const { PORT } = require('./config/env');
const { ensureYtDlp } = require('./services/youtubeService');
const { initAutoProxyRefresh } = require('./utils/proxyManager');

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Async setup
    ensureYtDlp().catch(err => console.error('YTDLP Setup Failed:', err));
    
    // Initialize Proxy Refresh System
    initAutoProxyRefresh().catch(err => console.error('Proxy Init Failed:', err));
});
