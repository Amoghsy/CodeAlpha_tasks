const { supabase } = require('../config/db');

/**
 * Helper to enrich posts with likes count, comments count, and is_liked status
 */
async function enrichPostData(posts, currentUserId) {
  if (!posts || posts.length === 0) return [];

  const postIds = posts.map((p) => p.id);

  // 1. Fetch likes counts and current user's like status
  const { data: likesData } = await supabase
    .from('likes')
    .select('post_id, user_id')
    .in('post_id', postIds);

  // 2. Fetch comments count
  const { data: commentsData } = await supabase
    .from('comments')
    .select('post_id, id')
    .in('post_id', postIds);

  const likesMap = new Map();
  const userLikedSet = new Set();
  (likesData || []).forEach((l) => {
    likesMap.set(l.post_id, (likesMap.get(l.post_id) || 0) + 1);
    if (currentUserId && l.user_id === currentUserId) {
      userLikedSet.add(l.post_id);
    }
  });

  const commentsMap = new Map();
  (commentsData || []).forEach((c) => {
    commentsMap.set(c.post_id, (commentsMap.get(c.post_id) || 0) + 1);
  });

  return posts.map((post) => ({
    ...post,
    likes_count: likesMap.get(post.id) || 0,
    comments_count: commentsMap.get(post.id) || 0,
    is_liked: userLikedSet.has(post.id),
  }));
}

/**
 * Create a new post
 * POST /api/posts
 */
const createPost = async (req, res, next) => {
  try {
    const currentUserId = req.user.userId;
    const { image_url, caption } = req.body;

    if (!image_url) {
      return res.status(400).json({ error: 'image_url is required' });
    }

    const { data: newPost, error } = await supabase
      .from('posts')
      .insert([
        {
          user_id: currentUserId,
          image_url: image_url.trim(),
          caption: caption ? caption.trim() : null,
        },
      ])
      .select(`
        id,
        caption,
        image_url,
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
      message: 'Post created successfully',
      post: {
        ...newPost,
        likes_count: 0,
        comments_count: 0,
        is_liked: false,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get personalized feed (posts from followed users + own posts)
 * GET /api/posts/feed
 */
const getFeed = async (req, res, next) => {
  try {
    const currentUserId = req.user.userId;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    // Get list of followed user IDs
    const { data: followingData, error: followErr } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUserId);

    if (followErr) return next(followErr);

    const followedIds = (followingData || []).map((f) => f.following_id);
    const feedUserIds = [currentUserId, ...followedIds];
    const isDiscoverMode = followedIds.length === 0;

    // Fetch total count for pagination
    let countQuery = supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    if (!isDiscoverMode) {
      countQuery = countQuery.in('user_id', feedUserIds);
    }

    const { count: totalPosts, error: countErr } = await countQuery;
    if (countErr) return next(countErr);

    // Fetch posts
    let postsQuery = supabase
      .from('posts')
      .select(`
        id,
        caption,
        image_url,
        created_at,
        updated_at,
        user:user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!isDiscoverMode) {
      postsQuery = postsQuery.in('user_id', feedUserIds);
    }

    const { data: posts, error: postsErr } = await postsQuery;
    if (postsErr) return next(postsErr);

    const enrichedPosts = await enrichPostData(posts, currentUserId);

    return res.status(200).json({
      pagination: {
        page,
        limit,
        total: totalPosts || 0,
        totalPages: Math.ceil((totalPosts || 0) / limit),
        hasMore: offset + limit < (totalPosts || 0),
      },
      posts: enrichedPosts,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single post by ID with author info, like count, comment count
 * GET /api/posts/:id
 */
const getPostById = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const currentUserId = req.user ? req.user.userId : null;

    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        id,
        caption,
        image_url,
        created_at,
        updated_at,
        user:user_id (
          id,
          username,
          full_name,
          avatar_url,
          bio
        )
      `)
      .eq('id', postId)
      .single();

    if (error || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const [enrichedPost] = await enrichPostData([post], currentUserId);

    return res.status(200).json({
      post: enrichedPost,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all posts by a specific user (for profile grid)
 * GET /api/users/:username/posts
 */
const getUserPosts = async (req, res, next) => {
  try {
    const targetUsername = req.params.username.trim().toLowerCase();
    const currentUserId = req.user ? req.user.userId : null;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const offset = (page - 1) * limit;

    // Find user
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', targetUsername)
      .single();

    if (userErr || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get total count
    const { count: totalPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Fetch posts
    const { data: posts, error: postsErr } = await supabase
      .from('posts')
      .select(`
        id,
        caption,
        image_url,
        created_at,
        updated_at,
        user:user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (postsErr) return next(postsErr);

    const enrichedPosts = await enrichPostData(posts, currentUserId);

    return res.status(200).json({
      pagination: {
        page,
        limit,
        total: totalPosts || 0,
        totalPages: Math.ceil((totalPosts || 0) / limit),
        hasMore: offset + limit < (totalPosts || 0),
      },
      posts: enrichedPosts,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a post (only owner can delete)
 * DELETE /api/posts/:id
 */
const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const currentUserId = req.user.userId;

    // Check if post exists and user is owner
    const { data: post, error: findError } = await supabase
      .from('posts')
      .select('id, user_id')
      .eq('id', postId)
      .single();

    if (findError || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.user_id !== currentUserId) {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own posts' });
    }

    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (deleteError) {
      return next(deleteError);
    }

    return res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPost,
  getFeed,
  getPostById,
  getUserPosts,
  deletePost,
};
