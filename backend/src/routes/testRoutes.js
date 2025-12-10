const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

router.get('/connections', testController.testConnections);

module.exports = router;
