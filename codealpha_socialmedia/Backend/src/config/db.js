const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const config = require('./env');

// Initialize Supabase Client with service_role key for backend operations
let supabase = null;

if (config.supabase.url && config.supabase.serviceRoleKey) {
  supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
} else {
  // Create a placeholder or mock client when env vars are missing so server can boot
  console.warn(
    '⚠️ Supabase client initialized in standby mode (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).'
  );
  supabase = {
    from: () => {
      throw new Error('Supabase client is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    },
    storage: {
      from: () => {
        throw new Error('Supabase storage is not configured.');
      }
    }
  };
}

// Optional direct pg connection pool (used for migrations and direct SQL if needed)
let pool = null;
if (config.databaseUrl) {
  pool = new Pool({
    connectionString: config.databaseUrl,
    ssl:
      config.nodeEnv === 'production' ||
      config.databaseUrl.includes('supabase.co') ||
      config.databaseUrl.includes('pooler.supabase.com')
        ? { rejectUnauthorized: false }
        : false,
  });
}

/**
 * Execute a parameterized direct SQL query if pg pool is configured
 */
const query = async (text, params) => {
  if (!pool) {
    throw new Error('Direct Postgres Pool is not configured. Check DATABASE_URL in .env');
  }
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (config.nodeEnv === 'development') {
    console.log('Executed query', { text, duration, rows: res.rowCount });
  }
  return res;
};

module.exports = {
  supabase,
  pool,
  query,
};
