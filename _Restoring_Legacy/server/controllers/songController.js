import Song from '../models/Song.js';
import { processAudio } from '../utils/transcoder.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// import youtubeDl from 'youtube-dl-exec';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROCESSED_DIR = path.join(__dirname, '../../uploads/processed');

export const getAllSongs = async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadSong = async (req, res) => {
  try {
    // req.files should contain 'audio' and optionally 'cover'
    const audioFile = req.files['audio'] ? req.files['audio'][0] : null;
    const coverFile = req.files['cover'] ? req.files['cover'][0] : null;
    
    if (!audioFile) return res.status(400).json({ message: 'No audio file uploaded' });

    const { title, artist, album, category } = req.body;

    // Process Audio
    const transcodeResults = await processAudio(
      audioFile.path, 
      PROCESSED_DIR, 
      path.parse(audioFile.filename).name
    );

    // Save Song to DB
    const newSong = new Song({
      title,
      artist,
      album,
      category,
      coverArt: coverFile ? `/uploads/${coverFile.filename}` : null, // Fix path later
      filePathHigh: `/uploads/processed/${transcodeResults.high}`,
      filePathLow: `/uploads/processed/${transcodeResults.low}`,
      filePathPreview: `/uploads/processed/${transcodeResults.preview}`,
      uploadedBy: req.user.id
    }); // Add duration later if extracted

    await newSong.save();

    // Clean up temp file
    fs.unlinkSync(audioFile.path);

    res.status(201).json(newSong);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

export const importFromYoutube = async (req, res) => {
  try {
     return res.status(501).json({ message: 'YouTube Import is disabled in local dev mode (missing binaries). Use Docker for full features.' });

    // const { url, category } = req.body;
    
    // if (!url) return res.status(400).json({ message: 'URL is required' });

    // // 1. Fetch Metadata
    // const metadata = await youtubeDl(url, {
    //   dumpSingleJson: true,
    //   noWarnings: true,
    //   noCallHome: true,
    // });

    // const title = metadata.title;
    // const artist = metadata.uploader || 'Unknown Artist';
    // const duration = metadata.duration;
    
    // // 2. Download Audio
    // const outputTemplate = path.join(__dirname, '../../uploads/temp/%(id)s.%(ext)s');
    
    // // Download using yt-dlp (download best audio)
    // // Note: this depends on server having network access and yt-dlp working
    // await youtubeDl(url, {
    //     extractAudio: true,
    //     audioFormat: 'mp3',
    //     output: outputTemplate,
    // });

    // const audioPath = path.join(__dirname, `../../uploads/temp/${metadata.id}.mp3`);

    // // 3. Process Audio (Transcode)
    // const transcodeResults = await processAudio(
    //   audioPath, 
    //   PROCESSED_DIR, 
    //   metadata.id
    // );

    //  // 4. Save to DB
    //  const newSong = new Song({
    //   title: title,
    //   artist: artist,
    //   category: category,
    //   coverArt: metadata.thumbnail,
    //   filePathHigh: `/uploads/processed/${transcodeResults.high}`,
    //   filePathLow: `/uploads/processed/${transcodeResults.low}`,
    //   filePathPreview: `/uploads/processed/${transcodeResults.preview}`,
    //   duration: duration,
    //   youtubeId: metadata.id,
    //   uploadedBy: req.user.id
    // });

    // await newSong.save();
    
    // // Clean up
    // if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

    // res.status(201).json(newSong);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'YouTube Import failed', error: error.message });
  }
};
