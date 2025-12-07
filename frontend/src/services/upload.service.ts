import api from './api';

interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  expiresIn: number;
  message: string;
}

interface UploadCompleteResponse {
  message: string;
  song: {
    id: string;
    title: string;
    artist: string;
    storageKey: string;
  };
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload file to R2/S3 using presigned URL
 */
export async function uploadFileToStorage(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  try {
    // Step 1: Get presigned URL from backend
    const presignedResponse = await api.get<PresignedUrlResponse>('/upload/presign', {
      params: {
        filename: file.name,
        contentType: file.type,
        fileType: file.type.startsWith('audio/') ? 'audio' : 'image',
        contentLength: file.size,
      },
    });

    const { uploadUrl, key } = presignedResponse.data;

    // Step 2: Upload file directly to R2/S3
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    }).then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.statusText}. ${errorText}`);
      }
    });

    // Track progress if callback provided
    if (onProgress) {
      onProgress({
        loaded: file.size,
        total: file.size,
        percentage: 100,
      });
    }

    return key;
  } catch (error: any) {
    console.error('Upload error:', error);
    throw new Error(error.message || 'Failed to upload file');
  }
}

/**
 * Complete upload and create song record
 */
export async function completeUpload(
  key: string,
  metadata: {
    title: string;
    artist?: string;
    album?: string;
    duration?: number;
    genre?: string;
  }
): Promise<UploadCompleteResponse> {
  try {
    const response = await api.post<UploadCompleteResponse>('/upload/complete', {
      key,
      ...metadata,
    });

    return response.data;
  } catch (error: any) {
    console.error('Complete upload error:', error);
    throw new Error(error.response?.data?.error || 'Failed to complete upload');
  }
}

/**
 * Upload song with metadata (complete flow)
 */
export async function uploadSong(
  file: File,
  metadata: {
    title: string;
    artist?: string;
    album?: string;
    duration?: number;
    genre?: string;
  },
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadCompleteResponse> {
  try {
    // Step 1: Upload file to storage
    const key = await uploadFileToStorage(file, onProgress);

    // Step 2: Complete upload and create song record
    const result = await completeUpload(key, metadata);

    return result;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to upload song');
  }
}

/**
 * Get stream URL for a song
 */
export async function getStreamUrl(songId: string): Promise<string> {
  try {
    const response = await api.get(`/upload/stream/${songId}`);
    return response.data.streamUrl;
  } catch (error: any) {
    console.error('Get stream URL error:', error);
    throw new Error(error.response?.data?.error || 'Failed to get stream URL');
  }
}

/**
 * Get upload configuration
 */
export async function getUploadInfo() {
  try {
    const response = await api.get('/upload/info');
    return response.data;
  } catch (error: any) {
    console.error('Get upload info error:', error);
    throw new Error('Failed to get upload info');
  }
}

export default {
  uploadFileToStorage,
  completeUpload,
  uploadSong,
  getStreamUrl,
  getUploadInfo,
};
