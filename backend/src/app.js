const express = require('express');
const cors = require('cors');
const songRoutes = require('./routes/songRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const testRoutes = require('./routes/testRoutes');
const likeRoutes = require('./routes/likeRoutes');
const emotionRoutes = require('./routes/emotionRoutes');

const app = express();

app.use(cors({ 
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        return callback(null, true);
    },
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
