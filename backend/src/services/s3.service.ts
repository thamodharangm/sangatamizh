import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const bucket = process.env.S3_BUCKET || 'sangatamizh-music';
const region = process.env.S3_REGION || 'auto';
const endpoint = process.env.S3_ENDPOINT;
const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_KEY;

if (!endpoint || !accessKeyId || !secretAccessKey) {
  console.warn('⚠️  S3/R2 credentials not configured. File uploads will not work.');
}

// Configure S3 Client for Cloudflare R2
const s3Client = new S3Client({
  region,
  endpoint,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
  forcePathStyle: false, // R2 uses virtual-hosted-style
});

// Allowed file types
const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  'audio/aac',
  'audio/m4a',
];

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

interface PresignedUrlResult {
  uploadUrl: string;
  key: string;
  expiresIn: number;
}

/**
 * Generate presigned URL for uploading a file
 */
export async function generatePresignedUploadUrl(
  filename: string,
  contentType: string,
  fileType: 'audio' | 'image' = 'audio'
): Promise<PresignedUrlResult> {
  // Validate content type
  const allowedTypes = fileType === 'audio' ? ALLOWED_AUDIO_TYPES : ALLOWED_IMAGE_TYPES;
  if (!allowedTypes.includes(contentType)) {
    throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
  }

  // Generate unique key
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${fileType}s/${timestamp}-${sanitizedFilename}`;

  // Create presigned PUT URL
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const expiresIn = 300; // 5 minutes
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

  return {
    uploadUrl,
    key,
    expiresIn,
  };
}

/**
 * Generate presigned URL for downloading/streaming a file
 */
export async function generatePresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Upload file directly (for server-side uploads)
 */
export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3Client.send(command);
}

/**
 * Download file
 */
export async function downloadFile(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await s3Client.send(command);
  const chunks: Uint8Array[] = [];
  
  if (response.Body) {
    // @ts-ignore - Body is a readable stream
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
  }

  return Buffer.concat(chunks);
}

/**
 * Delete file
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Check if file exists
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validate file size from content-length header
 */
export function validateFileSize(contentLength: number, fileType: 'audio' | 'image'): void {
  const maxSize = fileType === 'audio' ? MAX_AUDIO_SIZE : MAX_IMAGE_SIZE;
  if (contentLength > maxSize) {
    throw new Error(`File too large. Maximum size: ${maxSize / 1024 / 1024}MB`);
  }
}

export { ALLOWED_AUDIO_TYPES, ALLOWED_IMAGE_TYPES, MAX_AUDIO_SIZE, MAX_IMAGE_SIZE };
