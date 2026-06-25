const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL not found. Run with node --env-file=.env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('🚀 Connecting to AWS RDS to alter "Login" table...');
  try {
    // 1. Add reset_code column
    console.log('Adding column "reset_code" to table "Login"...');
    await pool.query(`
      ALTER TABLE "Login" ADD COLUMN IF NOT EXISTS reset_code TEXT;
    `);

    // 2. Add reset_expires_at column
    console.log('Adding column "reset_expires_at" to table "Login"...');
    await pool.query(`
      ALTER TABLE "Login" ADD COLUMN IF NOT EXISTS reset_expires_at TIMESTAMP;
    `);

    console.log('✅ Columns "reset_code" and "reset_expires_at" added successfully!');

    // Fetch the updated table records to verify schema structure
    const res = await pool.query('SELECT * FROM "Login" LIMIT 1');
    console.log('Sample Login record structure:', res.rows[0]);

  } catch (err) {
    console.error('❌ Error running database script:', err.message);
  } finally {
    await pool.end();
  }
}

run();
