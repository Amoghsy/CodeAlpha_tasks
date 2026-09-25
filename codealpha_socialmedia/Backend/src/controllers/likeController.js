const { supabase } = require('../config/db');

/**
 * Toggle like/unlike on a post
 * POST /api/posts/:postId/like
 */
const toggleLike = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const currentUserId = req.user.userId;

    // Verify post exists
    const { data: post, error: postErr } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (postErr || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user already liked the post
    const { data: existingLike, error: checkErr } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', currentUserId)
      .maybeSingle();

    if (checkErr) {
      return next(checkErr);
    }

    let isLiked = false;
    let message = '';

    if (existingLike) {
      // Unlike
      const { error: deleteErr } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteErr) return next(deleteErr);

      isLiked = false;
      message = 'Post unliked successfully';
    } else {
      // Like
      const { error: insertErr } = await supabase
        .from('likes')
        .insert([
          {
            post_id: postId,
            user_id: currentUserId,
          },
        ]);

      if (insertErr) return next(insertErr);

      isLiked = true;
      message = 'Post liked successfully';
    }

    // Get updated total likes count
    const { count: likesCount } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    return res.status(200).json({
      message,
      is_liked: isLiked,
      likes_count: likesCount || 0,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get likes count and optionally list of users who liked
 * GET /api/posts/:postId/likes
 */
const getPostLikes = async (req, res, next) => {
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

    const { data: likes, error } = await supabase
      .from('likes')
      .select(`
        created_at,
        users:user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) {
      return next(error);
    }

    const formattedLikes = (likes || []).map((l) => ({
      ...l.users,
      liked_at: l.created_at,
    }));

    return res.status(200).json({
      count: formattedLikes.length,
      likes: formattedLikes,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  toggleLike,
  getPostLikes,
};
