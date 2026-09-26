const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ WARNING: Supabase URL or Service Role Key is missing in environment variables.');
  console.warn('Please define SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.');
}

/**
 * Admin Supabase Client (bypasses RLS with service_role key for backend operations)
 */
const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseServiceKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Public Supabase Client (for standard client-facing operations)
 */
const supabasePublic = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || supabaseServiceKey || 'placeholder-key'
);

module.exports = {
  supabase: supabaseAdmin,
  supabasePublic
};
