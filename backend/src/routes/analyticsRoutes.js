const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.post('/login', analyticsController.logLogin);
router.get('/stats', analyticsController.getStats);

module.exports = router;
