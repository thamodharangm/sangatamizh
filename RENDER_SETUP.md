2. **Level 2**: Try `yt-dlp` binary with cookies
3. **Level 3**: Try Invidious API mirrors
4. **Level 4**: Try Official YouTube Data API (uses YT_API_KEY) ← **This is the guaranteed fix**
5. **Download**: Try yt-dlp → fallback to ytdl-core stream

## After Adding Environment Variables

1. Click "Save Changes" in Render
2. Wait for automatic redeploy (~2 minutes)
3. Check deployment logs for "Server on 3002" message
4. Test upload from your frontend

## Troubleshooting

### If uploads still fail:

- Check Render logs for which level failed
- Verify YT_API_KEY is correctly set
- Ensure YouTube Data API v3 is enabled in Google Cloud Console

### If backend won't start:

- Check for "SUPABASE_KEY is missing" error
- Verify all 3 required env vars are set

## Current Status

✅ Backend code is fixed and deployed
✅ Cookies file is included in repository
✅ Multi-level fallback system implemented
✅ Official YouTube API fallback added

⚠️ **ACTION REQUIRED**: Add YT_API_KEY to Render Environment Variables

Once you add the API key, the "Failed to fetch metadata" error will be permanently resolved.
