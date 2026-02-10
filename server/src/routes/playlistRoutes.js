import express from 'express';
import { 
  getUserPlaylists, 
  createPlaylist, 
  addSongToPlaylist, 
  removeSongFromPlaylist, 
  deletePlaylist 
} from '../controllers/playlistController.js';

const router = express.Router();

router.get('/', getUserPlaylists);
router.post('/', createPlaylist);
router.put('/', addSongToPlaylist);
router.delete('/:id', deletePlaylist);
router.delete('/:id/song/:songId', removeSongFromPlaylist);

export default router;
