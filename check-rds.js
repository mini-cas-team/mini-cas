const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl || dbUrl.includes('<your-db-password>')) {
  console.error('❌ Error: Please update the password in .env.local before running this test.');
  console.error('Run command: node --env-file=.env.local check-rds.js');
  process.exit(1);
}

console.log('Testing connection to RDS PostgreSQL...');
console.log('Endpoint:', dbUrl.split('@')[1]);

const pool = new Pool({
  connectionString: dbUrl,
  connectionTimeoutMillis: 5000, // 5 seconds timeout
  ssl: {
    rejectUnauthorized: false // Required for RDS standard certificates if not loading CA bundle
  }
});

async function runTest() {
  try {
    const start = Date.now();
    const res = await pool.query('SELECT NOW() as current_time, version()');
    console.log('✅ Connection Successful!');
    console.log('Database time:', res.rows[0].current_time);
    console.log('PostgreSQL version:', res.rows[0].version.split(',')[0]);
    console.log(`Response time: ${Date.now() - start}ms`);
  } catch (err) {
    console.error('❌ Connection Failed!');
    console.error('Error Details:', err.message);
  } finally {
    await pool.end();
  }
}

runTest();
