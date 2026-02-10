import { dbService } from './src/services/db.service.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    console.log("Checking DB Stats...");
    const stats = await dbService.getAnalyticsStats();
    console.log("Stats result:", JSON.stringify(stats, null, 2));
}

test();
