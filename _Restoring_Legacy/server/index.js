import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sangtamizh';

// Retry connection logic for Docker startup timing
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error, retrying in 5s:', err);
    setTimeout(connectDB, 5000);
  }
};
connectDB();

// Routes
import authRoutes from './routes/auth.js';
import songRoutes from './routes/songs.js';

app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'Sangtamizh Music API v1.0' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
