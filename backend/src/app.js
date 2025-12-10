const express = require('express');
const cors = require('cors');
const songRoutes = require('./routes/songRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const testRoutes = require('./routes/testRoutes');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Mount Routes
app.use('/api', songRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/test', testRoutes);

// Health Check
app.get('/', (req, res) => res.send('Sangatamizh Music Backend v2'));

module.exports = app;
