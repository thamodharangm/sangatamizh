const prisma = require('../config/prisma');
const youtubeService = require('../services/youtubeService');
const youtubeStreamService = require('../services/youtubeStreamService');
const storageService = require('../services/storageService');
const emotionDetector = require('../services/emotionDetector');
const fs = require('fs');
const fetch = require('node-fetch');
const { YT_API_KEY, YOUTUBE_COOKIES } = require('../config/env');

// Helper to extract ID (simplified version of what's in service)
const extractVideoId = (url) => url.match(/(?:v=|youtu\.be\/|embed\/)([\\w-]{11})/)?.[1];

const serialize = (data) => JSON.parse(JSON.stringify(data, (key, value) =>
    typeof value === 'bigint'
        ? value.toString()
        : value 
));

// Stream Song with FULL Mobile Safari Support + Mobile Optimization
exports.streamSong = async (req, res) => {
    const startTime = Date.now();
    console.log(`[Stream] Request for ID: ${req.params.id}`);
    
    try {
        const { id } = req.params;
        const song = await prisma.song.findUnique({ where: { id } });
        
        fs.appendFileSync('stream_debug.log', `[${new Date().toISOString()}] Stream request for ID: ${id}\n`);
        if (!song) {
            console.log("[Stream] Song not found in DB");
            return res.status(404).send('Song not found');
        }
        if (!song.file_url) {
            console.log("[Stream] No file_url for song");
            return res.status(404).send('No Audio Source');
        }

        console.log(`[Stream] Streaming: ${song.file_url}`);
        
        // Check if it's a YouTube URL and route to YouTube stream service
        const isYouTubeUrl = song.file_url.includes('youtube.com') || song.file_url.includes('youtu.be');
        fs.appendFileSync('stream_debug.log', `[${new Date().toISOString()}] URL: ${song.file_url}, isYouTube: ${isYouTubeUrl}\n`);
        if (isYouTubeUrl) {
            console.log('[Stream] Detected YouTube URL, using YouTube stream service');
            return youtubeStreamService.streamYouTubeAudio(song.file_url, req, res);
        }
        
        // Detect Content-Type from file extension with proper codec info
        const urlLower = song.file_url.toLowerCase();
        let contentType = 'audio/mpeg';
        
        // M4A files need specific MIME type for proper decoding
        if (urlLower.includes('.m4a')) {
            contentType = 'audio/mp4'; // Standard MIME for M4A/AAC
        }
        else if (urlLower.includes('.opus')) contentType = 'audio/opus';
        else if (urlLower.includes('.webm')) contentType = 'audio/webm';
        else if (urlLower.includes('.ogg')) contentType = 'audio/ogg';
        
        // Detect mobile device
        const userAgent = req.headers['user-agent'] || 'Sangatamizh-Backend/1.0';
        const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
        
        // Encode URL to safe string (handles spaces in filenames)
        const safeUrl = encodeURI(song.file_url);

        // Step 1: HEAD request to get file size (critical for iOS)
        const headResponse = await fetch(safeUrl, { 
            method: 'HEAD',
            headers: {
                'User-Agent': userAgent 
            }
        });
        const fileSize = parseInt(headResponse.headers.get('content-length') || '0');
        
        if (!fileSize) {
            console.error('[Stream] Could not determine file size');
            return res.status(500).send('Unable to stream: file size unknown');
        }

        console.log(`[Stream] File size: ${fileSize} bytes, Mobile: ${isMobile}, UA: ${userAgent.substring(0, 50)}`);

        // Step 2: Check if Range request
        const range = req.headers.range;
        
        if (!range) {
            // NO Range Header: Return 200 OK with full file info (iOS initial probe)
            console.log('[Stream] No Range header, sending 200 OK');
            res.status(200);
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', fileSize);
            res.setHeader('Accept-Ranges', 'bytes'); // CRITICAL for iOS
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
            res.setHeader('X-Content-Type-Options', 'nosniff');
            
            // Stream entire file
            const response = await fetch(safeUrl, {
                headers: { 'User-Agent': userAgent }
            });
            
            // Log performance
            const duration = Date.now() - startTime;
            console.log(`[Stream] Full file stream started in ${duration}ms`);
            
            return response.body.pipe(res);
        }

        // Step 3: Parse Range Header (e.g., "bytes=0-1023" or "bytes=0-")
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        
        // Mobile Optimization: Limit chunk size to prevent buffering delays
        if (isMobile) {
            const MOBILE_MAX_CHUNK = 512 * 1024; // 512KB chunks for mobile
            const requestedChunk = end - start + 1;
            if (requestedChunk > MOBILE_MAX_CHUNK) {
                end = start + MOBILE_MAX_CHUNK - 1;
                console.log(`[Stream] Mobile chunk limited to ${MOBILE_MAX_CHUNK} bytes`);
            }
        }
        
        // Validate range
        if (start >= fileSize || end >= fileSize || start > end) {
            console.error(`[Stream] Invalid range: ${range}`);
            return res.status(416)
                .setHeader('Content-Range', `bytes */${fileSize}`)
                .send('Range Not Satisfiable');
        }

        const chunkSize = (end - start) + 1;
        
        console.log(`[Stream] Range request: ${start}-${end} (${chunkSize} bytes)`);

        // Step 4: Fetch with Range header
        const response = await fetch(safeUrl, {
            headers: { 
                'Range': `bytes=${start}-${end}`,
                'User-Agent': userAgent // Forward user agent
            }
        });

        // Verify response
        if (!response.ok && response.status !== 206) {
            const errText = await response.text();
            console.error(`[Stream] Upstream error: ${response.status} - ${errText.substring(0, 200)}`);
            return res.status(502).send('Upstream streaming error');
        }

        // Step 5: Send 206 Partial Content with EXACT headers iOS needs
        res.status(206);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', chunkSize);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        
        // Performance logging
        const duration = Date.now() - startTime;
        console.log(`[Stream] 206 response prepared in ${duration}ms`);
        
        // Stream the chunk
        response.body.pipe(res);

    } catch (e) {
        console.error("[Streaming Error]:", {
            message: e.message,
            stack: e.stack,
            songId: req.params.id
        });
        if (!res.headersSent) {
            res.status(500).send('Stream Failed');
        }
    }
};

exports.getAllSongs = async (req, res) => {
    try {
        console.log('[getAllSongs] Fetching songs from database...');
        const songs = await prisma.song.findMany({
            orderBy: { created_at: "desc" },
        });
        console.log(`[getAllSongs] Found ${songs.length} songs`);
        res.json(serialize(songs));
    } catch (e) {
        console.error('[getAllSongs] ERROR:', {
            message: e.message,
            stack: e.stack,
            code: e.code,
            name: e.name
        });
        res.status(500).json({ 
            error: 'Failed to fetch songs',
            details: process.env.NODE_ENV === 'development' ? e.message : undefined
        });
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
        console.error('[getMetadata] ERROR:', e);
        res.status(500).json({ error: 'Failed to fetch metadata' });
    }
};

exports.uploadFromYoutube = async (req, res) => {
    const { url, category, emotion, customMetadata } = req.body;
    console.log("[UploadFromYouTube] Processing:", { url, category, emotion });

    try {
        // 1. Get Metadata (Validate Link & Details)
        const metadata = await youtubeService.getMetadata(url);
        
        // 2. Auto-detect logic (AI Simulation)
        let finalEmotion = emotion;
        let finalCategory = category;
        
        if (!emotion || emotion === 'Neutral') {
            const emotionAnalysis = emotionDetector.analyzeMetadata(metadata);
            finalEmotion = emotionAnalysis.emotion;
        }
        
        if (!category || category === 'General') {
             finalCategory = emotionDetector.getSuggestedCategory(finalEmotion);
        }
        
        // 3. Create DB Record (ZERO STORAGE - Direct Link Only)
        // We use the YouTube URL as the 'file_url' so the Streamer knows to proxy it.
        const song = await prisma.song.create({
            data: {
                title: customMetadata?.title || metadata.title,
                artist: customMetadata?.artist || metadata.artist || "Unknown",
                file_url: url, // <--- DIRECT LINK (No Storage)
                cover_url: customMetadata?.coverUrl || metadata.coverUrl || "https://via.placeholder.com/150",
                category: finalCategory || "Tamil",
                emotion: finalEmotion || "Feel Good",
                source_url: url,
                youtube_views: BigInt(metadata.viewCount || 0)
            },
        });
        
        console.log(`[UploadFromYouTube] Success: ${song.title} (ID: ${song.id})`);
        res.json(serialize(song));

    } catch (e) {
        console.error("Youtube Upload Logic Failed:", e);
        res.status(500).json({ 
            error: "YouTube Import Failed", 
            message: e.message 
        });
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
        title = title || audioFile.originalname.replace(/\\.[^/.]+$/, "") || "Untitled Song";
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
        console.error('[uploadFile] ERROR:', e);
        if (req.files?.audio?.[0] && fs.existsSync(req.files.audio[0].path)) fs.unlinkSync(req.files.audio[0].path);
        if (req.files?.cover?.[0] && fs.existsSync(req.files.cover[0].path)) fs.unlinkSync(req.files.cover[0].path);
        res.status(500).json({ error: e.message });
    }
};

exports.deleteSong = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. Fetch song to get file URLs
        const song = await prisma.song.findUnique({ where: { id } });
        if (!song) {
            return res.status(404).json({ error: 'Song not found' });
        }

        // 2. Delete from Storage
        // Helper to extract relative path from public URL
        const extractPath = (fullUrl) => {
            if (!fullUrl) return null;
            // Matches everything after /music_assets/
            const match = fullUrl.match(/\/music_assets\/(.*)$/);
            return match ? match[1] : null; // returns e.g. "songs/123.mp3"
        };

        if (song.file_url) {
            const path = extractPath(song.file_url);
            if (path) await storageService.deleteFile(path);
        }

        if (song.cover_url && !song.cover_url.includes('placeholder')) {
            const path = extractPath(song.cover_url);
            if (path) await storageService.deleteFile(path);
        }

        // 3. Delete from DB
        await prisma.song.delete({ where: { id } });

        res.json({ message: 'Song and files deleted successfully' });
    } catch(e) {
        console.error("Delete Error:", e);
        res.status(500).json({ error: 'Failed to delete song' });
    }
};

exports.updateSong = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, artist, category, emotion } = req.body;

        const updatedSong = await prisma.song.update({
            where: { id },
            data: {
                title,
                artist,
                category,
                emotion
            }
        });

        res.json(serialize(updatedSong));
    } catch (e) {
        console.error("Update Error:", e);
        res.status(500).json({ error: 'Failed to update song' });
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
        console.log('[getHomeSections] Fetching sections for userId:', userId);
        
        // 1. Trending Now: Based on actual APP PLAYS (Last 7 Days)
        // Check local play history instead of static youtube views
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const trendingPlays = await prisma.playHistory.groupBy({
            by: ['songId'],
            where: { playedAt: { gte: sevenDaysAgo } },
            _count: { songId: true },
            orderBy: { _count: { songId: 'desc' } },
            take: 10
        });

        let trendingIds = trendingPlays.map(t => t.songId);
        
        // Fallback: If no history, use YouTube Views (Cold Start)
        if (trendingIds.length === 0) {
             const fallback = await prisma.song.findMany({
                 orderBy: { youtube_views: 'desc' },
                 take: 10,
                 select: { id: true }
             });
             trendingIds = fallback.map(s => s.id);
        }

        // Fetch full song objects (preserve order)
        const trending = await prisma.song.findMany({
            where: { id: { in: trendingIds } }
        });
        
        // Re-sort in memory because 'in' clause kills order
        trending.sort((a, b) => trendingIds.indexOf(a.id) - trendingIds.indexOf(b.id));

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

        console.log(`[getHomeSections] Returning ${trending.length} trending, ${hits.length} hits, ${recent.length} recent`);

        res.json({
            trending: serialize(trending),
            hits: serialize(hits),
            recent: serialize(recent)
        });

    } catch (e) {
         console.error('[getHomeSections] ERROR:', {
             message: e.message,
             stack: e.stack,
             code: e.code
         });
         res.status(500).json({ error: e.message });
    }
};
