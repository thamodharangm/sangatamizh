const fs = require('fs');
const path = require('path');
const os = require('os');
const fetch = require('node-fetch');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { YT_API_KEY, YOUTUBE_COOKIES } = require('../config/env');

let ytDlpBinaryPath = process.platform === 'win32' 
    ? path.join(__dirname, '../../yt-dlp.exe') 
    : path.join(os.tmpdir(), "yt-dlp");

async function ensureYtDlp() {
  if (fs.existsSync(ytDlpBinaryPath)) {
      console.log(`Using yt-dlp at: ${ytDlpBinaryPath}`);
      return;
  }
  
  // Fallback to temp if local not found
  const tempPath = path.join(os.tmpdir(), process.platform === 'win32' ? "yt-dlp.exe" : "yt-dlp");
  ytDlpBinaryPath = tempPath;

  if (!fs.existsSync(tempPath)) {
    console.log("Downloading yt-dlp...");
    let url = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";
    if (process.platform === "win32") url += ".exe";
    else if (process.platform === "linux") url += "_linux";
    
    try {
      const res = await fetch(url);
      const dest = fs.createWriteStream(tempPath);
      res.body.pipe(dest);
      await new Promise((r) => dest.on("finish", r));
      if (process.platform !== 'win32') fs.chmodSync(tempPath, "755");
      console.log("yt-dlp ready at temp.");
    } catch (e) {
      console.error("yt-dlp download failed:", e);
    }
  }
}


// Initialize on load
ensureYtDlp();

const getCookiePath = () => {
    const cookiePath = path.join(os.tmpdir(), "cookies.txt");
    if (YOUTUBE_COOKIES) fs.writeFileSync(cookiePath, YOUTUBE_COOKIES);
    else if (fs.existsSync("./cookies.txt")) fs.copyFileSync("./cookies.txt", cookiePath);
    return cookiePath;
};

async function getMetadata(url) {
    console.log('[Meta Request] URL:', url);
    const cookiePath = getCookiePath();
    
    // 1. Try YouTube Data API
    if (YT_API_KEY) {
         const id = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1];
         if (id) {
             try {
                const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${YT_API_KEY}`;
                const r = await fetch(apiUrl);
                const d = await r.json();
                if (d.items && d.items.length > 0) {
                    const snip = d.items[0].snippet;
                    console.log('[Meta] ✅ API Success');
                    return { 
                        title: snip.title, 
                        artist: snip.channelTitle, 
                        coverUrl: snip.thumbnails.high?.url || snip.thumbnails.default?.url 
                    };
                }
             } catch(e) { console.error('[Meta] API Error', e.message); }
         }
    }

    // 2. Fallback to yt-dlp
    console.log('[Meta] Fallback to yt-dlp...');
    try {
        const cmd = `${ytDlpBinaryPath} "${url}" --dump-json --no-warnings --prefer-free-formats --force-ipv4 --cookies "${cookiePath}"`;
        const { stdout } = await exec(cmd);
        const info = JSON.parse(stdout);
        return { 
            title: info.title, 
            artist: info.uploader || 'Unknown', 
            coverUrl: info.thumbnail 
        };
    } catch(e) { console.log('[Meta] yt-dlp failed:', e.message); }

    // 3. Fallback to ytdl-core
    try {
         const ytdl = require('@distube/ytdl-core');
         const info = await ytdl.getBasicInfo(url);
         return {
             title: info.videoDetails.title,
             artist: info.videoDetails.author.name,
             coverUrl: info.videoDetails.thumbnails[0].url
         };
    } catch(e) {}

    throw new Error('Could not fetch metadata');
}

async function downloadAudio(videoId) {
    console.log(`Downloading ${videoId}...`);
    const tempFile = path.join(os.tmpdir(), `song_${Date.now()}.mp3`);
    
    // Try Invidious Mirrors
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

    // Fallback: Try yt-dlp (Binary + Cookies)
    console.log('[Download] All mirrors failed. Trying yt-dlp (Raw M4A)...');
    try {
        const cookiePath = getCookiePath();
        // Use m4a so we don't depend on ffmpeg for conversion
        const m4aFile = tempFile.replace('.mp3', '.m4a');
        
        // Command: Download best audio as m4a directly
        const cmd = `${ytDlpBinaryPath} -f "bestaudio[ext=m4a]" -o "${m4aFile}" "https://www.youtube.com/watch?v=${videoId}" --force-ipv4 --cookies "${cookiePath}"`;
        
        await exec(cmd);
        
        if (fs.existsSync(m4aFile)) {
             const stats = fs.statSync(m4aFile);
             if (stats.size > 0) {
                 console.log(`[Download] ✅ SUCCESS via yt-dlp (m4a) - Size: ${stats.size} bytes`);
                 return m4aFile;
             } else {
                 console.log('[Download] yt-dlp created empty file.');
                 fs.unlinkSync(m4aFile);
             }
        }
    } catch(e) {
        console.error('[Download] yt-dlp failed:', e.message);
    }

    throw new Error("Download failed: All methods blocked.");
}

module.exports = { ensureYtDlp, getMetadata, downloadAudio };
