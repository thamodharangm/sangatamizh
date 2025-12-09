const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const YTDlpWrap = require('yt-dlp-wrap').default;
const fs = require('fs');
const app = express();
require('dotenv').config();

app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

const fetch = require('node-fetch');

// Initialize Supabase
let supabaseUrl = process.env.SUPABASE_URL;
const fallbackUrl = 'https://lemirqphbiyhmulyczzg.supabase.co';

// Sanitize URL: If missing or invalid (doesn't start with http), OR has known typo, use fallback
if (!supabaseUrl || !supabaseUrl.startsWith('http') || supabaseUrl.includes('zzzg')) {
  console.log(`Invalid or Typo in SUPABASE_URL ('${supabaseUrl}'). Switching to fallback.`);
  supabaseUrl = fallbackUrl;
}

console.log(`Starting Backend. Node Version: ${process.version}`);
console.log(`Supabase URL: ${supabaseUrl}`);

const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbWlycXBoYml5aG11bHljenpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTE5MTYyNSwiZXhwIjoyMDgwNzY3NjI1fQ.MNy9qgdjwDUTpZeDE455jSPt_0Joct0L76jOdHz5DKc';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    fetch: fetch 
  }
});

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize yt-dlp
// Initialize yt-dlp
const ytDlpWrap = new YTDlpWrap();
(async () => {
  try {
    console.log('Checking for yt-dlp binary...');
    // Ensure binary exists
    if (!fs.existsSync('./yt-dlp')) {
        console.log('Downloading yt-dlp binary from GitHub...');
        await YTDlpWrap.downloadFromGithub();
        console.log('yt-dlp downloaded successfully!');
    }
    
    // Ensure executable permissions (Linux/Render)
    try {
      if (process.platform !== 'win32') {
         fs.chmodSync('./yt-dlp', '755');
         console.log('Set 755 permissions on yt-dlp');
      }
    } catch (e) {
      console.error('Failed to set permissions on yt-dlp:', e);
    }

    ytDlpWrap.setBinaryPath('./yt-dlp');
  } catch (e) {
    console.error('Failed to setup yt-dlp:', e);
  }
})();

// GET /api/songs
app.get('/api/songs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error in /api/songs:', err);
    res.status(503).json({ 
      error: 'Failed to fetch songs', 
      details: err.message,
      usedUrl: supabaseUrl 
    });
  }
});

// POST /api/yt-metadata (Uses Official API)
app.post('/api/yt-metadata', async (req, res) => {
  try {
    const { url } = req.body;
    console.log('Received metadata request for:', url);
    const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (!videoId) return res.status(400).json({ error: 'Invalid URL' });

    const API_KEY = 'AIzaSyD2UdnHiVDZGEkQZSeKiAzowVJ34BIML7s';
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) return res.status(404).json({ error: 'Video not found' });

    const snippet = data.items[0].snippet;
    const thumbnails = snippet.thumbnails;
    const coverUrl = thumbnails.maxres?.url || thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url;

    res.json({
      title: snippet.title,
      artist: snippet.channelTitle,
      coverUrl: coverUrl
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Metadata fetch failed' });
  }
});

/* 
  POST /api/upload-from-yt
  File-based yt-dlp implementation (Most Robust)
*/
app.post('/api/upload-from-yt', async (req, res) => {
  const tempFilePath = `./downloads/temp_${Date.now()}.mp3`;
  try {
    const { url, category, customMetadata } = req.body;
    console.log('Processing YouTube Upload via yt-dlp (File Mode):', url);

    // 1. Get Metadata
    const metadataStdout = await ytDlpWrap.execPromise([url, '--dump-json']);
    const info = JSON.parse(metadataStdout);
    const videoId = info.id;

    console.log(`Downloading ${videoId} to disk...`);

    // 2. Download File to Disk (Native Spawn)
    console.log('Spawning yt-dlp process...');
    const { spawn } = require('child_process');
    const path = require('path');
    const ytDlpPath = path.resolve(__dirname, 'yt-dlp');
    
    console.log(`yt-dlp Absolute Path: ${ytDlpPath}`);
    if (!fs.existsSync(ytDlpPath)) {
       throw new Error(`yt-dlp binary NOT found at ${ytDlpPath}`);
    }

    await new Promise((resolve, reject) => {
      const child = spawn(ytDlpPath, [
        url,
        '-f', 'bestaudio',
        '--force-ipv4',
        '-o', tempFilePath
      ]);

      child.stdout.on('data', (data) => console.log(`stdout: ${data}`));
      child.stderr.on('data', (data) => console.error(`stderr: ${data}`));

      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`yt-dlp exited with code ${code}`));
      });
    });

    console.log(`Download complete. Reading file...`);
    
    // 3. Read File
    if (!fs.existsSync(tempFilePath)) {
      throw new Error('File was not created by yt-dlp');
    }
    const fileBuffer = fs.readFileSync(tempFilePath);
    
    console.log(`Uploading ${fileBuffer.length} bytes to Supabase...`);

    // 4. Upload to Supabase
    const filename = `songs/${Date.now()}_${videoId}.mp3`;
    
    let publicUrl;
    try {
      const { error: uploadError } = await supabase
        .storage
        .from('music_assets')
        .upload(filename, fileBuffer, { 
          contentType: 'audio/mpeg',
          upsert: false
        });
      
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('music_assets').getPublicUrl(filename);
      publicUrl = data.publicUrl;
    } catch (upErr) {
       console.error('Supabase Upload Call Failed:', upErr);
       throw new Error(`Supabase Upload Failed: ${upErr.message || upErr}`);
    }

    // 5. Save to DB
    const { data: dbData, error: dbError } = await supabase
      .from('songs')
      .insert({
        id: require('crypto').randomUUID(), // FIX: Generate ID manually
        title: customMetadata?.title || info.title,
        artist: customMetadata?.artist || info.uploader,
        category: category || 'General',
        cover_url: customMetadata?.coverUrl || info.thumbnail,
        file_url: publicUrl,
        source_url: url
      })
      .select();

    if (dbError) throw new Error(`DB Insert Failed: ${dbError.message}`);

    // Cleanup
    try { fs.unlinkSync(tempFilePath); } catch (e) { console.error('Cleanup failed:', e); }

    res.json({ success: true, song: dbData[0] });

  } catch (error) {
    console.error('YT-DLP Error:', error);
    // Cleanup on error too
    try { if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); } catch (e) {}
    res.status(500).json({ error: 'Download failed: ' + error.message });
  }
});

// POST /api/upload-file
app.post('/api/upload-file', upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
  try {
    const { title, artist, album, category } = req.body;
    const audioFile = req.files['audio'] ? req.files['audio'][0] : null;
    const coverFile = req.files['cover'] ? req.files['cover'][0] : null;

    if (!audioFile) return res.status(400).json({ error: 'No audio file' });

    const audioFilename = `songs/${Date.now()}_${audioFile.originalname}`;
    const { error: audioUploadError } = await supabase.storage.from('music_assets').upload(audioFilename, audioFile.buffer, { contentType: audioFile.mimetype });
    if (audioUploadError) throw audioUploadError;
    const { data: { publicUrl: audioUrl } } = supabase.storage.from('music_assets').getPublicUrl(audioFilename);

    let coverUrl = 'https://via.placeholder.com/300?text=Music'; 
    if (coverFile) {
       const coverFilename = `covers/${Date.now()}_${coverFile.originalname}`;
       const { error: coverUploadError } = await supabase.storage.from('music_assets').upload(coverFilename, coverFile.buffer, { contentType: coverFile.mimetype });
       if (!coverUploadError) {
         const { data: { publicUrl } } = supabase.storage.from('music_assets').getPublicUrl(coverFilename);
         coverUrl = publicUrl;
       }
    }

    const { data: dbData, error: dbError } = await supabase.from('songs').insert({
        id: require('crypto').randomUUID(), // FIX: Generate ID manually
        title: title || 'Unknown Title',
        artist: artist || 'Unknown Artist',
        category: category || 'General',
        cover_url: coverUrl,
        file_url: audioUrl,
        source_url: 'file_upload'
    }).select();

    if (dbError) throw dbError;
    res.json({ success: true, song: dbData[0] });

  } catch (error) {
    console.error('File Upload Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/*
  Route: DELETE /api/songs/:id
  Delete song from DB and Storage
*/
app.delete('/api/songs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[DELETE] Request for ID: ${id}`);
    
    // 1. Fetch song details to get file paths
    const { data: song, error: fetchError } = await supabase
      .from('songs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
       console.error('[DELETE] Fetch Error:', fetchError);
       return res.status(404).json({ error: 'Song not found in DB' });
    }
    console.log('[DELETE] Found song:', song.title);

    // 2. Extract storage paths from URLs
    const getPath = (fullUrl) => {
       if (!fullUrl) return null;
       try {
         const urlObj = new URL(fullUrl);
         // Path usually: /storage/v1/object/public/music_assets/songs/xyz.mp3
         // We need: songs/xyz.mp3
         const pathParts = urlObj.pathname.split('music_assets/');
         if (pathParts.length > 1) return decodeURIComponent(pathParts[1]);
         return null;
       } catch (e) { return null; }
    };

    const filesToDelete = [];
    if (song.file_url) filesToDelete.push(getPath(song.file_url));
    if (song.cover_url && !song.cover_url.includes('placeholder')) filesToDelete.push(getPath(song.cover_url));
    
    const validFiles = filesToDelete.filter(f => f);
    console.log('[DELETE] Files to remove:', validFiles);

    // 3. Delete files from Storage (Soft Fail)
    if (validFiles.length > 0) {
      const { error: storageError } = await supabase
        .storage
        .from('music_assets')
        .remove(validFiles);
      
      if (storageError) console.error('[DELETE] Storage Error (Ignored):', storageError);
      else console.log('[DELETE] Storage cleanup success');
    }

    // 4. Delete record from DB
    const { error: deleteError } = await supabase
      .from('songs')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[DELETE] DB Delete Error:', deleteError);
      throw deleteError;
    }

    console.log('[DELETE] Success');
    res.json({ success: true, message: 'Song deleted successfully' });

  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
