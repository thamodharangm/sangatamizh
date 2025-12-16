
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fetch = require('node-fetch');

// Use 127.0.0.1 to avoid ECONNREFUSED issues on some environments
const API_URL = 'http://127.0.0.1:3002/api';

async function migrate() {
    console.log("Searching for M4A songs...");
    // Find songs where file_url contains .m4a
    // Prisma "contains" is case-insensitive usually, but being explicit is good.
    const songs = await prisma.song.findMany({
        where: {
            file_url: { contains: '.m4a' }
        }
    });

    console.log(`Found ${songs.length} songs to migrate.`);

    if (songs.length === 0) {
        console.log("No migration needed.");
        return;
    }

    console.log("Starting migration in 5 seconds... Press Ctrl+C to cancel.");
    await new Promise(r => setTimeout(r, 5000));

    for (const [index, song] of songs.entries()) {
        console.log(`[${index + 1}/${songs.length}] Migrating: ${song.title} (${song.id})`);
        
        if (!song.source_url || (!song.source_url.includes('youtube.com') && !song.source_url.includes('youtu.be'))) {
            console.log(`  ⚠️ Skipping - No valid YouTube source URL found (${song.source_url})`);
            continue;
        }

        try {
            // 1. Delete existing song
            console.log("  Step 1: Deleting old version...");
            const delRes = await fetch(`${API_URL}/songs/${song.id}`, { method: 'DELETE' });
            
            // If 404, maybe already deleted, try to upload anyway?
            if (!delRes.ok && delRes.status !== 404) {
                throw new Error(`Delete failed: ${delRes.status} ${await delRes.text()}`);
            }

            // 2. Re-upload
            console.log("  Step 2: Re-uploading as MP3...");
            const payload = {
                url: song.source_url,
                category: song.category,
                emotion: song.emotion,
                customMetadata: {
                    title: song.title,
                    artist: song.artist,
                    // Preserve cover if it's not a local path that got deleted?
                    // But uploadFromYoutube handles cover extraction or download.
                    // If we pass coverUrl, it might use it.
                    // If cover_url was local, it might be gone after delete.
                    // Safest is to let `uploadFromYoutube` fetch fresh metadata/cover from YT.
                    // OR pass the old URL if it was external.
                }
            };
            
            // If cover is external, keep it. If local, `deleteSong` might have removed it.
            // But `uploadFromYoutube` fetches fresh cover from YT usually.
            // Let's rely on YT metadata to ensure fresh high-res cover.

            const upRes = await fetch(`${API_URL}/upload-from-yt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!upRes.ok) {
                throw new Error(`Upload failed: ${upRes.status} ${await upRes.text()}`);
            }
            
            const newSong = await upRes.json();
            console.log(`  ✅ Success! New ID: ${newSong.id}, URL: ${newSong.file_url}`);

        } catch (e) {
            console.error(`  ❌ Migration failed: ${e.message}`);
        }
        
        // Brief pause to avoid rate limits
        await new Promise(r => setTimeout(r, 2000));
    }
}

migrate()
    .catch(e => console.error("Fatal Error:", e))
    .finally(() => prisma.$disconnect());
