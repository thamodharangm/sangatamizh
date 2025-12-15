const fetch = require('node-fetch');

const testUrl = 'https://lemirqphbiyhmulyczzg.supabase.co/storage/v1/object/public/music_assets/songs/1765769054924_NOeMYlFuEmk.m4a';

async function testHeaders() {
    console.log('Testing Supabase Storage Headers...\n');
    
    // Test 1: HEAD request
    console.log('=== HEAD Request ===');
    const head = await fetch(testUrl, { method: 'HEAD' });
    console.log('Status:', head.status);
    console.log('Content-Length:', head.headers.get('content-length'));
    console.log('Content-Type:', head.headers.get('content-type'));
    console.log('Accept-Ranges:', head.headers.get('accept-ranges'));
    console.log('Content-Encoding:', head.headers.get('content-encoding'));
    
    // Test 2: Range request (first 1024 bytes)
    console.log('\n=== Range Request (bytes=0-1023) ===');
    const range = await fetch(testUrl, { 
        headers: { 'Range': 'bytes=0-1023' } 
    });
    console.log('Status:', range.status);
    console.log('Content-Length:', range.headers.get('content-length'));
    console.log('Content-Range:', range.headers.get('content-range'));
    console.log('Accept-Ranges:', range.headers.get('accept-ranges'));
    
    // Test 3: Check if Supabase supports 206
    if (range.status === 206) {
        console.log('\n✅ Supabase DOES support Range requests!');
    } else {
        console.log('\n❌ Supabase does NOT support Range requests properly!');
        console.log('This is why mobile Safari shows wrong duration.');
    }
}

testHeaders().catch(console.error);
