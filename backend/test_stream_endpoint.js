const fetch = require('node-fetch');

const songId = 'f3201cdf-2a55-4812-ac13-a27f85a01121';
const streamUrl = `https://sangatamizh.onrender.com/api/stream/${songId}`;

async function testStream() {
    console.log('Testing stream endpoint:', streamUrl);
    
    try {
        // Test with Range header (like mobile Safari sends)
        const res = await fetch(streamUrl, {
            headers: { 'Range': 'bytes=0-1023' }
        });
        
        console.log('\nStatus:', res.status);
        console.log('Status Text:', res.statusText);
        console.log('Content-Type:', res.headers.get('content-type'));
        console.log('Content-Length:', res.headers.get('content-length'));
        console.log('Content-Range:', res.headers.get('content-range'));
        console.log('Accept-Ranges:', res.headers.get('accept-ranges'));
        
        if (res.status !== 206 && res.status !== 200) {
            const text = await res.text();
            console.log('\nError Response:', text);
        }
        
    } catch (e) {
        console.error('\nFetch Error:', e.message);
    }
}

testStream();
