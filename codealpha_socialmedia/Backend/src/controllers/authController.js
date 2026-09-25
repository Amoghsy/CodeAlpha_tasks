const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/db');
const config = require('../config/env');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password, full_name, bio, avatar_url } = req.body;

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check if username or email already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id, username, email')
      .or(`username.eq.${cleanUsername},email.eq.${cleanEmail}`);

    if (checkError) {
      return next(checkError);
    }

    if (existingUsers && existingUsers.length > 0) {
      const isUsernameTaken = existingUsers.some((u) => u.username === cleanUsername);
      if (isUsernameTaken) {
        return res.status(409).json({ error: 'Username is already taken' });
      }
      return res.status(409).json({ error: 'Email is already registered' });
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert user into Supabase
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          username: cleanUsername,
          email: cleanEmail,
          password_hash,
          full_name: full_name ? full_name.trim() : null,
          bio: bio ? bio.trim() : null,
          avatar_url: avatar_url || null,
        },
      ])
      .select('id, username, email, full_name, bio, avatar_url, created_at')
      .single();

    if (insertError) {
      return next(insertError);
    }

    // Generate JWT token (payload: { userId, username })
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: newUser,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Log in an existing user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { identifier, email, username, password } = req.body;

    const loginIdentifier = (identifier || email || username || '').trim().toLowerCase();

    if (!loginIdentifier || !password) {
      return res.status(400).json({ error: 'Email or username and password are required' });
    }

    // Query user by email or username
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('id, username, email, password_hash, full_name, bio, avatar_url, created_at')
      .or(`email.eq.${loginIdentifier},username.eq.${loginIdentifier}`);

    if (findError) {
      return next(findError);
    }

    const user = users && users.length > 0 ? users[0] : null;

    if (!user) {
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Exclude password_hash from response
    const { password_hash, ...safeUser } = user;

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
};
