import './workers/videoWorker.js';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Recreate __dirname functionality for standard ES Module environments
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Enable clean CORS stream handshakes for dynamic HLS chunk delivery
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Range');
  }
}));

// Import routing structures cleanly via ES Module paths
import authRoutes from './features/users/userRoutes.js';
import courseRoutes from './features/courses/courseRoutes.js';
import quizRoutes from './features/quizzes/quizRoutes.js';
import liveRoutes from './features/live/liveRoutes.js';
import revenueRoutes from './features/revenue/revenueRoutes.js';

// Routes mapping layout matrix
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/revenue', revenueRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms')
  .then(() => {
    console.log('MongoDB Connected successfully');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('Database connection error:', err));
