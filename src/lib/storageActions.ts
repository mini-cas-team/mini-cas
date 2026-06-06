'use server';

import { getUploadPresignedUrl, getDownloadPresignedUrl, deleteFile } from './s3';

export async function getUploadUrlAction(key: string, contentType: string) {
  try {
    const url = await getUploadPresignedUrl(key, contentType);
    return { success: true, url };
  } catch (error: any) {
    console.error('Failed to generate upload URL:', error);
    return { success: false, error: error.message };
  }
}

export async function getDownloadUrlAction(key: string) {
  try {
    if (!key) return { success: false, error: 'Empty key' };
    const url = await getDownloadPresignedUrl(key);
    return { success: true, url };
  } catch (error: any) {
    console.error('Failed to generate download URL:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteFileAction(key: string) {
  try {
    await deleteFile(key);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete file:', error);
    return { success: false, error: error.message };
  }
}
