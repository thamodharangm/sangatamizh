// Quick test script to diagnose metadata fetch
require('dotenv').config();
const { getMetadata } = require('./src/services/youtubeService');

const testUrl = 'https://youtu.be/2hGEiQg9X_g';

console.log('Testing metadata fetch...');
console.log('YT_API_KEY present:', !!process.env.YT_API_KEY);
console.log('URL:', testUrl);
console.log('---');

getMetadata(testUrl)
    .then(meta => {
        console.log('\n✅ SUCCESS!');
        console.log('Title:', meta.title);
        console.log('Artist:', meta.artist);
        console.log('Emotion:', meta.emotion);
    })
    .catch(err => {
        console.log('\n❌ FAILED');
        console.log('Error:', err.message);
        console.log('Stack:', err.stack);
    });
