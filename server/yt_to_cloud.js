import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { dbService } from './src/services/db.service.js';
import { storageService } from './src/services/storage.service.js';
import dotenv from 'dotenv';
dotenv.config();

const downloadAndPush = async () => {
    console.log('--- YOUTUBE TO SUPABASE CLOUD MIGRATION ---');

    if (!dbService.isCloud) {
        console.error('ERROR: Supabase credentials missing.');
        return;
    }

    try {
        const songs = await dbService.getSongs();
        const ytSongs = songs.filter(s => s.is_youtube || s.url.includes('youtu'));

        console.log(`Found ${ytSongs.length} YouTube songs to convert to Cloud Files.`);

        for (const song of ytSongs) {
            console.log(`Processing: ${song.title}...`);
            const videoId = song.url.match(/(?:v=|youtu\.be\/|embed\/|watch\?v=)([\w-]{11})/)?.[1];
            if (!videoId) continue;

            const tempPath = path.join(process.cwd(), 'temp', `${videoId}.mp3`);
            if (!fs.existsSync(path.dirname(tempPath))) fs.mkdirSync(path.dirname(tempPath), { recursive: true });

            console.log(`  Downloading audio from YouTube...`);
            const cookiesPath = path.join(process.cwd(), 'cookies.txt');
            const cookieFlag = fs.existsSync(cookiesPath) ? `--cookies "${cookiesPath}"` : '';
            const YTDLP_PATH = path.join(process.cwd(), 'temp', 'yt-dlp.exe');
            
            // Download best audio without conversion (avoiding ffmpeg dependency)
            const downloadCmd = `"${YTDLP_PATH}" ${cookieFlag} -f "ba" -o "${path.join(process.cwd(), 'temp', `${videoId}.%(ext)s`)}" "https://www.youtube.com/watch?v=${videoId}"`;
            
            await new Promise((resolve, reject) => {
                exec(downloadCmd, (err, stdout, stderr) => {
                    if (err) {
                        console.error('  ❌ Download failed Error:', err);
                        return reject(err);
                    }
                    resolve();
                });
            });

            // Find the downloaded file (could be .webm, .m4a, etc.)
            const files = fs.readdirSync(path.join(process.cwd(), 'temp'));
            const downloadedFile = files.find(f => f.startsWith(videoId) && f !== videoId && !f.endsWith('.exe'));

            if (downloadedFile) {
                const actualTempPath = path.join(process.cwd(), 'temp', downloadedFile);
                const ext = path.extname(downloadedFile);
                const mimetype = ext === '.m4a' ? 'audio/mp4' : (ext === '.webm' ? 'audio/webm' : 'audio/mpeg');

                console.log(`  Uploading to Supabase Storage (${downloadedFile})...`);
                const mockFile = {
                    path: actualTempPath,
                    originalname: downloadedFile,
                    filename: downloadedFile,
                    mimetype: mimetype
                };
                
                const cloudUrl = await storageService.uploadFile(mockFile, 'songs');
                console.log(`  ✅ Uploaded: ${cloudUrl}`);

                // Update DB (Use updateSong instead of addSong for existing records)
                await dbService.updateSong(song.id, {
                   url: cloudUrl,
                   is_youtube: false
                });
                console.log(`  ✅ Database updated.`);
                
                // Cleanup
                try { fs.unlinkSync(actualTempPath); } catch (e) {}
            }
        }

        console.log('--- ALL DONE ---');
    } catch (err) {
        console.error('Migration failed:', err);
    }
};

downloadAndPush();
