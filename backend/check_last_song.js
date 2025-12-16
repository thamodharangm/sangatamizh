
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const song = await prisma.song.findFirst({
        orderBy: { created_at: 'desc' }
    });
    if (song) {
        console.log("Last Song:");
        console.log("Title:", song.title);
        console.log("URL:", song.file_url);
        console.log("Created:", song.created_at);
    } else {
        console.log("No songs found.");
    }
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
