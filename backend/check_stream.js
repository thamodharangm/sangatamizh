const fetch = require('node-fetch');

const id = 'f532b61d-3b6a-4e6b-91fc-471acd4844c5';
const url = `http://localhost:3002/api/stream/${id}`;

async function check() {
    console.log(`Checking ${url}...`);
    try {
        // 1. Regular Request
        const r1 = await fetch(url, { method: 'HEAD' });
        console.log('\n--- HEAD Headers ---');
        console.log('Status:', r1.status);
        console.log('Content-Type:', r1.headers.get('content-type'));
        console.log('Content-Length:', r1.headers.get('content-length'));
        console.log('Accept-Ranges:', r1.headers.get('accept-ranges'));

        // 2. Range Request (First 100 bytes)
        const r2 = await fetch(url, { headers: { 'Range': 'bytes=0-100' } });
        console.log('\n--- Range Request (0-100) ---');
        console.log('Status:', r2.status);
        console.log('Content-Range:', r2.headers.get('content-range'));
        console.log('Content-Length:', r2.headers.get('content-length'));
        
    } catch(e) {
        console.error(e);
    }
}

check();
