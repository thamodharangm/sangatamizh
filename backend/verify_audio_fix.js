
const fetch = require('node-fetch');

async function testUpload() {
    console.log("Starting upload test for MP3 Fix Verification...");
    const payload = {
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Rick Roll - known reliable video
        category: "Test",
        emotion: "Happy"
    };

    try {
        const res = await fetch('http://127.0.0.1:3002/api/upload-from-yt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const txt = await res.text();
            console.error(`Upload failed: ${res.status} ${txt}`);
            return;
        }

        const song = await res.json();
        console.log("Upload response received.");
        console.log("Song ID:", song.id);
        console.log("File URL:", song.file_url);

        if (song.file_url) {
            // Check extension
            if (song.file_url.endsWith('.mp3')) {
                console.log("✅ PASS: File URL ends with .mp3");
            } else {
                console.error("❌ FAIL: File URL does not end with .mp3");
            }
            
            // Optional: Check Content-Type header from the file URL
            try {
                const headRes = await fetch(song.file_url, { method: 'HEAD' });
                const type = headRes.headers.get('content-type');
                console.log("File Content-Type:", type);
                if (type === 'audio/mpeg' || type === 'audio/mp3') {
                     console.log("✅ PASS: Content-Type is audio/mpeg");
                } else {
                     console.log(`⚠️ WARNING: Content-Type is ${type} (Expected audio/mpeg)`);
                }
            } catch (headErr) {
                console.log("Could not check HEAD of file url:", headErr.message);
            }

        } else {
             console.error("❌ FAIL: No file_url returned");
        }

    } catch (e) {
        console.error("Test execution failed:", e);
    }
}

testUpload();
