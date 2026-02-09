import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

/**
 * SYNC COOKIES: 
 * This script extracts YouTube cookies from your local Chrome browser
 * and pushes them to your Render server automatically.
 */

// --- CONFIGURATION ---
const RENDER_API_URL = 'https://sangatamizh.onrender.com/api'; // Replace with your actual Render URL if different
const TARGET_ENDPOINT = `${RENDER_API_URL}/admin/update-cookies`;
// ---------------------

const syncCookies = async () => {
    console.log('--- COOKIE SYNC: LOCAL CHROME -> RENDER SERVER ---');
    
    // Auto-detect yt-dlp path
    const localPath = path.join(process.cwd(), 'temp', 'yt-dlp.exe');
    let YTDLP_RUN = 'yt-dlp';

    try {
        await new Promise(r => exec('yt-dlp --version', err => {
            if (err) YTDLP_RUN = `"${localPath}"`;
            r();
        }));
    } catch(e) {
        YTDLP_RUN = `"${localPath}"`;
    }

    console.log(`Using yt-dlp from: ${YTDLP_RUN}`);

    const tempCookieFile = path.join(process.cwd(), 'temp_browser_cookies.txt');
    
    try {
        console.log('Step 1: Extracting cookies from Chrome browser...');
        
        // Command to extract cookies using yt-dlp
        // Using --skip-download to just get cookies without processing video
        const extractCmd = `${YTDLP_RUN} --cookies-from-browser chrome --cookies "${tempCookieFile}" --no-warnings --skip-download "https://www.youtube.com"`;
        
        await new Promise((resolve, reject) => {
            exec(extractCmd, (err, stdout, stderr) => {
                // yt-dlp might return an error code but still create the file (due to no video specified)
                if (fs.existsSync(tempCookieFile)) {
                    resolve();
                } else {
                    reject(err || stderr);
                }
            });
        });

        if (!fs.existsSync(tempCookieFile)) {
            throw new Error('Failed to generate cookie file. Make sure Chrome is installed and you are logged into YouTube.');
        }

        console.log('Step 2: Preparing cookie data...');
        const cookieContent = fs.readFileSync(tempCookieFile, 'utf8');

        console.log('Step 3: Pushing to Render Server...');
        const response = await axios.post(TARGET_ENDPOINT, {
            cookies: cookieContent
        });

        if (response.data.ok) {
            console.log('✅ SUCCESS: Your Render server is now updated with fresh cookies!');
            console.log('Server Message:', response.data.message);
        } else {
            console.error('❌ Failed to update server:', response.data);
        }

    } catch (err) {
        console.error('\n❌ SYNC FAILED!');
        console.error('Error details:', err.message || err);
        console.log('\nTroubleshooting:');
        console.log('1. Make sure Chrome is CLOSED before running this script.');
        console.log('2. Make sure you have yt-dlp installed globally (npm install -g yt-dlp is not enough, download the exe).');
        console.log('3. If you use a specific Chrome profile, use: --cookies-from-browser chrome:PROFILE_NAME');
    } finally {
        // Cleanup temp file
        if (fs.existsSync(tempCookieFile)) {
            try { fs.unlinkSync(tempCookieFile); } catch (e) {}
        }
    }
};

syncCookies();
