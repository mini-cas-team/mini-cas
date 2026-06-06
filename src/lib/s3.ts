import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Config: any = {
  region: process.env.MINI_CAS_AWS_REGION || process.env.AWS_REGION || 'us-east-1',
};

if (process.env.MINI_CAS_AWS_ACCESS_KEY_ID && process.env.MINI_CAS_AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: process.env.MINI_CAS_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MINI_CAS_AWS_SECRET_ACCESS_KEY,
  };
}

export const s3 = new S3Client(s3Config);

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'mini-cas-docs-5d904b5f';

/**
 * Generates a presigned URL for PUT uploads directly from the browser to S3.
 */
export async function getUploadPresignedUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Generates a temporary presigned URL for GET requests to view/download files.
 */
export async function getDownloadPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Fetches an object directly from S3 and returns its content as a Node.js Buffer.
 * Useful for server-side processing (e.g. PDF generation).
 */
export async function getFileBuffer(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  const response = await s3.send(command);
  if (!response.Body) {
    throw new Error(`Empty response body from S3 for key: ${key}`);
  }
  const byteArray = await response.Body.transformToByteArray();
  return Buffer.from(byteArray);
}

/**
 * Deletes an object from S3.
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  await s3.send(command);
}
