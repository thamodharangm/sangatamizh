require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const fetch = require('node-fetch');
const YTDlpWrap = require('yt-dlp-wrap').default;
const util = require('util');
const exec = util.promisify(require('child_process').exec);

/* 
  SANGATAMIZH MUSIC BACKEND 
  Fixed for Render Deployment + YouTube Download
*/

const app = express();
const prisma = new PrismaClient();

// CORS
app.use(cors({ origin: '*' }));
app.use(express.json());

// --- LOGGING & DIAGNOSTICS ---
console.log('--- BACKEND STARTING ---');
console.log('Node Version:', process.version);
const PORT = process.env.PORT || 3002;

// --- DATABASE SETUP ---
let supabaseUrl = process.env.SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_KEY;

// Fix: Force correct URL if typo is detected in env vars
const correctUrl = 'https://lemirqphbiyhmulyczzg.supabase.co';
if (!supabaseUrl || !supabaseUrl.startsWith('http') || supabaseUrl.includes('zzzg')) {
  console.log(`[Config] Fixing Supabase URL from '${supabaseUrl}' to '${correctUrl}'`);
  supabaseUrl = correctUrl;
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: { fetch: fetch }
});

// --- YOUTUBE DOWNLOADER SETUP ---
const ytDlpBinaryPath = path.join(os.tmpdir(), 'yt-dlp');

// Helper: Ensure yt-dlp binary exists (Standalone Linux version for Render)
async function ensureYtDlp() {
    if (!fs.existsSync(ytDlpBinaryPath)) {
        console.log('[Setup] Downloading Standalone yt-dlp binary...');
        let binaryUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp'; // Default
        if (process.platform === 'linux') binaryUrl += '_linux';
        else if (process.platform === 'win32') binaryUrl += '.exe';

        try {
            const res = await fetch(binaryUrl);
            if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`);
            const fileStream = fs.createWriteStream(ytDlpBinaryPath);
            await new Promise((resolve, reject) => {
                res.body.pipe(fileStream);
                res.body.on('error', reject);
                fileStream.on('finish', resolve);
            });
            fs.chmodSync(ytDlpBinaryPath, '755');
            console.log('[Setup] yt-dlp installed successfully');
        } catch (e) {
            console.error('[Setup] Failed to download yt-dlp:', e);
        }
    }
}
ensureYtDlp();

// Helper: Secure Cookie File Setup
function setupCookies() {
    // Priority 1: Env Var
    if (process.env.YOUTUBE_COOKIES) {
        const cookiePath = path.join(os.tmpdir(), 'cookies.txt');
        fs.writeFileSync(cookiePath, process.env.YOUTUBE_COOKIES);
        return cookiePath;
    }
    // Priority 2: Local File (Fallback)
    const localCookies = path.join(__dirname, 'cookies.txt');
    if (fs.existsSync(localCookies)) return localCookies;
    
    return null;
}

// Helper: Run yt-dlp command
async function runYtDlp(args, options = {}) {
    const flags = [
        '--no-warnings',
        '--no-check-certificate',
        '--prefer-free-formats',
        '--force-ipv4',
        '--js-runtimes', `node:${process.execPath}`,
        '--extractor-args', 'youtube:player_client=ios'
    ];

    const cookiePath = setupCookies();
    if (cookiePath) flags.push('--cookies', cookiePath);

    if (options.useProxy && process.env.PROXY_URL) {
        flags.push('--proxy', process.env.PROXY_URL);
    }

    const command = `${ytDlpBinaryPath} ${args.join(' ')} ${flags.join(' ')}`;
    console.log(`[Exec] ${command}`);
    const { stdout } = await exec(command);
    return stdout;
}


// --- ROUTES ---

app.get('/', (req, res) => {
  res.send('Sangatamizh Backend is Running!');
});

app.get('/api/songs', async (req, res) => {
  try {
    const songs = await prisma.song.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(songs);
  } catch (err) {
    console.error('Error in /api/songs:', err);
    res.status(503).json({ error: 'Failed to fetch songs', details: err.message, usedUrl: supabaseUrl });
  }
});

/* 
  POST /api/upload-from-yt
  FULL PRODUCTION IMPLEMENTATION
*/
app.post('/api/upload-from-yt', async (req, res) => {
    const { url, category, customMetadata } = req.body;
    const tempFilePath = path.join(os.tmpdir(), `temp_${Date.now()}.mp3`);
    let videoId = null;
    let videoTitle = 'Unknown Title';
    let videoCover = null;

    console.log(`[Upload] Processing: ${url}`);

    try {
        // --- STEP 1: METADATA FETCHING (Multi-Level Fallback) ---
        
        // Level 1: @distube/ytdl-core
        try {
            console.log('[Meta] Trying Level 1: @distube/ytdl-core');
            const ytdl = require('@distube/ytdl-core');
            const info = await ytdl.getBasicInfo(url);
            videoId = info.videoDetails.videoId;
            videoTitle = info.videoDetails.title;
            videoCover = info.videoDetails.thumbnails.pop().url;
            console.log('[Meta] Success Level 1');
        } catch (e) {
            console.warn('[Meta] Failed Level 1:', e.message);
        }

        // Level 2: yt-dlp (Standard + Cookies)
        if (!videoId) {
            try {
                console.log('[Meta] Trying Level 2: yt-dlp');
                const json = await runYtDlp([url, '--dump-json']);
                const info = JSON.parse(json);
                videoId = info.id;
                videoTitle = info.title;
                videoCover = info.thumbnail;
                console.log('[Meta] Success Level 2');
            } catch (e) {
                console.warn('[Meta] Failed Level 2:', e.message);
            }
        }

        // Level 3: yt-dlp + PROXY
        if (!videoId && process.env.PROXY_URL) {
            try {
                console.log('[Meta] Trying Level 3: yt-dlp + PROXY');
                const json = await runYtDlp([url, '--dump-json'], { useProxy: true });
                const info = JSON.parse(json);
                videoId = info.id;
                videoTitle = info.title;
                videoCover = info.thumbnail;
                console.log('[Meta] Success Level 3');
            } catch (e) {
                console.warn('[Meta] Failed Level 3:', e.message);
            }
        }

        // Level 4: Invidious API (Rotating Instances)
        if (!videoId) {
            console.log('[Meta] Trying Level 4: Invidious API (Rotating Mirrors)');
            const tempId = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)?.[1];
            
            if (tempId) {
                const instances = [
                    'https://inv.tux.pizza', 
                    'https://vid.uff.io',
                    'https://invidious.jing.rocks',
                    'https://inv.nadeko.net',
                    'https://invidious.nerdvpn.de'
                ];
                
                for (const instance of instances) {
                    try {
                        console.log(`[Meta] Trying Invidious Mirror: ${instance}`);
                        const apiRes = await fetch(`${instance}/api/v1/videos/${tempId}`, { timeout: 5000 });
                        
                        if (apiRes.ok) {
                            const data = await apiRes.json();
                            videoId = data.videoId;
                            videoTitle = data.title;
                            // Ensure we find a valid thumbnail
                            videoCover = data.videoThumbnails?.find(t => t.quality === 'high')?.url || data.videoThumbnails?.[0]?.url;
                            console.log(`[Meta] Success via ${instance}`);
                            break; 
                        } else {
                             console.warn(`[Meta] Mirror ${instance} HTTP Error: ${apiRes.status}`);
                        }
                    } catch (e) {
                        console.warn(`[Meta] Mirror ${instance} failed: ${e.message}`);
                    }
                }
            } else {
                console.warn('[Meta] Could not extract ID for Invidious fallback.');
            }
        }

// Debug endpoint to check connectivity
app.get('/api/debug-network', async (req, res) => {
    try {
        const fetch = require('node-fetch');
        const google = await fetch('https://www.google.com');
        const inv = await fetch('https://inv.tux.pizza/api/v1/stats');
        res.json({
            google: google.status,
            invidious_mirror: inv.status,
            ip: (await (await fetch('https://api.ipify.org?format=json')).json()).ip
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

        if (!videoId) throw new Error('CRITICAL: All metadata methods failed. YouTube blocked server IP.');

        // --- STEP 2: DOWNLOAD FILE ---
        console.log(`[Download] Starting download for ID: ${videoId}`);
        let downloadSuccess = false;

        // Try yt-dlp
        try {
             await runYtDlp([url, '-f', 'bestaudio', '-o', tempFilePath]);
             downloadSuccess = true;
        } catch (e) {
             console.warn('[Download] Standard Failed:', e.message);
        }

        // Try Proxy
        if (!downloadSuccess && process.env.PROXY_URL) {
             try {
                 await runYtDlp([url, '-f', 'bestaudio', '-o', tempFilePath], { useProxy: true });
                 downloadSuccess = true;
             } catch (e) {
                 console.warn('[Download] Proxy Failed:', e.message);
             }
        }

        // Try ytdl-core stream (Last Resort)
        if (!downloadSuccess) {
             console.log('[Download] Last Resort: ytdl-core...');
             const ytdl = require('@distube/ytdl-core');
             await new Promise((resolve, reject) => {
                 ytdl(url, { quality: 'highestaudio' })
                    .pipe(fs.createWriteStream(tempFilePath))
                    .on('finish', resolve)
                    .on('error', reject);
             });
             downloadSuccess = true;
        }

        if (!downloadSuccess) throw new Error('Download failed completely.');

        // --- STEP 3: UPLOAD TO STORAGE ---
        const fileBuffer = fs.readFileSync(tempFilePath);
        const filename = `songs/${Date.now()}_${videoId}.mp3`;
        
        const { error: uploadError } = await supabase.storage
            .from('music-files')
            .upload(filename, fileBuffer, { contentType: 'audio/mpeg' });

        if (uploadError) throw uploadError;

        const publicUrl = supabase.storage.from('music-files').getPublicUrl(filename).data.publicUrl;
        
        // Cleanup
        try { fs.unlinkSync(tempFilePath); } catch (e) {}

        // --- STEP 4: SAVE TO DB ---
        const newSong = await prisma.song.create({
            data: {
                title: customMetadata?.title || videoTitle,
                artist: customMetadata?.artist || 'Unknown Artist',
                url: publicUrl,
                coverUrl: customMetadata?.coverUrl || videoCover || 'https://via.placeholder.com/150',
                category: category || 'Tamil'
            }
        });

        res.status(201).json(newSong);

    } catch (err) {
        console.error('CRITICAL UPLOAD ERROR:', err);
        try { if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); } catch (e) {}
        res.status(500).json({ error: 'Upload Failed', details: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
