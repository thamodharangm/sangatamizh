const fs = require('fs');
const { getProxyAgent, rotateProxy, getCurrentProxyUrl } = require('../utils/proxyManager');
const path = require('path');
const os = require('os');
// ---- PROXY SUPPORT -------------------------------------------------
const HttpsProxyAgent = require('https-proxy-agent');
function getEnvProxyAgent() {
  const proxy = process.env.PROXY_URL;
  if (!proxy || proxy === 'DIRECT') return null;
  return new HttpsProxyAgent(proxy);
}
const fetch = require('node-fetch');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { YT_API_KEY, YOUTUBE_COOKIES } = require('../config/env');
const { runYtDlp } = require('../utils/runYtDlp');
const lyricsFinder = require('lyrics-finder'); // New import

// Binary Management
const YTDLPInteractive = require('yt-dlp-wrap').default;
let ytDlpBinaryPath = path.join(__dirname, '../../temp', process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

async function ensureYtDlp() {
  if (fs.existsSync(ytDlpBinaryPath)) {
      // Check for zero-byte corruption
      const stats = fs.statSync(ytDlpBinaryPath);
      if (stats.size > 1000) return;
  }
  
  // Download if missing or corrupt
  const tempDir = path.dirname(ytDlpBinaryPath);
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  console.log("[Meta Service] Downloading yt-dlp...");
  try {
     await YTDLPInteractive.downloadFromGithub(ytDlpBinaryPath);
     if (process.platform !== 'win32') fs.chmodSync(ytDlpBinaryPath, "755");
     console.log("[Meta Service] yt-dlp ready.");
  } catch(e) {
      console.error("[Meta Service] Failed to download binary", e);
  }
}

ensureYtDlp();

const getCookiePath = () => {
    const cookiePath = path.join(os.tmpdir(), "cookies.txt");
    if (YOUTUBE_COOKIES) fs.writeFileSync(cookiePath, YOUTUBE_COOKIES);
    else if (fs.existsSync("./cookies.txt")) fs.copyFileSync("./cookies.txt", cookiePath);
    return cookiePath;
};

const cleanMetadata = (title, channelName) => {
    // Remove common video prefixes/suffixes
    let cleanTitle = title
        .replace(/^(Full Video|Video Song|Lyrical Video|Official Video|Lyrical|4K|HD)[:\|]?\s*/i, '') // Prefixes
        .replace(/\(.*\)/g, '')
        .replace(/\[.*\]/g, '')
        .replace(/ft\..*/i, '')
        .replace(/feat\..*/i, '')
        .replace(/\|.*/, '') // Remove everything after pipe
        .replace(/ - .*/, '') // Remove everything after dash if use dash separator
        .replace(/Video Song|Full Video|Lyrical/gi, '') // Remove these words anywhere
        .trim();
        
    // Sometimes artist is in title "Artist - Song" - handled by piped/dash removal above mostly, 
    // but if it was "Song - Artist", it's harder. Assuming standard format.
    
    // For specific known channels or patterns
    let artist = channelName;
    if (channelName.includes('VEVO') || channelName.includes('Sony') || channelName.includes('Music')) {
         // Try to find artist in description or just use generic search which lyrics-finder handles well if artist is vague
         artist = ""; // Let lyrics finder guess from title only if channel is generic label
    }

    return { title: cleanTitle, artist };
};

const detectEmotion = (title, description = '', lyrics = '') => {
    const text = (title + ' ' + description + ' ' + lyrics).toLowerCase();
    
    // Weights: Lyrics matches count x2, Title x3
    // Simple occurrence check:
    
    const countMatches = (keywords) => {
        let count = 0;
        const potentialMatches = [];
        keywords.forEach(k => {
            const regex = new RegExp(`\\b${k}\\b`, 'gi');
            const matches = text.match(regex);
            if (matches) {
                count += matches.length;
                potentialMatches.push(`${k}(${matches.length})`);
            }
        });
        return { count, matches: potentialMatches };
    };

    // 1. Sad / Emotional
    const sadKeywords = [
        'sad', 'lonely', 'cry', 'broken', 'pain', 'tears', 'miss you', 'heartbreak',
        'sogam', 'kanner', 'pirivu', 'valigal', 'thanimai', 'emotional', 'pathos',
        'death', 'die', 'hurt', 'alone', 'sorry', 'goodbye', 'lost', 'sogamaana'
    ];
    const sadRes = countMatches(sadKeywords);
    const sadScore = sadRes.count;
    
    // 2. Motivation / Power
    const motivationKeywords = [
        'motivation', 'gym', 'workout', 'power', 'rise', 'inspire', 'success', 'win', 
        'victory', 'triumph', 'energy', 'beast', 'fire', 'thunder', 'verithanam', 'mass',
        'strong', 'fight', 'champion', 'believe', 'dream', 'gethu', 'singapenney'
    ];
    const motivationRes = countMatches(motivationKeywords);
    const motivationScore = motivationRes.count;
    
    // 3. Vibe / Party / Fast
    const vibeKeywords = [
        'party', 'dj', 'dance', 'remix', 'vibe', 'kuthu', 'fast', 'beat', 'club', 
        'folk', 'gaana', 'celebration', 'fun', 'groove', 'thara local', 'adi', 'koko',
        'start music', 'drink', 'night', 'shake', 'move', 'aatam', 'thullal'
    ];
    const vibeRes = countMatches(vibeKeywords);
    const vibeScore = vibeRes.count;
    
    // 4. Feel Good / Melody / Love
    const feelGoodKeywords = [
        'feel good', 'happy', 'chill', 'relax', 'melody', 'love', 'romance', 
        'kaadhal', 'kadhal', 'pizhai', 'mudhal', 'anbe', 'uyire', 'kanmani', 
        'azhagi', 'beautiful', 'soul', 'breeze', 'rain', 'mazhai', 'bgm', 'instrumental',
        'senthaazhini', 'poo', 'malar', 'kannamma', 'thoongu', 'madiyil', 'urgame',
        'baby', 'kiss', 'together', 'forever', 'sun', 'smile', 
        'kannumuzhi', 'kannu', 'vizhi', 'penne', 'usure', 'rathamae', 'yennai', 'lesa'
    ];
    const feelGoodRes = countMatches(feelGoodKeywords);
    const feelGoodScore = feelGoodRes.count;

    console.log(`[Emotion Analysis] Matches: Sad-[${sadRes.matches}], Motivation-[${motivationRes.matches}], Vibe-[${vibeRes.matches}], FeelGood-[${feelGoodRes.matches}]`);
    console.log(`[Emotion Analysis] Scores - Sad: ${sadScore}, Motivation: ${motivationScore}, Vibe: ${vibeScore}, Feel Good: ${feelGoodScore}`);

    // Determine winner
    const maxScore = Math.max(sadScore, motivationScore, vibeScore, feelGoodScore);
    
    if (maxScore === 0) return 'Feel Good'; 
    
    // Priority Resolution for Ties or "Mass" conflict
    // If Motivation has "Mass" only, but Feel Good has strong romantic keywords, prefer Feel Good.
    const hasMass = motivationRes.matches.some(m => m.startsWith('mass'));
    if (hasMass && feelGoodScore > 0 && feelGoodScore >= motivationScore - 1) {
         return 'Feel Good';
    }

    if (motivationScore === maxScore) return 'Motivation';
    if (vibeScore === maxScore) return 'Vibe';
    if (sadScore === maxScore) return 'Sad songs';
    if (feelGoodScore === maxScore) return 'Feel Good';

    return 'Feel Good'; 
};

async function getMetadata(url) {
    const fs = require('fs');
    fs.appendFileSync('debug_meta.log', `[${new Date().toISOString()}] Request: ${url}\n`);
    console.log('[Meta Request] URL:', url);
    const cookiePath = getCookiePath();
    
    // 1. Try YouTube Data API (with Key Rotation)
    if (YT_API_KEY) {
         const id = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1];
         if (id) {
             const keys = YT_API_KEY.split(',').map(k => k.trim()).filter(k => k);
             
             for (const key of keys) {
                 try {
                    console.log(`[Meta] Trying API Key: ...${key.slice(-4)}`);
                    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${key}`;
                    
                    // Add timeout to API request
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
                    
                    const r = await fetch(apiUrl, { signal: controller.signal });
                    clearTimeout(timeoutId);
                    
                    if (!r.ok) {
                        console.warn(`[Meta] Key ...${key.slice(-4)} failed: ${r.status} ${r.statusText}`);
                        if (r.status === 403) continue;
                        continue;
                    }

                    const d = await r.json();
                    if (d.items && d.items.length > 0) {
                        const snip = d.items[0].snippet;
                        console.log('[Meta] ✅ API Success');
                        
                        // Fast emotion detection (no lyrics - too slow)
                        const emotion = detectEmotion(snip.title, snip.description || '', '');
                        
                        console.log(`[Meta] Detected Emotion: ${emotion}`);
                        return { 
                            title: snip.title, 
                            artist: snip.channelTitle, 
                            coverUrl: snip.thumbnails.high?.url || snip.thumbnails.default?.url,
                            emotion,
                            description: snip.description,
                            viewCount: 0
                        };
                    } else {
                        console.log(`[Meta] Video not found with key ...${key.slice(-4)}`);
                    }
                 } catch(e) { 
                     console.error('[Meta] API Error with key', e.message); 
                 }
             }
             console.log('[Meta] All API keys failed. Trying fast fallbacks...');
         }
    }

    // 2. Skip yt-dlp for speed (too slow for upload UI)

    // 3. Fast Fallback: Invidious Mirrors
    const mirrors = ["https://inv.tux.pizza", "https://vid.uff.io"];
    for (const mirror of mirrors) {
        try {
            console.log(`[Meta] Trying mirror ${mirror}...`);
            const id = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1];
            if (!id) continue;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 sec timeout
            
            const res = await fetch(`${mirror}/api/v1/videos/${id}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (res.ok) {
                const info = await res.json();
                console.log(`[Meta] Success via ${mirror}`);
                
                // Fast emotion detection (no lyrics)
                const emotion = detectEmotion(info.title, info.description || '', '');
                
                return {
                    title: info.title,
                    artist: info.author,
                    coverUrl: info.videoThumbnails?.find(t => t.quality === 'maxresdefault')?.url || info.videoThumbnails?.[0]?.url,
                    emotion,
                    description: info.description,
                    viewCount: info.viewCount || 0
                };
            }
        } catch(e) {
            console.log(`[Meta] Mirror ${mirror} failed:`, e.message);
        }
    }

    // 4. Fallback to ytdl-core
    try {
         const ytdl = require('@distube/ytdl-core');
         const info = await ytdl.getBasicInfo(url);
         return {
             title: info.videoDetails.title,
             artist: info.videoDetails.author.name,
             coverUrl: info.videoDetails.thumbnails[0].url,
             emotion: detectEmotion(info.videoDetails.title, info.videoDetails.description || '')
         };
    } catch(e) {}

    throw new Error('Could not fetch metadata');
}

async function downloadAudio(videoId) {
    console.log(`Downloading ${videoId}...`);
    const tempFile = path.join(os.tmpdir(), `song_${Date.now()}.mp3`); // Always MP3
    
    // 1. Try @distube/ytdl-core (Node Native - Often fastest)
    try {
        console.log('[Download] Trying @distube/ytdl-core...');
        const ytdl = require('@distube/ytdl-core');
        const stream = ytdl(`https://www.youtube.com/watch?v=${videoId}`, {
            quality: 'highestaudio',
            filter: 'audioonly'
        });
        
        await new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(tempFile);
            stream.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
            stream.on('error', reject);
        });
        
        if (fs.existsSync(tempFile)) {
             const stats = fs.statSync(tempFile);
             if (stats.size > 50000) { // > 50KB
                 console.log(`[Download] ✅ SUCCESS via ytdl-core - Size: ${stats.size}`);
                 return tempFile;
             }
        }
    } catch (e) {
        console.log('[Download] ytdl-core failed:', e.message);
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }

    // 2. Try Invidious Mirrors
    const mirrors = ["https://inv.tux.pizza", "https://vid.uff.io", "https://invidious.jing.rocks"];
    
    for (const mirror of mirrors) {
        try {
            console.log(`[Download] Trying to get audio URL from ${mirror}...`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const res = await fetch(`${mirror}/api/v1/videos/${videoId}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (res.ok) {
                const data = await res.json();
                const audioFormats = data.adaptiveFormats?.filter((f) => f.type?.includes("audio")) || [];
                
                if (audioFormats.length > 0) {
                    const bestAudio = audioFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
                    console.log(`[Download] Found audio URL from ${mirror}`);
                    
                    const audioRes = await fetch(bestAudio.url);
                    const buffer = await audioRes.arrayBuffer();
                    fs.writeFileSync(tempFile, Buffer.from(buffer));
                    
                    return tempFile; // Return path to downloaded file
                }
            }
        } catch(e) {
            console.log(`[Download] Mirror ${mirror} failed:`, e.message);
        }
    }

    // 3. Fallback: Try yt-dlp (Binary + Cookies + Proxy Rotation)
    console.log('[Download] All mirrors failed. Trying yt-dlp (Raw M4A) with Proxy Rotation...');
    
    // Retry loop with proxies
    let attempts = 0;
    const maxRetries = 3;

    // Flag to track if we should try the specific PROXY_URL env var
    let useEnvProxy = true;

    while (attempts <= maxRetries) {
        try {
            const cookiePath = getCookiePath();
           
            // Proxy selection: Use env var first, but if it fails, switch to pool
            const envProxy = process.env.PROXY_URL;
            let proxyUrl;
            
            if (useEnvProxy && envProxy) {
                proxyUrl = envProxy;
            } else {
                proxyUrl = getCurrentProxyUrl();
                // If pool is empty (returns DIRECT) but we want a proxy, wait a bit
                if (proxyUrl === 'DIRECT') {
                    console.log('[Download] Proxy pool empty, waiting 5s for fetcher...');
                    await new Promise(r => setTimeout(r, 5000));
                    proxyUrl = getCurrentProxyUrl(); 
                }
            }

            console.log(`[Download] Attempt ${attempts + 1}: Using Proxy ${proxyUrl || 'DIRECT'}`);

            // Build args array for runYtDlp
            const args = [
                ytDlpBinaryPath,
                '--ffmpeg-location', require('ffmpeg-static'),
                '-x', '--audio-format', 'mp3',
                '-o', tempFile, // Output as mp3
                `https://www.youtube.com/watch?v=${videoId}`,
                '--force-ipv4',
            ];

            // Add cookies if they exist
            if (fs.existsSync(cookiePath)) {
                args.push('--cookies', cookiePath);
            }

            // Add proxy flag only when we have a real proxy
            if (proxyUrl && proxyUrl !== 'DIRECT') {
                args.push('--proxy', proxyUrl);
            }

            // Execute using wrapper
            await runYtDlp(args, { timeout: 60000 });
            
            if (fs.existsSync(tempFile)) {
                 const stats = fs.statSync(tempFile);
                 if (stats.size > 0) {
                     console.log(`[Download] ✅ SUCCESS via yt-dlp (mp3) - Size: ${stats.size} bytes`);
                     return tempFile;
                 } else {
                     console.log('[Download] yt-dlp created empty file.');
                     fs.unlinkSync(tempFile);
                 }
            }
        } catch(e) {
            console.error(`[Download] yt-dlp failed (Attempt ${attempts + 1}):`, e.message);
            
            // If we were using the hardcoded env proxy, disable it for next retry so we can rotate
            if (useEnvProxy && process.env.PROXY_URL) {
                console.log('[Download] PROXY_URL failed, switching to auto-rotating pool...');
                useEnvProxy = false;
            }

            // If failed and using proxy, rotate
            const currentProxy = getCurrentProxyUrl();
            if (currentProxy && currentProxy !== 'DIRECT') {
                 console.log('[Download] Rotating proxy due to failure...');
                 rotateProxy();
            }
        }
        attempts++;
    }

    throw new Error("Download failed: All methods blocked.");
}

module.exports = { ensureYtDlp, getMetadata, downloadAudio };
