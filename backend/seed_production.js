// Seed production database with dummy songs
// Run this with: DATABASE_URL=<your-railway-postgres-url> node seed_production.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DUMMY_SONGS = [
    {
        title: "Vibe Mode - Tamil Hit",
        artist: "Sangatamizh Artist",
        cover_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60",
        file_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        emotion: "Vibe",
        category: "Tamil",
        source_url: "https://youtube.com/demo1"
    },
    {
        title: "Feel Good Melody",
        artist: "Sangatamizh Artist",
        cover_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60",
        file_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        emotion: "Feel Good",
        category: "Tamil",
        source_url: "https://youtube.com/demo2"
    },
    {
        title: "Motivation Anthem",
        artist: "Sangatamizh Artist",
        cover_url: "https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=500&auto=format&fit=crop&q=60",
        file_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        emotion: "Motivation",
        category: "Tamil",
        source_url: "https://youtube.com/demo3"
    },
     {
        title: "Sad Melody",
        artist: "Sangatamizh Artist",
        cover_url: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=500&auto=format&fit=crop&q=60",
        file_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        emotion: "Sad",
        category: "Tamil",
        source_url: "https://youtube.com/demo4"
    }
];

async function main() {
    console.log('🌱 Seeding Production Database...');
    console.log('Database URL:', process.env.DATABASE_URL ? 'Connected' : 'NOT SET!');

    for (const song of DUMMY_SONGS) {
        const exists = await prisma.song.findFirst({
            where: { title: song.title }
        });

        if (!exists) {
            await prisma.song.create({
                data: song
            });
            console.log(`✅ Added: ${song.title}`);
        } else {
            console.log(`ℹ️ Skipped (Already exists): ${song.title}`);
        }
    }

    console.log('\n✨ Production database seeded! Refresh your live website.');
}

main()
    .catch(e => {
        console.error('❌ Error:', e.message);
        console.error('Make sure DATABASE_URL environment variable is set to your Railway Postgres URL');
    })
    .finally(() => prisma.$disconnect());
