const express = require('express');
const { body, param, query } = require('express-validator');
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');
const likeController = require('../controllers/likeController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Private
 */
router.post(
  '/',
  authenticateToken,
  [
    body('image_url')
      .trim()
      .notEmpty()
      .withMessage('Image URL is required'),
    body('caption')
      .optional()
      .trim()
      .isLength({ max: 2200 })
      .withMessage('Caption cannot exceed 2200 characters'),
    validate,
  ],
  postController.createPost
);

/**
 * @route   GET /api/posts/feed
 * @desc    Get feed of followed users' posts + own posts
 * @access  Private
 */
router.get(
  '/feed',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    validate,
  ],
  postController.getFeed
);

/**
 * @route   GET /api/posts/:id
 * @desc    Get single post details with likes & comments count
 * @access  Public / Optional Auth
 */
router.get(
  '/:id',
  optionalAuth,
  [
    param('id').isUUID().withMessage('Valid Post UUID is required'),
    validate,
  ],
  postController.getPostById
);

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete post by ID (owner only)
 * @access  Private
 */
router.delete(
  '/:id',
  authenticateToken,
  [
    param('id').isUUID().withMessage('Valid Post UUID is required'),
    validate,
  ],
  postController.deletePost
);

/* ==========================================================================
   Comments on Post Sub-Routes
   ========================================================================== */

/**
 * @route   POST /api/posts/:postId/comments
 * @desc    Add comment to a post
 * @access  Private
 */
router.post(
  '/:postId/comments',
  authenticateToken,
  [
    param('postId').isUUID().withMessage('Valid Post UUID is required'),
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Comment content is required')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Comment must be between 1 and 1000 characters'),
    validate,
  ],
  commentController.addComment
);

/**
 * @route   GET /api/posts/:postId/comments
 * @desc    Get comments on a post
 * @access  Public
 */
router.get(
  '/:postId/comments',
  [
    param('postId').isUUID().withMessage('Valid Post UUID is required'),
    validate,
  ],
  commentController.getComments
);

/* ==========================================================================
   Likes on Post Sub-Routes
   ========================================================================== */

/**
 * @route   POST /api/posts/:postId/like
 * @desc    Toggle like / unlike on a post
 * @access  Private
 */
router.post(
  '/:postId/like',
  authenticateToken,
  [
    param('postId').isUUID().withMessage('Valid Post UUID is required'),
    validate,
  ],
  likeController.toggleLike
);

/**
 * @route   GET /api/posts/:postId/likes
 * @desc    Get list of users who liked the post
 * @access  Public
 */
router.get(
  '/:postId/likes',
  [
    param('postId').isUUID().withMessage('Valid Post UUID is required'),
    validate,
  ],
  likeController.getPostLikes
);

module.exports = router;
