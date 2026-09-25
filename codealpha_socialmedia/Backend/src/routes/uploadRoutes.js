const express = require('express');
const upload = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/upload
 * @desc    Upload an image file (post image or avatar)
 * @access  Private
 */
router.post(
  '/',
  authenticateToken,
  upload.single('image'),
  uploadController.uploadMedia
);

module.exports = router;
