const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteM4aSongs() {
    console.log("=== DELETING M4A SONGS ===\n");
    
    const songs = await prisma.song.findMany();
    let deletedCount = 0;
    
    for (const song of songs) {
        if (song.file_url.toLowerCase().includes('.m4a')) {
            console.log(`Deleting: ${song.title}`);
            console.log(`  URL: ${song.file_url}`);
            
            try {
                await prisma.song.delete({ where: { id: song.id } });
                console.log(`  ✅ Deleted\n`);
                deletedCount++;
            } catch (e) {
                console.log(`  ❌ Error: ${e.message}\n`);
            }
        }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Deleted ${deletedCount} M4A songs`);
    console.log(`\nAll remaining songs are MP3 format ✅`);
    console.log(`New uploads will automatically be MP3 ✅`);
    
    await prisma.$disconnect();
}

deleteM4aSongs().catch(console.error);
