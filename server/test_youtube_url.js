
import { getYouTubeMetadata } from './src/services/youtube.service.js';

const testUrl = "https://youtu.be/0s3_UJ2zlJk?si=xm7udGdECCLAuJGh";

console.log(`\n---------------------------------`);
console.log(`Testing URL: ${testUrl}`);
console.log(`---------------------------------\n`);

async function run() {
    try {
        const meta = await getYouTubeMetadata(testUrl);
        
        console.log("METADATA RESULT:");
        console.log("Raw Title:", meta.rawTitle); // Add this!
        console.log("Title:    ", meta.title);
        console.log("Movie:    ", meta.movie);
        console.log("Artist:   ", meta.artist);
        console.log("Duration: ", meta.duration);
        console.log(`---------------------------------\n`);

    } catch (error) {
        console.error("ERROR:", error.message);
    }
}

run();
