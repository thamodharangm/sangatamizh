// Script to fix file_url for existing songs
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixFileUrls() {
    console.log('🔧 Fixing file_url for all songs...\n');
    
    try {
        // Get all songs
        const songs = await prisma.song.findMany();
        console.log(`Found ${songs.length} songs to fix\n`);
        
        let fixed = 0;
        let skipped = 0;
        
        for (const song of songs) {
            // Extract video ID from source_url
            const videoId = song.source_url?.match(/(?:youtu\.be\/|v=|\/v\/|embed\/|watch\?v=)([^&\s]+)/)?.[1];
            
            if (!videoId) {
                console.log(`⏭️  Skipping "${song.title}" - no video ID found`);
                skipped++;
                continue;
            }
            
            // Create correct YouTube URL
            const correctUrl = `https://www.youtube.com/watch?v=${videoId}`;
            
            // Update the song
            await prisma.song.update({
                where: { id: song.id },
                data: { file_url: correctUrl }
            });
            
            console.log(`✅ Fixed: ${song.title}`);
            fixed++;
        }
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📊 Summary:`);
        console.log(`   ✅ Fixed: ${fixed}`);
        console.log(`   ⏭️  Skipped: ${skipped}`);
        console.log(`   📝 Total: ${songs.length}`);
        console.log(`${'='.repeat(60)}\n`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixFileUrls();
