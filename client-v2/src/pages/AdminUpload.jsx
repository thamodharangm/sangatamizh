import { useState, useEffect } from 'react';
import api from '../config/api'; 
import AdminAnalytics from './AdminAnalytics'; 
import AdminEmotionManager from './AdminEmotionManager';

// Mobile-optimized Admin Hub (Full Parity with Desktop)
const AdminUpload = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [uploadTab, setUploadTab] = useState('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  
  // Data State
  const [songs, setSongs] = useState([]);
  const [stats, setStats] = useState({ totalSongs: 0, storageUsed: '0 MB' });

  // Form State
  const [file, setFile] = useState(null);
  const [cover, setCover] = useState(null);
  const [metadata, setMetadata] = useState({ title: '', artist: '', album: '', category: 'General', emotion: 'Neutral', coverUrl: '' });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const res = await api.get('/songs');
      setSongs(res.data);
      setStats({
        totalSongs: res.data.length,
        storageUsed: `${(res.data.length * 3.5).toFixed(1)} MB`
      });
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    }
  };

  const fetchYoutubeMetadata = async () => {
    if (!youtubeUrl) return;
    setLoading(true);
    try {
      const res = await api.post('/yt-metadata', { url: youtubeUrl });
      const { title, artist, coverUrl, suggestedEmotion, suggestedCategory } = res.data;
      setMetadata(prev => ({ 
        ...prev, 
        title, 
        artist, 
        coverUrl, 
        emotion: suggestedEmotion || 'Feel Good',
        category: suggestedCategory || 'Tamil'
      }));
      setMessage('Metadata fetched!');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch metadata');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleCoverChange = (e) => {
    if (e.target.files[0]) setCover(e.target.files[0]);
  };

  const handleMetadataChange = (e) => {
    setMetadata({ ...metadata, [e.target.name]: e.target.value });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      if (uploadTab === 'youtube') {
         await api.post('/upload-from-yt', {
           url: youtubeUrl,
           category: metadata.category,
           emotion: metadata.emotion,
           customMetadata: metadata
         });
         setMessage('YouTube Import Successful!');
         setYoutubeUrl('');
      } else {
        if (!file) throw new Error("Please select an audio file.");

        const formData = new FormData();
        formData.append('audio', file);
        if (cover) formData.append('cover', cover);
        formData.append('title', metadata.title || file.name.replace(/\.[^/.]+$/, ""));
        formData.append('artist', metadata.artist || 'Unknown Artist');
        formData.append('album', metadata.album || 'Single');
        formData.append('category', metadata.category || 'General');
        formData.append('emotion', metadata.emotion || 'Neutral');

        await api.post('/upload-file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        setMessage('File Upload Successful!');
        setFile(null);
        setCover(null);
      }
      
      setMetadata({ title: '', artist: '', album: '', category: 'General', emotion: 'Neutral', coverUrl: '' });
      fetchSongs(); 

    } catch (err) {
      console.error("Upload Error:", err);
      setError(err.response?.data?.error || err.message || 'Upload Failed');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async (id) => {
    try {
      await api.delete(`/songs/${id}`);
      fetchSongs();
      setMessage('Song deleted successfully!');
      setDeleteConfirm(null);
    } catch (err) {
      setError('Delete Failed: ' + (err.response?.data?.error || err.message));
      setDeleteConfirm(null);
    }
  };

  // Delete (existing confirmation logic integrated below)
  
  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const startEditing = (song) => {
    setEditingId(song.id);
    setEditForm({
      title: song.title,
      artist: song.artist,
      category: song.category,
      emotion: song.emotion || 'Neutral'
    });
    setDeleteConfirm(null); 
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const saveEdit = async () => {
    try {
      await api.put(`/songs/${editingId}`, editForm);
      setMessage('Song updated successfully!');
      setEditingId(null);
      fetchSongs();
    } catch (err) {
      console.error(err);
      setError('Update Failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="admin-page" style={{ paddingBottom: '2rem' }}>
      <h1 className="mb-3">Admin Hub</h1>

      {/* Stats Overview */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div className="card-flat" style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>{stats.totalSongs}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Songs</div>
          </div>
          <div className="card-flat" style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '1.5rem', color: '#f59e0b', fontWeight: 'bold' }}>{stats.storageUsed}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Storage</div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="scroll-container mb-3" style={{ paddingBottom: '0.5rem' }}>
        {['dashboard', 'analytics', 'upload', 'manage', 'emotions'].map((tab) => (
          <button  
            key={tab}
            onClick={() => { setActiveTab(tab); setMessage(''); setError(''); }}
            className={`btn-3d ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
                minWidth: 'auto',
                fontSize: '0.8rem',
                marginRight: '0.5rem',
                height: '40px'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* DASHBOARD CONTENT */}
      {activeTab === 'dashboard' && (
        <div className="card-flat">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Recent Uploads</h2>
          {songs.length === 0 ? <p style={{color: 'var(--text-muted)'}}>No songs yet.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {songs.slice(0, 5).map(song => (
                    <div key={song.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                         <img src={song.cover_url || 'https://via.placeholder.com/40'} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} alt="cover" />
                         <div style={{ flex: 1, minWidth: 0 }}>
                             <div style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                             <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{song.artist}</div>
                         </div>
                    </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ANALYTICS CONTENT */}
      {activeTab === 'analytics' && <AdminAnalytics />}

      {/* EMOTIONS CONTENT */}
      {activeTab === 'emotions' && <AdminEmotionManager />}

      {/* UPLOAD CONTENT */}
      {activeTab === 'upload' && (
        <div className="card-flat">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
             <button 
                onClick={() => setUploadTab('youtube')} 
                className={`btn-3d ${uploadTab === 'youtube' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '0.8rem', height: '40px' }}
             >
                YouTube
             </button>
             <button 
                onClick={() => setUploadTab('file')} 
                className={`btn-3d ${uploadTab === 'file' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '0.8rem', height: '40px' }}
             >
                 File
             </button>
          </div>

          {message && <div style={{ color: '#86efac', marginBottom: '1rem', fontSize: '0.9rem' }}>{message}</div>}
          {error && <div style={{ color: '#fca5a5', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

          <form onSubmit={handleUpload}>
             {uploadTab === 'youtube' && (
                 <div className="mb-2">
                     <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input className="input-flat" placeholder="Paste YouTube URL" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} style={{ flex: 1 }} />
                        <button 
                            type="button" 
                            onClick={fetchYoutubeMetadata} 
                            className="btn-3d btn-primary" 
                            style={{ fontSize: '0.8rem', minWidth: 'auto', padding: '0 1rem' }} 
                            disabled={loading}
                        >
                            Fetch
                        </button>
                     </div>
                 </div>
             )}

             {uploadTab === 'file' && (
                 <div className="mb-2">
                     <input type="file" accept="audio/*" onChange={handleFileChange} className="input-flat mb-1" style={{ padding: '0.5rem' }} required />
                     <input type="file" accept="image/*" onChange={handleCoverChange} className="input-flat" style={{ padding: '0.5rem' }} />
                 </div>
             )}
             
             <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1.5rem' }}>
                 <input className="input-flat" placeholder="Title" name="title" value={metadata.title} onChange={handleMetadataChange} />
                 <input className="input-flat" placeholder="Artist" name="artist" value={metadata.artist} onChange={handleMetadataChange} />
                 <select className="input-flat" name="emotion" value={metadata.emotion} onChange={handleMetadataChange}>
                    <option value="Neutral">Neutral</option>
                    <option value="Feel Good">Feel Good</option>
                    <option value="Sad">Sad</option>
                    <option value="Love">Love</option>
                    <option value="Party">Party</option>
                    <option value="Motivation">Motivation</option>
                 </select>
             </div>

             <button type="submit" className="btn-3d btn-primary" style={{ width: '100%' }} disabled={loading}>
                 {loading ? 'Processing...' : 'UPLOAD'}
             </button>
          </form>
        </div>
      )}

      {/* MANAGE CONTENT */}
      {activeTab === 'manage' && (
          <div className="card-flat">
               <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Manage Songs</h2>
               
               {message && <div style={{ color: '#86efac', marginBottom: '1rem', fontSize: '0.9rem' }}>{message}</div>}
               {error && <div style={{ color: '#fca5a5', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   {songs.map(song => (
                       <div key={song.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                           
                           {/* Normal View */}
                           {editingId !== song.id && (
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ overflow: 'hidden', flex: 1, marginRight: '1rem' }}>
                                    <div style={{ fontSize: '0.95rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
                                      <span>{song.artist}</span>
                                      <span>•</span>
                                      <span style={{ color: 'var(--primary)' }}>{song.emotion || 'Neutral'}</span>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                   {deleteConfirm === song.id ? (
                                       <>
                                         <button 
                                            onClick={() => confirmDelete(song.id)} 
                                            className="btn-3d btn-danger"
                                            style={{ padding: '0 0.75rem', fontSize: '0.7rem', height: '32px' }}
                                         >
                                             Delete
                                          </button>
                                         <button 
                                            onClick={() => setDeleteConfirm(null)} 
                                            className="btn-3d btn-secondary"
                                            style={{ padding: '0 0.75rem', fontSize: '0.7rem', height: '32px' }}
                                         >
                                             Cancel
                                          </button>
                                       </>
                                   ) : (
                                       <>
                                         <button 
                                            onClick={() => startEditing(song)} 
                                            className="btn-3d btn-secondary"
                                            style={{ padding: '0 0.75rem', fontSize: '0.7rem', height: '32px' }}
                                          >
                                             Edit
                                          </button>
                                          <button 
                                            onClick={() => setDeleteConfirm(song.id)} 
                                            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '0 0.5rem' }}
                                            title="Delete"
                                          >
                                             🗑️
                                          </button>
                                       </>
                                   )}
                                </div>
                             </div>
                           )}

                           {/* Editing View */}
                           {editingId === song.id && (
                             <div style={{ display: 'grid', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                                <input className="input-flat" name="title" value={editForm.title} onChange={handleEditChange} placeholder="Title" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                  <input className="input-flat" name="artist" value={editForm.artist} onChange={handleEditChange} placeholder="Artist" />
                                  <input className="input-flat" name="category" value={editForm.category} onChange={handleEditChange} placeholder="Category" />
                                </div>
                                <select className="input-flat" name="emotion" value={editForm.emotion} onChange={handleEditChange}>
                                    <option value="Neutral">Neutral</option>
                                    <option value="Feel Good">Feel Good</option>
                                    <option value="Sad">Sad</option>
                                    <option value="Love">Love</option>
                                    <option value="Party">Party</option>
                                    <option value="Motivation">Motivation</option>
                                </select>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                   <button onClick={saveEdit} className="btn-3d btn-primary" style={{ flex: 1, height: '36px', fontSize: '0.8rem' }}>Save Changes</button>
                                   <button onClick={cancelEditing} className="btn-3d btn-secondary" style={{ flex: 1, height: '36px', fontSize: '0.8rem' }}>Cancel</button>
                                </div>
                             </div>
                           )}

                       </div>
                   ))}
               </div>
          </div>
      )}

    </div>
  );
};

export default AdminUpload;
