import { NextRequest, NextResponse } from 'next/server';
import { getDownloadPresignedUrl, s3 } from '@/lib/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    
    if (!key) {
        return new NextResponse('Missing document key parameter', { status: 400 });
    }
    
    try {
        // Generate a secure, temporary presigned URL for viewing
        const url = await getDownloadPresignedUrl(key, 3600); // valid for 1 hour
        return NextResponse.redirect(url);
    } catch (e: any) {
        console.error('Failed to resolve document URL from S3:', e);
        const key = process.env.MINI_CAS_AWS_ACCESS_KEY_ID;
        const secret = process.env.MINI_CAS_AWS_SECRET_ACCESS_KEY;
        const keyStatus = key ? `${key.substring(0, 4)}... (len: ${key.length})` : 'undefined/empty';
        const secretStatus = secret ? `present (len: ${secret.length})` : 'undefined/empty';
        return new NextResponse(
            `Error loading document: ${e.message}. (AccessKey: ${keyStatus}, SecretKey: ${secretStatus})`, 
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const key = formData.get('key') as string;
        const file = formData.get('file') as File;
        
        if (!key || !file) {
            return NextResponse.json({ success: false, error: 'Missing key or file parameters' }, { status: 400 });
        }
        
        const buffer = Buffer.from(await file.arrayBuffer());
        const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'mini-cas-docs-5d904b5f';
        
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: file.type
        });
        
        await s3.send(command);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Server-side S3 upload failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
