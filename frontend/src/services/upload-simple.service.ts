import { uploadSong } from '../services/upload.service';

// Simplified upload - just save metadata for now
export async function uploadSongSimple(
  metadata: {
    title: string;
    artist?: string;
    album?: string;
    genre?: string;
  }
): Promise<any> {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/upload/simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to upload');
  }
}

export { uploadSong };
export default { uploadSong, uploadSongSimple };
