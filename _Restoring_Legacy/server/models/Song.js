import mongoose from 'mongoose';

const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  album: { type: String },
  coverArt: { type: String }, // URL or path
  category: { type: String },
  
  // Audio Paths
  filePathHigh: { type: String }, // 128kbps or original
  filePathLow: { type: String },  // 64kbps
  filePathPreview: { type: String }, // 30s clip

  duration: { type: Number }, // in seconds
  youtubeId: { type: String },
  
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  plays: { type: Number, default: 0 }
});

export default mongoose.model('Song', songSchema);
