// Check song emotions in database
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3002/api';

async function checkEmotions() {
    console.log('📊 Checking song emotions in database...\n');
    
    try {
        const res = await fetch(`${API_URL}/songs`);
        const songs = await res.json();
        
        console.log(`Total songs: ${songs.length}\n`);
        
        // Group by emotion
        const emotionCounts = {};
        songs.forEach(song => {
            const emotion = song.emotion || 'No Emotion';
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });
        
        console.log('Emotion Distribution:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━');
        Object.entries(emotionCounts).forEach(([emotion, count]) => {
            console.log(`${emotion.padEnd(20)} : ${count} songs`);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // Show sample songs with emotions
        console.log('Sample Songs:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━');
        songs.slice(0, 5).forEach(song => {
            console.log(`Title: ${song.title}`);
            console.log(`Emotion: ${song.emotion || 'NOT SET'}`);
            console.log(`Category: ${song.category || 'NOT SET'}`);
            console.log('---');
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkEmotions();
