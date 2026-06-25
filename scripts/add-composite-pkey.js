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
  console.log('🚀 Connecting to AWS RDS to alter "Login" primary key to composite (email, type)...');
  try {
    // 1. Drop existing single primary key constraint
    console.log('Dropping existing primary key constraint "Login_pkey"...');
    await pool.query(`
      ALTER TABLE "Login" DROP CONSTRAINT IF EXISTS "Login_pkey";
    `);
    
    // 2. Add composite primary key (email, type)
    console.log('Adding composite primary key constraint (email, type)...');
    await pool.query(`
      ALTER TABLE "Login" ADD PRIMARY KEY (email, type);
    `);
    
    console.log('✅ Alter table completed successfully!');

    // Verify constraints
    const res = await pool.query(`
      SELECT conname, contype 
      FROM pg_constraint 
      WHERE conrelid = '"Login"'::regclass
    `);
    console.log('Current Login table constraints:');
    console.log(res.rows);

  } catch (err) {
    console.error('❌ Error running database script:', err.message);
  } finally {
    await pool.end();
  }
}

run();
