// YouTube Audio Stream Handler
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require('path');
const os = require('os');
const fetch = require('node-fetch');

const ytDlpBinaryPath = process.platform === 'win32' 
    ? path.join(__dirname, '../../yt-dlp.exe') 
    : path.join(os.tmpdir(), "yt-dlp");

/**
 * Extract direct audio stream URL from YouTube using yt-dlp
 * @param {string} youtubeUrl - YouTube video URL
 * @returns {Promise<string>} Direct audio stream URL
 */
async function getYouTubeAudioUrl(youtubeUrl) {
    try {
        // Prefer M4A (AAC) format 140 - best cross-browser compatibility
        // Format 140: M4A audio, 130k bitrate, AAC codec (mp4a.40.2)
        // Supported by: Chrome, Firefox, Safari, Edge, iOS, Android
        const cmd = `"${ytDlpBinaryPath}" -f "140/bestaudio[ext=m4a]/bestaudio" -g "${youtubeUrl}"`;
        console.log(`[YouTubeStream] Extracting audio URL...`);
        const { stdout } = await exec(cmd, { timeout: 10000 });
        const audioUrl = stdout.trim();
        
        if (!audioUrl) {
            throw new Error('No audio URL extracted');
        }
        
        console.log(`[YouTubeStream] Got audio URL: ${audioUrl.substring(0, 100)}...`);
        return audioUrl;
    } catch (error) {
        console.error('[YouTubeStream] Extraction failed:', error.message);
        throw error;
    }
}

/**
 * Stream YouTube audio with range support
 * @param {string} youtubeUrl - YouTube video URL
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function streamYouTubeAudio(youtubeUrl, req, res) {
    const startTime = Date.now();
    
    try {
        // Get direct audio URL
        const audioUrl = await getYouTubeAudioUrl(youtubeUrl);
        
        // Setup
        const userAgent = req.headers['user-agent'] || 'Mozilla/5.0';
        const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
        
        // Get file size
        const headResponse = await fetch(audioUrl, { 
            method: 'HEAD',
            headers: { 'User-Agent': userAgent }
        });
        const fileSize = parseInt(headResponse.headers.get('content-length') || '0');
        const contentType = headResponse.headers.get('content-type') || 'audio/mpeg';
        
        if (!fileSize) {
            console.error('[YouTubeStream] Could not determine file size');
            return res.status(500).send('Unable to stream: file size unknown');
        }

        console.log(`[YouTubeStream] File size: ${fileSize} bytes, Type: ${contentType}, Mobile: ${isMobile}`);

        // Handle range requests
        const range = req.headers.range;
        
        if (!range) {
            // No range - send full file info
            console.log('[YouTubeStream] No Range header, sending 200 OK');
            res.status(200);
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', fileSize);
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            
            const response = await fetch(audioUrl, {
                headers: { 'User-Agent': userAgent }
            });
            
            const duration = Date.now() - startTime;
            console.log(`[YouTubeStream] Full file stream started in ${duration}ms`);
            
            return response.body.pipe(res);
        }

        // Parse range
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        
        // Mobile optimization
        if (isMobile) {
            const MOBILE_MAX_CHUNK = 512 * 1024;
            const requestedChunk = end - start + 1;
            if (requestedChunk > MOBILE_MAX_CHUNK) {
                end = start + MOBILE_MAX_CHUNK - 1;
            }
        }
        
        // Validate range
        if (start >= fileSize || end >= fileSize || start > end) {
            console.error(`[YouTubeStream] Invalid range: ${range}`);
            return res.status(416)
                .setHeader('Content-Range', `bytes */${fileSize}`)
                .send('Range Not Satisfiable');
        }

        const chunkSize = (end - start) + 1;
        console.log(`[YouTubeStream] Range request: ${start}-${end} (${chunkSize} bytes)`);

        // Fetch with range
        const response = await fetch(audioUrl, {
            headers: { 
                'Range': `bytes=${start}-${end}`,
                'User-Agent': userAgent
            }
        });

        if (!response.ok && response.status !== 206) {
            console.error(`[YouTubeStream] Upstream error: ${response.status}`);
            return res.status(502).send('Upstream streaming error');
        }

        // Send 206 Partial Content
        res.status(206);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', chunkSize);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        
        const duration = Date.now() - startTime;
        console.log(`[YouTubeStream] 206 response prepared in ${duration}ms`);
        
        response.body.pipe(res);
        
    } catch (error) {
        console.error('[YouTubeStream] Error:', error.message);
        if (!res.headersSent) {
            res.status(500).send('YouTube streaming failed');
        }
    }
}

module.exports = {
    getYouTubeAudioUrl,
    streamYouTubeAudio
};
