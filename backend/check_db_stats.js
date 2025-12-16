
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const total = await prisma.song.count();
    const m4a = await prisma.song.count({ where: { file_url: { contains: '.m4a' } } });
    const mp3 = await prisma.song.count({ where: { file_url: { contains: '.mp3' } } });
    const youtube = await prisma.song.count({ 
        where: { 
            OR: [
                { file_url: { contains: 'youtube.com' } },
                { file_url: { contains: 'youtu.be' } }
            ]
        } 
    });
    
    console.log(`\nDB Stats:`);
    console.log(`- Total Songs: ${total}`);
    console.log(`- M4A Files: ${m4a}`);
    console.log(`- MP3 Files: ${mp3}`);
    console.log(`- Direct YouTube Links: ${youtube}`);
    console.log(`- Other/Unknown: ${total - m4a - mp3 - youtube}`);

    if (total > 0 && m4a === 0) {
        console.log("\n✅ No M4A files found. Migration is not needed for current DB.");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
