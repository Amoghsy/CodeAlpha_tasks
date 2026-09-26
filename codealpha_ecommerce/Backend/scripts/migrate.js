require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runMigrations() {
  console.log('\n========================================');
  console.log('🚀 Supabase Database Migration Runner');
  console.log('========================================\n');

  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL is missing in your .env file.\n');
    console.log('💡 How to get your DATABASE_URL in Supabase:');
    console.log('1. Go to your Supabase Project: Project Settings ➔ Database');
    console.log('2. Under "Connection string", select "URI" (or Session pooler)');
    console.log('3. Copy the URL, replace [YOUR-PASSWORD] with your database password, and add to .env:');
    console.log('   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.paildkjjmhzhfyiututq.supabase.co:5432/postgres\n');
    console.log('ℹ️  Alternatively, you can copy migrations/001_initial_schema.sql directly into the Supabase SQL Editor.\n');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to PostgreSQL database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // 1. Create migrations tracking table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public._migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Read migration files from /migrations
    const migrationsDir = path.join(__dirname, '../migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.error(`❌ Migrations directory not found at: ${migrationsDir}`);
      process.exit(1);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('ℹ️  No .sql migration files found.');
      process.exit(0);
    }

    // 3. Check already executed migrations
    const { rows: executedRows } = await client.query('SELECT name FROM public._migrations');
    const executedSet = new Set(executedRows.map(r => r.name));

    let executedCount = 0;

    for (const file of files) {
      if (executedSet.has(file)) {
        console.log(`⏩ Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`⏳ Executing migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');

      // Execute SQL in transaction
      await client.query('BEGIN');
      try {
        await client.query(sqlContent);
        await client.query('INSERT INTO public._migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ Applied ${file}`);
        executedCount++;
      } catch (migrationErr) {
        await client.query('ROLLBACK');
        console.error(`❌ Failed while executing ${file}:`);
        console.error(migrationErr.message);
        process.exit(1);
      }
    }

    if (executedCount === 0) {
      console.log('\n✨ Database schema is already up to date!');
    } else {
      console.log(`\n🎉 Successfully applied ${executedCount} migration(s)!`);
    }

    console.log('========================================\n');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

runMigrations();
