import fetch from 'node-fetch';

async function checkSongs() {
    try {
        const res = await fetch('http://localhost:3002/api/songs');
        const songs = await res.json();
        
        console.log(`Total Songs: ${songs.length}`);
        if(songs.length > 0) {
            // Sort by created_at if available, or just take the last if appended.
            // The dbService says it orders by created_at DESC, so the first one should be the newest.
            const newest = songs[0]; 
            console.log('Newest Song:', newest);
        }
    } catch (e) {
        console.error('Error fetching songs:', e);
    }
}

checkSongs();
