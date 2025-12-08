import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: Function) => {
  const user = (req as AuthRequest).user;
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', authenticate, isAdmin, async (req: Request, res: Response) => {
  try {
    const totalSongs = await prisma.song.count();
    const totalUsers = await prisma.user.count();
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentUploads = await prisma.song.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    });

    res.json({
      totalSongs,
      totalUsers,
      recentUploads,
      storageUsed: '0 MB' // TODO: Calculate from Google Drive
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/admin/songs
 * List all songs with pagination and search
 */
router.get('/songs', authenticate, isAdmin, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', search = '', status = 'all' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { artist: { contains: search as string, mode: 'insensitive' } },
        { album: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (status !== 'all') {
      where.status = status;
    }

    const [songs, total] = await Promise.all([
      prisma.song.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          uploader: {
            select: {
              id: true,
              displayName: true,
              email: true
            }
          }
        }
      }),
      prisma.song.count({ where })
    ]);

    res.json({
      songs,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error: any) {
    console.error('List songs error:', error);
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
});

/**
 * GET /api/admin/songs/:id
 * Get single song details
 */
router.get('/songs/:id', authenticate, isAdmin, async (req: Request, res: Response) => {
  try {
    const song = await prisma.song.findUnique({
      where: { id: req.params.id },
      include: {
        uploader: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      }
    });

    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    res.json(song);
  } catch (error: any) {
    console.error('Get song error:', error);
    res.status(500).json({ error: 'Failed to fetch song' });
  }
});

/**
 * PUT /api/admin/songs/:id
 * Update song metadata
 */
router.put('/songs/:id', authenticate, isAdmin, async (req: Request, res: Response) => {
  try {
    const { title, artist, album, genre, status } = req.body;

    const song = await prisma.song.update({
      where: { id: req.params.id },
      data: {
        title,
        artist,
        album,
        genre,
        status
      }
    });

    res.json({
      message: 'Song updated successfully',
      song
    });
  } catch (error: any) {
    console.error('Update song error:', error);
    res.status(500).json({ error: 'Failed to update song' });
  }
});

/**
 * DELETE /api/admin/songs/:id
 * Delete a song
 */
router.delete('/songs/:id', authenticate, isAdmin, async (req: Request, res: Response) => {
  try {
    // TODO: Delete from Google Drive as well
    await prisma.song.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Song deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete song error:', error);
    res.status(500).json({ error: 'Failed to delete song' });
  }
});

/**
 * GET /api/admin/uploads
 * Get upload history
 */
router.get('/uploads', authenticate, isAdmin, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', status = 'all' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status !== 'all') {
      where.status = status;
    }

    const [uploads, total] = await Promise.all([
      prisma.song.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          artist: true,
          status: true,
          createdAt: true,
          uploader: {
            select: {
              displayName: true,
              email: true
            }
          },
          storageKeys: true
        }
      }),
      prisma.song.count({ where })
    ]);

    res.json({
      uploads,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error: any) {
    console.error('Get uploads error:', error);
    res.status(500).json({ error: 'Failed to fetch uploads' });
  }
});

export default router;
