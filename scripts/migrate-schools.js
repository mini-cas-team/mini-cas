const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL is not set. Run this script with node --env-file=.env.local scripts/migrate-schools.js');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('🚀 Starting school migration to AWS RDS PostgreSQL...');
  
  try {
    let yamlPath = path.join(process.cwd(), 'src', 'config', 'school.yml');
    if (!fs.existsSync(yamlPath)) {
      yamlPath = path.join(process.cwd(), 'src', 'config', 'school_notuse.yml');
    }
    
    if (!fs.existsSync(yamlPath)) {
      console.error('❌ Error: YAML file containing schools was not found.');
      process.exit(1);
    }

    console.log(`Loading schools from: ${yamlPath}`);
    const fileContents = fs.readFileSync(yamlPath, 'utf8');
    const parsedData = yaml.load(fileContents);
    const schools = parsedData.schools || [];

    console.log(`📦 Found ${schools.length} schools in YAML.`);

    for (const school of schools) {
      console.log(`Upserting: ${school.name}`);
      await pool.query(
        `INSERT INTO schools (id, name, location) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, location = EXCLUDED.location`,
        [school.id, school.name, school.location]
      );
    }

    console.log('✅ Migration complete!');
  } catch (e) {
    console.error('❌ Migration failed:', e);
  } finally {
    await pool.end();
  }
}

migrate();
