import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const checkSchema = async () => {
    // Get one row to check columns
    const { data, error } = await supabase.from('songs').select('*').limit(1);
    if (error) {
        console.error('Error fetching songs:', error);
        return;
    }
    if (data.length > 0) {
        console.log('Columns in songs table:', Object.keys(data[0]));
    } else {
        console.log('Songs table is empty.');
    }
};

checkSchema();
