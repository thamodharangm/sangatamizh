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
});   const express = require('express');
const cors = require('cors');
const songRoutes = require('./routes/songRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const testRoutes = require('./routes/testRoutes');
const likeRoutes = require('./routes/likeRoutes');
const emotionRoutes = require('./routes/emotionRoutes');

const app = express();

app.use(cors({ 
    origin: [
        'http://localhost:5173', 
        'https://sangatamizh-music-premium.vercel.app'
    ],
    credentials: true
}));
app.use(express.json());

// Mount Routes
app.use('/api', songRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/test', testRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/emotions', emotionRoutes);

// Health Check
app.get('/', (req, res) => res.send('Sangatamizh Music Backend v2'));

module.exports = app;
 