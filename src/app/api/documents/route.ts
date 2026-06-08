import { NextRequest, NextResponse } from 'next/server';
import { getDownloadPresignedUrl } from '@/lib/s3';

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
