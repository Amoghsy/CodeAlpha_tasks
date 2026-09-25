const { uploadToSupabaseStorage } = require('../services/storageService');

/**
 * Upload an image (post image or profile picture)
 * POST /api/upload
 */
const uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided in request (field name: image)' });
    }

    const folder = req.query.folder === 'avatars' ? 'avatars' : 'posts';
    const publicUrl = await uploadToSupabaseStorage(req.file, folder);

    return res.status(200).json({
      message: 'Image uploaded successfully',
      url: publicUrl,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadMedia,
};
