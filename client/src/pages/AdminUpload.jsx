import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api'; 
import AdminAnalytics from './AdminAnalytics'; 

const AdminUpload = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [uploadTab, setUploadTab] = useState('file');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  
  const [songs, setSongs] = useState([]);
  const [stats, setStats] = useState({ totalSongs: 0, storageUsed: '0 MB' });

  const [file, setFile] = useState(null);
  const [cover, setCover] = useState(null);
  const [metadata, setMetadata] = useState({ title: '', artist: '', album: '', category: 'General', emotion: 'Neutral', coverUrl: '', lyrics: '' });
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const emotionsList = ['Neutral', 'Feel Good', 'Sad', 'Motivation', 'Love', 'Party', 'Vibe'];

  const startEditing = (song) => {
    setEditingId(song.id);
    setEditForm({
      title: song.title,
      artist: song.artist,
      category: song.category || 'Tamil',
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
      setLoading(true);
      await api.put(`/songs/${editingId}`, editForm);
      setMessage('Song updated successfully!');
      setEditingId(null);
      fetchSongs();
    } catch (err) {
      console.error(err);
      setError('Update Failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

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
    } finally {
      setDataLoading(false);
    }
  };

  const fetchYoutubeMetadata = async () => {
    if (!youtubeUrl) return;
    setLoading(true);
    try {
      const res = await api.post('/yt-metadata', { url: youtubeUrl });
      const { title, artist, coverUrl, suggestedEmotion, suggestedCategory, emotionConfidence } = res.data;
      setMetadata(prev => ({ 
        ...prev, 
        title, 
        artist, 
        coverUrl, 
        lyrics: res.data.lyrics || '',
        emotion: suggestedEmotion || 'Feel Good',
        category: suggestedCategory || 'Tamil'
      }));
      setMessage(`Metadata fetched! AI detected: ${suggestedEmotion} (${Math.round(emotionConfidence * 100)}% confidence)`);
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
            title: metadata.title,
            artist: metadata.artist,
            coverUrl: metadata.coverUrl,
            lyrics: metadata.lyrics,
            category: metadata.category,
            emotion: metadata.emotion,
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
        if(document.getElementById('audio-input')) document.getElementById('audio-input').value = "";
        if(document.getElementById('cover-input')) document.getElementById('cover-input').value = "";
      }
      
      setMetadata({ title: '', artist: '', album: '', category: 'General', emotion: 'Neutral', coverUrl: '', lyrics: '' });
      fetchSongs();

    } catch (err) {
      console.error("Upload Error:", err);
      let errorMsg = 'Upload Failed';
      if (err.response && err.response.data) {
        errorMsg += ': ' + (err.response.data.message || JSON.stringify(err.response.data));
      } else if (err.message) {
        errorMsg += ': ' + err.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async (id) => {
    try {
      await api.delete(`/songs/${id}`);
      fetchSongs();
      setMessage('Song deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
      setDeleteConfirm(null);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.message;
      setError('Delete Failed: ' + msg);
      setTimeout(() => setError(''), 5000);
      setDeleteConfirm(null);
    }
  };

  const handleDelete = (id) => {
    setDeleteConfirm(id);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Extreme Minimal Header */}
      <div style={{ flexShrink: 0, background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', padding: '0.35rem 0.75rem 0 0.75rem', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
        <header style={{ marginBottom: '0.35rem' }}>
          <h1 style={{ color: 'white', marginBottom: '0.1rem', fontSize: '1rem', fontWeight: '800', letterSpacing: '-0.3px' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.7rem' }}>Manage library</p>
        </header>
        
        {/* Minimal Stats */}
        {activeTab === 'dashboard' && (
          <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <div className="card-flat admin-stat-card" style={{ padding: '0.35rem 0.4rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)', marginBottom: '0.05rem', lineHeight: 1 }}>{stats.totalSongs}</h3>
              <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', fontSize: '0.6rem', margin: 0, lineHeight: 1 }}>Songs</p>
            </div>
            <div className="card-flat admin-stat-card" style={{ padding: '0.35rem 0.4rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#10b981', marginBottom: '0.05rem', lineHeight: 1 }}>Active</h3>
              <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', fontSize: '0.6rem', margin: 0, lineHeight: 1 }}>Status</p>
            </div>
            <div className="card-flat admin-stat-card" style={{ padding: '0.35rem 0.4rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#f59e0b', marginBottom: '0.05rem', lineHeight: 1 }}>{stats.storageUsed}</h3>
              <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', fontSize: '0.6rem', margin: 0, lineHeight: 1 }}>Storage</p>
            </div>
          </div>
        )}

        {/* Minimal Tabs */}
        <div className="admin-tabs" style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
          {['dashboard', 'analytics', 'upload', 'manage', 'emotions'].map((tab) => (
            <button  
              key={tab}
              onClick={() => {
                if (tab === 'emotions') {
                  navigate('/admin/emotions');
                } else {
                  setActiveTab(tab);
                  setMessage('');
                  setError('');
                }
              }}
              className={`btn-3d ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize', fontSize: '0.7rem', padding: '0.25rem 0.6rem', height: 'auto', lineHeight: 1.2 }}
            >
              {tab === 'emotions' ? '🎭' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div style={{ 
        flex: 1, 
        overflow: 'hidden',
        padding: '1rem 0.75rem 1.5rem 0.75rem', 
        maxWidth: '1600px', 
        margin: '0 auto', 
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>

      {activeTab === 'dashboard' && (
        <div className="card-flat" style={{ padding: '0', borderRadius: '20px', overflow: 'hidden', height: '380px', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Header */}
          <div style={{ padding: '1rem 1.25rem 0.75rem 1.25rem', borderBottom: '2px solid rgba(255,255,255,0.05)', background: 'var(--bg-card)', flexShrink: 0 }}>
            <h2 style={{ fontSize: '1rem', margin: 0, fontWeight: '800' }}>Recent Activity</h2>
          </div>
          
          {/* Scrollable List */}
          <div 
            className="hide-scrollbar"
            style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '0 1.25rem 2rem 1.25rem',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {dataLoading ? (
              <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</div>
            ) : songs.length === 0 ? (
              <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No songs yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0', marginBottom: '2rem' }}>
                {songs.slice(0, 15).map(song => (
                  <div key={song.id || song._id} style={{ 
                    display: 'flex', 
                    gap: '0.85rem', 
                    alignItems: 'center', 
                    padding: '0.75rem 0', 
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}>
                    {/* Album Art */}
                    <img 
                      src={song.cover_url || song.coverArt || 'https://via.placeholder.com/42'} 
                      style={{ 
                        width: '42px', 
                        height: '42px', 
                        borderRadius: '10px', 
                        objectFit: 'cover', 
                        border: '1px solid rgba(255,255,255,0.08)',
                        flexShrink: 0
                      }} 
                      alt="cover" 
                    />
                    
                    {/* Song Info */}
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: '700', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        marginBottom: '2px',
                        color: 'white'
                      }}>
                        {song.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {song.artist}
                      </div>
                    </div>
                    
                    {/* Date */}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0, textAlign: 'right' }}>
                      {new Date(song.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}


      {activeTab === 'analytics' && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <AdminAnalytics />
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="card-flat" style={{ 
          padding: '1rem 1.25rem', 
          maxWidth: '600px', 
          margin: '0 auto', 
          flex: 1, 
          overflow: 'hidden',
          borderRadius: '20px',
          background: 'var(--bg-card)',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
           <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', borderBottom: '2px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
            <button 
              onClick={() => setUploadTab('file')}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: uploadTab === 'file' ? 'var(--primary)' : 'var(--text-muted)', 
                fontWeight: uploadTab === 'file' ? '800' : '600',
                cursor: 'pointer', 
                fontSize: '0.85rem',
                transition: 'all 0.2s ease',
                padding: '0.25rem 0'
              }}
            >
              File Upload
            </button>
            <button 
              onClick={() => setUploadTab('youtube')}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: uploadTab === 'youtube' ? 'var(--primary)' : 'var(--text-muted)', 
                fontWeight: uploadTab === 'youtube' ? '800' : '600',
                cursor: 'pointer', 
                fontSize: '0.85rem',
                transition: 'all 0.2s ease',
                padding: '0.25rem 0'
              }}
            >
              YouTube Import
            </button>
          </div>

          {message && <div style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.5)', color: '#86efac', padding: '0.35rem', borderRadius: '5px', marginBottom: '0.4rem', fontWeight: 'bold', fontSize: '0.75rem' }}>{message}</div>}
          {error && <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#fca5a5', padding: '0.35rem', borderRadius: '5px', marginBottom: '0.4rem', fontWeight: 'bold', fontSize: '0.75rem' }}>{error}</div>}

          <form onSubmit={handleUpload}>
            {uploadTab === 'youtube' && (
              <div style={{ marginBottom: '0.6rem' }}>
                 <h4 style={{ color: 'var(--text-main)', marginBottom: '0.3rem', margin: 0, fontSize: '0.8rem' }}>YouTube Link</h4>
                 <div style={{ display: 'flex', gap: '0.3rem' }}>
                   <input 
                     className="input-flat" 
                     type="text" 
                     placeholder="Paste URL..." 
                     value={youtubeUrl}
                     onChange={(e) => setYoutubeUrl(e.target.value)}
                     style={{ flex: 1, fontSize: '0.8rem', height: '32px', padding: '0 0.6rem' }}
                   />
                   <button 
                     type="button" 
                     onClick={(e) => { e.preventDefault(); fetchYoutubeMetadata(); }} 
                     className="btn-3d btn-secondary" 
                     disabled={loading || !youtubeUrl} 
                     style={{ width: '70px', fontSize: '0.7rem', height: '32px', padding: '0 0.4rem' }}
                   >
                     {loading ? '...' : 'Fill'}
                   </button>
                 </div>
              </div>
            )}

            {metadata.coverUrl && (
               <div style={{ marginBottom: '0.4rem', width: '45px', height: '45px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <img src={metadata.coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               </div>
            )}

            {uploadTab === 'file' && (
               <div style={{ marginBottom: '0.75rem' }}>
                 <h4 style={{ color: 'var(--text-main)', margin: 0, fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.4rem' }}>Details</h4>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                   <input className="input-flat" type="text" name="title" placeholder="Title" value={metadata.title} onChange={handleMetadataChange} style={{ fontSize: '0.8rem', height: '32px', padding: '0 0.6rem' }} />
                   <input className="input-flat" type="text" name="artist" placeholder="Artist" value={metadata.artist} onChange={handleMetadataChange} style={{ fontSize: '0.8rem', height: '32px', padding: '0 0.6rem' }} />
                   <input className="input-flat" type="text" name="album" placeholder="Album" value={metadata.album} onChange={handleMetadataChange} style={{ fontSize: '0.8rem', height: '32px', padding: '0 0.6rem' }} />
                   <select className="input-flat" name="emotion" value={metadata.emotion} onChange={handleMetadataChange} style={{ cursor: 'pointer', fontSize: '0.8rem', height: '32px', padding: '0 0.6rem' }}>
                     {emotionsList.map(e => (
                       <option key={e} value={e}>{e}</option>
                     ))}
                   </select>
                 </div>
               </div>
            )}

            {uploadTab === 'youtube' && (
               <div style={{ marginBottom: '0.6rem' }}>
                   <h4 style={{ color: 'var(--text-main)', marginBottom: '0.3rem', margin: 0, fontSize: '0.8rem' }}>AI Details</h4>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
                      <input className="input-flat" placeholder="Title" value={metadata.title} onChange={e => setMetadata({...metadata, title: e.target.value})} style={{ fontSize: '0.8rem', height: '32px', padding: '0 0.6rem' }} />
                      <input className="input-flat" placeholder="Artist" value={metadata.artist} onChange={e => setMetadata({...metadata, artist: e.target.value})} style={{ fontSize: '0.8rem', height: '32px', padding: '0 0.6rem' }} />
                   </div>
                   <select className="input-flat" style={{ marginTop: '0.3rem', fontSize: '0.8rem', height: '32px', padding: '0 0.6rem', width: '100%' }} value={metadata.emotion} onChange={e => setMetadata({...metadata, emotion: e.target.value})}>
                      {emotionsList.map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                   </select>
               </div>
            )}

            {uploadTab === 'file' && (
              <div style={{ marginBottom: '0.75rem' }}>
                <h4 style={{ color: 'var(--text-main)', marginBottom: '0.4rem', margin: 0, fontSize: '0.9rem', fontWeight: '700' }}>Files</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.2rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600' }}>Audio (MP3)*</label>
                    <input 
                      id="audio-input" 
                      type="file" 
                      accept="audio/*" 
                      onChange={handleFileChange} 
                      className="input-flat" 
                      style={{ 
                        padding: '0.35rem', 
                        height: 'auto', 
                        fontSize: '0.75rem', 
                        width: '100%', 
                        cursor: 'pointer',
                        background: 'rgba(255,255,255,0.03)'
                      }} 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.2rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600' }}>Cover Art</label>
                    <input 
                      id="cover-input" 
                      type="file" 
                      accept="image/*" 
                      onChange={handleCoverChange} 
                      className="input-flat" 
                      style={{ 
                        padding: '0.35rem', 
                        height: 'auto', 
                        fontSize: '0.75rem', 
                        width: '100%', 
                        cursor: 'pointer',
                        background: 'rgba(255,255,255,0.03)'
                      }} 
                    />
                  </div>
                </div>
              </div>
            )}

            <button 
              className="btn-3d btn-primary" 
              disabled={loading} 
              style={{ 
                width: '100%', 
                marginTop: '0', 
                height: '42px', 
                fontSize: '0.9rem',
                borderRadius: '12px',
                fontWeight: '800',
                letterSpacing: '0.5px',
                boxShadow: '0 4px 12px rgba(88, 204, 2, 0.3)',
                textTransform: 'uppercase'
              }}
            >
              {loading ? 'PROCESSING...' : (uploadTab === 'youtube' ? 'IMPORT FROM YOUTUBE' : 'UPLOAD SONG')}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="card-flat" style={{ padding: '0', flex: 1, overflow: 'hidden' }}>
           {(message || error) && (
             <div style={{ padding: '0.5rem 0.75rem' }}>
               {message && <div style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.5)', color: '#86efac', padding: '0.3rem', borderRadius: '4px', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: '600' }}>{message}</div>}
               {error && <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#fca5a5', padding: '0.3rem', borderRadius: '4px', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: '600' }}>{error}</div>}
             </div>
           )}
           <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
             <thead style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-muted)' }}>
               <tr>
                 <th style={{ padding: '0.5rem 0.6rem', fontSize: '0.7rem', fontWeight: '700' }}>Track</th>
                 <th style={{ padding: '0.5rem 0.6rem', fontSize: '0.7rem', fontWeight: '700' }}>Artist</th>
                 <th style={{ padding: '0.5rem 0.6rem', fontSize: '0.7rem', fontWeight: '700' }}>Emotion</th>
                 <th style={{ padding: '0.5rem 0.6rem', textAlign: 'right', fontSize: '0.7rem', fontWeight: '700' }}>Actions</th>
               </tr>
             </thead>
             <tbody>
               {songs.map((song, i) => (
                 <tr key={song.id || i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                   <td style={{ padding: '0.5rem 0.6rem', color: 'white', fontSize: '0.8rem' }}>
                      {editingId === song.id ? (
                        <input className="input-flat" name="title" value={editForm.title} onChange={handleEditChange} style={{ height: '26px', fontSize: '0.75rem', padding: '0 0.4rem' }} />
                      ) : song.title}
                   </td>
                   <td style={{ padding: '0.5rem 0.6rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {editingId === song.id ? (
                        <input className="input-flat" name="artist" value={editForm.artist} onChange={handleEditChange} style={{ height: '26px', fontSize: '0.75rem', padding: '0 0.4rem' }} />
                      ) : song.artist}
                   </td>
                   <td style={{ padding: '0.5rem 0.6rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {editingId === song.id ? (
                        <select className="input-flat" name="emotion" value={editForm.emotion} onChange={handleEditChange} style={{ height: '26px', fontSize: '0.75rem', padding: '0 0.4rem' }}>
                          {emotionsList.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                      ) : (song.emotion || 'Neutral')}
                   </td>
                   <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right' }}>
                      {editingId === song.id ? (
                        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                          <button onClick={saveEdit} className="btn-3d btn-primary" style={{ height: '26px', fontSize: '0.65rem', padding: '0 0.5rem' }}>Save</button>
                          <button onClick={cancelEditing} className="btn-3d btn-secondary" style={{ height: '26px', fontSize: '0.65rem', padding: '0 0.5rem' }}>Cancel</button>
                        </div>
                      ) : deleteConfirm === song.id ? (
                         <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => confirmDelete(song.id)} className="btn-3d btn-danger" style={{ height: '26px', fontSize: '0.65rem', padding: '0 0.5rem' }}>Delete</button>
                            <button onClick={() => setDeleteConfirm(null)} className="btn-3d btn-secondary" style={{ height: '26px', fontSize: '0.65rem', padding: '0 0.5rem' }}>Cancel</button>
                         </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                           <button onClick={() => startEditing(song)} className="btn-3d btn-secondary" style={{ height: '26px', fontSize: '0.65rem', padding: '0 0.5rem' }}>Edit</button>
                           <button onClick={() => handleDelete(song.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>🗑️</button>
                        </div>
                      )}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       )}
      </div>
    </div>
  );
};
export default AdminUpload;
