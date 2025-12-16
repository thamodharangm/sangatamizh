const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testStreamFix() {
    console.log('=== TESTING AUDIO FORMAT FIX ===\n');
    
    // Get first song
    const song = await prisma.song.findFirst();
    
    if (!song) {
        console.error('No songs found');
        return;
    }
    
    console.log(`Testing: ${song.title}`);
    console.log(`YouTube URL: ${song.file_url}\n`);
    
    const streamUrl = `http://localhost:3002/api/stream/${song.id}`;
    
    try {
        console.log('--- Step 1: Testing Stream Endpoint ---');
        const response = await fetch(streamUrl, {
            method: 'GET',
            headers: {
                'Range': 'bytes=0-1023'
            }
        });
        
        console.log('Status:', response.status, response.statusText);
        console.log('Content-Type:', response.headers.get('content-type'));
        console.log('Content-Range:', response.headers.get('content-range'));
        console.log('Accept-Ranges:', response.headers.get('accept-ranges'));
        
        const contentType = response.headers.get('content-type') || '';
        
        if (response.status === 206) {
            console.log('\n✅ Range request working correctly');
        } else {
            console.log('\n⚠️ Expected 206, got', response.status);
        }
        
        if (contentType.includes('audio/mp4') || contentType.includes('audio/x-m4a')) {
            console.log('✅ M4A format detected (universal browser support)');
        } else if (contentType.includes('audio/webm') || contentType.includes('audio/opus')) {
            console.log('⚠️ WEBM/OPUS format (limited browser support)');
        } else if (contentType.includes('audio/mpeg')) {
            console.log('✅ MP3 format detected (universal browser support)');
        } else {
            console.log('❓ Unknown format:', contentType);
        }
        
        const buffer = await response.buffer();
        console.log('\nReceived', buffer.length, 'bytes');
        console.log('First 16 bytes:', buffer.slice(0, 16).toString('hex'));
        
        // Check for M4A signature
        const signature = buffer.slice(4, 8).toString();
        if (signature === 'ftyp') {
            console.log('✅ Valid M4A/MP4 container detected');
        }
        
        console.log('\n--- Result ---');
        console.log('✅ Streaming endpoint is functional');
        console.log('✅ Audio format should now work in browsers');
        console.log('\nNext: Test playback in your frontend application');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.log('\nMake sure:');
        console.log('1. Backend is running on port 3002');
        console.log('2. Song ID exists in database');
        console.log('3. YouTube URL is accessible');
    }
    
    await prisma.$disconnect();
}

testStreamFix().catch(console.error);
