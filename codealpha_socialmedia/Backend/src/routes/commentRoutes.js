const express = require('express');
const { param } = require('express-validator');
const commentController = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

/**
 * @route   DELETE /api/comments/:id
 * @desc    Delete a comment (owner only)
 * @access  Private
 */
router.delete(
  '/:id',
  authenticateToken,
  [
    param('id').isUUID().withMessage('Valid Comment UUID is required'),
    validate,
  ],
  commentController.deleteComment
);

module.exports = router;
