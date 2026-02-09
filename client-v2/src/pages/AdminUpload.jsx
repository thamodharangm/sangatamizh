import { useState, useEffect } from 'react';
import api from '../config/api'; 
import AdminAnalytics from './AdminAnalytics'; 
import AdminEmotionManager from './AdminEmotionManager';

const EMOTIONS = ['Neutral', 'Feel Good', 'Sad', 'Motivation', 'Love', 'Party', 'Vibe'];

const AdminUpload = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [uploadTab, setUploadTab] = useState('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  
  const [songs, setSongs] = useState([]);
  const [stats, setStats] = useState({ totalSongs: 0, storageUsed: '0 MB' });

  const [file, setFile] = useState(null);
  const [cover, setCover] = useState(null);
  const [metadata, setMetadata] = useState({ title: '', artist: '', album: '', category: 'General', emotion: 'Neutral', coverUrl: '' });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [cookieBox, setCookieBox] = useState('');

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
      const { title, artist, coverUrl, suggestedEmotion, emotionConfidence } = res.data;
      
      setMetadata(prev => ({ 
        ...prev, 
        title, 
        artist, 
        coverUrl: coverUrl || '', 
        emotion: EMOTIONS.includes(suggestedEmotion) ? suggestedEmotion : 'Feel Good'
      }));
      setMessage(`AI Detection: ${suggestedEmotion} (${Math.round(emotionConfidence * 100)}% confidence)`);
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
           category: 'Tamil',
           emotion: metadata.emotion
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
        formData.append('category', 'Tamil');
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
      
      setMetadata({ title: '', artist: '', album: '', category: 'General', emotion: 'Neutral', coverUrl: '' });
      fetchSongs(); 

    } catch (err) {
      console.error("Upload Error:", err);
      setError('Upload Failed: ' + (err.response?.data?.message || err.message));
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

  const startEditing = (song) => {
    setEditingId(song.id);
    setEditForm({
      title: song.title,
      artist: song.artist,
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
      setError('Update Failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="admin-page" style={{ 
      height: '100dvh', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden', 
      padding: 0,
      background: 'var(--bg-main)'
    }}>
      {/* Compact Header Section - FIXED */}
      <div style={{ 
        flexShrink: 0, 
        background: 'var(--bg-main)', 
        borderBottom: '1px solid var(--border-color)', 
        padding: 'max(0.5rem, var(--safe-area-top, 0px)) 1rem 0 1rem',
        zIndex: 200
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '900', letterSpacing: '-0.5px', margin: 0 }}>Admin Hub</h1>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700' }}>V2.0 PRO</div>
        </div>

        {/* Compact Stats - Only visible on dashboard */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div className="card-flat" style={{ textAlign: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
              <div style={{ fontSize: '1.1rem', color: 'var(--primary)', fontWeight: '900', lineHeight: 1 }}>{stats.totalSongs}</div>
              <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Songs</div>
            </div>
            <div className="card-flat" style={{ textAlign: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
              <div style={{ fontSize: '1.1rem', color: '#f59e0b', fontWeight: '900', lineHeight: 1 }}>{stats.storageUsed}</div>
              <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Storage</div>
            </div>
          </div>
        )}

        {/* Compact Tabs - Scrollable */}
        <div className="scroll-container no-scrollbar" style={{ paddingBottom: '0.5rem', marginBottom: 0, gap: '0.4rem' }}>
          {['dashboard', 'analytics', 'upload', 'manage', 'emotions', 'cookies'].map((tab) => (
            <button  
              key={tab}
              onClick={() => { setActiveTab(tab); setMessage(''); setError(''); }}
              className={`btn-3d ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                  minWidth: 'auto',
                  fontSize: '0.65rem',
                  height: '28px',
                  padding: '0 0.85rem',
                  borderRadius: '14px'
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '0.75rem 0.75rem 80px 0.75rem', 
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }} className="hide-scrollbar">

      {activeTab === 'dashboard' && (
        <div className="card-flat" style={{ padding: '0', borderRadius: '24px', overflow: 'hidden', height: '400px', display: 'flex', flexDirection: 'column' }}>
          {/* Compact Header */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', flexShrink: 0 }}>
            <h2 style={{ fontSize: '0.9rem', margin: 0, fontWeight: '900', letterSpacing: '0.5px' }}>RECENT ACTIVITY</h2>
          </div>
          
          {/* Scrollable List */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '0 0.85rem',
          }} className="hide-scrollbar">
            {songs.length === 0 ? (
              <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No uploads found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {songs.slice(0, 20).map(song => (
                  <div key={song.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.65rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <img 
                      src={song.cover_url || 'https://via.placeholder.com/34'} 
                      style={{ 
                        width: '34px', 
                        height: '34px', 
                        borderRadius: '10px', 
                        objectFit: 'cover', 
                        flexShrink: 0,
                        border: '1px solid rgba(255,255,255,0.05)'
                      }} 
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'white' }}>
                        {song.title}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                        {song.artist}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '700', opacity: 0.6 }}>
                      {new Date(song.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && <AdminAnalytics />}
      {activeTab === 'emotions' && <AdminEmotionManager />}

      {activeTab === 'upload' && (
        <div className="card-flat" style={{ padding: '1.25rem', borderRadius: '24px' }}>
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem' }}>
             <button 
                onClick={() => setUploadTab('youtube')} 
                className={`btn-3d ${uploadTab === 'youtube' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '0.8rem', height: '42px', borderRadius: '12px' }}
             >
                YouTube
             </button>
             <button 
                onClick={() => setUploadTab('file')} 
                className={`btn-3d ${uploadTab === 'file' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '0.8rem', height: '42px', borderRadius: '12px' }}
             >
                 Local File
             </button>
          </div>

          {message && <div style={{ background: 'rgba(88, 204, 2, 0.1)', color: 'var(--primary)', padding: '0.75rem', borderRadius: '14px', marginBottom: '1rem', fontSize: '0.75rem', fontWeight: '700', border: '1px solid rgba(88, 204, 2, 0.1)' }}>{message}</div>}
          {error && <div style={{ background: 'rgba(255, 64, 85, 0.1)', color: '#FF4055', padding: '0.75rem', borderRadius: '14px', marginBottom: '1rem', fontSize: '0.75rem', fontWeight: '700', border: '1px solid rgba(255, 64, 85, 0.1)' }}>{error}</div>}

          <form onSubmit={handleUpload}>
             {uploadTab === 'youtube' && (
                 <div className="mb-3">
                     <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <input className="input-flat" placeholder="Paste YouTube Link" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} style={{ flex: 1, height: '44px', fontSize: '0.85rem' }} />
                        <button 
                            type="button" 
                            onClick={(e) => { e.preventDefault(); fetchYoutubeMetadata(); }} 
                            className="btn-3d btn-primary" 
                            style={{ fontSize: '0.7rem', minWidth: '70px', height: '44px', borderRadius: '12px' }} 
                            disabled={loading}
                        >
                            {loading ? '...' : 'FETCH'}
                        </button>
                     </div>
                 </div>
             )}

             <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '1.25rem' }}>
                 {metadata.coverUrl && (
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid rgba(88, 204, 2, 0.3)', boxShadow: '0 4px 12px rgba(88, 204, 2, 0.2)' }}>
                       <img src={metadata.coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                 )}
                 <input className="input-flat" placeholder="Track Title" name="title" value={metadata.title} onChange={handleMetadataChange} style={{ height: '44px', fontSize: '0.85rem' }} />
                 <input className="input-flat" placeholder="Artist Name" name="artist" value={metadata.artist} onChange={handleMetadataChange} style={{ height: '44px', fontSize: '0.85rem' }} />
                 <select className="input-flat" name="emotion" value={metadata.emotion} onChange={handleMetadataChange} style={{ height: '44px', fontSize: '0.85rem' }}>
                    {EMOTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                 </select>
             </div>

             {uploadTab === 'file' && (
                 <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                     <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '800' }}>AUDIO (MP3)*</label>
                     <input id="audio-input" type="file" accept="audio/*" onChange={handleFileChange} className="input-flat mb-3" style={{ padding: '0.65rem', fontSize: '0.7rem' }} required={uploadTab === 'file'} />
                     <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '800' }}>COVER ART (OPTIONAL)</label>
                     <input id="cover-input" type="file" accept="image/*" onChange={handleCoverChange} className="input-flat" style={{ padding: '0.65rem', fontSize: '0.7rem' }} />
                 </div>
             )}

             <button type="submit" className="btn-3d btn-primary" style={{ width: '100%', height: '54px', fontSize: '0.95rem', fontWeight: '900', borderRadius: '18px' }} disabled={loading}>
                 {loading ? 'PROCESSING...' : (uploadTab === 'youtube' ? 'START IMPORT' : 'UPLOAD TRACK')}
             </button>
          </form>
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="card-flat" style={{ padding: '0', borderRadius: '24px', overflow: 'hidden', height: '480px', display: 'flex', flexDirection: 'column' }}>
          {/* Compact Header */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', flexShrink: 0 }}>
            <h2 style={{ fontSize: '0.9rem', margin: 0, fontWeight: '900', letterSpacing: '0.5px' }}>INVENTORY CONTROL</h2>
          </div>
          
          {/* Scrollable List */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '0 0.85rem',
          }} className="hide-scrollbar">
                    {songs.map(song => (
                        <div key={song.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', padding: '0.65rem 0.4rem' }}>
                            {editingId !== song.id ? (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                                 <div style={{ overflow: 'hidden', flex: 1 }}>
                                     <div style={{ fontSize: '0.85rem', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'white' }}>{song.title}</div>
                                     <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '1px' }}>
                                       {song.artist} • <span style={{ color: 'var(--primary)', fontWeight: '800' }}>{song.emotion || 'Unset'}</span>
                                     </div>
                                 </div>
                                 
                                 <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                    {deleteConfirm === song.id ? (
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                          <button onClick={() => confirmDelete(song.id)} className="btn-3d btn-danger" style={{ padding: '0 0.6rem', height: '28px', fontSize: '0.65rem', borderRadius: '8px' }}>DEL</button>
                                          <button onClick={() => setDeleteConfirm(null)} className="btn-3d btn-secondary" style={{ padding: '0 0.6rem', height: '28px', fontSize: '0.65rem', borderRadius: '8px' }}>X</button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                          <button onClick={() => startEditing(song)} className="btn-3d btn-secondary" style={{ padding: '0 0.75rem', height: '32px', fontSize: '0.7rem', fontWeight: '800', borderRadius: '10px' }}>EDIT</button>
                                          <button onClick={() => setDeleteConfirm(song.id)} style={{ background: 'rgba(255, 64, 85, 0.05)', border: 'none', width: '30px', height: '30px', borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑️</button>
                                        </div>
                                    )}
                                 </div>
                              </div>
                            ) : (
                              <div style={{ display: 'grid', gap: '0.6rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '18px', margin: '0.5rem 0', border: '1px solid rgba(88, 204, 2, 0.2)' }}>
                                 <input className="input-flat" name="title" value={editForm.title} onChange={handleEditChange} placeholder="Title" style={{ height: '40px', fontSize: '0.8rem' }} />
                                 <input className="input-flat" name="artist" value={editForm.artist} onChange={handleEditChange} placeholder="Artist" style={{ height: '40px', fontSize: '0.8rem' }} />
                                 <select className="input-flat" name="emotion" value={editForm.emotion} onChange={handleEditChange} style={{ height: '40px', fontSize: '0.8rem' }}>
                                     {EMOTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                                 </select>
                                 <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                    <button onClick={saveEdit} className="btn-3d btn-primary" style={{ flex: 1, height: '40px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '900' }}>SAVE CHANGES</button>
                                    <button onClick={cancelEditing} className="btn-3d btn-secondary" style={{ flex: 1, height: '40px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800' }}>CANCEL</button>
                                 </div>
                              </div>
                            )}
                        </div>
                    ))}
        )}

        {activeTab === 'cookies' && (
          <div className="card-flat" style={{ padding: '1.25rem', borderRadius: '24px' }}>
            <h2 style={{ fontSize: '0.9rem', marginBottom: '1rem', fontWeight: '900' }}>REFRESH YOUTUBE COOKIES</h2>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Paste Netscape formatted cookies here to bypass YouTube bot detection.
            </p>
            <textarea 
              className="input-flat" 
              placeholder="# Netscape HTTP Cookie File..." 
              value={cookieBox} 
              onChange={e => setCookieBox(e.target.value)}
              style={{ minHeight: '150px', fontSize: '0.7rem', fontFamily: 'monospace', marginBottom: '1.25rem', padding: '1rem' }}
            />
            <button 
              className="btn-3d btn-primary" 
              style={{ width: '100%', height: '48px', borderRadius: '14px' }}
              onClick={async () => {
                try {
                   setLoading(true);
                   await api.post('/admin/update-cookies', { cookies: cookieBox });
                   setMessage('Cookies updated successfully!');
                   setCookieBox('');
                } catch(e) {
                   setError('Failed to update cookies');
                } finally {
                   setLoading(false);
                }
              }}
              disabled={loading}
            >
              {loading ? 'SAVING...' : 'UPDATE SERVER COOKIES'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUpload;
