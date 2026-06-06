const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL is not set. Run: node --env-file=.env.local create-test-student.js');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const student = {
    name: 'Alice Smith',
    email: 'alice.smith@university.edu',
    address: '456 University Ave, New York, NY',
    college_university: 'Columbia University',
    major: 'Data Science',
    exams: { gre: '328', gmat: '710' }
  };

  console.log('Inserting test student into RDS PostgreSQL...');
  try {
    const res = await pool.query(
      `INSERT INTO students (name, email, address, college_university, major, exams) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (name) 
       DO UPDATE SET 
         email = EXCLUDED.email, 
         address = EXCLUDED.address, 
         college_university = EXCLUDED.college_university, 
         major = EXCLUDED.major, 
         exams = EXCLUDED.exams
       RETURNING *`,
      [
        student.name,
        student.email,
        student.address,
        student.college_university,
        student.major,
        JSON.stringify(student.exams)
      ]
    );

    console.log('✅ Test Student Inserted/Updated Successfully:');
    console.log('ID:', res.rows[0].id);
    console.log('Name:', res.rows[0].name);
    console.log('Email:', res.rows[0].email);
    console.log('College:', res.rows[0].college_university);
    console.log('Major:', res.rows[0].major);
    console.log('Exams:', res.rows[0].exams);
  } catch (err) {
    console.error('❌ Error inserting test student:', err.message);
  } finally {
    await pool.end();
  }
}

run();
