const cors = require('cors');

const corsOptions = {
    origin: '*', // For production, replace with specific domain
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
    credentials: true,
};

module.exports = cors(corsOptions);
