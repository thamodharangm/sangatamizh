import fs from "fs";
import path from "path";
import { streamFile } from "../utils/streamFile.js";
import { getYouTubeMetadata, streamYouTubeAudio } from "../services/youtube.service.js";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const DB_PATH = path.join(process.cwd(), "src", "songs.json");

// Ensure directories and files exist
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));

const getSongs = () => {
    try {
        const data = fs.readFileSync(DB_PATH, "utf8");
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

const saveSongs = (songs) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(songs, null, 2));
}

export const listSongs = async (req, res) => {
  res.json(getSongs());
};

export const getHomeSections = async (req, res) => {
    const songs = getSongs();
    res.json({
        trending: songs.slice(0, 5),
        hits: songs.slice().reverse().slice(0, 5),
        recent: songs.slice(2, 7)
    });
};

export const getYTMeta = async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: "URL required" });
        const meta = await getYouTubeMetadata(url);
        res.json(meta);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const uploadFromYoutube = async (req, res) => {
    try {
        const { url, title, artist, category, emotion, coverUrl } = req.body;
        if (!url) return res.status(400).json({ error: "URL required" });

        const songs = getSongs();
        const newSong = {
            id: 'yt_' + Date.now().toString(),
            title: title || "YouTube Song",
            artist: artist || "YouTube",
            category: category || "Tamil",
            emotion: emotion || "Neutral",
            url: url, // Store full YT url for streaming
            cover_url: coverUrl || "https://i.ytimg.com/vi/placeholder/hqdefault.jpg",
            is_youtube: true,
            created_at: new Date().toISOString()
        };

        songs.push(newSong);
        saveSongs(songs);
        res.json({ ok: true, song: newSong });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const streamSong = async (req, res) => {
  const songs = getSongs();
  const song = songs.find(s => s.id === req.params.id || s.id == req.params.id);
  
  if (!song) return res.sendStatus(404);
  
  // Handle YouTube Stream
  if (song.is_youtube || song.url.includes('youtube.com') || song.url.includes('youtu.be')) {
      return streamYouTubeAudio(song.url, req, res);
  }

  const filePath = path.join(process.cwd(), song.url);
  if (!fs.existsSync(filePath)) return res.sendStatus(404);
  
  streamFile(req, res, filePath);
};

export const uploadSong = async (req, res) => {
  try {
    const audioFile = req.files['audio'] ? req.files['audio'][0] : null;
    const coverFile = req.files['cover'] ? req.files['cover'][0] : null;
    
    if (!audioFile) return res.status(400).json({ error: "No audio file" });

    const { title, artist, album, category, emotion } = req.body;
    
    const songs = getSongs();
    const newSong = {
        id: Date.now().toString(),
        title: title || audioFile.originalname,
        artist: artist || "Unknown Artist",
        album: album || "Single",
        category: category || "General",
        emotion: emotion || "Neutral",
        url: `uploads/${audioFile.filename}`,
        cover_url: coverFile ? `uploads/${coverFile.filename}` : "https://via.placeholder.com/500",
        created_at: new Date().toISOString()
    };

    songs.push(newSong);
    saveSongs(songs);

    res.json({ ok: true, song: newSong });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during upload" });
  }
};

export const deleteSong = async (req, res) => {
    const { id } = req.params;
    let songs = getSongs();
    const song = songs.find(s => s.id === id);

    if (!song) return res.status(404).json({ error: "Song not found" });

    // Delete files
    try {
        const audioPath = path.join(process.cwd(), song.url);
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        
        if (song.cover_url && song.cover_url.startsWith("uploads/")) {
            const coverPath = path.join(process.cwd(), song.cover_url);
            if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
        }
    } catch (e) {
        console.warn("Error deleting files:", e);
    }

    songs = songs.filter(s => s.id !== id);
    saveSongs(songs);
    res.json({ ok: true });
};
