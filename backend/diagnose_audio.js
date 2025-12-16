const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

async function diagnoseAudio() {
    console.log("=== AUDIO FILE DIAGNOSTIC ===\n");
    const songs = await prisma.song.findMany();
    
    console.log(`Total songs in database: ${songs.length}\n`);
    
    for (const song of songs) {
        console.log(`\n[${song.title}]`);
        console.log(`  ID: ${song.id}`);
        console.log(`  URL: ${song.file_url}`);
        
        try {
            const res = await fetch(song.file_url, { method: 'HEAD' });
            const contentType = res.headers.get('content-type');
            const contentLength = res.headers.get('content-length');
            
            console.log(`  Status: ${res.status}`);
            console.log(`  Content-Type: ${contentType}`);
            console.log(`  Size: ${(parseInt(contentLength) / 1024 / 1024).toFixed(2)} MB`);
            
            // Check if it's a valid audio format
            const validFormats = ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/webm', 'audio/ogg'];
            if (!validFormats.some(fmt => contentType?.includes(fmt))) {
                console.log(`  ⚠️ WARNING: Unexpected content type!`);
            }
            
            // Check file size (too small = likely corrupted)
            if (parseInt(contentLength) < 100000) { // < 100KB
                console.log(`  ⚠️ WARNING: File too small, likely corrupted!`);
            }
            
            if (res.status !== 200) {
                console.log(`  ❌ BROKEN: File not accessible`);
            } else {
                console.log(`  ✅ OK`);
            }
            
        } catch(e) {
            console.log(`  ❌ ERROR: ${e.message}`);
        }
    }
    
    await prisma.$disconnect();
}

diagnoseAudio();
