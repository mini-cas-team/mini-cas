'use server';

import { query } from '@/lib/db';
import { s3 } from '@/lib/s3';
import { HeadBucketCommand, CreateBucketCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const VALID_TABLES = ['students', 'schools', 'applications', 'school_questions', 'application_answers', 'providers', 'provider_letter'];

export async function provisionTable(tableName: string) {
    if (!VALID_TABLES.includes(tableName)) {
        return { success: false, message: `Error: Invalid table name: "${tableName}"` };
    }

    try {
        // Check if table exists in PostgreSQL
        const existCheck = await query(
            `SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE  table_schema = 'public'
                AND    table_name   = $1
            );`,
            [tableName]
        );

        const tableExists = existCheck.rows[0]?.exists;

        if (tableExists) {
            const countCheck = await query(`SELECT COUNT(*) FROM ${tableName}`);
            const count = parseInt(countCheck.rows[0]?.count || '0', 10);
            return { success: true, count, message: `Table "${tableName}" exists with ${count} records.` };
        }

        // Provision the requested table
        if (tableName === 'students') {
            await query(`
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
        } else if (tableName === 'schools') {
            await query(`
                CREATE TABLE IF NOT EXISTS schools (
                    id BIGINT PRIMARY KEY,
                    name TEXT NOT NULL,
                    location TEXT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `);
        } else if (tableName === 'applications') {
            await query(`
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
        } else if (tableName === 'school_questions') {
            await query(`
                CREATE TABLE IF NOT EXISTS school_questions (
                    id BIGSERIAL PRIMARY KEY,
                    school_id BIGINT REFERENCES schools(id) ON DELETE CASCADE,
                    content TEXT NOT NULL,
                    question_type TEXT DEFAULT 'text',
                    sort_order INT DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `);
        } else if (tableName === 'application_answers') {
            await query(`
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
        } else if (tableName === 'providers') {
            await query(`
                CREATE TABLE IF NOT EXISTS providers (
                    id SERIAL PRIMARY KEY,
                    provider TEXT NOT NULL,
                    provider_email TEXT,
                    student_id UUID REFERENCES students(id) ON DELETE CASCADE
                );
            `);
        } else if (tableName === 'provider_letter') {
            await query(`
                CREATE TABLE IF NOT EXISTS provider_letter (
                    provider_id INT REFERENCES providers(id) ON DELETE CASCADE,
                    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
                    school TEXT DEFAULT '' NOT NULL,
                    letters TEXT UNIQUE NOT NULL,
                    acc_view BOOLEAN DEFAULT false NOT NULL,
                    UNIQUE (provider_id, student_id, school)
                );
            `);
        }

        return { success: true, count: 0, message: `Created table "${tableName}" successfully on AWS RDS.` };
    } catch (err: any) {
        console.error(`Error provisioning table ${tableName}:`, err);
        return { success: false, message: `Error provisioning table: ${err.message}` };
    }
}

export async function provisionBucket(bucketName: string) {
    const bucket = process.env.S3_BUCKET_NAME || 'mini-cas-docs-5d904b5f';

    try {
        // Check if the main S3 bucket exists
        try {
            await s3.send(new HeadBucketCommand({ Bucket: bucket }));
        } catch (err: any) {
            // Bucket doesn't exist, try to create it
            if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
                await s3.send(new CreateBucketCommand({ Bucket: bucket }));
            } else {
                throw err;
            }
        }

        // List files under the prefix folder to count files
        const listData = await s3.send(new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: `${bucketName}/`
        }));
        
        // Count files that are actual objects (not just the folder key itself)
        const files = listData.Contents?.filter(item => item.Key !== `${bucketName}/`) || [];
        const count = files.length;

        return { 
            success: true, 
            count, 
            message: `S3 Folder prefix "${bucketName}/" inside S3 bucket "${bucket}" is ready.` 
        };
    } catch (err: any) {
        console.error(`Error provisioning S3 folder for ${bucketName}:`, err);
        return { success: false, message: `Error provisioning S3 folder: ${err.message}` };
    }
}
