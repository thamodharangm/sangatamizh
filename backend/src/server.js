const app = require('./app');
const { PORT } = require('./config/env');
const { ensureYtDlp } = require('./services/youtubeService');
const { exec } = require('child_process');

console.log('🚀 Starting Backend...');

// Start Server Immediately
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🎵 Sangatamizh Music Backend Ready!`);
    
    // Async setup (non-blocking)
    ensureYtDlp().catch(err => console.error('YTDLP Setup Failed:', err));
    
    console.log('Skipping generic proxy fetcher to save resources.');
});