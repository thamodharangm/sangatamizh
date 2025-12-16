const fetch = require('node-fetch');

async function testV() {
    const url = "https://lemirqphbiyhmulyczzg.supabase.co/storage/v1/object/public/music_assets/songs/1765729026244_ihnrJkq3CXY.m4a";
    console.log("Fetching:", url);
    try {
        const res = await fetch(url);
        console.log("Status:", res.status);
        console.log("StatusText:", res.statusText);
        const text = await res.text();
        console.log("Body:", text.substring(0, 500));
    } catch (e) {
        console.error("Error:", e);
    }
}

testV();
