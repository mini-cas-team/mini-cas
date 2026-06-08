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
        const envKeys = Object.keys(process.env).filter(k => 
            k.includes('DATABASE') || k.includes('S3') || k.includes('AWS') || k.includes('MINI')
        );
        return new NextResponse(
            `Error loading document: ${e.message}. (Loaded Env Keys: ${envKeys.join(', ')})`, 
            { status: 500 }
        );
    }
}
