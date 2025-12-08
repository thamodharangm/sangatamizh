import express from 'express';
import { getAllSongs, uploadSong, importFromYoutube } from '../controllers/songController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', getAllSongs);

// Uploads - Protected (Admin only?)
router.post('/upload', verifyToken, verifyAdmin, upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), uploadSong);

router.post('/youtube-import', verifyToken, verifyAdmin, importFromYoutube);

export default router;
