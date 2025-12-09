/* 
  SANGATAMIZH MUSIC BACKEND (STABLE)
  includes: Cookies, ytdl-core fallback, yt-dlp binary fix
*/
require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const fetch = require('node-fetch');
const YTDlpWrap = require('yt-dlp-wrap').default;
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const app = express();
const prisma = new PrismaClient();
app.use(cors({ origin: '*' }));
app.use(express.json());

const PORT = process.env.PORT || 3002;

// Supabase Setup
let supabaseUrl = process.env.SUPABASE_URL || 'https://lemirqphbiyhmulyczzg.supabase.co';
if (supabaseUrl.includes('zzzg')) supabaseUrl = 'https://lemirqphbiyhmulyczzg.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseKey) console.error('CRITICAL: SUPABASE_KEY is missing!');

const supabase = createClient(supabaseUrl, supabaseKey || 'MISSING_KEY', {
  auth: { autoRefreshToken: false, persistSession: false },
  global: { fetch: fetch }
});

// yt-dlp Setup
const ytDlpBinaryPath = path.join(os.tmpdir(), 'yt-dlp');
async function ensureYtDlp() {
    if (!fs.existsSync(ytDlpBinaryPath)) {
        console.log('Downloading yt-dlp...');
        let url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
        if (process.platform === 'linux') url += '_linux';
        try {
            const res = await fetch(url);
            const dest = fs.createWriteStream(ytDlpBinaryPath);
            res.body.pipe(dest);
            await new Promise(r => dest.on('finish', r));
            fs.chmodSync(ytDlpBinaryPath, '755');
            console.log('yt-dlp ready.');
        } catch(e) { console.error('yt-dlp download failed:', e); }
    }
}
ensureYtDlp();

app.get('api/songs', async (req, res) => {
    try {
        const songs = await prisma.song.findMany({ orderBy: { createdAt: 'desc' }});
        res.json(songs);
    } catch(e) { res.status(500).json({error: e.message}); }
});

// Debug Endpoint
app.get('/api/debug-network', async (req, res) => {
    const google = await fetch('https://www.google.com').then(r=>r.status).catch(e=>e.message);
    res.json({ google_status: google, env_cookies: !!process.env.YOUTUBE_COOKIES });
});

app.post('/api/upload-from-yt', async (req, res) => {
    const { url, category, customMetadata } = req.body;
    const tempFile = path.join(os.tmpdir(), `song_${Date.now()}.mp3`);
    
    // Cookie Setup
    const cookiePath = path.join(os.tmpdir(), 'cookies.txt');
    if (process.env.YOUTUBE_COOKIES) fs.writeFileSync(cookiePath, process.env.YOUTUBE_COOKIES);
    else if (fs.existsSync('./cookies.txt')) fs.copyFileSync('./cookies.txt', cookiePath);

    let videoId = null;
    let title = 'Unknown';
    let cover = null;

    try {
        // 1. Metadata: Try ytdl-core (Pure JS) FIRST
        try {
            const ytdl = require('@distube/ytdl-core');
            const info = await ytdl.getBasicInfo(url);
            videoId = info.videoDetails.videoId;
            title = info.videoDetails.title;
            cover = info.videoDetails.thumbnails.pop().url;
            console.log('Meta: ytdl-core success');
        } catch(e) { console.log('Meta: ytdl-core failed'); }

        // 2. Metadata: Fallback to yt-dlp (Binary + Cookies)
        if (!videoId) {
            try {
                const cmd = `${ytDlpBinaryPath} "${url}" --dump-json --no-warnings --prefer-free-formats --force-ipv4 --js-runtimes "node:${process.execPath}" --extractor-args "youtube:player_client=ios" --cookies "${cookiePath}"`;
                const { stdout } = await exec(cmd);
                const info = JSON.parse(stdout);
                videoId = info.id;
                title = info.title;
                cover = info.thumbnail;
                console.log('Meta: yt-dlp success');
            } catch(e) { console.log('Meta: yt-dlp failed'); }
        }

        // 3. Metadata: Fallback to Invidious
        if (!videoId) {
             const id = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1];
             if (id) {
                 const mirrors = ['https://inv.tux.pizza', 'https://vid.uff.io', 'https://invidious.jing.rocks'];
                 for (const m of mirrors) {
                     try {
                         const r = await fetch(`${m}/api/v1/videos/${id}`);
                         if (r.ok) {
                             const d = await r.json();
                             videoId = d.videoId;
                             title = d.title;
                             cover = d.videoThumbnails?.[0]?.url;
                             console.log(`Meta: Invidious success (${m})`);
                             break;
                         }
                     } catch(e) {}
                 }
             }
        }

        // 4. Metadata: Fallback to Official YouTube Data API (The Final Solution)
        if (!videoId && process.env.YT_API_KEY) {
            try {
                const id = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1];
                if (id) {
                    console.log('Meta: Trying Official YouTube API...');
                    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${process.env.YT_API_KEY}`;
                    const r = await fetch(apiUrl);
                    const d = await r.json();
                    if (d.items && d.items.length > 0) {
                        videoId = id;
                        title = d.items[0].snippet.title;
                        cover = d.items[0].snippet.thumbnails.high.url;
                        console.log('Meta: YouTube API success');
                    }
                }
            } catch(e) { console.error('Meta: YouTube API failed', e); }
        }

        if (!videoId) throw new Error('MetaData Failed completely.');

        // 4. Download: Try yt-dlp
        console.log(`Downloading ${videoId}...`);
        try {
             await exec(`${ytDlpBinaryPath} "${url}" -f bestaudio -o "${tempFile}" --no-warnings --force-ipv4 --js-runtimes "node:${process.execPath}" --extractor-args "youtube:player_client=ios" --cookies "${cookiePath}"`);
        } catch(e) {
            // 5. Download: Last Resort ytdl-core stream
            console.log('yt-dlp download failed, trying stream...');
            const ytdl = require('@distube/ytdl-core');
            await new Promise((resolve, reject) => {
                ytdl(url, { quality: 'highestaudio' }).pipe(fs.createWriteStream(tempFile))
                .on('finish', resolve).on('error', reject);
            });
        }

        // Upload
        const file = fs.readFileSync(tempFile);
        const fname = `songs/${Date.now()}_${videoId}.mp3`;
        const { error } = await supabase.storage.from('music-files').upload(fname, file, { contentType: 'audio/mpeg' });
        if (error) throw error;
        
        const publicUrl = supabase.storage.from('music-files').getPublicUrl(fname).data.publicUrl;
        fs.unlinkSync(tempFile);

        const song = await prisma.song.create({
            data: { 
                title: customMetadata?.title || title,
                artist: customMetadata?.artist || 'Unknown',
                url: publicUrl,
                coverUrl: customMetadata?.coverUrl || cover || 'https://via.placeholder.com/150',
                category: category || 'Tamil'
            }
        });
        res.json(song);

    } catch(e) {
        console.error(e);
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, () => console.log(`Server on ${PORT}`));
