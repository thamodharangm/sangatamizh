import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const execAsync = promisify(exec);

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Supabase credentials missing in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BUCKET_NAME = 'music-app'; // Ensure this bucket exists

// Helper to download file
async function downloadFile(url, dest) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download: ${res.statusText}`);
    const stream = fs.createWriteStream(dest);
    return new Promise((resolve, reject) => {
        res.body.pipe(stream);
        res.body.on('error', reject);
        stream.on('finish', resolve);
    });
}

// Check and download yt-dlp if missing
async function ensureYtDlp() {
    const exeName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
    const exePath = path.join(process.cwd(), exeName);

    if (fs.existsSync(exePath)) {
        return `"${exePath}"`;
    }

    console.log("⬇️ yt-dlp not found. Downloading latest version...");
    const url = process.platform === 'win32' 
        ? "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
        : "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";

    await downloadFile(url, exePath);
    if (process.platform !== 'win32') fs.chmodSync(exePath, '755');
    
    console.log("✅ yt-dlp downloaded successfully!");
    return `"${exePath}"`;
}

// Download using yt-dlp
async function downloadFromYouTube(url, outputDir) {
    const ytDlpPath = await ensureYtDlp();
    const timestamp = Date.now();
    const outputTemplate = path.join(outputDir, `${timestamp}_%(id)s.%(ext)s`);
    
    console.log(`🎬 Downloading from YouTube: ${url}`);
    
    try {
        // Try MP3 extraction first (requires FFmpeg)
        const cmd = `${ytDlpPath} -x --audio-format mp3 -o "${outputTemplate}" --write-thumbnail --convert-thumbnails jpg --no-playlist "${url}"`;
        await execAsync(cmd);
    } catch (error) {
        if (error.message.includes('ffmpeg') || error.message.includes('ffprobe')) {
            console.log("⚠️ FFmpeg missing. Downloading best available audio (m4a/webm)...");
            const fallbackCmd = `${ytDlpPath} -f "ba" -o "${outputTemplate}" --write-thumbnail --no-playlist "${url}"`;
            await execAsync(fallbackCmd);
        } else {
            throw error;
        }
    }

    // List files to find the downloaded audio and thumbnail
    const files = fs.readdirSync(outputDir).filter(f => f.startsWith(`${timestamp}_`));
    const audioFile = files.find(f => /\.(mp3|m4a|webm|opus)$/.test(f));
    const coverFile = files.find(f => /\.(jpg|png|webp|jpeg)$/.test(f));
    
    if (!audioFile) throw new Error("Audio file not found after download");

    return { 
        audioPath: path.join(outputDir, audioFile),
        coverPath: coverFile ? path.join(outputDir, coverFile) : null,
        id: audioFile.split('_')[1].split('.')[0]
    };
}


async function uploadToSupabase(filePath, folder) {
    const fileName = `${Date.now()}_${path.basename(filePath)}`;
    const storagePath = `${folder}/${fileName}`;
    const fileBuffer = fs.readFileSync(filePath);
    
    // Determine mime type roughly
    let mimeType = 'application/octet-stream';
    if (filePath.endsWith('.mp3')) mimeType = 'audio/mpeg';
    if (filePath.endsWith('.m4a')) mimeType = 'audio/mp4';
    if (filePath.endsWith('.webm')) mimeType = 'audio/webm';
    if (filePath.endsWith('.jpg')) mimeType = 'image/jpeg';
    if (filePath.endsWith('.png')) mimeType = 'image/png';
    if (filePath.endsWith('.webp')) mimeType = 'image/webp';

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileBuffer, { contentType: mimeType, upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath);

    return publicUrl;
}

async function processYoutubeLinks() {
    // 1. Get ONLY true pending songs (Strict Filter)
    const { data: songs, error } = await supabase
        .from('songs')
        .select('*')
        .eq('is_youtube', true);

    if (error) {
        console.error("❌ DB Fetch Error:", error);
        return;
    }

    // JS-side Safety Filter: Skip anything that already has a cloud URL
    const pendingSongs = songs.filter(s => {
        const isCloud = s.url && s.url.includes('supabase.co');
        if (isCloud) {
            console.log(`⏩ Skipping internal sync for "${s.title}" (Already in cloud storage)`);
            return false;
        }
        return true;
    });

    if (pendingSongs.length === 0) {
        console.log("✅ No pending YouTube links to sync. Cache is clean!");
        return;
    }

    console.log(`🎯 Found ${pendingSongs.length} pending YouTube links to sync.`);

    const tempDir = path.join(process.cwd(), 'temp_downloads');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    for (const song of pendingSongs) {
        console.log(`\n🔄 [Syncing] ${song.title}`);
        try {
            // 2. Download from YouTube (Now properly awaited)
            const { audioPath, coverPath } = await downloadFromYouTube(song.url, tempDir);
            
            // 3. Upload to Supabase Storage
            console.log(`☁️ Uploading to cloud...`);
            const publicAudioUrl = await uploadToSupabase(audioPath, 'songs');
            
            let publicCoverUrl = song.cover_url;
            if (coverPath && (!song.cover_url || song.cover_url.includes('ytimg'))) {
                 publicCoverUrl = await uploadToSupabase(coverPath, 'covers');
            }

            // 4. Update DB (Mark is_youtube as false)
            console.log(`💾 Finalizing database...`);
            const { error: updateError } = await supabase
                .from('songs')
                .update({ 
                    url: publicAudioUrl, 
                    cover_url: publicCoverUrl,
                    is_youtube: false 
                })
                .eq('id', song.id);

            if (updateError) throw updateError;

            console.log(`✅ Successfully synced: ${song.title}`);

            // Cleanup local files
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
            if (coverPath && fs.existsSync(coverPath)) fs.unlinkSync(coverPath);

        } catch (e) {
            console.error(`⚠️ Failed to sync "${song.title}":`, e.message);
        }
    }
    
    // Final cleanup of temp dir
    try { 
        if (fs.readdirSync(tempDir).length === 0) {
            fs.rmdirSync(tempDir); 
        }
    } catch(e) {}
    console.log('\n✨ Sync process finished.');
}

processYoutubeLinks();
