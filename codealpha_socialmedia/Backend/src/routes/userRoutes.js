const express = require('express');
const { body, param, query } = require('express-validator');
const userController = require('../controllers/userController');
const postController = require('../controllers/postController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

/**
 * @route   GET /api/users/me
 * @desc    Get logged in user's profile and stats
 * @access  Private
 */
router.get('/me', authenticateToken, userController.getMe);

/**
 * @route   PUT /api/users/me
 * @desc    Update logged in user's profile
 * @access  Private
 */
router.put(
  '/me',
  authenticateToken,
  [
    body('full_name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Full name cannot exceed 100 characters'),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio cannot exceed 500 characters'),
    body('avatar_url')
      .optional({ checkFalsy: true })
      .isURL()
      .withMessage('Avatar URL must be a valid URL'),
    validate,
  ],
  userController.updateMe
);

/**
 * @route   GET /api/users/:username
 * @desc    Get public profile of a user
 * @access  Public / Optional Auth
 */
router.get(
  '/:username',
  optionalAuth,
  [
    param('username').trim().notEmpty().withMessage('Username is required'),
    validate,
  ],
  userController.getProfileByUsername
);

/**
 * @route   POST /api/users/:username/follow
 * @desc    Toggle follow/unfollow a user
 * @access  Private
 */
router.post(
  '/:username/follow',
  authenticateToken,
  [
    param('username').trim().notEmpty().withMessage('Username is required'),
    validate,
  ],
  userController.toggleFollow
);

/**
 * @route   GET /api/users/:username/followers
 * @desc    Get list of followers for a user
 * @access  Public
 */
router.get(
  '/:username/followers',
  [
    param('username').trim().notEmpty().withMessage('Username is required'),
    validate,
  ],
  userController.getFollowers
);

/**
 * @route   GET /api/users/:username/following
 * @desc    Get list of users followed by a user
 * @access  Public
 */
router.get(
  '/:username/following',
  [
    param('username').trim().notEmpty().withMessage('Username is required'),
    validate,
  ],
  userController.getFollowing
);

/**
 * @route   GET /api/users/:username/posts
 * @desc    Get all posts by a specific user (profile grid)
 * @access  Public / Optional Auth
 */
router.get(
  '/:username/posts',
  optionalAuth,
  [
    param('username').trim().notEmpty().withMessage('Username is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    validate,
  ],
  postController.getUserPosts
);

module.exports = router;
