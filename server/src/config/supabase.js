import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] Missing credentials! Falling back to local storage logic in controllers if applicable.');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
