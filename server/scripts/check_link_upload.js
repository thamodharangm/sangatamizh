import fetch from 'node-fetch';
import FormData from 'form-data';

async function testLinkUpload() {
    try {
        const formData = new FormData();
        formData.append('title', 'Test Link Upload');
        formData.append('audioUrl', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
        formData.append('artist', 'Tester');
        formData.append('emotion', 'vibe');

        const res = await fetch('http://localhost:3002/api/upload-file', {
            method: 'POST',
            body: formData
        });

        const result = await res.json();
        console.log('Upload Result:', result);
    } catch (e) {
        console.error('Test Failed:', e);
    }
}

testLinkUpload();
