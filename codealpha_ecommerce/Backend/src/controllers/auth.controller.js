const { supabase, supabasePublic } = require('../config/supabaseClient');
const { z } = require('zod');

// Validation Schemas
const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email address is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    full_name: z.string().min(2, 'Full name must be at least 2 characters').optional(),
    phone: z.string().optional(),
    address: z.string().optional()
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email address is required'),
    password: z.string().min(1, 'Password is required')
  })
});

/**
 * Register a new user with Supabase Auth & create profiles record
 */
async function register(req, res, next) {
  try {
    const { email, password, name, full_name, phone, address } = req.body;
    const displayName = full_name || name || email.split('@')[0];

    // Create user in Supabase Auth (auto-confirm email for frictionless development/demo)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: displayName }
    });

    if (authError) {
      // If user already exists, return 400
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user.id;

    // Create matching profile record in public.profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: displayName,
        phone: phone || null,
        address: address || null
      });

    if (profileError) {
      console.warn('Profile record creation warning:', profileError.message);
    }

    // Sign in immediately to generate session token
    const { data: sessionData, error: loginError } = await supabasePublic.auth.signInWithPassword({
      email,
      password
    });

    if (loginError) {
      return res.status(201).json({
        message: 'Registration successful. Please proceed to login.',
        user: { id: userId, email, name: displayName }
      });
    }

    return res.status(201).json({
      message: 'Account created successfully',
      token: sessionData.session?.access_token,
      user: {
        id: userId,
        email: authData.user.email,
        name: displayName
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Authenticate user via Supabase Auth
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabasePublic.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.session) {
      return res.status(401).json({ error: error?.message || 'Invalid email or password' });
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return res.status(200).json({
      message: 'Login successful',
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.full_name || data.user.user_metadata?.full_name || email.split('@')[0],
        phone: profile?.phone || null,
        address: profile?.address || null
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Sign out
 */
async function logout(req, res, next) {
  try {
    if (req.token) {
      await supabase.auth.admin.signOut(req.token).catch(() => {});
    }
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * Get profile of current authenticated user
 */
async function getMe(req, res, next) {
  try {
    const userId = req.user.id;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: profile?.full_name || req.user.user_metadata?.full_name || '',
        phone: profile?.phone || '',
        address: profile?.address || '',
        created_at: profile?.created_at || req.user.created_at
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe,
  registerSchema,
  loginSchema
};
