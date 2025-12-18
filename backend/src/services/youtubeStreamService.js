const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec: execParams } = require('child_process');
const https = require('https');
const http = require('http');
// Properly load HttpsProxyAgent
const HttpsProxyAgentModule = require('https-proxy-agent');
const HttpsProxyAgent = HttpsProxyAgentModule.HttpsProxyAgent || HttpsProxyAgentModule;

const { YOUTUBE_COOKIES } = require('../config/env');
const { getCurrentProxyUrl, rotateProxy } = require('../utils/proxyManager');

// ==========================================
// 1. SETUP & BINARY MANAGEMENT (v2.0 REBUILD)
// ==========================================

// Ensure yt-dlp binary is available
const YTDLPInteractive = require('yt-dlp-wrap').default;
const ytDlpDir = path.join(__dirname, '../../temp'); // Local temp dir inside app
// Force ensure dir exists
if (!fs.existsSync(ytDlpDir)) {
    try { fs.mkdirSync(ytDlpDir, { recursive: true }); } catch(e) {}
}

const ytDlpBinaryPath = path.join(ytDlpDir, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

// Initializer: Downloads binary if missing or corrupt
(async () => {
    try {
        console.log(`[YouTubeStream v2] Initializing Binary at: ${ytDlpBinaryPath}`);
        
        let shouldDownload = false;

        if (!fs.existsSync(ytDlpBinaryPath)) {
            shouldDownload = true;
        } else {
            // Check for corruption (empty file)
            const stats = fs.statSync(ytDlpBinaryPath);
            if (stats.size < 1024 * 10) { // Less than 10KB is definitely wrong
                console.warn('[YouTubeStream v2] Binary corrupt (too small), deleting...');
                try { fs.unlinkSync(ytDlpBinaryPath); } catch(e) {}
                shouldDownload = true;
            }
        }

        if (shouldDownload) {
            console.log(`[YouTubeStream v2] Downloading latest yt-dlp...`);
            await YTDLPInteractive.downloadFromGithub(ytDlpBinaryPath);
            console.log(`[YouTubeStream v2] Download Complete.`);
        } else {
             console.log(`[YouTubeStream v2] Binary already exists.`);
        }

        // CRITICAL: Force Execute Permissions (Linux/Docker)
        if (process.platform !== 'win32') {
            try {
                fs.chmodSync(ytDlpBinaryPath, '755'); // rwxr-xr-x
                console.log(`[YouTubeStream v2] Permissions set to 755 (Executable).`);
            } catch (permErr) {
                console.error(`[YouTubeStream v2] Failed to set execute permissions: ${permErr.message}`);
            }
        }

    } catch (e) {
        console.error("[YouTubeStream v2] Critical Initialization Error:", e);
    }
})();

// Helper to get cookies
const getCookiePath = () => {
    const cookiePath = path.join(os.tmpdir(), "sangatamizh_cookies.txt");
    if (YOUTUBE_COOKIES && (!fs.existsSync(cookiePath) || fs.statSync(cookiePath).size === 0)) {
        try {
            fs.writeFileSync(cookiePath, YOUTUBE_COOKIES);
            console.log('[YouTubeStream v2] Cookies refreshed.');
        } catch (err) {
            console.warn('[YouTubeStream v2] Failed to write cookies:', err);
            return null;
        }
    }
    return fs.existsSync(cookiePath) ? cookiePath : null;
};

// Promisified Exec
const exec = (cmd, options = {}) => {
    return new Promise((resolve, reject) => {
        execParams(cmd, options, (error, stdout, stderr) => {
            if (error) {
                error.stdout = stdout;
                error.stderr = stderr;
                return reject(error);
            }
            resolve({ stdout, stderr });
        });
    });
};

// ==========================================
// 2. EXTRACTION LOGIC (Dual-Stack)
// ==========================================

async function getYouTubeAudioUrl(youtubeUrl, userAgent = 'Mozilla/5.0') {
    const cookiePath = getCookiePath();
    let lastError = null;

    // A. Preferred Method: DIRECT IPv4 (Fastest, Signed)
    try {
        console.log(`[YouTubeStream v2] Extracting (IPv4) for: ${youtubeUrl}`);
        const cookieArg = cookiePath ? `--cookies "${cookiePath}"` : '';
        // Prefer m4a for native streaming, bestaudio fallback
        const cmd = `"${ytDlpBinaryPath}" ${cookieArg} --user-agent "${userAgent}" --force-ipv4 -f "bestaudio[ext=m4a]/bestaudio" -g "${youtubeUrl}"`;
        
        const { stdout } = await exec(cmd, { timeout: 25000 });
        const url = stdout.trim().split('\n')[0]; // Take first line if multiple
        if (url && url.startsWith('http')) {
            console.log(`[YouTubeStream v2] URL Encquired (IPv4)`);
            return { url, family: 4 };
        }
    } catch (err) {
        console.warn(`[YouTubeStream v2] IPv4 Extraction Failed: ${err.message.substring(0, 100)}...`);
        lastError = err;
    }

    // B. Fallback Method: Standard/IPv6 (If IPv4 blocked or unavail)
    try {
        console.log(`[YouTubeStream v2] Extracting (IPv6/Default) for: ${youtubeUrl}`);
        const cookieArg = cookiePath ? `--cookies "${cookiePath}"` : '';
        const cmd = `"${ytDlpBinaryPath}" ${cookieArg} --user-agent "${userAgent}" -f "bestaudio[ext=m4a]/bestaudio" -g "${youtubeUrl}"`;
        
        const { stdout } = await exec(cmd, { timeout: 25000 });
         const url = stdout.trim().split('\n')[0];
        if (url && url.startsWith('http')) {
             console.log(`[YouTubeStream v2] URL Encquired (IPv6/Default)`);
            return { url, family: 6 };
        }
    } catch (err) {
        console.warn(`[YouTubeStream v2] IPv6 Extraction Failed: ${err.message.substring(0, 100)}...`);
        lastError = err;
    }
    
    // If we're here, binaries failed. We could fallback to ytdl-core in future, 
    // but for "High Quality" proxying, binaries are best.
    throw new Error('All extraction methods failed. ' +  (lastError ? lastError.message : ''));
}

// ==========================================
// 3. STREAMING LOGIC (The "Rebuild")
// ==========================================

async function streamYouTubeAudio(youtubeUrl, req, res) {
    // 1. Setup headers & Identity
    const userAgent = req.headers['user-agent'] || 'Mozilla/5.0';
    
    try {
        // 2. Get the Source URL
        const { url: audioSourceUrl, family } = await getYouTubeAudioUrl(youtubeUrl, userAgent);

        // 3. Configure the Proxy Request
        // We MUST match the extraction Protocol (IPv4 vs IPv6) to avoid 403 Forbidden
        const proxyUrl = getCurrentProxyUrl();
        let agent;
        
        if (proxyUrl && proxyUrl !== 'DIRECT') {
            agent = new HttpsProxyAgent(proxyUrl);
        } else {
             const Agent = audioSourceUrl.startsWith('https') ? https.Agent : http.Agent;
             // family: 4 forced IPv4, family: 6 allows IPv6
             agent = new Agent({ family: family, keepAlive: true });
        }

        // 4. Construct Headers for the Upstream Request
        const fetchHeaders = {
            'User-Agent': userAgent,
            'Accept': '*/*',
            'Connection': 'keep-alive'
        };

        // Forward Range header if present (Critical for seeking!)
        if (req.headers.range) {
            fetchHeaders['Range'] = req.headers.range;
            console.log(`[YouTubeStream v2] Proxying Range: ${req.headers.range} | Mode: IPv${family}`);
        } else {
            console.log(`[YouTubeStream v2] Proxying Full Stream | Mode: IPv${family}`);
        }

        // 5. Execute the Stream (Native Node Request for raw piping)
        // We use native https.request because it handles streams better than node-fetch
        const lib = audioSourceUrl.startsWith('https') ? https : http;
        const options = {
            method: 'GET',
            headers: fetchHeaders,
            agent: agent
        };

        const proxyReq = lib.request(audioSourceUrl, options, (proxyRes) => {
            // A. Handle Errors from Upstream (e.g. 403)
            if (proxyRes.statusCode >= 400) {
                console.error(`[YouTubeStream v2] Upstream Error: ${proxyRes.statusCode}`);
                // Try to consume data to free socket
                proxyRes.resume(); 
                if (!res.headersSent) res.status(500).send('Upstream Source Error');
                return;
            }

            // B. Forward Response Headers
            res.status(proxyRes.statusCode);
            
            // Critical Streaming Headers
            if (proxyRes.headers['content-type']) res.setHeader('Content-Type', proxyRes.headers['content-type']);
            if (proxyRes.headers['content-length']) res.setHeader('Content-Length', proxyRes.headers['content-length']);
            if (proxyRes.headers['content-range']) res.setHeader('Content-Range', proxyRes.headers['content-range']);
            if (proxyRes.headers['accept-ranges']) res.setHeader('Accept-Ranges', proxyRes.headers['accept-ranges']);
            
            // C. Pipe Data
            proxyRes.pipe(res);

            proxyRes.on('error', (err) => {
                console.error('[YouTubeStream v2] Response Stream Error:', err);
                if (!res.headersSent) res.end();
            });
        });

        proxyReq.on('error', (err) => {
             console.error('[YouTubeStream v2] Request Error:', err);
             // Verify if we can fallback? For now just error.
             if (!res.headersSent) res.status(502).send('Proxy Connection Failed');
        });

        proxyReq.end();

    } catch (error) {
        console.error('[YouTubeStream v2] Primary Flow Failed:', error.message);
        if (!res.headersSent) res.status(500).send(`Stream Initialization Failed: ${error.message}`);
    }
}

// Pure JS Fallback (just in case binary completely dies)
// We keep it exported but the main function uses new logic
async function verifyYtDlp() {
     return fs.existsSync(ytDlpBinaryPath);
}

module.exports = {
    streamYouTubeAudio,
    ensureYtDlp: verifyYtDlp // Mocking existing interface
};
