const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function run() {
    const song = await prisma.song.findFirst();
    if (song) {
        fs.writeFileSync('url_debug.txt', `URL: ${song.file_url}\nEncoded: ${encodeURI(song.file_url)}\nJSON: ${JSON.stringify(song.file_url)}`);
    } else {
        fs.writeFileSync('url_debug.txt', 'No song found');
    }
    await prisma.$disconnect();
}

run();
