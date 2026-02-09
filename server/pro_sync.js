import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const proSync = async () => {
    console.log('--- PRO SYNC: LOCAL PC TO CLOUD MIGRATION ---');
    console.log('Using your local internet to bypass YouTube blocks!');

    try {
        // Fetch songs that are still YouTube links
        const { data: songs, error } = await supabase.from('songs').select('*');
        if (error) throw error;

        const ytSongs = songs.filter(s => s.is_youtube || (s.url && s.url.includes('youtu')));
        if (ytSongs.length === 0) {
            console.log('✅ All songs are already in the cloud. Nothing to sync!');
            return;
        }

        console.log(`Found ${ytSongs.length} songs to sync.`);

        for (const song of ytSongs) {
            console.log(`\nSyncing: ${song.title}...`);
            const videoId = song.url.match(/(?:v=|youtu\.be\/|embed\/|watch\?v=)([\w-]{11})/)?.[1];
            if (!videoId) continue;

            const tempDir = path.join(process.cwd(), 'temp_sync');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const outputPattern = path.join(tempDir, `${videoId}.%(ext)s`);
            
            // 1. Download locally (using your Home IP)
            console.log('  Step 1: Downloading from YouTube...');
            const downloadCmd = `yt-dlp -f "ba" -o "${outputPattern}" "https://www.youtube.com/watch?v=${videoId}"`;
            
            await new Promise((resolve, reject) => {
                exec(downloadCmd, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });

            // 2. Find file
            const files = fs.readdirSync(tempDir);
            const downloadedFile = files.find(f => f.startsWith(videoId));
            const actualTempPath = path.join(tempDir, downloadedFile);

            // 3. Upload to Supabase
            console.log('  Step 2: Uploading to Supabase Cloud...');
            const fileBuffer = fs.readFileSync(actualTempPath);
            const fileName = `songs/${Date.now()}_${downloadedFile}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('music-app')
                .upload(fileName, fileBuffer, {
                    contentType: downloadedFile.endsWith('.m4a') ? 'audio/mp4' : 'audio/webm'
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('music-app').getPublicUrl(fileName);

            // 4. Update Database
            console.log('  Step 3: Updating Database...');
            const { error: updateError } = await supabase
                .from('songs')
                .update({ 
                    url: publicUrl, 
                    is_youtube: false 
                })
                .eq('id', song.id);

            if (updateError) throw updateError;

            console.log('  ✅ Success!');
            
            // Cleanup
            fs.unlinkSync(actualTempPath);
        }

        console.log('\n--- PRO SYNC COMPLETE ---');
    } catch (err) {
        console.error('PRO Sync Failed:', err);
    }
};

proSync();
