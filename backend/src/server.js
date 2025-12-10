const app = require('./app');
const { PORT } = require('./config/env');
const { ensureYtDlp } = require('./services/youtubeService');

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Async setup
    ensureYtDlp().catch(err => console.error('YTDLP Setup Failed:', err));
});
