const fetch = require('node-fetch');

// Get the first song ID from the database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testStreaming() {
    console.log('=== TESTING YOUTUBE STREAMING ===\n');
    
    // Get first song
    const song = await prisma.song.findFirst();
    
    if (!song) {
        console.error('No songs in database');
        return;
    }
    
    console.log(`Testing song: ${song.title}`);
    console.log(`File URL: ${song.file_url}\n`);
    
    const streamUrl = `http://localhost:3002/api/stream/${song.id}`;
    
    // Test 1: HEAD request
    console.log('--- Test 1: HEAD Request ---');
    try {
        const headRes = await fetch(streamUrl, { method: 'HEAD' });
        console.log('Status:', headRes.status);
        console.log('Content-Type:', headRes.headers.get('content-type'));
        console.log('Content-Length:', headRes.headers.get('content-length'));
        console.log('Accept-Ranges:', headRes.headers.get('accept-ranges'));
    } catch (e) {
        console.error('HEAD Request Failed:', e.message);
    }
    
    console.log('\n--- Test 2: GET Request (first 1024 bytes) ---');
    try {
        const getRes = await fetch(streamUrl, {
            headers: { 'Range': 'bytes=0-1023' }
        });
        console.log('Status:', getRes.status);
        console.log('Content-Type:', getRes.headers.get('content-type'));
        console.log('Content-Range:', getRes.headers.get('content-range'));
        console.log('Content-Length:', getRes.headers.get('content-length'));
        
        // Check if it's a valid audio stream
        const buffer = await getRes.buffer();
        console.log('Received bytes:', buffer.length);
        console.log('First 16 bytes (hex):', buffer.slice(0, 16).toString('hex'));
    } catch (e) {
        console.error('GET Request Failed:', e.message);
    }
    
    await prisma.$disconnect();
}

testStreaming().catch(console.error);
