import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  validateFileSize,
  ALLOWED_AUDIO_TYPES,
  ALLOWED_IMAGE_TYPES,
} from '../services/s3.service';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/upload/presign
 * Generate presigned URL for file upload
 * Query params: filename, contentType, fileType (audio|image), contentLength
 */
router.get('/presign', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { filename, contentType, fileType = 'audio', contentLength } = req.query;

    // Validate required parameters
    if (!filename || !contentType) {
      return res.status(400).json({
        error: 'Missing required parameters: filename, contentType',
      });
    }

    // Validate file size
    if (contentLength) {
      try {
        validateFileSize(Number(contentLength), fileType as 'audio' | 'image');
      } catch (error: any) {
        return res.status(400).json({ error: error.message });
      }
    }

    // Generate presigned URL
    const result = await generatePresignedUploadUrl(
      filename as string,
      contentType as string,
      fileType as 'audio' | 'image'
    );

    res.json({
      uploadUrl: result.uploadUrl,
      key: result.key,
      expiresIn: result.expiresIn,
      message: 'Upload URL generated successfully',
    });
  } catch (error: any) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate upload URL',
    });
  }
});

/**
 * POST /api/upload/complete
 * Mark upload as complete and create song record
 * Body: { key, title, artist, album, duration, genre }
 */
router.post('/complete', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { key, title, artist, album, duration, genre } = req.body;
    const userId = (req as any).user.userId;

    // Validate required fields
    if (!key || !title) {
      return res.status(400).json({
        error: 'Missing required fields: key, title',
      });
    }

    // Create song record in database
    const song = await prisma.song.create({
      data: {
        title,
        artist: artist || 'Unknown Artist',
        album: album || null,
        duration: duration ? parseInt(duration) : null,
        genre: genre || null,
        storageKey: key,
        status: 'ready',
        uploadedById: userId,
      },
    });

    res.json({
      message: 'Upload completed successfully',
      song: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        storageKey: song.storageKey,
      },
    });
  } catch (error: any) {
    console.error('Error completing upload:', error);
    res.status(500).json({
      error: error.message || 'Failed to complete upload',
    });
  }
});

/**
 * GET /api/upload/stream/:songId
 * Get presigned URL for streaming a song
 */
router.get('/stream/:songId', async (req: Request, res: Response) => {
  try {
    const { songId } = req.params;

    // Get song from database
    const song = await prisma.song.findUnique({
      where: { id: songId },
    });

    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    if (!song.storageKey) {
      return res.status(404).json({ error: 'Song file not available' });
    }

    // Generate presigned download URL
    const streamUrl = await generatePresignedDownloadUrl(song.storageKey, 3600); // 1 hour

    res.json({
      streamUrl,
      song: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        duration: song.duration,
      },
    });
  } catch (error: any) {
    console.error('Error generating stream URL:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate stream URL',
    });
  }
});

/**
 * GET /api/upload/info
 * Get upload configuration info
 */
router.get('/info', (req: Request, res: Response) => {
  res.json({
    allowedAudioTypes: ALLOWED_AUDIO_TYPES,
    allowedImageTypes: ALLOWED_IMAGE_TYPES,
    maxAudioSize: 50 * 1024 * 1024, // 50MB
    maxImageSize: 5 * 1024 * 1024, // 5MB
    presignedUrlTTL: 300, // 5 minutes
  });
});

export default router;
