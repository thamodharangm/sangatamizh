/* 
  SANGATAMIZH MUSIC BACKEND (STABLE)
  includes: Cookies, ytdl-core fallback, yt-dlp binary fix
*/
require("dotenv").config();
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const os = require("os");
const fetch = require("node-fetch");
const YTDlpWrap = require("yt-dlp-wrap").default;
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const app = express();
const prisma = new PrismaClient();
app.use(cors({ origin: "*" }));
app.use(express.json());

const PORT = process.env.PORT || 3002;

// Supabase Setup
let supabaseUrl =
  process.env.SUPABASE_URL || "https://lemirqphbiyhmulyczzg.supabase.co";
if (supabaseUrl.includes("zzzg"))
  supabaseUrl = "https://lemirqphbiyhmulyczzg.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseKey) console.error("CRITICAL: SUPABASE_KEY is missing!");

const supabase = createClient(supabaseUrl, supabaseKey || "MISSING_KEY", {
  auth: { autoRefreshToken: false, persistSession: false },
  global: { fetch: fetch },
});

// yt-dlp Setup
const ytDlpBinaryPath = path.join(os.tmpdir(), "yt-dlp");
async function ensureYtDlp() {
  if (!fs.existsSync(ytDlpBinaryPath)) {
    console.log("Downloading yt-dlp...");
    let url =
      "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";
    if (process.platform === "linux") url += "_linux";
    try {
      const res = await fetch(url);
      const dest = fs.createWriteStream(ytDlpBinaryPath);
      res.body.pipe(dest);
      await new Promise((r) => dest.on("finish", r));
      fs.chmodSync(ytDlpBinaryPath, "755");
      console.log("yt-dlp ready.");
    } catch (e) {
      console.error("yt-dlp download failed:", e);
    }
  }
}
ensureYtDlp();

app.get("/api/songs", async (req, res) => {
  try {
    const songs = await prisma.song.findMany({
      orderBy: { created_at: "desc" },
    });
    res.json(songs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Debug Endpoint
app.get("/api/debug-network", async (req, res) => {
  const google = await fetch("https://www.google.com")
    .then((r) => r.status)
    .catch((e) => e.message);
  res.json({
    google_status: google,
    env_cookies: !!process.env.YOUTUBE_COOKIES,
  });
});

// NEW: Metadata Endpoint for Auto-Fill
app.post('/api/yt-metadata', async (req, res) => {
    const { url } = req.body;
    console.log('[Meta Request] URL:', url);
    
    // Cookie Setup (Shared logic)
    const cookiePath = path.join(os.tmpdir(), "cookies.txt");
    if (process.env.YOUTUBE_COOKIES) fs.writeFileSync(cookiePath, process.env.YOUTUBE_COOKIES);
    else if (fs.existsSync("./cookies.txt")) fs.copyFileSync("./cookies.txt", cookiePath);

    let videoId = null;
    let title = 'Unknown';
    let cover = null;

    try {
        // 1. Try YouTube Data API (Fastest & Most Reliable if Key exists)
        if (process.env.YT_API_KEY) {
             const id = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1];
             if (id) {
                 try {
                    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${process.env.YT_API_KEY}`;
                    const r = await fetch(apiUrl);
                    const d = await r.json();
                    if (d.items && d.items.length > 0) {
                        videoId = id;
                        title = d.items[0].snippet.title;
                        cover = d.items[0].snippet.thumbnails.high.url || d.items[0].snippet.thumbnails.default.url;
                        console.log('[Meta] ✅ API Success');
                        return res.json({ title, artist: d.items[0].snippet.channelTitle, coverUrl: cover });
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
            return res.json({ 
                title: info.title, 
                artist: info.uploader || 'Unknown', 
                coverUrl: info.thumbnail 
            });
        } catch(e) { console.log('[Meta] yt-dlp failed:', e.message); }

        // 3. Fallback to ytdl-core
        try {
             const ytdl = require('@distube/ytdl-core');
             const info = await ytdl.getBasicInfo(url);
             return res.json({
                 title: info.videoDetails.title,
                 artist: info.videoDetails.author.name,
                 coverUrl: info.videoDetails.thumbnails[0].url
             });
        } catch(e) {}

        throw new Error('Could not fetch metadata');

    } catch(e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch metadata' });
    }
});

app.post("/api/upload-from-yt", async (req, res) => {
  const { url, category, customMetadata } = req.body;
  const tempFile = path.join(os.tmpdir(), `song_${Date.now()}.mp3`);

  // Cookie Setup
  const cookiePath = path.join(os.tmpdir(), "cookies.txt");
  if (process.env.YOUTUBE_COOKIES)
    fs.writeFileSync(cookiePath, process.env.YOUTUBE_COOKIES);
  else if (fs.existsSync("./cookies.txt"))
    fs.copyFileSync("./cookies.txt", cookiePath);

  let videoId = null;
  let title = "Unknown";
  let cover = null;

  // Debug: Log environment variable status
  console.log("[DEBUG] Environment Check:", {
    hasYtApiKey: !!process.env.YT_API_KEY,
    hasCookies: !!process.env.YOUTUBE_COOKIES,
    cookieFileExists: fs.existsSync("./cookies.txt"),
  });

  try {
    // 1. Metadata: Try ytdl-core (Pure JS) FIRST
    try {
      console.log("[Meta] Level 1: Trying ytdl-core...");
      const ytdl = require("@distube/ytdl-core");
      const info = await ytdl.getBasicInfo(url, {
        requestOptions: {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        },
      });
      videoId = info.videoDetails.videoId;
      title = info.videoDetails.title;
      cover =
        info.videoDetails.thumbnails?.pop()?.url ||
        info.videoDetails.thumbnails?.[0]?.url;
      console.log("[Meta] ✅ Level 1 SUCCESS: ytdl-core");
    } catch (e) {
      console.log("[Meta] ❌ Level 1 FAILED: ytdl-core -", e.message);
    }

    // 2. Metadata: Fallback to yt-dlp (Binary + Cookies)
    if (!videoId) {
      try {
        console.log("[Meta] Level 2: Trying yt-dlp with cookies...");
        const cmd = `${ytDlpBinaryPath} "${url}" --dump-json --no-warnings --prefer-free-formats --force-ipv4 --js-runtimes "node:${process.execPath}" --extractor-args "youtube:player_client=ios" --cookies "${cookiePath}"`;
        const { stdout } = await exec(cmd);
        const info = JSON.parse(stdout);
        videoId = info.id;
        title = info.title;
        cover = info.thumbnail;
        console.log("[Meta] ✅ Level 2 SUCCESS: yt-dlp");
      } catch (e) {
        console.log("[Meta] ❌ Level 2 FAILED: yt-dlp -", e.message);
      }
    }

    // 3. Metadata: Fallback to Invidious
    if (!videoId) {
      console.log("[Meta] Level 3: Trying Invidious mirrors...");
      const id = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1];
      if (id) {
        const mirrors = [
          "https://inv.tux.pizza",
          "https://vid.uff.io",
          "https://invidious.jing.rocks",
        ];
        for (const m of mirrors) {
          try {
            console.log(`[Meta] Level 3: Trying mirror ${m}...`);

            // Add 5-second timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const r = await fetch(`${m}/api/v1/videos/${id}`, {
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (r.ok) {
              const d = await r.json();
              videoId = d.videoId;
              title = d.title;
              cover = d.videoThumbnails?.[0]?.url;
              console.log(`[Meta] ✅ Level 3 SUCCESS: Invidious (${m})`);
              break;
            } else {
              console.log(`[Meta] Mirror ${m} returned status ${r.status}`);
            }
          } catch (e) {
            console.log(`[Meta] Mirror ${m} error:`, e.message);
          }
        }
      } else {
        console.log(
          "[Meta] ❌ Level 3 FAILED: Could not extract video ID from URL"
        );
      }
    }

    // 4. Metadata: Fallback to Official YouTube Data API (The Final Solution)
    if (!videoId && process.env.YT_API_KEY) {
      try {
        console.log("[Meta] Level 4: Trying Official YouTube Data API...");
        const id = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1];
        if (id) {
          const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${process.env.YT_API_KEY}`;
          console.log(
            `[Meta] API Request to: ${apiUrl.replace(
              process.env.YT_API_KEY,
              "API_KEY_HIDDEN"
            )}`
          );
          const r = await fetch(apiUrl);
          const d = await r.json();
          console.log(
            "[Meta] API Response:",
            JSON.stringify(d).substring(0, 200)
          );
          if (d.items && d.items.length > 0) {
            videoId = id;
            title = d.items[0].snippet.title;
            cover = d.items[0].snippet.thumbnails.high.url;
            console.log("[Meta] ✅ Level 4 SUCCESS: YouTube Data API");
          } else {
            console.log("[Meta] ❌ Level 4 FAILED: No items in API response");
          }
        } else {
          console.log("[Meta] ❌ Level 4 FAILED: Could not extract video ID");
        }
      } catch (e) {
        console.error(
          "[Meta] ❌ Level 4 FAILED: YouTube API error -",
          e.message
        );
      }
    } else if (!videoId) {
      console.log(
        "[Meta] ⚠️ Level 4 SKIPPED: YT_API_KEY not set in environment"
      );
    }

    if (!videoId) throw new Error("MetaData Failed completely.");

    // 4. Download: Use Invidious to get direct audio URL (bypasses YouTube bot detection)
    console.log(`Downloading ${videoId}...`);
    let downloadSuccess = false;

    // Try getting audio URL from Invidious
    const invMirrors = [
      "https://inv.tux.pizza",
      "https://vid.uff.io",
      "https://invidious.jing.rocks",
    ];
    for (const mirror of invMirrors) {
      try {
        console.log(`[Download] Trying to get audio URL from ${mirror}...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`${mirror}/api/v1/videos/${videoId}`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          // Get the best audio format
          const audioFormats =
            data.adaptiveFormats?.filter((f) => f.type?.includes("audio")) ||
            [];
          if (audioFormats.length > 0) {
            const bestAudio = audioFormats.sort(
              (a, b) => (b.bitrate || 0) - (a.bitrate || 0)
            )[0];
            console.log(`[Download] Found audio URL from ${mirror}`);

            // Download the audio file
            const audioRes = await fetch(bestAudio.url);
            const buffer = await audioRes.arrayBuffer();
            fs.writeFileSync(tempFile, Buffer.from(buffer));
            downloadSuccess = true;
            console.log("[Download] ✅ SUCCESS via Invidious");
            break;
          }
        }
      } catch (e) {
        console.log(`[Download] Mirror ${mirror} failed:`, e.message);
      }
    }

    if (!downloadSuccess) {
      throw new Error(
        "Download failed: All methods blocked by YouTube bot detection. Please add a PROXY_URL environment variable or try a different video."
      );
    }

    // Upload
    const file = fs.readFileSync(tempFile);
    const fname = `songs/${Date.now()}_${videoId}.mp3`;
    const { error } = await supabase.storage
      .from("music-files")
      .upload(fname, file, { contentType: "audio/mpeg" });
    if (error) throw error;

    const publicUrl = supabase.storage.from("music-files").getPublicUrl(fname)
      .data.publicUrl;
    fs.unlinkSync(tempFile);

    const song = await prisma.song.create({
      data: {
        title: customMetadata?.title || title,
        artist: customMetadata?.artist || "Unknown",
        file_url: publicUrl,
        cover_url:
          customMetadata?.coverUrl ||
          cover ||
          "https://via.placeholder.com/150",
        category: category || "Tamil",
      },
    });
    res.json(song);
  } catch (e) {
    console.error(e);
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`Server on ${PORT}`));
