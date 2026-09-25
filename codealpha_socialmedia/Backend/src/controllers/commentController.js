const { supabase } = require('../config/db');

/**
 * Add a comment to a post
 * POST /api/posts/:postId/comments
 */
const addComment = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const currentUserId = req.user.userId;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
    }

    // Verify post exists
    const { data: post, error: postErr } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (postErr || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Insert comment
    const { data: newComment, error } = await supabase
      .from('comments')
      .insert([
        {
          post_id: postId,
          user_id: currentUserId,
          content: content.trim(),
        },
      ])
      .select(`
        id,
        post_id,
        content,
        created_at,
        updated_at,
        user:user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      return next(error);
    }

    return res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all comments for a post
 * GET /api/posts/:postId/comments
 */
const getComments = async (req, res, next) => {
  try {
    const postId = req.params.postId;

    // Verify post exists
    const { data: post, error: postErr } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (postErr || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Fetch comments
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        id,
        post_id,
        content,
        created_at,
        updated_at,
        user:user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      return next(error);
    }

    return res.status(200).json({
      count: (comments || []).length,
      comments: comments || [],
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a comment (only owner can delete)
 * DELETE /api/comments/:id
 */
const deleteComment = async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const currentUserId = req.user.userId;

    const { data: comment, error: findErr } = await supabase
      .from('comments')
      .select('id, user_id')
      .eq('id', commentId)
      .single();

    if (findErr || !comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== currentUserId) {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own comments' });
    }

    const { error: deleteErr } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (deleteErr) {
      return next(deleteErr);
    }

    return res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addComment,
  getComments,
  deleteComment,
};
