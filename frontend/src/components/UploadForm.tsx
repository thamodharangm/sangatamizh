import React, { useState } from 'react';
import api from '../services/api';

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('');
  const [status, setStatus] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Choose a file');
    if (!title) return alert('Enter a title');

    setUploading(true);
    setStatus('Uploading...');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('title', title);
      formData.append('artist', artist || 'Unknown Artist');
      if (album) formData.append('album', album);
      if (genre) formData.append('genre', genre);

      // Upload using legacy endpoint
      const response = await api.post('/upload-legacy', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setStatus('✓ Uploaded successfully!');
      setFile(null);
      setTitle('');
      setArtist('');
      setAlbum('');
      setGenre('');
      
      setTimeout(() => setStatus(''), 3000);
    } catch (error: any) {
      console.error('Upload failed:', error);
      setStatus(`✗ Upload failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Upload Song</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Song title"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={uploading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Artist</label>
        <input
          type="text"
          value={artist}
          onChange={e => setArtist(e.target.value)}
          placeholder="Artist name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={uploading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Album</label>
        <input
          type="text"
          value={album}
          onChange={e => setAlbum(e.target.value)}
          placeholder="Album name (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={uploading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
        <input
          type="text"
          value={genre}
          onChange={e => setGenre(e.target.value)}
          placeholder="Genre (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={uploading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Audio File *</label>
        <input
          type="file"
          accept="audio/*"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={uploading}
        />
        {file && <p className="mt-1 text-sm text-gray-500">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
      </div>

      <button
        type="submit"
        disabled={uploading || !file || !title}
        className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        {uploading ? 'Uploading...' : 'Upload Song'}
      </button>

      {status && (
        <div className={`p-3 rounded-md text-sm ${
          status.includes('✓') ? 'bg-green-50 text-green-800' :
          status.includes('✗') ? 'bg-red-50 text-red-800' :
          'bg-blue-50 text-blue-800'
        }`}>
          {status}
        </div>
      )}
    </form>
  );
}
