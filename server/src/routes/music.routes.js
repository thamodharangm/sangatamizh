import { Router } from "express";
import { 
    listSongs, 
    streamSong, 
    uploadSong, 
    deleteSong, 
    getHomeSections, 
    getYTMeta, 
    uploadFromYoutube 
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

// YouTube Endpoints
router.post("/yt-metadata", getYTMeta);
router.post("/upload-from-yt", uploadFromYoutube);

// Analytics Dummies
router.post("/log-play", (req, res) => res.json({ ok: true }));
router.post("/analytics/login", (req, res) => res.json({ ok: true }));
router.get("/analytics/stats", (req, res) => res.json({ 
    totalLogins: 42, 
    totalSongs: 10, 
    activeUsers: 5, 
    chartData: [
        { date: "2024-01-01", logins: 5 },
        { date: "2024-01-02", logins: 8 },
        { date: "2024-01-03", logins: 12 }
    ] 
}));

export default router;
