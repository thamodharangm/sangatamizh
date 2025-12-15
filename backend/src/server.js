const app = require('./app');
const { PORT } = require('./config/env');
const { ensureYtDlp } = require('./services/youtubeService');
const { initAutoProxyRefresh } = require('./utils/proxyManager');
const { exec } = require('child_process');

console.log('🚀 Starting Backend...');

// Runtime Database Migration Helper
const runMigration = () => new Promise((resolve) => {
    console.log('📦 Running Database Migration (prisma db push)...');
    exec('npx prisma db push --accept-data-loss', (error, stdout, stderr) => {
        if (error) {
            console.warn('⚠️ Migration Warning:', stderr);
        } else {
            console.log('✅ Database Tables Synced:', stdout);
        }
        resolve(); // Continue starting server regardless
    });
});

runMigration().then(() => {
    app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`🎵 Sangatamizh Music Backend Ready!`);
        
        // Async setup (non-blocking)
        ensureYtDlp().catch(err => console.error('YTDLP Setup Failed:', err));
        
        // Initialize Proxy Refresh System (non-blocking)
        // Initialize Proxy Refresh System (non-blocking, delayed)
        setTimeout(() => {
            initAutoProxyRefresh().catch(err => {
                console.warn('Proxy Init Failed:', err.message);
                console.log('Server will use direct connections');
            });
        }, 5000);
    });
});