/**
 * Vibesta Node.js Database Version Manager / Migration Runner
 * 
 * Manages database migrations with version tracking in a `schema_migrations` table.
 * 
 * Commands:
 *   node src/db/migrate.js up       - Apply all pending migrations
 *   node src/db/migrate.js down     - Rollback the most recently applied migration
 *   node src/db/migrate.js status   - Display status of all migrations
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL is not defined in your .env file.');
  console.error('Please configure DATABASE_URL to run database migrations.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' || connectionString.includes('supabase.co') || connectionString.includes('pooler.supabase.com')
    ? { rejectUnauthorized: false }
    : false
});

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function initMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    return [];
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();
}

function parseSqlSections(sqlContent) {
  const upIndex = sqlContent.indexOf('-- Up');
  const downIndex = sqlContent.indexOf('-- Down');

  let upSql = '';
  let downSql = '';

  if (upIndex !== -1 && downIndex !== -1) {
    upSql = sqlContent.substring(upIndex + 5, downIndex).trim();
    downSql = sqlContent.substring(downIndex + 7).trim();
  } else if (upIndex !== -1) {
    upSql = sqlContent.substring(upIndex + 5).trim();
  } else if (downIndex !== -1) {
    upSql = sqlContent.substring(0, downIndex).trim();
    downSql = sqlContent.substring(downIndex + 7).trim();
  } else {
    upSql = sqlContent.trim();
  }

  return { upSql, downSql };
}

async function migrateUp() {
  const client = await pool.connect();
  try {
    await initMigrationTable(client);

    const { rows: appliedRows } = await client.query(
      'SELECT name FROM schema_migrations ORDER BY id ASC'
    );
    const appliedSet = new Set(appliedRows.map((r) => r.name));

    const files = getMigrationFiles();
    const pendingFiles = files.filter((f) => !appliedSet.has(f));

    if (pendingFiles.length === 0) {
      console.log('✅ Database is already up to date. No pending migrations.');
      return;
    }

    console.log(`🚀 Found ${pendingFiles.length} pending migration(s) to apply:\n`);

    for (const file of pendingFiles) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      const { upSql } = parseSqlSections(sqlContent);

      if (!upSql) {
        console.log(`⚠️ Skipping ${file} (No SQL found in UP section)`);
        continue;
      }

      console.log(`⏳ Applying: ${file}...`);
      await client.query('BEGIN');
      try {
        await client.query(upSql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ Applied:  ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Migration failed on ${file}:`, err.message);
        throw err;
      }
    }

    console.log('\n🎉 All migrations applied successfully!');
  } finally {
    client.release();
    await pool.end();
  }
}

async function migrateDown() {
  const client = await pool.connect();
  try {
    await initMigrationTable(client);

    const { rows: appliedRows } = await client.query(
      'SELECT name FROM schema_migrations ORDER BY id DESC LIMIT 1'
    );

    if (appliedRows.length === 0) {
      console.log('⚠️ No applied migrations to rollback.');
      return;
    }

    const lastMigration = appliedRows[0].name;
    const filePath = path.join(MIGRATIONS_DIR, lastMigration);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Migration file ${lastMigration} not found in ${MIGRATIONS_DIR}`);
    }

    const sqlContent = fs.readFileSync(filePath, 'utf8');
    const { downSql } = parseSqlSections(sqlContent);

    if (!downSql) {
      console.error(`❌ Cannot rollback ${lastMigration}: No '-- Down' section found.`);
      return;
    }

    console.log(`⏳ Rolling back: ${lastMigration}...`);
    await client.query('BEGIN');
    try {
      await client.query(downSql);
      await client.query('DELETE FROM schema_migrations WHERE name = $1', [lastMigration]);
      await client.query('COMMIT');
      console.log(`✅ Successfully rolled back: ${lastMigration}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`❌ Rollback failed for ${lastMigration}:`, err.message);
      throw err;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

async function migrationStatus() {
  const client = await pool.connect();
  try {
    await initMigrationTable(client);

    const { rows: appliedRows } = await client.query(
      'SELECT name, applied_at FROM schema_migrations ORDER BY id ASC'
    );
    const appliedMap = new Map(appliedRows.map((r) => [r.name, r.applied_at]));

    const files = getMigrationFiles();

    console.log('\n📊 Vibesta Database Migration Status:');
    console.log('------------------------------------------------------------');
    console.log(
      'Status   | Migration Name                            | Applied At'
    );
    console.log('------------------------------------------------------------');

    if (files.length === 0) {
      console.log('No migration files found.');
    }

    for (const file of files) {
      if (appliedMap.has(file)) {
        const dateStr = new Date(appliedMap.get(file)).toLocaleString();
        console.log(`APPLIED  | ${file.padEnd(41)} | ${dateStr}`);
      } else {
        console.log(`PENDING  | ${file.padEnd(41)} | --`);
      }
    }
    console.log('------------------------------------------------------------\n');
  } finally {
    client.release();
    await pool.end();
  }
}

const command = process.argv[2] || 'up';

switch (command) {
  case 'up':
    migrateUp().catch(() => process.exit(1));
    break;
  case 'down':
    migrateDown().catch(() => process.exit(1));
    break;
  case 'status':
    migrationStatus().catch(() => process.exit(1));
    break;
  default:
    console.log(`Unknown command: ${command}`);
    console.log('Available commands: up, down, status');
    process.exit(1);
}
