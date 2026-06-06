const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL not found. Run: node --env-file=.env.local setup-db-tables.js');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('🚀 Provisioning PostgreSQL schemas on AWS RDS...');
  try {
    // 1. Create students table
    console.log('Creating table "students"...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        email TEXT,
        address TEXT,
        college_university TEXT,
        major TEXT,
        exams JSONB DEFAULT '{}'::jsonb,
        recommendation_letters JSONB DEFAULT '[]'::jsonb,
        transcripts JSONB DEFAULT '[]'::jsonb
      );
    `);

    // 2. Create schools table
    console.log('Creating table "schools"...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schools (
        id BIGINT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 3. Create applications table
    console.log('Creating table "applications"...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id BIGSERIAL PRIMARY KEY,
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        school_id BIGINT REFERENCES schools(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'draft',
        include_gre BOOLEAN DEFAULT false,
        include_gmat BOOLEAN DEFAULT false,
        selected_letter_paths JSONB DEFAULT '[]'::jsonb,
        selected_transcript_paths JSONB DEFAULT '[]'::jsonb,
        full_name TEXT,
        email TEXT,
        phone TEXT,
        program TEXT,
        file_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 4. Create school_questions table
    console.log('Creating table "school_questions"...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS school_questions (
        id BIGSERIAL PRIMARY KEY,
        school_id BIGINT REFERENCES schools(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        question_type TEXT DEFAULT 'text',
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 5. Create application_answers table
    console.log('Creating table "application_answers"...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS application_answers (
        id BIGSERIAL PRIMARY KEY,
        application_id BIGINT REFERENCES applications(id) ON DELETE CASCADE,
        question_id BIGINT REFERENCES school_questions(id) ON DELETE CASCADE,
        answer TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(application_id, question_id)
      );
    `);

    console.log('✅ All database tables provisioned successfully on AWS RDS!');
  } catch (err) {
    console.error('❌ Schema provisioning failed:', err.message);
  } finally {
    await pool.end();
  }
}

run();
