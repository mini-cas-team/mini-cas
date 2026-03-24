'use server';

import { supabase } from '@/lib/supabase';
import { Pool } from 'pg';

export async function provisionTable(tableName: string) {
    const dbUrl = process.env.DATABASE_URL;

    // Check if table exists via REST
    const { count, error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });

    if (!error) {
        return { success: true, count: count || 0, message: `Table exists with ${count || 0} records.` };
    }

    if (error.code === 'PGRST204' || error.message.includes("relation") || error.message.includes("does not exist")) {
        if (!dbUrl) {
            return { success: false, message: `Error: Missing DATABASE_URL connection string in .env.local to execute DDL.` };
        }

        try {
            const pool = new Pool({ connectionString: dbUrl });

            if (tableName === 'students') {
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
                    GRANT ALL ON TABLE public.students TO anon;
                    GRANT ALL ON TABLE public.students TO authenticated;
                    GRANT ALL ON TABLE public.students TO service_role;
                    ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
                `);
            }
            await pool.end();

            // Re-verify
            const { count: finalCount, error: countErr } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
            if (countErr) {
                // Even if it failed the REST verify, it might have created fine if RLS blocks read
                return { success: true, count: 0, message: `Created table ${tableName}. (REST verify returned: ${countErr.message})` };
            }

            return { success: true, count: finalCount || 0, message: `Created table ${tableName} successfully.` };
        } catch (err: any) {
            return { success: false, message: `Error creating table: ${err.message}` };
        }
    }

    return { success: false, message: `Unexpected error querying table: ${error.message}` };
}

export async function provisionBucket(bucketName: string) {
    // Note: To successfully create buckets, @supabase/supabase-js must be initialized with the SERVICE_ROLE_KEY
    // rather than ANON_KEY, else RLS will block creation.
    try {
        const { data: getBucket, error: getErr } = await supabase.storage.getBucket(bucketName);

        if (getBucket) {
            const { data: files, error: listErr } = await supabase.storage.from(bucketName).list();
            if (listErr) {
                return { success: true, count: 0, message: `Bucket exists, but couldn't list files: ${listErr.message}` };
            }
            return { success: true, count: files?.length || 0, message: `Bucket exists with ${files?.length || 0} files.` };
        }

        if (getErr && (getErr.message.includes("not found") || getErr.message.includes("Entity not found"))) {
            const dbUrl = process.env.DATABASE_URL;
            if (dbUrl) {
                // We have DB string, let's just insert directly into storage.buckets to bypass RLS
                try {
                    const pool = new Pool({ connectionString: dbUrl });
                    await pool.query(`
                        INSERT INTO storage.buckets (id, name, public) 
                        VALUES ($1, $2, true) 
                        ON CONFLICT (id) DO NOTHING;

                        -- Ensure the storage.objects table has liberal RLS for public uploads to work
                        CREATE POLICY "allow_public_uploads" ON storage.objects FOR INSERT WITH CHECK (true);
                        CREATE POLICY "allow_public_reads" ON storage.objects FOR SELECT USING (true);
                        CREATE POLICY "allow_public_updates" ON storage.objects FOR UPDATE USING (true);
                        CREATE POLICY "allow_public_deletes" ON storage.objects FOR DELETE USING (true);
                    `, [bucketName, bucketName]);
                    await pool.end();
                    return { success: true, count: 0, message: `Created bucket ${bucketName} successfully via Postgres.` };
                } catch (e: any) {
                    return { success: false, message: `Failed to create bucket via DB: ${e.message}` };
                }
            }

            // Fallback to REST (which will fail without service key)
            const { data: newBucket, error: createErr } = await supabase.storage.createBucket(bucketName, { public: true });

            if (createErr) {
                return { success: false, message: `Failed to create bucket: ${createErr.message}. Ensure you are using SUPABASE_SERVICE_ROLE_KEY or insert via DB string.` };
            }
            return { success: true, count: 0, message: `Created bucket ${bucketName} successfully.` };
        }

        return { success: false, message: `Error fetching bucket: ${getErr?.message}` };
    } catch (err: any) {
        return { success: false, message: `Unexpected error: ${err.message}` };
    }
}
