const { Pool } = require('pg');
const crypto = require('crypto');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL not found. Run with node --env-file=.env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

// Securely hash password using PBKDF2/scrypt with a unique salt
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function run() {
  console.log('🚀 Connecting to AWS RDS to create "Login" table...');
  try {
    // Create the Login table
    console.log('Creating table "Login"...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Login" (
        email TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        password TEXT NOT NULL,
        status TEXT NOT NULL
      );
    `);
    console.log('✅ Table "Login" created successfully!');

    // Seed a sample login record
    console.log('Inserting seed login record...');
    const sampleEmail = 'admin@minicas.edu';
    const sampleType = 'admin';
    const rawPassword = 'SuperSecurePassword123!';
    const hashedPassword = hashPassword(rawPassword);
    const sampleStatus = 'active';

    await pool.query(`
      INSERT INTO "Login" (email, type, password, status)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email)
      DO UPDATE SET
        type = EXCLUDED.type,
        password = EXCLUDED.password,
        status = EXCLUDED.status
    `, [sampleEmail, sampleType, hashedPassword, sampleStatus]);

    console.log(`✅ Sample record inserted/updated successfully:`);
    console.log(`- Email: ${sampleEmail}`);
    console.log(`- Type: ${sampleType}`);
    console.log(`- Hashed Password (stored in DB): ${hashedPassword}`);
    console.log(`- Status: ${sampleStatus}`);

  } catch (err) {
    console.error('❌ Error running database script:', err.message);
  } finally {
    await pool.end();
  }
}

run();
