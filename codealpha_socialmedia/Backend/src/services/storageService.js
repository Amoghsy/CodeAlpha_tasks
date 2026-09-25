const path = require('path');
const crypto = require('crypto');
const { supabase } = require('../config/db');
const config = require('../config/env');

/**
 * Ensures the target storage bucket exists and is public
 */
async function ensureBucketExists(bucketName) {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) return;

    const exists = buckets.some((b) => b.name === bucketName);
    if (!exists) {
      await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
    }
  } catch (err) {
    // Ignore if permission issue or already exists
  }
}

/**
 * Uploads a file buffer to Supabase Storage
 * @param {Object} file - Multer file object ({ buffer, originalname, mimetype })
 * @param {string} folder - 'avatars' | 'posts'
 * @returns {Promise<string>} - The public URL of the uploaded image
 */
async function uploadToSupabaseStorage(file, folder = 'posts') {
  if (!supabase || !config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error('Supabase Storage is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  const bucketName = config.supabase.storageBucket;
  await ensureBucketExists(bucketName);

  const fileExt = path.extname(file.originalname) || '.jpg';
  const randomFileName = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${fileExt}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(randomFileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload image to Supabase Storage: ${error.message}`);
  }

  // Get public URL
  const { data: publicData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(randomFileName);

  return publicData.publicUrl;
}

module.exports = {
  uploadToSupabaseStorage,
};
