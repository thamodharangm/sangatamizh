import { Router } from "express";
import { 
    listSongs, 
    streamSong, 
    uploadSong, 
    deleteSong, 
    getHomeSections, 
    getYTMeta, 
    uploadFromYoutube,
    logPlay,
    logLogin,
    getAnalyticsStats,
    getLyrics,
    updateSong,
    initializeEmotions,
    bulkUpdateEmotions
} from "../controllers/music.controller.js";
import multer from "multer";
import path from "path";

// Setup multer for storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const router = Router();

// Endpoint: /api/songs
router.get("/songs", listSongs);

// Endpoint: /api/home-sections
router.get("/home-sections", getHomeSections);

// Endpoint: /api/stream/:id
router.get("/stream/:id", streamSong);

// Endpoint: /api/upload-file
router.post("/upload-file", upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), uploadSong);

// Endpoint: /api/songs/:id
router.delete("/songs/:id", deleteSong);
router.put("/songs/:id", updateSong);

// Emotion Endpoints
router.post("/emotions/initialize", initializeEmotions);
router.post("/emotions/bulk-update", bulkUpdateEmotions);

// YouTube Endpoints
router.post("/yt-metadata", getYTMeta);
router.post("/upload-from-yt", uploadFromYoutube);

// Endpoint: /api/log-play
router.post("/log-play", logPlay);

// Endpoint: /api/lyrics
router.get("/lyrics", getLyrics);

router.post("/analytics/login", logLogin);
router.get("/analytics/stats", getAnalyticsStats);

// ========== LIKES ENDPOINTS (CLOUDBE READY) ==========
import likesService from "../services/likes.service.js";

// GET /api/likes/ids?userId=xxx - Array of liked IDs
router.get("/likes/ids", async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: "userId required" });
        const ids = await likesService.getLikedIds(userId);
        res.json(ids);
    } catch (e) {
        res.status(500).json({ error: "Server error" });
    }
});

// POST /api/likes/toggle - Toggle single like
router.post("/likes/toggle", async (req, res) => {
    try {
        const { userId, songId } = req.body;
        if (!userId || !songId) return res.status(400).json({ error: "userId and songId required" });
        const result = await likesService.toggleLike(userId, songId);
        res.json({ ok: true, ...result });
    } catch (e) {
        res.status(500).json({ error: "Toggle failed" });
    }
});

// GET /api/likes/songs?userId=xxx - Full song objects for individual playlist
router.get("/likes/songs", async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: "userId required" });
        const songs = await likesService.getUserLikedSongs(userId);
        res.json(songs);
    } catch (e) {
        res.status(500).json({ error: "Fetch failed" });
    }
});

// ========== PLAYLIST ENDPOINTS ==========
import { 
  getUserPlaylists, 
  createPlaylist, 
  addSongToPlaylist, 
  removeSongFromPlaylist, 
  deletePlaylist 
} from "../controllers/playlistController.js";

router.get("/playlists", getUserPlaylists);
router.post("/playlists", createPlaylist);
router.put("/playlists", addSongToPlaylist); // Alias for App.jsx compatibility
router.put("/playlists/add", addSongToPlaylist);
router.put("/playlists/remove", removeSongFromPlaylist);
router.delete("/playlists/:id", deletePlaylist);

export default router;
