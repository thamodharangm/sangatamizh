const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const songRoutes = require('./routes/songRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const testRoutes = require('./routes/testRoutes');
const likeRoutes = require('./routes/likeRoutes');
const emotionRoutes = require('./routes/emotionRoutes');
const debugRoutes = require('./routes/debugRoutes');

const app = express();

// Trust proxy for Render/Vercel (deployment)
app.set('trust proxy', 1); // Trust the first proxy

const allowedOrigins = [
  'http://localhost:5175',
  'http://localhost:5174',
  'http://localhost:5173',
  'https://sangatamizh.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({ 
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, curl, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range']
}));
app.use(express.json());

// Rate Limiting Configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per 15 minutes (increased from 100)
  message: { error: 'Too many requests from this IP, please try again later' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    console.warn(`[Rate Limit] IP ${req.ip} exceeded API limit`);
    res.status(429).json({ error: 'Too many requests, please try again later' });
  }
});

const streamLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 stream requests per minute (increased from 30)
  message: { error: 'Streaming rate limit exceeded' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`[Rate Limit] IP ${req.ip} exceeded streaming limit`);
    res.status(429).json({ error: 'Too many streaming requests, please slow down' });
  }
});

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/stream/', streamLimiter);

// Mount Routes
app.use('/api', songRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/test', testRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/emotions', emotionRoutes);
app.use('/api/debug', debugRoutes);

// Health Check
app.get('/', (req, res) => res.send('Sangatamizh Music Backend v2'));

module.exports = app;
