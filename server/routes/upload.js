/**
 * AP Mart - Local File Upload Router using Multer
 * Uploads apparel imagery to local public/uploads/ directory
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads');

// Ensure destination upload folder exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const uniqueName = `${basename}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});

// File filter for image formats
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|avif/;
  const isExt = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const isMime = allowedTypes.test(file.mimetype);

  if (isExt && isMime) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, PNG, WebP) are permitted for apparel assets'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

// POST /api/upload - Single image upload
router.post('/', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded' });
    }

    const relativeUrl = `uploads/${req.file.filename}`;
    res.json({
      success: true,
      message: 'Image uploaded successfully to local storage',
      url: relativeUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  });
});

module.exports = router;
