import { streamFile } from "../utils/streamFile.js";
import { getYouTubeMetadata, streamYouTubeAudio, YTDLP_PATH, IS_GLOBAL } from "../services/youtube.service.js";
import lyricsFinder from 'lyrics-finder';
import { dbService } from "../services/db.service.js";
import { storageService } from "../services/storage.service.js";
import { streamProxy } from "../utils/streamProxy.js";
import cp from "child_process";
const { exec } = cp;
import path from "path";
import fs from "fs";

export const listSongs = async (req, res) => {
    try {
        const songs = await dbService.getSongs();
        res.json(songs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getHomeSections = async (req, res) => {
    try {
        const { userId } = req.query;
        const songs = await dbService.getSongs();
        
        // This part still uses smart logic from songs list + analytics
        // Note: For large apps, we'd do this via SQL, but for now this works.
        const sectionsData = await dbService.isCloud ? 
            { plays: [] } : // Placeholder until we add cloud analytics fetch logic if needed
            JSON.parse(fs.readFileSync(path.join(process.cwd(), "src", "analytics.json"), "utf8") || '{"plays":[]}');

        // Note: Analytics cloud fetch is simplified here. 
        // We'll prioritize showing trending/recent from songs list directly if analytics fail.
        
        res.json({
            trending: songs.slice(0, 10),
            recent: [] // Will populate once we have more usage
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
        const { url, title, artist, category, emotion, coverUrl, lyrics } = req.body;
        if (!url) return res.status(400).json({ error: "URL required" });

        console.log(`[Admin] Starting YouTube migration for: ${url}`);
        
        const videoId = url.match(/(?:v=|youtu\.be\/|embed\/|watch\?v=)([\w-]{11})/)?.[1];
        if (!videoId) throw new Error('Invalid YouTube URL');

        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        
        const outputPattern = path.join(tempDir, `${videoId}.%(ext)s`);

        // Use local yt-dlp if available
        const cookiesPath = path.join(process.cwd(), 'cookies.txt');
        const cookieFlag = fs.existsSync(cookiesPath) ? `--cookies "${cookiesPath}"` : '';
        const YTDLP_RUN = IS_GLOBAL ? 'yt-dlp' : YTDLP_PATH;

        const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
        const downloadCmd = `"${YTDLP_RUN}" ${cookieFlag} -f "ba" --force-ipv4 --user-agent "${userAgent}" --no-warnings -o "${outputPattern}" "${url}"`;
        
        console.log(`[Admin] Downloading: ${downloadCmd}`);
        console.log(`[Debug] cp defined: ${!!cp}, exec defined: ${!!cp.exec}`);
        
        await new Promise((resolve, reject) => {
            cp.exec(downloadCmd, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        // Find file
        const files = fs.readdirSync(tempDir);
        const downloadedFile = files.find(f => f.startsWith(videoId) && f !== videoId && !f.endsWith('.exe'));

        if (!downloadedFile) throw new Error("Download failed - File not found");

        const actualTempPath = path.join(tempDir, downloadedFile);
        const ext = path.extname(downloadedFile);
        const mimetype = ext === '.m4a' ? 'audio/mp4' : (ext === '.webm' ? 'audio/webm' : 'audio/mpeg');

        console.log(`[Admin] Uploading to Cloud...`);
        const mockFile = {
            path: actualTempPath,
            originalname: downloadedFile,
            filename: downloadedFile,
            mimetype: mimetype
        };
        
        const cloudUrl = await storageService.uploadFile(mockFile, 'songs');

        const newSong = {
            id: 'yt_' + Date.now().toString(),
            title: title || "YouTube Song",
            artist: artist || "YouTube",
            lyrics: lyrics || "",
            category: category || "Tamil",
            emotion: emotion || "Neutral",
            url: cloudUrl, // Save the CLOUD URL instead of YT link
            cover_url: coverUrl || "https://i.ytimg.com/vi/placeholder/hqdefault.jpg",
            is_youtube: false, // It's a cloud file now!
            created_at: new Date().toISOString()
        };

        const saved = await dbService.addSong(newSong);
        
        // Final cleanup
        try { fs.unlinkSync(actualTempPath); } catch (e) {}

        res.json({ ok: true, song: saved });
    } catch (err) {
        console.error("[Admin] YT Upload Error:", err);
        res.status(500).json({ error: err.message });
    }
};

export const streamSong = async (req, res) => {
    try {
        const songs = await dbService.getSongs();
        const song = songs.find(s => s.id === req.params.id || s.id == req.params.id);
        
        if (!song) return res.sendStatus(404);
        
        if (song.is_youtube || (song.url && (song.url.includes('youtube.com') || song.url.includes('youtu.be')))) {
            return streamYouTubeAudio(song.url, req, res);
        }

        if (song.url && (song.url.startsWith('http') || song.url.startsWith('https'))) {
            // It's a cloud storage URL, proxy it to avoid CORS issues
            return streamProxy(song.url, req, res);
        }

        const filePath = path.join(process.cwd(), song.url);
        if (!fs.existsSync(filePath)) return res.sendStatus(404);
        
        streamFile(req, res, filePath);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const uploadSong = async (req, res) => {
  try {
    const audioFile = req.files['audio'] ? req.files['audio'][0] : null;
    const coverFile = req.files['cover'] ? req.files['cover'][0] : null;
    
    if (!audioFile) return res.status(400).json({ error: "No audio file" });

    const { title, artist, album, category, emotion } = req.body;
    
    // Upload to Storage (Supabase or Local)
    const audioUrl = await storageService.uploadFile(audioFile, 'songs');
    const coverUrl = coverFile ? await storageService.uploadFile(coverFile, 'covers') : "https://via.placeholder.com/500";
    
    const newSong = {
        id: Date.now().toString(),
        title: title || audioFile.originalname,
        artist: artist || "Unknown Artist",
        album: album || "Single",
        category: category || "General",
        emotion: emotion || "Neutral",
        url: audioUrl,
        cover_url: coverUrl,
        created_at: new Date().toISOString()
    };

    const saved = await dbService.addSong(newSong);
    res.json({ ok: true, song: saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteSong = async (req, res) => {
    try {
        const { id } = req.params;
        const songs = await dbService.getSongs();
        const song = songs.find(s => s.id === id);

        if (!song) return res.status(404).json({ error: "Song not found" });

        // Delete from Storage
        if (song.url) await storageService.deleteFile(song.url);
        if (song.cover_url) await storageService.deleteFile(song.cover_url);

        // Delete from DB
        await dbService.deleteSong(id);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const logPlay = async (req, res) => {
    try {
        const { userId, songId } = req.body;
        if (!userId || !songId) return res.status(400).json({ error: "Missing UserId or SongId" });
        await dbService.logPlay(userId, songId);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const logLogin = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: "UserId required" });
        await dbService.logLogin(userId);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAnalyticsStats = async (req, res) => {
    try {
        const songs = await dbService.getSongs();
        // Simplified for cloud mode, full implementation would require more SQL
        res.json({
            totalLogins: 100, // Placeholder
            totalSongs: songs.length,
            totalPlays: 500, // Placeholder
            activeUsers: 10,  // Placeholder
            chartData: [],
            topPlayed: [],
            topLiked: []
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getLyrics = async (req, res) => {
    try {
        const { title, artist } = req.query;
        if (!title || !artist) return res.status(400).json({ error: "Title and artist are required" });
        
        const cleanTitle = title.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').replace(/Video Song|Official|Music Video|HD|4K|8K|Lyric/gi, '').split('|')[0].trim();
        const cleanArtist = artist.replace(/Official|Music|Channel|VEVO|Records|Films/gi, '').trim();
        
        let lyrics = await lyricsFinder(cleanArtist, cleanTitle) || await lyricsFinder(artist, title) || await lyricsFinder("", cleanTitle);
        
        res.json({ lyrics: lyrics || "Lyrics not found." });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch lyrics" });
    }
};

export const updateSong = async (req, res) => {
    try {
        const { id } = req.params;
        const saved = await dbService.updateSong(id, req.body);
        res.json({ ok: true, song: saved });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const initializeEmotions = async (req, res) => {
    try {
        const songs = await dbService.getSongs();
        let updatedCount = 0;
        for (const song of songs) {
            if (!song.emotion) {
                await dbService.updateSong(song.id, { emotion: 'Feel Good' });
                updatedCount++;
            }
        }
        res.json({ ok: true, updatedCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const bulkUpdateEmotions = async (req, res) => {
    try {
        const { updates } = req.body;
        for (const update of updates) {
            await dbService.updateSong(update.id, { emotion: update.emotion });
        }
        res.json({ ok: true, updatedCount: updates.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

