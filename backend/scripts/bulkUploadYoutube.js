const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const youtubeService = require('../src/services/youtubeService');
const emotionDetector = require('../src/services/emotionDetector');

// YouTube Links to Import
const youtubeLinks = [
    'https://youtu.be/2hGEiQg9X_g?si=llddec78ipi74_4L',
    'https://youtu.be/izbydia9jz4?si=GAYErVmN-7n4CKmo',
    'https://youtu.be/RPTfXa_4jPg?si=62YqLgsby2r6AQZg',
    'https://youtu.be/MwtKJG_87fw?si=vi2Vu_qvKuYekpQ_',
    'https://youtu.be/PAhTLB1LBR0?si=WUHJzKs3Ig3bw3rk',
    'https://youtu.be/9iX4HQeW1aM?si=ngxkCqv4f8_Ka0p3',
    'https://youtu.be/naGxpB5FbXw?si=NsVdz7-DhvBRjmVd',
    'https://youtu.be/dsrku40uZMc?si=9QAZxyHGqst9ANVa',
    'https://youtu.be/bdHWFi5NfR0?si=uA7xxk6AkUZnqzeM',
    'https://youtu.be/oL4SC97QBoU?si=YktiEmNtEIb7eQ3d',
    'https://youtu.be/XWlWvLauIrg?si=fwLCnSsTfXfM8eZH',
    'https://youtu.be/hnemFzjQUSM?si=_t6_UwZLXCZ6437d',
    'https://youtu.be/UgjtxhV08Ao?si=rFZ07aUHjn54AJxa',
    'https://youtu.be/A64oFRutkeI?si=iSnuipgFqY6FLncs',
    'https://youtu.be/cEWwJxEq9Lg?si=ZRaYj5dgtymToVZz',
    'https://youtu.be/ti4fD2or_6s?si=VH3zfWf4NnzLJW7V',
    'https://youtu.be/Zy_KwCohQd0?si=_L0zkY8mxQ7AMW0V',
    'https://youtu.be/XnHLmsClbP4?si=WGXbFcMLeQe0Lxl-',
    'https://youtu.be/k9_JbEaRxso?si=C7EYtfO2BxGmYjMs',
    'https://youtu.be/AIFjQ3RIAOQ?si=UkKEV9UvQdWNI8Ez',
    'https://youtu.be/CpjbtSzVOz8?si=OayGyNhfS6jEcaC6',
    'https://youtu.be/qOBCyC0khCc?si=j9Bi6eYuYqkiKKVb',
    'https://youtu.be/xZ92nnR1Pt8?si=kewt2HXjHJqafXUZ',
    'https://youtu.be/jRDCWQP7rjI?si=vWuaCdyBTUM9q0S_',
    'https://youtu.be/NOeMYlFuEmk?si=aPHgazS_YGToqOLs',
    'https://youtu.be/rlXZROSltGk?si=Zz1TELw7rc5n32XI'
];

const serialize = (data) => JSON.parse(JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
));

async function importSong(url, index) {
    try {
        console.log(`\n[${index + 1}/${youtubeLinks.length}] Processing: ${url}`);
        
        // 1. Fetch Metadata
        console.log('  → Fetching metadata...');
        const metadata = await youtubeService.getMetadata(url);
        
        // 2. Auto-detect emotion
        const emotionAnalysis = emotionDetector.analyzeMetadata(metadata);
        const emotion = emotionAnalysis.emotion;
        const category = emotionDetector.getSuggestedCategory(emotion);
        
        console.log(`  → Title: ${metadata.title}`);
        console.log(`  → Artist: ${metadata.artist}`);
        console.log(`  → Emotion: ${emotion} (${Math.round(emotionAnalysis.confidence * 100)}%)`);
        console.log(`  → Category: ${category}`);
        
        // 3. Create DB Record (Zero Storage - Direct Link)
        const song = await prisma.song.create({
            data: {
                title: metadata.title,
                artist: metadata.artist || "Unknown",
                file_url: url, // Direct YouTube link
                cover_url: metadata.coverUrl || "https://via.placeholder.com/150",
                category: category || "Tamil",
                emotion: emotion || "Feel Good",
                source_url: url,
                youtube_views: BigInt(metadata.viewCount || 0)
            },
        });
        
        console.log(`  ✅ Imported successfully (ID: ${song.id})`);
        return { success: true, song: serialize(song) };
        
    } catch (error) {
        console.error(`  ❌ Failed: ${error.message}`);
        return { success: false, error: error.message, url };
    }
}

async function main() {
    console.log('🎵 Sangatamizh Bulk YouTube Import');
    console.log('==================================\n');
    console.log(`Total links to import: ${youtubeLinks.length}\n`);
    
    const results = {
        success: [],
        failed: []
    };
    
    // Process sequentially to avoid rate limits
    for (let i = 0; i < youtubeLinks.length; i++) {
        const result = await importSong(youtubeLinks[i], i);
        
        if (result.success) {
            results.success.push(result.song);
        } else {
            results.failed.push(result);
        }
        
        // Small delay between requests to be respectful
        if (i < youtubeLinks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }
    }
    
    console.log('\n\n📊 Import Summary');
    console.log('=================');
    console.log(`✅ Successful: ${results.success.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    
    if (results.failed.length > 0) {
        console.log('\n❌ Failed Imports:');
        results.failed.forEach(f => {
            console.log(`  - ${f.url}`);
            console.log(`    Error: ${f.error}`);
        });
    }
    
    console.log('\n✨ Import complete!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
