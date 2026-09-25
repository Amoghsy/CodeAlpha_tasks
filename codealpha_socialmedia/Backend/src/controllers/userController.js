const { supabase } = require('../config/db');

/**
 * Get public profile by username with post/follower/following counts
 * GET /api/users/:username
 */
const getProfileByUsername = async (req, res, next) => {
  try {
    const targetUsername = req.params.username.trim().toLowerCase();
    const currentUserId = req.user ? req.user.userId : null;

    // Fetch user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, full_name, bio, avatar_url, created_at')
      .eq('username', targetUsername)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get post count
    const { count: postCount, error: postErr } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get follower count (people following this user)
    const { count: followerCount, error: followerErr } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id);

    // Get following count (people this user is following)
    const { count: followingCount, error: followingErr } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id);

    // Check if current user is following this user
    let isFollowing = false;
    if (currentUserId && currentUserId !== user.id) {
      const { data: followRecord } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', user.id)
        .maybeSingle();

      isFollowing = !!followRecord;
    }

    return res.status(200).json({
      user: {
        ...user,
        counts: {
          posts: postCount || 0,
          followers: followerCount || 0,
          following: followingCount || 0,
        },
        is_following: isFollowing,
        is_self: currentUserId === user.id,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get current authenticated user's own profile and stats
 * GET /api/users/me
 */
const getMe = async (req, res, next) => {
  try {
    const currentUserId = req.user.userId;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, email, full_name, bio, avatar_url, created_at, updated_at')
      .eq('id', currentUserId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Get stats
    const { count: postCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUserId);

    const { count: followerCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', currentUserId);

    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', currentUserId);

    return res.status(200).json({
      user: {
        ...user,
        counts: {
          posts: postCount || 0,
          followers: followerCount || 0,
          following: followingCount || 0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update authenticated user's profile
 * PUT /api/users/me
 */
const updateMe = async (req, res, next) => {
  try {
    const currentUserId = req.user.userId;
    const { full_name, bio, avatar_url } = req.body;

    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name ? full_name.trim() : null;
    if (bio !== undefined) updates.bio = bio ? bio.trim() : null;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url || null;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    updates.updated_at = new Date().toISOString();

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', currentUserId)
      .select('id, username, email, full_name, bio, avatar_url, created_at, updated_at')
      .single();

    if (error) {
      return next(error);
    }

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Toggle follow/unfollow a user
 * POST /api/users/:username/follow
 */
const toggleFollow = async (req, res, next) => {
  try {
    const currentUserId = req.user.userId;
    const targetUsername = req.params.username.trim().toLowerCase();

    // Find target user
    const { data: targetUser, error: targetErr } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', targetUsername)
      .single();

    if (targetErr || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.id === currentUserId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    // Check if already following
    const { data: existingFollow, error: checkErr } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUser.id)
      .maybeSingle();

    if (checkErr) {
      return next(checkErr);
    }

    if (existingFollow) {
      // Unfollow
      const { error: deleteErr } = await supabase
        .from('follows')
        .delete()
        .eq('id', existingFollow.id);

      if (deleteErr) return next(deleteErr);

      return res.status(200).json({
        message: `Unfollowed @${targetUser.username}`,
        is_following: false,
      });
    } else {
      // Follow
      const { error: insertErr } = await supabase
        .from('follows')
        .insert([
          {
            follower_id: currentUserId,
            following_id: targetUser.id,
          },
        ]);

      if (insertErr) return next(insertErr);

      return res.status(200).json({
        message: `Following @${targetUser.username}`,
        is_following: true,
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Get followers list of a user
 * GET /api/users/:username/followers
 */
const getFollowers = async (req, res, next) => {
  try {
    const targetUsername = req.params.username.trim().toLowerCase();

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', targetUsername)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data: followers, error: followError } = await supabase
      .from('follows')
      .select(`
        created_at,
        users:follower_id (
          id,
          username,
          full_name,
          avatar_url,
          bio
        )
      `)
      .eq('following_id', user.id)
      .order('created_at', { ascending: false });

    if (followError) {
      return next(followError);
    }

    const formattedFollowers = (followers || []).map((f) => ({
      ...f.users,
      followed_at: f.created_at,
    }));

    return res.status(200).json({
      count: formattedFollowers.length,
      followers: formattedFollowers,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get following list of a user
 * GET /api/users/:username/following
 */
const getFollowing = async (req, res, next) => {
  try {
    const targetUsername = req.params.username.trim().toLowerCase();

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', targetUsername)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data: following, error: followError } = await supabase
      .from('follows')
      .select(`
        created_at,
        users:following_id (
          id,
          username,
          full_name,
          avatar_url,
          bio
        )
      `)
      .eq('follower_id', user.id)
      .order('created_at', { ascending: false });

    if (followError) {
      return next(followError);
    }

    const formattedFollowing = (following || []).map((f) => ({
      ...f.users,
      followed_at: f.created_at,
    }));

    return res.status(200).json({
      count: formattedFollowing.length,
      following: formattedFollowing,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfileByUsername,
  getMe,
  updateMe,
  toggleFollow,
  getFollowers,
  getFollowing,
};
