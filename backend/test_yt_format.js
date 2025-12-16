// Direct test of YouTube audio extraction
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require('path');

const ytDlpPath = path.join(__dirname, 'yt-dlp.exe');

async function testYouTubeExtraction() {
    console.log('=== TESTING YOUTUBE AUDIO EXTRACTION ===\n');
    
    const testUrl = 'https://www.youtube.com/watch?v=rlXZROSltGk';
    
    console.log(`Testing URL: ${testUrl}\n`);
    
    // Test 1: Current format (WEBM/OPUS)
    console.log('--- Test 1: WEBM/OPUS format ---');
    try {
        const cmd1 = `"${ytDlpPath}" -f "bestaudio[ext=webm]/bestaudio[ext=opus]/bestaudio" -g "${testUrl}"`;
        console.log('Command:', cmd1);
        const { stdout: url1 } = await exec(cmd1, { timeout: 15000 });
        const audioUrl = url1.trim();
        console.log('✅ Extracted URL:', audioUrl.substring(0, 100) + '...');
        
        // Check what format it actually is
        const formatCmd = `"${ytDlpPath}" -f "bestaudio[ext=webm]/bestaudio[ext=opus]/bestaudio" -F "${testUrl}"`;
        const { stdout: formats } = await exec(formatCmd, { timeout: 15000 });
        console.log('\nAvailable formats:');
        console.log(formats);
        
    } catch (e) {
        console.error('❌ Failed:', e.message);
    }
    
    // Test 2: Check what browsers support
    console.log('\n--- Browser Compatibility ---');
    console.log('WEBM/OPUS: ✅ Chrome, Firefox, Edge, Safari 14.1+');
    console.log('M4A/AAC:   ✅ Safari, Chrome, Firefox (partial)');
    console.log('MP3:       ✅ All browsers (best compatibility)');
    
    console.log('\n--- Recommendation ---');
    console.log('If you\'re seeing "Audio format not supported", it means:');
    console.log('1. The browser doesn\'t support WEBM/OPUS codec');
    console.log('2. OR the stream headers are incorrect');
    console.log('3. OR CORS is blocking the stream');
    
    console.log('\n--- To Fix ---');
    console.log('Option 1: Change format to M4A (better Safari support)');
    console.log('Option 2: Download as MP3 and upload to Supabase');
    console.log('Option 3: Check browser console for exact error');
}

testYouTubeExtraction().catch(console.error);
