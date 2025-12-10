const prisma = require('../config/prisma');
const youtubeService = require('../services/youtubeService');
const storageService = require('../services/storageService');
const fs = require('fs');
const fetch = require('node-fetch');
const { YT_API_KEY, YOUTUBE_COOKIES } = require('../config/env');

// Helper to extract ID (simplified version of what's in service)
const extractVideoId = (url) => url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1];

exports.getAllSongs = async (req, res) => {
    try {
        const songs = await prisma.song.findMany({
            orderBy: { created_at: "desc" },
        });
        res.json(songs);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getMetadata = async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required' });
        
        const metadata = await youtubeService.getMetadata(url);
        res.json(metadata);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch metadata' });
    }
};

exports.uploadFromYoutube = async (req, res) => {
    const { url, category, customMetadata } = req.body;
    let tempFile = null;

    try {
        // 1. Get Metadata to get ID and basic info
        const metadata = await youtubeService.getMetadata(url);
        // We need the ID for filename
        const videoId = extractVideoId(url) || Date.now().toString();
        
        // 2. Download Audio
        tempFile = await youtubeService.downloadAudio(videoId);
        
        // 3. Upload to Storage
        const isM4a = tempFile.endsWith('.m4a');
        const ext = isM4a ? 'm4a' : 'mp3';
        const contentType = isM4a ? 'audio/x-m4a' : 'audio/mpeg';

        const fname = `songs/${Date.now()}_${videoId}.${ext}`;
        const publicUrl = await storageService.uploadFile(tempFile, fname, contentType);
        
        // 4. Create DB Record
        const song = await prisma.song.create({
            data: {
                title: customMetadata?.title || metadata.title,
                artist: customMetadata?.artist || metadata.artist || "Unknown",
                file_url: publicUrl,
                cover_url: customMetadata?.coverUrl || metadata.coverUrl || "https://via.placeholder.com/150",
                category: category || "Tamil",
            },
        });
        
        res.json(song);

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    } finally {
        if (tempFile && fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
};

exports.uploadFile = async (req, res) => {
    try {
        // Validation: Check if audio file exists
        if (!req.files || !req.files.audio || !req.files.audio[0]) {
            return res.status(400).json({ error: 'No audio file provided' });
        }
        
        const audioFile = req.files.audio[0];
        const { title, artist, category, coverUrl } = req.body;
        let finalCoverUrl = coverUrl || "https://via.placeholder.com/150";

        // Upload Audio
        const audioFname = `songs/${Date.now()}_${audioFile.originalname}`;
        const audioUrl = await storageService.uploadFile(audioFile.path, audioFname, audioFile.mimetype);
        
        // Handle Cover Image Upload if present (fields.cover usually, but existing code assumes url or separate upload? 
        // Frontend uses formData.append('cover', coverFile). Multer 'upload.single' only handles one.
        // I need to update the route to handle fields: audio and cover.
        // For now, assuming coverUrl string is passed or default. 
        // IF req.files is used (fields), we can handle cover file. 
        // Let's assume frontend sends coverUrl if it's a link, or we need to handle multi-part file for cover too.
        // Frontend code: formData.append('cover', cover) -> generic file.
        // I will update route to use upload.fields([{name: 'audio'}, {name: 'cover'}])
        
        if (req.files && req.files.cover && req.files.cover[0]) {
             const coverFname = `covers/${Date.now()}_${req.files.cover[0].originalname}`;
             finalCoverUrl = await storageService.uploadFile(req.files.cover[0].path, coverFname, req.files.cover[0].mimetype);
             // Cleanup cover temp file
             fs.unlinkSync(req.files.cover[0].path);
        }

        const song = await prisma.song.create({
            data: {
                category: category || "General"
            }
        });

        // Cleanup audio temp file
        if (fs.existsSync(audioFile.path)) fs.unlinkSync(audioFile.path);
        
        res.json(song);

    } catch(e) {
        console.error(e);
        if (req.files?.audio?.[0] && fs.existsSync(req.files.audio[0].path)) fs.unlinkSync(req.files.audio[0].path);
        if (req.files?.cover?.[0] && fs.existsSync(req.files.cover[0].path)) fs.unlinkSync(req.files.cover[0].path);
        res.status(500).json({ error: e.message });
    }
};

exports.deleteSong = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.song.delete({ where: { id } });
        // Optionally delete from Storage? (Not strictly required for this task but good practice)
        // Ignoring storage delete for now to keep it safe.
        res.json({ message: 'Song deleted successfully' });
    } catch(e) {
        res.status(500).json({ error: 'Failed to delete song' });
    }
};

exports.debugNetwork = async (req, res) => {
    const google = await fetch("https://www.google.com")
        .then((r) => r.status)
        .catch((e) => e.message);
    res.json({
        google_status: google,
        env_cookies: !!YOUTUBE_COOKIES,
    });
};
