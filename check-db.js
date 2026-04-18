const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: questions } = await supabase.from('school_questions').select('*');
    console.log('QUESTIONS:', questions);
    const { data: schools } = await supabase.from('schools').select('*');
    console.log('SCHOOLS:', schools);
}
check();
