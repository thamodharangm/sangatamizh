import { dbService } from './src/services/db.service.js';
import { supabase } from './src/config/supabase.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const ANALYTICS_PATH = path.join(process.cwd(), "src", "analytics.json");

async function resetPlays() {
    console.log("🚀 Starting Total Plays Reset...");

    // 1. Reset Supabase (Cloud)
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
        console.log("☁️ Clearing cloud plays...");
        const { error } = await supabase
            .from('analytics_plays')
            .delete()
            .neq('song_id', '00000000-0000-0000-0000-000000000000'); // Valid UUID format filter to target all
        
        if (error) console.error("❌ Cloud Reset Error:", error.message);
        else console.log("✅ Cloud plays cleared.");
    }

    // 2. Reset Local analytics.json
    if (fs.existsSync(ANALYTICS_PATH)) {
        console.log("📂 Clearing local plays...");
        try {
            const data = JSON.parse(fs.readFileSync(ANALYTICS_PATH, 'utf8'));
            data.plays = [];
            fs.writeFileSync(ANALYTICS_PATH, JSON.stringify(data, null, 2));
            console.log("✅ Local plays cleared.");
        } catch (e) {
            console.error("❌ Local Reset Error:", e.message);
        }
    }

    console.log("✨ Reset Complete!");
}

resetPlays();
