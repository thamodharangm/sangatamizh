const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

// YouTube Audio Stream Handler
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require('path');
const os = require('os');
const fetch = require('node-fetch');
const fs = require('fs');
const { YOUTUBE_COOKIES } = require('../config/env');
const { getCurrentProxyUrl, rotateProxy } = require('../utils/proxyManager');
const https = require('https');
const http = require('http');
// Properly load HttpsProxyAgent
const HttpsProxyAgentModule = require('https-proxy-agent');
const HttpsProxyAgent = HttpsProxyAgentModule.HttpsProxyAgent || HttpsProxyAgentModule;

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

// Ensure yt-dlp binary is available and up-to-date
const YTDLPInteractive = require('yt-dlp-wrap').default;
const ytDlpDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(ytDlpDir)) fs.mkdirSync(ytDlpDir, { recursive: true });
const ytDlpBinaryPath = path.join(ytDlpDir, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

// Async IIFE for download check with error handling
(async () => {
    try {
        if (!fs.existsSync(ytDlpBinaryPath)) {
            console.log('Downloading yt-dlp to:', ytDlpBinaryPath);
            await YTDLPInteractive.downloadFromGithub(ytDlpBinaryPath);
        }
    } catch (e) {
        console.error("Failed to download yt-dlp binary:", e);
    }
})();

const getCookiePath = () => {
    const cookiePath = path.join(os.tmpdir(), "sangatamizh_cookies.txt");
    if (YOUTUBE_COOKIES) {
        fs.writeFileSync(cookiePath, YOUTUBE_COOKIES);
        return cookiePath;
    }
    const localCookies = path.join(__dirname, '../../cookies.txt');
    if (fs.existsSync(localCookies)) {
        return localCookies;
    }
    return null;
};

/**
 * Extract direct audio stream URL from YouTube using yt-dlp
 * @param {string} youtubeUrl - YouTube video URL
 * @returns {Promise<string>} Direct audio stream URL
 */
const ytdl = require('@distube/ytdl-core');

/**
 * Extract direct audio stream URL from YouTube
 * @param {string} youtubeUrl - YouTube video URL
 * @param {string} userAgent - User agent string
 * @returns {Promise<{audioUrl: string, family: number}>} Direct audio stream URL and IP family
 */
async function getYouTubeAudioUrl(youtubeUrl, userAgent = 'Mozilla/5.0') {
    // 1. Try DIRECT extraction first (with force-ipv4) - this is way faster than proxy
    const cookiePath = getCookiePath();
    try {
        console.log(`[YouTubeStream] Attempting DIRECT yt-dlp (IPv4): ${youtubeUrl}`);
        const cookieArg = cookiePath ? `--cookies "${cookiePath}"` : '';
        const userAgentArg = `--user-agent "${userAgent}"`;
        // Prefer m4a for better raw streaming compatibility, fallback to best
        const cmd = `"${ytDlpBinaryPath}" ${cookieArg} ${userAgentArg} --force-ipv4 -f "bestaudio[ext=m4a]/bestaudio" -g "${youtubeUrl}"`;
        const { stdout } = await exec(cmd, { timeout: 15000 });
        const audioUrl = stdout.trim();
        if (audioUrl) {
            console.log(`[YouTubeStream] Got audio URL via direct yt-dlp (IPv4)`);
            return { audioUrl, family: 4 };
        }
    } catch (error) {
        console.warn('[YouTubeStream] Direct yt-dlp (IPv4) failed, trying IPv6...', error.message);
        
        // 1.5 Try DIRECT extraction with IPv6 if IPv4 failed
        try {
             console.log(`[YouTubeStream] Attempting DIRECT yt-dlp (IPv6): ${youtubeUrl}`);
             const cookieArg = cookiePath ? `--cookies "${cookiePath}"` : '';
             const userAgentArg = `--user-agent "${userAgent}"`;
             const cmd = `"${ytDlpBinaryPath}" ${cookieArg} ${userAgentArg} -f "bestaudio[ext=m4a]/bestaudio" -g "${youtubeUrl}"`; // removed --force-ipv4
             const { stdout } = await exec(cmd, { timeout: 15000 });
             const audioUrl = stdout.trim();
             if (audioUrl) {
                 console.log(`[YouTubeStream] Got audio URL via direct yt-dlp (IPv6/Default)`);
                 return { audioUrl, family: 6 };
             }
        } catch (ipv6Err) {
             console.warn('[YouTubeStream] Direct yt-dlp (IPv6) also failed:', ipv6Err.message);
        }
    }

    // 2. Fallback to Proxy extraction (Usually stays IPv4 for proxy compatibility)
    if (cookiePath) {
        try {
            const proxyUrl = getCurrentProxyUrl();
            const proxyArg = (proxyUrl && proxyUrl !== 'DIRECT') ? `--proxy "${proxyUrl}"` : '';
            const userAgentArg = `--user-agent "${userAgent}"`;
            console.log(`[YouTubeStream] Attempting yt-dlp with proxy: ${youtubeUrl} | Proxy: ${proxyUrl || 'DIRECT'}`);
            // Force IPv4 for proxy stability usually
            const cmd = `"${ytDlpBinaryPath}" --cookies "${cookiePath}" ${proxyArg} ${userAgentArg} --force-ipv4 -f "bestaudio[ext=m4a]/bestaudio" -g "${youtubeUrl}"`;
            const { stdout } = await exec(cmd, { timeout: 20000 });
            const audioUrl = stdout.trim();
            if (audioUrl) {
                console.log(`[YouTubeStream] Got audio URL via yt-dlp+proxy`);
                return { audioUrl, family: 4 };
            }
        } catch (error) {
            console.warn('[YouTubeStream] yt-dlp proxy extraction failed, falling back to next:', error.message);
            rotateProxy();
        }
    }

    // 2. Try ytdl-core (fastest, node-native)
    try {
        console.log(`[YouTubeStream] Extracting with ytdl-core: ${youtubeUrl}`);
        const info = await ytdl.getInfo(youtubeUrl);
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
        if (format && format.url) {
            console.log(`[YouTubeStream] Got URL via ytdl-core`);
            return { audioUrl: format.url, family: 4 }; // Assume IPv4 for ytdl-core mostly
        }
    } catch (error) {
        console.warn('[YouTubeStream] ytdl-core extraction failed:', error.message);
    }

    // 3. Final fallback: yt-dlp WITHOUT cookies (if not tried already)
    if (!cookiePath) {
        try {
            const proxyUrl = getCurrentProxyUrl();
            const proxyArg = (proxyUrl && proxyUrl !== 'DIRECT') ? `--proxy "${proxyUrl}"` : '';
            const userAgentArg = `--user-agent "${userAgent}"`;
            const cmd = `"${ytDlpBinaryPath}" ${proxyArg} ${userAgentArg} --force-ipv4 -f "bestaudio[ext=m4a]/bestaudio" -g "${youtubeUrl}"`;
            console.log(`[YouTubeStream] Extracting audio URL with yt-dlp (no cookies)... | Proxy: ${proxyUrl || 'DIRECT'}`);
            const { stdout } = await exec(cmd, { timeout: 30000 });
            const audioUrl = stdout.trim();
            if (audioUrl) {
                console.log(`[YouTubeStream] Got audio URL via yt-dlp`);
                return { audioUrl, family: 4 };
            }
        } catch (error) {
            console.error('[YouTubeStream] yt-dlp (no cookies) extraction failed:', error.message);
            rotateProxy();
        }
    }

    throw new Error('All extraction methods failed');
}

/**
 * Stream YouTube audio using proxy (either raw or transcoded)
 * @param {string} youtubeUrl - YouTube video URL
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function streamYouTubeAudio(youtubeUrl, req, res) {
    const startTime = Date.now();
    let isDestroyed = false;
    
    try {
        // Setup
        const userAgent = req.headers['user-agent'] || 'Mozilla/5.0';
        console.log(`[YouTubeStream] Request for: ${youtubeUrl} | UA: ${userAgent.substring(0, 50)}`);
        console.log(`[YouTubeStream] Headers:`, JSON.stringify(req.headers));

        // Get direct audio URL with User Agent and protocol family
        const { audioUrl, family } = await getYouTubeAudioUrl(youtubeUrl, userAgent);
        
        // METHOD 1: Direct Proxy (Raw) - Faster, supports Ranges, but depends on format support
        // We'll try to fetch the first few bytes to see if it's accessible and get headers
        try {
            const proxyUrl = getCurrentProxyUrl();
            const fetchHeaders = {
                'User-Agent': userAgent,
                'Range': req.headers.range || 'bytes=0-'
            };

            // If we're using a proxy for the fetch
            let agent = null;
            if (proxyUrl && proxyUrl !== 'DIRECT') {
                agent = new HttpsProxyAgent(proxyUrl);
            } else {
                 // Force the same IP family that was used for extraction (4 or 6)
                 // This ensures identity consistency to avoid 403 Forbidden
                 const Agent = audioUrl.startsWith('https') ? https.Agent : http.Agent;
                 agent = new Agent({ family: family, keepAlive: true });
                 console.log(`[YouTubeStream] Using ${family === 4 ? 'IPv4' : 'IPv6'} agent to match extraction.`);
            }

            const fetchOptions = {
                headers: fetchHeaders,
                agent: agent
            };

            console.log(`[YouTubeStream] Attempting Raw Proxy with Range: ${fetchHeaders.Range}`);
            
            const response = await fetch(audioUrl, fetchOptions);
            
            if (response.ok || response.status === 206) {
                console.log(`[YouTubeStream] Raw Proxy Success: ${response.status} ${response.headers.get('content-type')}`);
                
                // Forward critical headers
                res.status(response.status);
                ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'].forEach(h => {
                    const val = response.headers.get(h);
                    if (val) res.setHeader(h, val);
                });
                
                // Safely handle content-type if missing or vague
                if (!res.getHeader('content-type')) {
                    res.setHeader('content-type', 'audio/mpeg'); // fallback
                }

                return response.body.pipe(res);
            } else {
                console.warn(`[YouTubeStream] Raw Proxy returned ${response.status}, falling back to Transcode`);
            }
        } catch (rawError) {
            console.warn(`[YouTubeStream] Raw Proxy failed, falling back to Transcode:`, rawError.message);
        }

        // METHOD 2: Transcode to MP3 (Fallback)
        console.log(`[YouTubeStream] Starting Fallback Transcode for: ${youtubeUrl}`);

        // Set headers for MP3 stream
        res.status(200);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Accept-Ranges', 'none'); 
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Connection', 'close');

        const proxyUrl = getCurrentProxyUrl();
        const inputOptions = [
            '-reconnect 1',
            '-reconnect_streamed 1',
            '-reconnect_delay_max 2',
            `-user_agent "${userAgent}"`
        ];

        if (proxyUrl && proxyUrl !== 'DIRECT') {
            inputOptions.push(`-http_proxy "${proxyUrl}"`);
        }

        const command = ffmpeg(audioUrl)
            .inputOptions(inputOptions)
            .audioCodec('libmp3lame')
            .audioBitrate(128)
            .format('mp3')
            .on('start', (cmd) => {
                console.log(`[YouTubeStream] FFmpeg started in ${Date.now() - startTime}ms`);
            })
            .on('error', (err) => {
                if (isDestroyed || err.message.includes('SIGKILL') || err.message.includes('killed')) return;
                console.error('[YouTubeStream] FFmpeg error:', err.message);
                if (!res.headersSent) res.status(500).send('Transcoding failed');
            });

        command.pipe(res, { end: true });
        
        req.on('close', () => {
            if (!isDestroyed) {
                isDestroyed = true;
                command.kill('SIGKILL');
            }
        });
        
    } catch (error) {
        console.error('[YouTubeStream] Fatal Error:', error.message);
        if (!res.headersSent) {
            res.status(500).send('YouTube streaming failed');
        }
    }
}

module.exports = {
    getYouTubeAudioUrl,
    streamYouTubeAudio
};
