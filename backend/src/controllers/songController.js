const prisma = require('../config/prisma');
const youtubeService = require('../services/youtubeService');
const storageService = require('../services/storageService');
const emotionDetector = require('../services/emotionDetector');
const fs = require('fs');
const fetch = require('node-fetch');
const { YT_API_KEY, YOUTUBE_COOKIES } = require('../config/env');

// Helper to extract ID (simplified version of what's in service)
const extractVideoId = (url) => url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1];

const serialize = (data) => JSON.parse(JSON.stringify(data, (key, value) =>
    typeof value === 'bigint'
        ? value.toString()
        : value 
));

exports.getAllSongs = async (req, res) => {
    try {
        const songs = await prisma.song.findMany({
            orderBy: { created_at: "desc" },
        });
        res.json(serialize(songs));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getMetadata = async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required' });
        
        const metadata = await youtubeService.getMetadata(url);
        
        // Analyze emotion from metadata
        const emotionAnalysis = emotionDetector.analyzeMetadata(metadata);
        const suggestedCategory = emotionDetector.getSuggestedCategory(emotionAnalysis.emotion);
        
        // Return metadata with emotion suggestions
        res.json({
            ...metadata,
            suggestedEmotion: emotionAnalysis.emotion,
            suggestedCategory: suggestedCategory,
            emotionConfidence: emotionAnalysis.confidence
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch metadata' });
    }
};

exports.uploadFromYoutube = async (req, res) => {
    const { url, category, emotion, customMetadata } = req.body;
    let tempFile = null;
    const fs = require('fs');
    fs.appendFileSync('debug_upload.log', `[${new Date().toISOString()}] Body: ${JSON.stringify(req.body)}\n`);
    console.log("[UploadFromYouTube] Body:", req.body);
    try {
        // 1. Get Metadata to get ID and basic info
        const metadata = await youtubeService.getMetadata(url);
        // We need the ID for filename
        const videoId = extractVideoId(url) || Date.now().toString();
        
        // 1.5. Auto-detect emotion if not provided
        let finalEmotion = emotion;
        let finalCategory = category;
        
        if (!emotion) {
            const emotionAnalysis = emotionDetector.analyzeMetadata(metadata);
            finalEmotion = emotionAnalysis.emotion;
            console.log(`[EmotionDetector] Auto-detected: ${finalEmotion} (confidence: ${emotionAnalysis.confidence})`);
        }
        
        if (!category) {
            finalCategory = emotionDetector.getSuggestedCategory(finalEmotion);
        }
        
        // 2. Download Audio
        tempFile = await youtubeService.downloadAudio(videoId);
        
        // 3. Upload to Storage
        const isM4a = tempFile.endsWith('.m4a');
        const ext = isM4a ? 'm4a' : 'mp3';
        const contentType = isM4a ? 'audio/x-m4a' : 'audio/mpeg';

        const fname = `songs/${Date.now()}_${videoId}.${ext}`;
        const publicUrl = await storageService.uploadFile(tempFile, fname, contentType);
        
        // 4. Create DB Record with auto-detected emotion
        const song = await prisma.song.create({
            data: {
                title: customMetadata?.title || metadata.title,
                artist: customMetadata?.artist || metadata.artist || "Unknown",
                file_url: publicUrl,
                cover_url: customMetadata?.coverUrl || metadata.coverUrl || "https://via.placeholder.com/150",
                category: finalCategory || "Tamil",
                emotion: finalEmotion || "Feel Good",
                source_url: url,
                youtube_views: BigInt(metadata.viewCount || 0)
            },
        });
        res.json(serialize(song));

    } catch (e) {
        console.error("Youtube Upload Logic Failed:", e);
        // Clean up temp file if it exists and error occurred (handled in finally for success case too, but explicit here for clarity if needed or remove duplicate)
        
        // Return 500 with a structured error object
        res.status(500).json({ 
            error: "YouTube Process Failed", 
            message: e.message || "Unknown error occurred",
            details: process.env.NODE_ENV === 'development' ? e.stack : undefined
        });
    } finally {
        if (tempFile && fs.existsSync(tempFile)) {
             try { fs.unlinkSync(tempFile); } catch(err) { console.error("Cleanup failed:", err); }
        }
    }
};

exports.uploadFile = async (req, res) => {
    console.log("Upload File Body:", req.body);
    console.log("Upload File Files:", req.files ? Object.keys(req.files) : "None");
    try {
        // Validation: Check if audio file exists
        if (!req.files || !req.files.audio || !req.files.audio[0]) {
            return res.status(400).json({ error: 'No audio file provided' });
        }
        
        const audioFile = req.files.audio[0];
        let { title, artist, category, coverUrl } = req.body;
        
        // Defaults if body parsing fails or fields missing
        title = title || audioFile.originalname.replace(/\.[^/.]+$/, "") || "Untitled Song";
        artist = artist || "Unknown Artist";
        category = category || "General";
        const emotion = req.body.emotion || "Neutral";
        
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
                title,
                artist,
                file_url: audioUrl,
                cover_url: finalCoverUrl,
                category, // already handled defaults
                emotion
            }
        });

        // Cleanup audio temp file
        if (fs.existsSync(audioFile.path)) fs.unlinkSync(audioFile.path);

        
        res.json(serialize(song));

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

exports.logPlay = async (req, res) => {
    try {
        const { userId, songId } = req.body;
        
        if (!userId || !songId) {
             return res.status(400).json({ error: "userId and songId required" });
        }

        // Ensure User exists in Postgres (Syncing Firebase ID)
        // We use upsert to be safe, or just check and create.
        // Since we don't have email in this request, we fake it or use ID.
        let user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
             // Create ghost user for history tracking
             console.log(`[LogPlay] Creating placeholder user for ID: ${userId}`);
             try {
                user = await prisma.user.create({
                    data: {
                        id: userId, // Use the Firebase UID
                        email: `${userId}@firebase.placeholder`,
                        password: 'firebase-user', // Dummy
                        role: 'USER'
                    }
                });
             } catch (createError) {
                 // Race condition check
                 if (createError.code === 'P2002') {
                     user = await prisma.user.findUnique({ where: { id: userId } });
                 } else {
                     throw createError;
                 }
             }
        }

        await prisma.playHistory.create({
             data: { userId, songId }
        });

        res.status(200).json({ status: 'ok' });
    } catch(e) {
        console.error("Play Log Error", e);
        res.status(500).json({ error: "Failed to log", message: e.message, stack: e.stack });
    }
};

exports.getHomeSections = async (req, res) => {
    try {
        const userId = req.query.userId;
        
        // 1. Trending Now: Sort by youtube_views desc (Top 10)
        // Note: Using BigInt, which JSON.stringify fails on unless serialized.
        const trending = await prisma.song.findMany({
            orderBy: { youtube_views: 'desc' },
            take: 10
        });

        // 2. Tamil Hits: Sort by youtube_views desc where category='Tamil'
        const hits = await prisma.song.findMany({
            where: { 
                OR: [
                    { category: 'Tamil' },
                    { emotion: 'Feel Good' }, // Including popular Feel Good ones in hits too potentially
                 ]
            },
            orderBy: { youtube_views: 'desc' },
            take: 10
        });

        // 3. Recently Played: "User Mostly and Recently Played"
        // We want a mix of frequency and recency.
        let recent = [];
        if (userId) {
            // Fetch raw history
            const history = await prisma.playHistory.findMany({
                where: { userId },
                include: { song: true },
                orderBy: { playedAt: 'desc' },
                take: 100 // Look at last 100 plays
            });

            // Process in JS to rank by Frequency + Recency
            const stats = {};
            history.forEach(h => {
                if (!stats[h.songId]) {
                    stats[h.songId] = { 
                        song: h.song, 
                        count: 0, 
                        lastPlayed: new Date(h.playedAt).getTime() 
                    };
                }
                stats[h.songId].count++;
                // Update lastPlayed if this entry is newer (though we sorted desc, so first is newest)
                if (new Date(h.playedAt).getTime() > stats[h.songId].lastPlayed) {
                     stats[h.songId].lastPlayed = new Date(h.playedAt).getTime();
                }
            });

            // Scored sorting
            // We want songs played OFTEN and RECENTLY. 
            // Simple Score: Count + (is_very_recent ? 2 : 0)
            // Or just sort by Count DESC, then LastPlayed DESC
            const sorted = Object.values(stats).sort((a, b) => {
                // Primary: Frequency (Most Played)
                if (b.count !== a.count) return b.count - a.count;
                // Secondary: Recency
                return b.lastPlayed - a.lastPlayed;
            });

            recent = sorted.map(s => s.song).slice(0, 10);
        }

        // Helper to serialize BigInt
        const serialize = (data) => JSON.parse(JSON.stringify(data, (key, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value // return everything else unchanged
        ));

        res.json({
            trending: serialize(trending),
            hits: serialize(hits),
            recent: serialize(recent)
        });

    } catch (e) {
         console.error(e);
         res.status(500).json({ error: e.message });
    }
};
