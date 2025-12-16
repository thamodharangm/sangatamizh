const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

async function diagnoseAudioIssue() {
    console.log("=== AUDIO FORMAT DIAGNOSTIC ===\n");
    
    const songs = await prisma.song.findMany({
        orderBy: { created_at: 'desc' }
    });
    
    console.log(`Total songs: ${songs.length}\n`);
    
    let m4aCount = 0;
    let mp3Count = 0;
    let brokenCount = 0;
    
    for (const song of songs) {
        const isM4a = song.file_url.toLowerCase().includes('.m4a');
        const isMp3 = song.file_url.toLowerCase().includes('.mp3');
        
        if (isM4a) m4aCount++;
        if (isMp3) mp3Count++;
        
        // Test if file is accessible
        try {
            const res = await fetch(song.file_url, { method: 'HEAD' });
            const status = res.status;
            const contentType = res.headers.get('content-type');
            
            if (status !== 200) {
                console.log(`❌ BROKEN: ${song.title}`);
                console.log(`   URL: ${song.file_url}`);
                console.log(`   Status: ${status}\n`);
                brokenCount++;
            } else if (isM4a) {
                console.log(`⚠️  M4A: ${song.title}`);
                console.log(`   Content-Type: ${contentType}`);
                console.log(`   Note: M4A may not work on all browsers\n`);
            }
        } catch (e) {
            console.log(`❌ ERROR: ${song.title}`);
            console.log(`   ${e.message}\n`);
            brokenCount++;
        }
    }
    
    console.log("\n=== SUMMARY ===");
    console.log(`Total Songs: ${songs.length}`);
    console.log(`MP3 Files: ${mp3Count} ✅`);
    console.log(`M4A Files: ${m4aCount} ⚠️ (may cause browser issues)`);
    console.log(`Broken Files: ${brokenCount} ❌`);
    
    if (m4aCount > 0) {
        console.log("\n⚠️  RECOMMENDATION:");
        console.log("M4A files may not be supported by all browsers.");
        console.log("Solution: Re-upload these songs - they will be converted to MP3 automatically.");
    }
    
    await prisma.$disconnect();
}

diagnoseAudioIssue().catch(console.error);
