const express = require('express');
const router = express.Router();
const songController = require('../controllers/songController');
const upload = require('../middlewares/upload');

// Public Routes
router.get('/songs', songController.getAllSongs);
// Note: Frontend calls /api/songs/:id for delete.
router.delete('/songs/:id', songController.deleteSong); 
router.put('/songs/:id', songController.updateSong); 

router.get('/debug-network', songController.debugNetwork);

router.post('/yt-metadata', songController.getMetadata);
router.post('/upload-from-yt', songController.uploadFromYoutube);

// Handling multiple files: 'audio' and 'cover'
const cpUpload = upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]);
router.post('/upload-file', cpUpload, songController.uploadFile);

// Home Page Sections
router.get('/home-sections', songController.getHomeSections);
router.post('/log-play', songController.logPlay);

module.exports = router;
