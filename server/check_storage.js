import { supabase } from './src/config/supabase.js';
import dotenv from 'dotenv';
dotenv.config();

const checkStorage = async () => {
    try {
        console.log('--- STORAGE DIAGNOSTIC ---');
        const { data: buckets, error: bError } = await supabase.storage.listBuckets();
        
        if (bError) {
            console.error('Error listing buckets:', bError.message);
            return;
        }

        console.log('Buckets found:', buckets.map(b => b.name));

        const bucketName = 'music-app';
        const exists = buckets.find(b => b.name === bucketName);
        
        if (!exists) {
            console.error(`ERROR: Bucket "${bucketName}" not found! Please create it in Supabase.`);
        } else {
            console.log(`✅ Bucket "${bucketName}" exists.`);
            if (!exists.public) {
                console.warn(`⚠️ Warning: Bucket "${bucketName}" is PRIVATE. Songs will not play. Set it to PUBLIC.`);
            } else {
                console.log(`✅ Bucket is PUBLIC.`);
            }
        }
    } catch (err) {
        console.error('Diagnostic failed:', err.message);
    }
};

checkStorage();
