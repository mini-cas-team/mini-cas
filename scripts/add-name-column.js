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
    // 1. Add name column with default value 'administrator'
    console.log('Adding column "name" to table "Login"...');
    await pool.query(`
      ALTER TABLE "Login" ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'administrator';
    `);
    
    // 2. Ensure any existing records have name set to 'administrator'
    console.log('Updating existing rows to set name = \'administrator\'...');
    await pool.query(`
      UPDATE "Login" SET name = 'administrator' WHERE name IS NULL;
    `);

    console.log('✅ Column "name" added and values updated successfully!');

    // Fetch the updated table records to verify
    const res = await pool.query('SELECT * FROM "Login"');
    console.log('Current Login table records:');
    console.log(res.rows);

  } catch (err) {
    console.error('❌ Error running database script:', err.message);
  } finally {
    await pool.end();
  }
}

run();
