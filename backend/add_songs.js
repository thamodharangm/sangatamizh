// Script to add YouTube songs to the database
const { PrismaClient } = require('@prisma/client');
const { getMetadata } = require('./src/services/youtubeService');

const prisma = new PrismaClient();

const youtubeUrls = [
    'https://youtu.be/2hGEiQg9X_g',
    'https://youtu.be/izbydia9jz4',
    'https://youtu.be/RPTfXa_4jPg',
    'https://youtu.be/MwtKJG_87fw',
    'https://youtu.be/PAhTLB1LBR0',
    'https://youtu.be/9iX4HQeW1aM',
    'https://youtu.be/naGxpB5FbXw',
    'https://youtu.be/dsrku40uZMc',
    'https://youtu.be/bdHWFi5NfR0',
    'https://youtu.be/oL4SC97QBoU',
    'https://youtu.be/XWlWvLauIrg',
    'https://youtu.be/hnemFzjQUSM',
    'https://youtu.be/UgjtxhV08Ao',
    'https://youtu.be/A64oFRutkeI',
    'https://youtu.be/cEWwJxEq9Lg',
    'https://youtu.be/ti4fD2or_6s',
    'https://youtu.be/Zy_KwCohQd0',
    'https://youtu.be/XnHLmsClbP4',
    'https://youtu.be/k9_JbEaRxso',
    'https://youtu.be/AIFjQ3RIAOQ',
    'https://youtu.be/CpjbtSzVOz8',
    'https://youtu.be/qOBCyC0khCc',
    'https://youtu.be/xZ92nnR1Pt8',
    'https://youtu.be/jRDCWQP7rjI',
    'https://youtu.be/NOeMYlFuEmk',
    'https://youtu.be/rlXZROSltGk'
];

async function addSongs() {
    console.log(`🎵 Starting to add ${youtubeUrls.length} songs...`);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < youtubeUrls.length; i++) {
        const url = youtubeUrls[i];
        console.log(`\n[${i + 1}/${youtubeUrls.length}] Processing: ${url}`);

        try {
            // Extract video ID
            const videoId = url.match(/(?:youtu\.be\/|v=|\/v\/|embed\/|watch\?v=)([^&\s]+)/)?.[1];
            if (!videoId) {
                console.error(`❌ Invalid URL: ${url}`);
                failCount++;
                continue;
            }

            // Check if song already exists
            const existing = await prisma.song.findFirst({
                where: { source_url: { contains: videoId } }
            });

            if (existing) {
                console.log(`⏭️  Song already exists: ${existing.title}`);
                successCount++;
                continue;
            }

            // Fetch metadata
            console.log('   Fetching metadata...');
            const metadata = await getMetadata(url);

            // Get direct audio stream URL from YouTube
            // We'll use the YouTube URL directly and let the stream endpoint handle it
            const streamUrl = `https://www.youtube.com/watch?v=${videoId}`;

            // Create song entry
            const song = await prisma.song.create({
                data: {
                    title: metadata.title,
                    artist: metadata.artist,
                    cover_url: metadata.coverUrl,
                    file_url: streamUrl, // Direct YouTube URL
                    source_url: url,
                    emotion: metadata.emotion || 'Feel Good',
                    category: 'Tamil',
                    youtube_views: metadata.viewCount ? BigInt(metadata.viewCount) : BigInt(0)
                }
            });

            console.log(`✅ Added: ${song.title} by ${song.artist} [${song.emotion}]`);
            successCount++;

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            console.error(`❌ Failed to add song: ${error.message}`);
            failCount++;
        }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📝 Total: ${youtubeUrls.length}`);
    console.log(`${'='.repeat(60)}\n`);

    await prisma.$disconnect();
}

addSongs().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
