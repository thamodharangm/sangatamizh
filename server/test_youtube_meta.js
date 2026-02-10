// Test the YouTube metadata extraction for Kaththi song
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3002/api';

async function testYouTubeMetadata() {
    const testUrl = 'https://youtu.be/hod8FrJIClM?si=DvpcKfeH5-h4P_jI';
    
    console.log('🧪 Testing YouTube Metadata Extraction\n');
    console.log('URL:', testUrl);
    console.log('Expected: Song name + Movie name clean extraction\n');
    
    try {
        const response = await fetch(`${API_URL}/yt-metadata`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: testUrl })
        });
        
        const data = await response.json();
        
        console.log('✅ Response:');
        console.log('─────────────────────────────────────');
        console.log('Title (Song):', data.title);
        console.log('Movie:', data.movie);
        console.log('Artist:', data.artist);
        console.log('Genre:', data.suggestedCategory);
        console.log('Emotion:', data.suggestedEmotion);
        console.log('Cover:', data.coverUrl);
        console.log('Raw Title:', data.rawTitle);
        console.log('─────────────────────────────────────\n');
        
        // Check if parsing worked
        if (data.title && data.title !== data.rawTitle) {
            console.log('✅ Title was cleaned!');
        } else {
            console.log('⚠️  Title was not cleaned');
        }
        
        if (data.movie) {
            console.log('✅ Movie name extracted:', data.movie);
        } else {
            console.log('⚠️  No movie name found');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testYouTubeMetadata();
