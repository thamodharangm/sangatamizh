import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function testFileUpload() {
    try {
        const formData = new FormData();
        formData.append('title', 'Test File Upload');
        formData.append('artist', 'Tester');
        formData.append('emotion', 'vibe');
        
        // Ensure we have a dummy file to upload
        const dummyPath = path.join(process.cwd(), 'dummy_audio.mp3');
        if (!fs.existsSync(dummyPath)) {
            fs.writeFileSync(dummyPath, 'fake audio content');
        }

        formData.append('audio', fs.createReadStream(dummyPath));

        console.log('Attempting file upload...');
        const res = await fetch('http://localhost:3002/api/upload-file', {
            method: 'POST',
            body: formData
        });

        const result = await res.json();
        console.log('Upload Result:', result);
        
        // Clean up
        if (fs.existsSync(dummyPath)) fs.unlinkSync(dummyPath);
    } catch (e) {
        console.error('Test Failed:', e);
    }
}

testFileUpload();
