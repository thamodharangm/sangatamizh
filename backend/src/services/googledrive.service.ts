import { google } from 'googleapis';
import { Readable } from 'stream';

// Initialize Google Drive API
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const GOOGLE_SERVICE_ACCOUNT_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

let drive: any = null;

function initializeDrive() {
  if (drive) return drive;

  if (!GOOGLE_SERVICE_ACCOUNT_JSON || !GOOGLE_DRIVE_FOLDER_ID) {
    console.warn('⚠️  Google Drive not configured. Set GOOGLE_DRIVE_FOLDER_ID and GOOGLE_SERVICE_ACCOUNT_JSON');
    return null;
  }

  try {
    const credentials = JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON);
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    drive = google.drive({ version: 'v3', auth });
    console.log('✓ Google Drive configured successfully');
    return drive;
  } catch (error) {
    console.error('❌ Failed to initialize Google Drive:', error);
    return null;
  }
}

/**
 * Upload file to Google Drive
 */
export async function uploadToGoogleDrive(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ fileId: string; webViewLink: string }> {
  const driveClient = initializeDrive();
  
  if (!driveClient) {
    throw new Error('Google Drive not configured');
  }

  try {
    const fileMetadata = {
      name: filename,
      parents: [GOOGLE_DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType,
      body: Readable.from(fileBuffer),
    };

    const response = await driveClient.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink',
    });

    return {
      fileId: response.data.id,
      webViewLink: response.data.webViewLink,
    };
  } catch (error: any) {
    console.error('Google Drive upload error:', error);
    throw new Error(`Failed to upload to Google Drive: ${error.message}`);
  }
}

/**
 * Get file download URL from Google Drive
 */
export async function getGoogleDriveDownloadUrl(fileId: string): Promise<string> {
  const driveClient = initializeDrive();
  
  if (!driveClient) {
    throw new Error('Google Drive not configured');
  }

  try {
    // Make file publicly readable
    await driveClient.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Get file metadata
    const file = await driveClient.files.get({
      fileId: fileId,
      fields: 'webContentLink',
    });

    return file.data.webContentLink;
  } catch (error: any) {
    console.error('Google Drive get URL error:', error);
    throw new Error(`Failed to get download URL: ${error.message}`);
  }
}

/**
 * Delete file from Google Drive
 */
export async function deleteFromGoogleDrive(fileId: string): Promise<void> {
  const driveClient = initializeDrive();
  
  if (!driveClient) {
    throw new Error('Google Drive not configured');
  }

  try {
    await driveClient.files.delete({
      fileId: fileId,
    });
  } catch (error: any) {
    console.error('Google Drive delete error:', error);
    throw new Error(`Failed to delete from Google Drive: ${error.message}`);
  }
}

/**
 * Check if Google Drive is configured
 */
export function isGoogleDriveConfigured(): boolean {
  return !!(GOOGLE_DRIVE_FOLDER_ID && GOOGLE_SERVICE_ACCOUNT_JSON);
}

export default {
  uploadToGoogleDrive,
  getGoogleDriveDownloadUrl,
  deleteFromGoogleDrive,
  isGoogleDriveConfigured,
};
