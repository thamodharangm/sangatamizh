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

// Check if yt-dlp is available in PATH (global install)
const checkGlobalYtDlp = () => {
    return new Promise((resolve) => {
        exec('yt-dlp --version', (error) => {
            resolve(!error);
        });
    });
};

export const IS_GLOBAL = await checkGlobalYtDlp();
export const YTDLP_PATH = IS_GLOBAL ? 'yt-dlp' : path.join(TEMP_DIR, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

// Initialize yt-dlp binary if missing
const initYtDlp = async () => {
    if (IS_GLOBAL || fs.existsSync(YTDLP_PATH)) return;

    try {
        console.log('[YouTubeService] Downloading yt-dlp...');
        const url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp' + (process.platform === 'win32' ? '.exe' : '');
        
        const headers = {};
        if (process.env.GITHUB_TOKEN) {
            headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
        }

        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            headers
        });

        const writer = fs.createWriteStream(YTDLP_PATH);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', (err) => {
                fs.unlink(YTDLP_PATH, () => {}); // Cleanup partial file
                reject(err);
            });
        });

        if (process.platform !== 'win32') {
            fs.chmodSync(YTDLP_PATH, '755');
        }
        console.log('[YouTubeService] yt-dlp binary downloaded successfully.');
    } catch (err) {
        if (err.response && err.response.status === 403) {
            console.error('[YouTubeService] ⚠️ GitHub Rate Limit Hit! streaming might fail until binary is available.');
            console.error('[YouTubeService] Add a GITHUB_TOKEN to your environment variables to bypass this.');
        } else {
            console.error('[YouTubeService] Failed to download yt-dlp:', err.message);
        }
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
        const cookiesPath = path.join(process.cwd(), 'cookies.txt');
        const cookieFlag = fs.existsSync(cookiesPath) ? `--cookies "${cookiesPath}"` : '';
        const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
        const cmd = `"${YTDLP_PATH}" ${cookieFlag} --dump-json --skip-download --no-warnings --force-ipv4 --user-agent "${userAgent}" "${url}"`;
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

        // Import title parser dynamically
        const { parseYouTubeMetadata } = await import('./titleParser.service.js');
        
        // Parse title intelligently
        const parsed = parseYouTubeMetadata({
            title: json.title,
            uploader: json.uploader,
            thumbnail: json.thumbnail,
            duration: json.duration,
            description: json.description || ''
        });

        return {
            // Main fields
            title: parsed.song,           // Song name (cleaned)
            movie: parsed.movie,          // Movie name (extracted)
            artist: parsed.uploader || json.uploader,  // Keep original uploader
            
            // Cover and metadata
            coverUrl: parsed.thumbnail,
            duration: parsed.duration,
            videoId,
            
            // Suggestions
            suggestedCategory: parsed.genre || 'Tamil',
            suggestedEmotion: parsed.emotion || 'Feel Good',
            
            // Original for reference
            rawTitle: json.title
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
        
        const cookiesPath = path.join(process.cwd(), 'cookies.txt');
        const cookieFlag = fs.existsSync(cookiesPath) ? `--cookies "${cookiesPath}"` : '';
        
        const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
        const cmd = `"${YTDLP_PATH}" ${cookieFlag} -f "ba[ext=m4a]/ba[ext=mp3]/ba" -g --no-warnings --force-ipv4 --add-header "User-Agent:${userAgent}" "${url}"`;
        
        console.log(`[YouTubeService] Running: ${cmd}`);
        
        const directUrl = await new Promise((resolve, reject) => {
            exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
                if (error) {
                    console.error('[YouTubeService] yt-dlp error:', stderr || error.message);
                    return reject(error);
                }
                // yt-dlp might return multiple lines if it finds both audio and video or multiple formats, take the first one
                const lines = stdout.trim().split('\n');
                const url = lines[0]; 
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

