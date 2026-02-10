import fetch from 'node-fetch';

async function checkSongs() {
    try {
        const res = await fetch('http://localhost:3002/api/songs');
        const songs = await res.json();
        
        console.log(`Total Songs: ${songs.length}`);
        // Sort explicitly just in case API order is weird
        songs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        console.log('--- Last 3 Songs ---');
        songs.slice(0, 3).forEach(s => {
            console.log(`ID: ${s.id}`);
            console.log(`Title: ${s.title}`);
            console.log(`URL: ${s.url}`);
            console.log(`Created: ${s.created_at}`);
            console.log('----------------');
        });
    } catch (e) {
        console.error('Error fetching songs:', e);
    }
}

checkSongs();
