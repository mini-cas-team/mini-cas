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
  console.log('🚀 Connecting to AWS RDS to migrate school records in "Login" table...');
  try {
    // Perform migration update
    console.log('Migrating school login records...');
    const updateRes = await pool.query(`
      UPDATE "Login"
      SET name = type, type = 'school'
      WHERE type NOT IN ('student', 'admin', 'school');
    `);
    
    console.log(`✅ Migration complete. Rows affected: ${updateRes.rowCount}`);

    // Verify the Login table contents
    const res = await pool.query('SELECT email, type, name, status FROM "Login"');
    console.log('Current Login table records:');
    console.log(res.rows);

  } catch (err) {
    console.error('❌ Error running migration script:', err.message);
  } finally {
    await pool.end();
  }
}

run();
