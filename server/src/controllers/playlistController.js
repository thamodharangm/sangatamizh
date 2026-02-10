import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLAYLISTS_FILE = path.join(__dirname, '../playlists.json');

const getPlaylistsData = () => {
  if (!fs.existsSync(PLAYLISTS_FILE)) return [];
  try {
    const data = fs.readFileSync(PLAYLISTS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    return [];
  }
};

const savePlaylistsData = (data) => {
  fs.writeFileSync(PLAYLISTS_FILE, JSON.stringify(data, null, 2));
};

export const getUserPlaylists = (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'UserId required' });

  const playlists = getPlaylistsData();
  const userPlaylists = playlists.filter(p => p.userId === userId);
  res.json(userPlaylists);
};

export const createPlaylist = (req, res) => {
  const { userId, name } = req.body;
  if (!userId || !name) return res.status(400).json({ error: 'UserId and Name required' });

  const playlists = getPlaylistsData();
  const newPlaylist = {
    id: Date.now().toString(),
    userId,
    name,
    songIds: [],
    createdAt: new Date().toISOString()
  };

  playlists.push(newPlaylist);
  savePlaylistsData(playlists);
  res.status(201).json(newPlaylist);
};

export const addSongToPlaylist = (req, res) => {
  const { playlistId, songId } = req.body;
  
  const playlists = getPlaylistsData();
  const playlist = playlists.find(p => p.id === playlistId);

  if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
  if (playlist.songIds.includes(songId)) return res.status(400).json({ error: 'Song already in playlist' });

  playlist.songIds.push(songId);
  savePlaylistsData(playlists);
  res.json({ success: true, playlist });
};

export const removeSongFromPlaylist = (req, res) => {
  const { playlistId, songId } = req.body;
  
  const playlists = getPlaylistsData();
  const playlist = playlists.find(p => p.id === playlistId);

  if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

  playlist.songIds = playlist.songIds.filter(id => id !== songId);
  savePlaylistsData(playlists);
  res.json({ success: true, playlist });
};

export const deletePlaylist = (req, res) => {
  const { id } = req.params;
  console.log(`[Backend] Attempting to delete playlist with ID: ${id}`);
  
  let playlists = getPlaylistsData();
  const initialLength = playlists.length;
  
  playlists = playlists.filter(p => p.id === id ? false : true); // Saner comparison
  
  if (playlists.length === initialLength) {
    console.log(`[Backend] Playlist NOT found: ${id}`);
    return res.status(404).json({ error: 'Playlist not found' });
  }

  savePlaylistsData(playlists);
  console.log(`[Backend] Playlist deleted successfully: ${id}`);
  res.json({ success: true });
};
