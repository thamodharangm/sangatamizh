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
            
            const downloadCmd = `yt-dlp ${cookieFlag} -x --audio-format mp3 -o "${tempPath}" "https://www.youtube.com/watch?v=${videoId}"`;
            
            await new Promise((resolve, reject) => {
                exec(downloadCmd, (err, stdout, stderr) => {
                    if (err) {
                        console.error('  ❌ Download failed:', stderr || err.message);
                        return reject(err);
                    }
                    resolve();
                });
            });

            if (fs.existsSync(tempPath)) {
                console.log(`  Uploading to Supabase Storage...`);
                const mockFile = {
                    path: tempPath,
                    originalname: `${videoId}.mp3`,
                    filename: `${videoId}.mp3`,
                    mimetype: 'audio/mpeg'
                };
                
                const cloudUrl = await storageService.uploadFile(mockFile, 'songs');
                console.log(`  ✅ Uploaded: ${cloudUrl}`);

                // Update DB to point to the new Cloud URL instead of YouTube
                song.url = cloudUrl;
                song.is_youtube = false;
                await dbService.addSong(song);
                console.log(`  ✅ Database updated.`);
            }
        }

        console.log('--- ALL DONE ---');
    } catch (err) {
        console.error('Migration failed:', err);
    }
};

downloadAndPush();
