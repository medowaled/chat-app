const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');

// Basic endpoint to fetch messages (will connect to DB later)
router.get('/messages', (req, res) => {
    res.json({ success: true, messages: [] });
});

// Upload media attachment
router.post('/upload', upload.single('media'), (req, res) => {
    if (req.file) {
        res.json({
            success: true,
            url: req.file.path,
            filename: req.file.filename,
            mimetype: req.file.mimetype
        });
    } else {
        res.status(400).json({ success: false, message: 'Upload failed' });
    }
});

module.exports = router;
