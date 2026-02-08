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
        const cmd = `"${YTDLP_PATH}" --dump-json --skip-download --no-warnings "${url}"`;
        const jsonOutput = await new Promise((resolve, reject) => {
            exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout) => {
                if (error) {
                    if (!stdout) return reject(error);
                }
                resolve(stdout);
            });
        });

        let json;
        try {
            json = JSON.parse(jsonOutput);
        } catch (e) {
            const lines = jsonOutput.split('\n');
            for (const line of lines) {
                try {
                    const parsed = JSON.parse(line);
                    if (parsed.title) {
                        json = parsed;
                        break;
                    }
                } catch (ignored) {}
            }
        }

        if (!json) throw new Error('Failed to parse yt-dlp output');

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
    try {
        console.log(`[YouTubeService] Streaming request for: ${url}`);
        
        // Get the direct audio URL using yt-dlp
        // Priority: mp3 > m4a > webm (mp3/m4a have best browser support)
        const cmd = `"${YTDLP_PATH}" -f "bestaudio[ext=m4a]/bestaudio[ext=mp3]/bestaudio" -g --no-warnings "${url}"`;
        
        console.log(`[YouTubeService] Running: ${cmd}`);
        
        const directUrl = await new Promise((resolve, reject) => {
            exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
                if (error) {
                    console.error('[YouTubeService] yt-dlp error:', stderr || error.message);
                    return reject(error);
                }
                const url = stdout.trim().split('\n')[0];
                if (!url) {
                    return reject(new Error('No URL extracted'));
                }
                resolve(url);
            });
        });

        console.log(`[YouTubeService] Got direct URL, length: ${directUrl.length}`);

        // Option 1: Redirect to direct URL (simplest, but may have CORS issues)
        // res.redirect(directUrl);
        
        // Option 2: Proxy the stream with proper headers
        const fetchHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Encoding': 'identity',
            'Connection': 'keep-alive',
        };
        
        // Handle range requests for seeking
        if (req.headers.range) {
            fetchHeaders['Range'] = req.headers.range;
        }

        const lib = directUrl.startsWith('https') ? https : http;
        
        const proxyReq = lib.request(directUrl, { 
            headers: fetchHeaders,
            timeout: 30000
        }, (proxyRes) => {
            console.log(`[YouTubeService] Proxy response: ${proxyRes.statusCode}`);
            console.log(`[YouTubeService] Content-Type: ${proxyRes.headers['content-type']}`);
            
            // If YouTube returned an error or non-audio content
            if (proxyRes.statusCode >= 400 || (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('text/html'))) {
                console.error(`[YouTubeService] ⚠️ YouTube returned an error or HTML instead of audio!`);
                if (!res.headersSent) {
                    res.status(proxyRes.statusCode || 500).json({ 
                        error: 'YouTube stream blocked or invalid',
                        ytStatusCode: proxyRes.statusCode,
                        ytContentType: proxyRes.headers['content-type']
                    });
                }
                proxyReq.destroy();
                return;
            }

            // Forward status code
            res.status(proxyRes.statusCode);
            
            // Forward important headers
            const headersToForward = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
            headersToForward.forEach(header => {
                if (proxyRes.headers[header]) {
                    res.setHeader(header, proxyRes.headers[header]);
                }
            });
            
            // If no content-type, set a default based on what we requested
            if (!proxyRes.headers['content-type']) {
                res.setHeader('Content-Type', 'audio/mp4');
            }
            
            // Critical for seeking in browsers
            if (proxyRes.headers['accept-ranges']) {
                res.setHeader('Accept-Ranges', 'bytes');
            }
            
            // Enable CORS for the stream
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Range');
            res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
            
            // Pipe the response
            proxyRes.pipe(res);
            
            proxyRes.on('error', (err) => {
                console.error('[YouTubeService] Proxy response error during pipe:', err.message);
                if (!res.writableEnded) res.end();
            });
        });

        proxyReq.on('error', (err) => {
            console.error('[YouTubeService] Proxy request error:', err.message);
            if (!res.headersSent) {
                res.status(502).json({ error: 'Stream proxy failed' });
            }
        });
        
        proxyReq.on('timeout', () => {
            console.error('[YouTubeService] Request timeout');
            proxyReq.destroy();
            if (!res.headersSent) {
                res.status(504).json({ error: 'Stream timeout' });
            }
        });

        // Handle client disconnect
        req.on('close', () => {
            proxyReq.destroy();
        });

        proxyReq.end();

    } catch (err) {
        console.error('[YouTubeService] Streaming failed:', err.message);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Streaming failed', details: err.message });
        }
    }
};

