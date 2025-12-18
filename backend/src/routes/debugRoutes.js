const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Determine yt-dlp path (copied from service/youtubeStreamService.js logic)
const ytDlpDir = path.join(__dirname, '../../temp');
const ytDlpBinaryPath = path.join(ytDlpDir, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

router.get('/ytdlp', async (req, res) => {
    const status = {
        platform: process.platform,
        binaryPath: ytDlpBinaryPath,
        exists: fs.existsSync(ytDlpBinaryPath),
        permissions: 'unknown',
        version: 'unknown',
        error: null
    };

    try {
        if (status.exists) {
            const stats = fs.statSync(ytDlpBinaryPath);
            status.permissions = (stats.mode & parseInt('777', 8)).toString(8);
        }

        // Try executing
        await new Promise((resolve, reject) => {
            exec(`"${ytDlpBinaryPath}" --version`, (error, stdout, stderr) => {
                if (error) {
                    status.error = error.message;
                    status.stderr = stderr;
                    resolve(); // Resolve anyway to send status
                } else {
                    status.version = stdout.trim();
                    resolve();
                }
            });
        });

        res.json(status);

    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

router.get('/ip', (req, res) => {
    res.json({
        ip: req.ip,
        ips: req.ips,
        headers: req.headers
    });
});

module.exports = router;
