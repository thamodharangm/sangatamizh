import fs from 'fs';
import path from 'path';
import { dbService } from './src/services/db.service.js';
import { storageService } from './src/services/storage.service.js';
import dotenv from 'dotenv';

dotenv.config();

const migrate = async () => {
    console.log('--- STARTING MIGRATION TO SUPABASE ---');

    if (!dbService.isCloud) {
        console.error('ERROR: Supabase credentials not found in .env');
        return;
    }

    try {
        const songsPath = path.join(process.cwd(), 'src', 'songs.json');
        if (!fs.existsSync(songsPath)) {
            console.log('No local songs.json found.');
            return;
        }

        const songs = JSON.parse(fs.readFileSync(songsPath, 'utf8'));
        console.log(`Found ${songs.length} songs to migrate.`);

        for (const song of songs) {
            console.log(`Migrating: ${song.title}...`);

            // If it's a local file, upload it
            if (song.url && !song.url.startsWith('http')) {
                const fullPath = path.join(process.cwd(), song.url);
                if (fs.existsSync(fullPath)) {
                    console.log(`  Uploading audio...`);
                    const mockFile = {
                        path: fullPath,
                        originalname: path.basename(song.url),
                        filename: path.basename(song.url),
                        mimetype: 'audio/mpeg'
                    };
                    song.url = await storageService.uploadFile(mockFile, 'songs');
                }
            }

            // If cover is local, upload it
            if (song.cover_url && song.cover_url.startsWith('uploads/')) {
                const fullPath = path.join(process.cwd(), song.cover_url);
                if (fs.existsSync(fullPath)) {
                    console.log(`  Uploading cover...`);
                    const mockFile = {
                        path: fullPath,
                        originalname: path.basename(song.cover_url),
                        filename: path.basename(song.cover_url),
                        mimetype: 'image/jpeg'
                    };
                    song.cover_url = await storageService.uploadFile(mockFile, 'covers');
                }
            }

            // Save to DB
            try {
                await dbService.addSong(song);
                console.log(`  ✅ Done.`);
            } catch (err) {
                if (err.code === '23505') {
                    console.warn(`  Song already exists in DB.`);
                } else {
                    console.error(`  ❌ Failed:`, err.message);
                }
            }
        }

        console.log('--- MIGRATION COMPLETE ---');
    } catch (err) {
        console.error('Migration failed:', err);
    }
};

migrate();
