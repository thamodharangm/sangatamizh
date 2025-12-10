const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const { SUPABASE_URL, SUPABASE_KEY } = require('./env');

if (!SUPABASE_KEY) {
  console.error("CRITICAL: SUPABASE_KEY is missing!");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY || "MISSING_KEY", {
  auth: { autoRefreshToken: false, persistSession: false },
  global: { fetch: fetch }
});

module.exports = supabase;
