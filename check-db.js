const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('❌ DATABASE_URL is not set. Run this script with node --env-file=.env.local check-db.js');
    process.exit(1);
}

const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        console.log('Connecting to RDS PostgreSQL...');
        const { rows: questions } = await pool.query('SELECT * FROM school_questions');
        console.log('✅ QUESTIONS:', questions);
        
        const { rows: schools } = await pool.query('SELECT * FROM schools');
        console.log('✅ SCHOOLS:', schools);
    } catch (e) {
        console.error('❌ Database query failed:', e.message);
    } finally {
        await pool.end();
    }
}
check();
