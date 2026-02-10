import fetch from 'node-fetch';

async function deleteSong() {
    try {
        const id = '1770657401349'; // The exact ID of "Test Link Upload"
        const res = await fetch(`http://localhost:3002/api/songs/${id}`, {
            method: 'DELETE'
        });
        const result = await res.json();
        console.log('Delete Result:', result);
    } catch (e) {
        console.error('Delete Failed:', e);
    }
}

deleteSong();
