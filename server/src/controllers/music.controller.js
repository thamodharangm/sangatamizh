import fs from "fs";
import path from "path";
import { streamFile } from "../utils/streamFile.js";
import { getYouTubeMetadata, streamYouTubeAudio } from "../services/youtube.service.js";
import lyricsFinder from 'lyrics-finder';

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
    try {
        const { userId } = req.query;
        const songs = getSongs();
        
        let analytics = { plays: [] };
        try {
            const analyticsPath = path.join(process.cwd(), "src", "analytics.json");
            if (fs.existsSync(analyticsPath)) {
                analytics = JSON.parse(fs.readFileSync(analyticsPath, "utf8"));
            }
        } catch (err) {}

        // Smart Trending: Calculate play counts
        const playCounts = {};
        if (analytics.plays) {
            analytics.plays.forEach(p => {
                playCounts[p.songId] = (playCounts[p.songId] || 0) + 1;
            });
        }

        const trending = [...songs].sort((a, b) => (playCounts[b.id] || 0) - (playCounts[a.id] || 0)).slice(0, 10);
        
        // Smart Recent: Last 10 songs played by user
        const userRecentIds = analytics.plays
            .filter(p => p.userId === userId)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(p => p.songId);
        
        // Get unique recent songs in order
        const uniqueRecentIds = [...new Set(userRecentIds)].slice(0, 10);
        const recent = uniqueRecentIds.map(id => songs.find(s => s.id === id)).filter(Boolean);

        // Ensure analytics.plays exists even after JSON parse
        if (!analytics.plays) analytics.plays = [];

        res.json({
            trending: trending.length > 0 ? trending : songs.slice(0, 10),
            recent: recent
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getYTMeta = async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: "URL required" });
        const meta = await getYouTubeMetadata(url);
        
        // Auto-fetch lyrics
        try {
            const lyrics = await lyricsFinder(meta.artist, meta.title) || "";
            meta.lyrics = lyrics;
        } catch (e) {
            meta.lyrics = "";
        }

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
            lyrics: req.body.lyrics || "",
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
  
  if (!song) {
      console.log(`[Stream] Song not found for ID: ${req.params.id}`);
      return res.sendStatus(404);
  }
  
  console.log(`[Stream] Request for: ${song.title} (${song.id})`);

  // Handle YouTube Stream
  if (song.is_youtube || song.url.includes('youtube.com') || song.url.includes('youtu.be')) {
      return streamYouTubeAudio(song.url, req, res);
  }

  const filePath = path.join(process.cwd(), song.url);
  if (!fs.existsSync(filePath)) {
      console.log(`[Stream] File not found: ${filePath}`);
      return res.sendStatus(404);
  }
  
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

export const logPlay = async (req, res) => {
    try {
        const { userId, songId } = req.body;
        if (!userId || !songId) return res.status(400).json({ error: "Missing UserId or SongId" });

        const analyticsPath = path.join(process.cwd(), "src", "analytics.json");
        let analytics = { plays: [], logins: [] };

        if (fs.existsSync(analyticsPath)) {
            try {
                analytics = JSON.parse(fs.readFileSync(analyticsPath, "utf8"));
                if (!analytics.logins) analytics.logins = [];
                if (!analytics.plays) analytics.plays = [];
            } catch (e) { analytics = { plays: [], logins: [] }; }
        }

        analytics.plays.push({ userId, songId, date: new Date().toISOString() });
        if (analytics.plays.length > 1000) analytics.plays = analytics.plays.slice(-1000);

        fs.writeFileSync(analyticsPath, JSON.stringify(analytics, null, 2));
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const logLogin = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: "UserId required" });

        const analyticsPath = path.join(process.cwd(), "src", "analytics.json");
        let analytics = { logins: [], plays: [] };

        if (fs.existsSync(analyticsPath)) {
            try {
                analytics = JSON.parse(fs.readFileSync(analyticsPath, "utf8"));
                if (!analytics.logins) analytics.logins = [];
                if (!analytics.plays) analytics.plays = [];
            } catch (e) { /* silent */ }
        }

        analytics.logins.push({ userId, date: new Date().toISOString() });
        if (analytics.logins.length > 1000) analytics.logins = analytics.logins.slice(-1000);

        fs.writeFileSync(analyticsPath, JSON.stringify(analytics, null, 2));
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAnalyticsStats = async (req, res) => {
    try {
        const songs = getSongs();
        const analyticsPath = path.join(process.cwd(), "src", "analytics.json");
        let analytics = { logins: [], plays: [] };

        if (fs.existsSync(analyticsPath)) {
            try {
                analytics = JSON.parse(fs.readFileSync(analyticsPath, "utf8"));
                if (!analytics.logins) analytics.logins = [];
                if (!analytics.plays) analytics.plays = [];
            } catch (e) { /* silent */ }
        }

        const totalLogins = analytics.logins.length;
        const totalPlays = analytics.plays.length;
        const totalSongs = songs.length;

        // Active Users (24h)
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const activeUsersCount = new Set(
            analytics.logins
                .filter(l => l.date >= last24h)
                .map(l => l.userId)
        ).size;

        // Chart Data (Last 7 days logins)
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const count = analytics.logins.filter(l => l.date.split('T')[0] === dateStr).length;
            chartData.push({ date: dateStr, logins: count });
        }

        // Top Played
        const playCounts = {};
        analytics.plays.forEach(p => {
            playCounts[p.songId] = (playCounts[p.songId] || 0) + 1;
        });

        const topPlayed = Object.entries(playCounts)
            .map(([id, count]) => {
                const song = songs.find(s => s.id === id);
                return { 
                    title: song ? song.title : 'Deleted Song', 
                    artist: song ? song.artist : 'Unknown', 
                    count 
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Top Liked
        const likesPath = path.join(process.cwd(), "src", "likes.json");
        let likesData = {};
        if (fs.existsSync(likesPath)) {
            try {
                likesData = JSON.parse(fs.readFileSync(likesPath, "utf8"));
            } catch (e) {}
        }
        
        const songLikes = {};
        Object.values(likesData).forEach(userLikes => {
            if (Array.isArray(userLikes)) {
                userLikes.forEach(songId => {
                    songLikes[songId] = (songLikes[songId] || 0) + 1;
                });
            }
        });
        
        const topLiked = Object.entries(songLikes)
            .map(([id, count]) => {
                const song = songs.find(s => s.id === id);
                return { 
                    title: song ? song.title : 'Deleted Song', 
                    artist: song ? song.artist : 'Unknown', 
                    count 
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        res.json({
            totalLogins,
            totalSongs,
            totalPlays,
            activeUsers: activeUsersCount,
            chartData,
            topPlayed,
            topLiked
        });
    } catch (err) {
        console.error("Analytics error:", err);
        res.status(500).json({ error: err.message });
    }
};

// Get lyrics for a song
export const getLyrics = async (req, res) => {
    try {
        const { title, artist } = req.query;
        
        if (!title || !artist) {
            return res.status(400).json({ error: "Title and artist are required" });
        }

        console.log(`[Lyrics] Searching for: ${title} by ${artist}`);
        
        // Clean up title and artist for better search results
        const cleanTitle = title
            .replace(/\(.*?\)/g, '') // Remove parentheses content
            .replace(/\[.*?\]/g, '') // Remove bracket content
            .replace(/Video Song|Official|Music Video|HD|4K|8K|Lyric/gi, '')
            .replace(/\|.*$/g, '') // Remove everything after pipe
            .trim();
        
        const cleanArtist = artist
            .replace(/Official|Music|Channel|VEVO|Records|Films/gi, '')
            .trim();
        
        console.log(`[Lyrics] Clean search: "${cleanTitle}" by "${cleanArtist}"`);
        
        // Try with cleaned values first
        let lyrics = await lyricsFinder(cleanArtist, cleanTitle);
        
        // If no results, try with original values
        if (!lyrics) {
            lyrics = await lyricsFinder(artist, title);
        }
        
        // If still no results, try just the title
        if (!lyrics) {
            lyrics = await lyricsFinder("", cleanTitle);
        }
        
        if (lyrics) {
            console.log(`[Lyrics] Found lyrics (${lyrics.length} chars)`);
            res.json({ lyrics });
        } else {
            console.log(`[Lyrics] No lyrics found`);
            res.json({ lyrics: "Lyrics not found." });
        }
    } catch (err) {
        console.error("[Lyrics] Error:", err.message);
        res.status(500).json({ error: "Failed to fetch lyrics", details: err.message });
    }
};

export const updateSong = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, artist, category, emotion, lyrics } = req.body;
        
        const songs = getSongs();
        const index = songs.findIndex(s => s.id === id);
        if (index === -1) return res.status(404).json({ error: "Song not found" });

        songs[index] = {
            ...songs[index],
            title: title || songs[index].title,
            artist: artist || songs[index].artist,
            category: category || songs[index].category,
            emotion: emotion || songs[index].emotion,
            lyrics: lyrics !== undefined ? lyrics : songs[index].lyrics,
        };

        saveSongs(songs);
        res.json({ ok: true, song: songs[index] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const initializeEmotions = async (req, res) => {
    try {
        const songs = getSongs();
        let updatedCount = 0;
        const updatedSongs = songs.map(song => {
            if (!song.emotion) {
                updatedCount++;
                return { ...song, emotion: 'Feel Good' };
            }
            return song;
        });
        saveSongs(updatedSongs);
        res.json({ ok: true, updatedCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const bulkUpdateEmotions = async (req, res) => {
    try {
        const { updates } = req.body;
        if (!Array.isArray(updates)) return res.status(400).json({ error: "Updates array required" });

        const songs = getSongs();
        const updatedSongs = songs.map(song => {
            const update = updates.find(u => u.id === song.id);
            if (update) {
                return { ...song, emotion: update.emotion };
            }
            return song;
        });

        saveSongs(updatedSongs);
        res.json({ ok: true, updatedCount: updates.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

