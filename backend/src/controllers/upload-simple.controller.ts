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
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

/**
 * POST /api/upload/direct
 * Direct upload through backend (simpler, works immediately)
 */
router.post('/direct', authenticate, upload.single('file'), async (req: Request, res: Response) => {
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

    // For now, just save metadata without actual file storage
    // This allows testing the upload flow
    const song = await prisma.song.create({
      data: {
        title,
        artist: artist || 'Unknown Artist',
        album: album || null,
        genre: genre || null,
        storageKeys: {
          original: `temp/${Date.now()}-${file.originalname}`,
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        },
        status: 'ready',
        uploaderId: userId,
      },
    });

    res.json({
      message: 'Upload successful',
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

/**
 * GET /api/upload/info
 * Get upload configuration info
 */
router.get('/info', (req: Request, res: Response) => {
  res.json({
    allowedAudioTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac'],
    maxAudioSize: 50 * 1024 * 1024, // 50MB
    uploadMethod: 'direct', // Using direct upload for now
  });
});

export default router;
