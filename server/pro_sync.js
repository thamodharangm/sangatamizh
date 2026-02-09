import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const proSync = async () => {
    console.log('--- PRO SYNC: LOCAL PC TO CLOUD MIGRATION ---');
    console.log('Using your local internet to bypass YouTube blocks!');

    try {
        // Fetch songs that are still YouTube links
        const { data: songs, error } = await supabase.from('songs').select('*');
        if (error) throw error;

        // Find songs where is_youtube is true OR the URL contains youtube/youtu.be
        const ytSongs = songs.filter(s => s.is_youtube === true || (s.url && s.url.includes('youtu')));
        
        if (ytSongs.length === 0) {
            console.log('✅ All songs are already in the cloud. Nothing to sync!');
            return;
        }

        console.log(`Found ${ytSongs.length} songs to sync.`);

        // Detect yt-dlp path (Check local temp folder first)
        const localYtdlp = path.join(process.cwd(), 'temp', 'yt-dlp.exe');
        let YTDLP_RUN = 'yt-dlp';
        if (fs.existsSync(localYtdlp)) {
            YTDLP_RUN = `"${localYtdlp}"`;
        }

        for (const song of ytSongs) {
            console.log(`\nSyncing: ${song.title}...`);
            const videoId = song.url.match(/(?:v=|youtu\.be\/|embed\/|watch\?v=)([\w-]{11})/)?.[1];
            
            if (!videoId) {
                console.log(`  ⚠️ Skipping: Could not extract Video ID from URL: ${song.url}`);
                continue;
            }

            const tempDir = path.join(process.cwd(), 'temp_sync');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const outputPattern = path.join(tempDir, `${videoId}.%(ext)s`);

            // 1. Download & Metadata fetch locally (using your Home IP)
            console.log('  Step 1: Extracting real Title/Artist and Downloading...');
            
            let metaTitle = song.title;
            let metaArtist = song.artist;

            const metaCmd = `${YTDLP_RUN} --dump-json --skip-download --no-warnings "https://www.youtube.com/watch?v=${videoId}"`;
            
            try {
                const metaOutput = await new Promise((resolve, reject) => {
                    exec(metaCmd, (err, stdout) => {
                        if (err) return reject(err);
                        resolve(stdout);
                    });
                });
                const json = JSON.parse(metaOutput);
                metaTitle = json.title || song.title;
                metaArtist = json.uploader || song.artist;
                console.log(`    Found: ${metaTitle} by ${metaArtist}`);
            } catch (e) {
                console.log('    ⚠️ Could not fetch metadata, using defaults.');
            }

            const downloadCmd = `${YTDLP_RUN} -f "ba" --no-warnings -o "${outputPattern}" "https://www.youtube.com/watch?v=${videoId}"`;
            
            try {
                await new Promise((resolve, reject) => {
                    exec(downloadCmd, (err) => {
                        if (err) return reject(err);
                        resolve();
                    });
                });
            } catch (downloadErr) {
                console.error(`  ❌ Download failed for ${song.title}:`, downloadErr.message);
                continue; 
            }

            // 2. Find the downloaded file
            const files = fs.readdirSync(tempDir);
            const downloadedFile = files.find(f => f.startsWith(videoId));
            
            if (!downloadedFile) {
                console.error('  ❌ Error: File not found after download.');
                continue;
            }

            const actualTempPath = path.join(tempDir, downloadedFile);

            // 3. Upload to Supabase
            console.log('  Step 2: Uploading to Supabase Cloud...');
            const fileBuffer = fs.readFileSync(actualTempPath);
            const cloudPath = `songs/${Date.now()}_${downloadedFile}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('music-app')
                .upload(cloudPath, fileBuffer, {
                    contentType: downloadedFile.endsWith('.m4a') ? 'audio/mp4' : (downloadedFile.endsWith('.mp3') ? 'audio/mpeg' : 'audio/webm'),
                    upsert: true
                });

            if (uploadError) {
                console.error('  ❌ Upload failed:', uploadError.message);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage.from('music-app').getPublicUrl(cloudPath);

            // 4. Update Database
            console.log('  Step 3: Updating Database (Title/Artist/URL)...');
            const { error: updateError } = await supabase
                .from('songs')
                .update({ 
                    title: metaTitle,
                    artist: metaArtist,
                    url: publicUrl, 
                    is_youtube: false 
                })
                .eq('id', song.id);

            if (updateError) {
                console.error('  ❌ DB Update failed:', updateError.message);
                continue;
            }

            console.log(`  ✅ Success: ${metaTitle} migrated!`);
            
            // Cleanup local file
            try { fs.unlinkSync(actualTempPath); } catch (e) {}
        }

        console.log('\n--- PRO SYNC COMPLETE ---');
        console.log('All YouTube songs are now permanently in your Supabase Cloud Storage!');
    } catch (err) {
        console.error('PRO Sync Global Error:', err);
    }
};

proSync();
