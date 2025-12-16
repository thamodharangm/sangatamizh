
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Fetching all songs...");
    const songs = await prisma.song.findMany({
        select: { id: true, title: true, file_url: true }
    });
    
    console.log(`Total Songs: ${songs.length}`);
    songs.forEach(s => {
        console.log(`- [${s.id}] ${s.title}: ${s.file_url}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
