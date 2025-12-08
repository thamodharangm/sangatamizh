import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { authenticate, AuthRequest } from '../middleware/auth';
import { uploadToGoogleDrive, isGoogleDriveConfigured } from '../services/googledrive.service';

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
 * POST /api/upload-legacy
 * Upload with Google Drive integration
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

    let storageKeys: any = {
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date().toISOString(),
    };

    // Upload to Google Drive if configured
    if (isGoogleDriveConfigured()) {
      try {
        console.log('Uploading to Google Drive...');
        const driveResult = await uploadToGoogleDrive(
          file.buffer,
          `${Date.now()}-${file.originalname}`,
          file.mimetype
        );
        
        storageKeys.googleDrive = {
          fileId: driveResult.fileId,
          webViewLink: driveResult.webViewLink,
        };
        
        console.log('✓ Uploaded to Google Drive:', driveResult.fileId);
      } catch (driveError: any) {
        console.error('Google Drive upload failed:', driveError.message);
        // Continue anyway, save metadata even if Drive upload fails
        storageKeys.driveError = driveError.message;
      }
    } else {
      console.warn('Google Drive not configured, saving metadata only');
    }

    // Save song metadata to database
    const song = await prisma.song.create({
      data: {
        title,
        artist: artist || 'Unknown Artist',
        album: album || null,
        genre: genre || null,
        storageKeys,
        status: 'ready',
        uploaderId: userId,
      },
    });

    res.json({
      success: true,
      message: storageKeys.googleDrive 
        ? 'Song uploaded successfully to Google Drive' 
        : 'Song metadata saved (Google Drive not configured)',
      song: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        genre: song.genre,
      },
      googleDrive: !!storageKeys.googleDrive,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: error.message || 'Upload failed',
    });
  }
});

export default router;
