import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, '../../temp');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const YTDLP_PATH = path.join(TEMP_DIR, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

// Initialize yt-dlp binary if missing
const initYtDlp = async () => {
    if (!fs.existsSync(YTDLP_PATH)) {
        console.log('[YouTubeService] Downloading yt-dlp...');
        const url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp' + (process.platform === 'win32' ? '.exe' : '');
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });
        const writer = fs.createWriteStream(YTDLP_PATH);
        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
        if (process.platform !== 'win32') {
            fs.chmodSync(YTDLP_PATH, '755');
        }
        console.log('[YouTubeService] yt-dlp ready.');
    }
};

initYtDlp().catch(console.error);

export const extractVideoId = (url) => {
    const match = url.match(/(?:v=|youtu\.be\/|embed\/|watch\?v=)([\w-]{11})/);
    return match ? match[1] : null;
};

export const getYouTubeMetadata = async (url) => {
    const videoId = extractVideoId(url);
    if (!videoId) throw new Error('Invalid YouTube URL');

    try {
        // Try to get metadata using yt-dlp (more reliable than API often)
        const cmd = `"${YTDLP_PATH}" --dump-json --skip-download "${url}"`;
        const json = await new Promise((resolve, reject) => {
            exec(cmd, (error, stdout) => {
                if (error) reject(error);
                else resolve(JSON.parse(stdout));
            });
        });

        return {
            title: json.title,
            artist: json.uploader,
            coverUrl: json.thumbnail,
            duration: json.duration,
            videoId
        };
    } catch (err) {
        console.warn('[YouTubeService] yt-dlp metadata failed, using fallback:', err.message);
        return {
            title: `YouTube Video ${videoId}`,
            artist: 'YouTube',
            coverUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            videoId
        };
    }
};

export const streamYouTubeAudio = async (url, req, res) => {
    const userAgent = req.headers['user-agent'] || 'Mozilla/5.0';
    
    try {
        // Get stream URL from yt-dlp
        const cmd = `"${YTDLP_PATH}" -f "bestaudio[ext=m4a]/bestaudio" -g "${url}"`;
        const streamUrl = await new Promise((resolve, reject) => {
            exec(cmd, (error, stdout) => {
                if (error) reject(error);
                else resolve(stdout.trim());
            });
        });

        const lib = streamUrl.startsWith('https') ? https : http;
        const fetchHeaders = {
            'User-Agent': userAgent,
            'Accept': '*/*',
            'Connection': 'keep-alive'
        };

        if (req.headers.range) {
            fetchHeaders['Range'] = req.headers.range;
        }

        const proxyReq = lib.request(streamUrl, { headers: fetchHeaders }, (proxyRes) => {
            res.status(proxyRes.statusCode);
            Object.keys(proxyRes.headers).forEach(key => {
                if (['content-type', 'content-length', 'content-range', 'accept-ranges'].includes(key.toLowerCase())) {
                    res.setHeader(key, proxyRes.headers[key]);
                }
            });
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
            console.error('[YouTubeService] Stream Request Error:', err);
            if (!res.headersSent) res.status(502).send('Upstream error');
        });

        proxyReq.end();
    } catch (err) {
        console.error('[YouTubeService] Streaming failed:', err);
        if (!res.headersSent) res.status(500).send('Streaming failed');
    }
};
