const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : '*',
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'vibesta-media',
  },
  databaseUrl: process.env.DATABASE_URL || '',
  jwt: {
    secret: process.env.JWT_SECRET || 'vibesta-development-jwt-secret-key-32-chars-min',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};

// Log warning in development if important variables are missing
if (!config.supabase.url || !config.supabase.serviceRoleKey) {
  if (process.env.NODE_ENV !== 'test') {
    console.warn(
      '⚠️ Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in your .env configuration.'
    );
  }
}

module.exports = config;
