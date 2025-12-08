import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

/**
 * POST /api/upload
 * Simple direct upload endpoint
 */
router.post('/', authenticate, upload.single('audio'), async (req: Request, res: Response) => {
  try {
    const { title, artist, album, genre } = req.body;
    const userId = (req as AuthRequest).user?.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Save song metadata to database
    const song = await prisma.song.create({
      data: {
        title,
        artist: artist || 'Unknown Artist',
        album: album || null,
        genre: genre || null,
        storageKeys: {
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          uploadedAt: new Date().toISOString(),
        },
        status: 'ready',
        uploaderId: userId,
      },
    });

    res.json({
      success: true,
      message: 'Song uploaded successfully',
      song: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        genre: song.genre,
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: error.message || 'Upload failed',
    });
  }
});

export default router;
