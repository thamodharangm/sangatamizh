require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3002,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  YT_API_KEY: process.env.YT_API_KEY,
  YOUTUBE_COOKIES: process.env.YOUTUBE_COOKIES,
  NODE_ENV: process.env.NODE_ENV || 'development'
};
