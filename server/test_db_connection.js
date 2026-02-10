import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sbUrl = process.env.SUPABASE_URL;
const sbKey = process.env.SUPABASE_KEY;

if (!sbUrl || !sbKey) {
    console.error("❌ Credentials missing in .env");
    process.exit(1);
}

const supabase = createClient(sbUrl, sbKey);

async function test() {
    console.log("🔄 Testing Database Connection...");
    
    // 1. Fetch Songs
    const { data: songs, error: dbError } = await supabase
        .from('songs')
        .select('id, title, artist, is_youtube, url')
        .limit(5);

    if (dbError) {
        console.error("❌ DB Error:", dbError.message);
    } else {
        console.log(`✅ DB Success! Found ${songs.length} songs (Showing top 5):`);
        console.table(songs); 
    }

    // 2. Fetch Storage Buckets
    console.log("\n🔄 Testing Storage Connection...");
    const { data: buckets, error: stError } = await supabase.storage.listBuckets();

    if (stError) {
        console.error("❌ Storage Error:", stError.message);
    } else {
        console.log("✅ Storage Success! Buckets:", buckets.map(b => b.name));
    }
}

test();
