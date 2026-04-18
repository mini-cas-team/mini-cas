import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('🚀 Starting migration...');
  
  try {
    const yamlPath = path.join(process.cwd(), 'src', 'config', 'school.yml');
    const fileContents = fs.readFileSync(yamlPath, 'utf8');
    const data = yaml.load(fileContents) as any;
    const schools = data.schools || [];

    console.log(`📦 Found ${schools.length} schools in YAML.`);

    for (const school of schools) {
      console.log(`Upserting: ${school.name}`);
      const { error } = await supabase
        .from('schools')
        .upsert({
          id: school.id, // Keep the numeric IDs as provided in YAML
          name: school.name,
          location: school.location
        }, { onConflict: 'id' });

      if (error) {
        if (error.code === '42P01') {
          console.error("❌ Table 'schools' does not exist. Please create it first in Supabase.");
          process.exit(1);
        }
        console.error(`❌ Error upserting ${school.name}:`, error.message);
      }
    }

    console.log('✅ Migration complete!');
  } catch (e) {
    console.error('❌ Migration failed:', e);
  }
}

migrate();
 Simon says: "To run this script, use: npx ts-node scripts/migrate-schools.ts"
