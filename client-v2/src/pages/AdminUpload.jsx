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
    <div className="admin-page" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: 0 }}>
      {/* Compact Header Section */}
      <div style={{ flexShrink: 0, background: 'var(--bg-main)', borderBottom: '2px solid rgba(255,255,255,0.05)', padding: '1rem 1rem 0 1rem' }}>
        <h1 className="mb-3" style={{ fontSize: '1.75rem', fontWeight: '900', letterSpacing: '-1px', margin: '0 0 1rem 0' }}>Admin Hub</h1>

        {/* Compact Stats - Only visible on dashboard */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
            <div className="card-flat" style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(50, 215, 75, 0.1)' }}>
              <div style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: '900', lineHeight: 1 }}>{stats.totalSongs}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginTop: '0.25rem' }}>Songs</div>
            </div>
            <div className="card-flat" style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: '1.5rem', color: '#f59e0b', fontWeight: '900', lineHeight: 1 }}>{stats.storageUsed}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginTop: '0.25rem' }}>Storage</div>
            </div>
          </div>
        )}

        {/* Compact Tabs */}
        <div className="scroll-container no-scrollbar" style={{ paddingBottom: '0.75rem', marginBottom: 0 }}>
          {['dashboard', 'analytics', 'upload', 'manage', 'emotions'].map((tab) => (
            <button  
              key={tab}
              onClick={() => { setActiveTab(tab); setMessage(''); setError(''); }}
              className={`btn-3d ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                  minWidth: 'auto',
                  fontSize: '0.75rem',
                  marginRight: '0.5rem',
                  height: '36px',
                  padding: '0 1rem',
                  borderRadius: '18px'
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
        padding: '1.5rem 1rem 120px 1rem',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }} className="hide-scrollbar">

      {activeTab === 'dashboard' && (
        <div className="card-flat" style={{ padding: '0', borderRadius: '20px', overflow: 'hidden', height: '380px', display: 'flex', flexDirection: 'column' }}>
          {/* Compact Header */}
          <div style={{ padding: '1rem 1.25rem 0.75rem 1.25rem', borderBottom: '2px solid rgba(255,255,255,0.05)', background: 'var(--bg-card)', flexShrink: 0 }}>
            <h2 style={{ fontSize: '1rem', margin: 0, fontWeight: '800' }}>Recent Uploads</h2>
          </div>
          
          {/* Scrollable List */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '0 1.25rem',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }} className="hide-scrollbar">
            {songs.length === 0 ? (
              <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No songs yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {songs.slice(0, 15).map(song => (
                  <div key={song.id} style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <img 
                      src={song.cover_url || 'https://via.placeholder.com/42'} 
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
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>
                        {song.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {song.artist}
                      </div>
                    </div>
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

      {activeTab === 'analytics' && <AdminAnalytics />}
      {activeTab === 'emotions' && <AdminEmotionManager />}

      {activeTab === 'upload' && (
        <div className="card-flat" style={{ padding: '1.5rem', borderRadius: '24px' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
             <button 
                onClick={() => setUploadTab('youtube')} 
                className={`btn-3d ${uploadTab === 'youtube' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '0.85rem', height: '44px', borderRadius: '14px' }}
             >
                YouTube
             </button>
             <button 
                onClick={() => setUploadTab('file')} 
                className={`btn-3d ${uploadTab === 'file' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '0.85rem', height: '44px', borderRadius: '14px' }}
             >
                 File
             </button>
          </div>

          {message && <div style={{ background: 'rgba(50, 215, 75, 0.1)', color: '#32D74B', padding: '1rem', borderRadius: '14px', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: '600' }}>{message}</div>}
          {error && <div style={{ background: 'rgba(255, 64, 85, 0.1)', color: '#FF4055', padding: '1rem', borderRadius: '14px', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: '600' }}>{error}</div>}

          <form onSubmit={handleUpload}>
             {uploadTab === 'youtube' && (
                 <div className="mb-3">
                     <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input className="input-flat" placeholder="YouTube Link" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} style={{ flex: 1 }} />
                        <button 
                            type="button" 
                            onClick={(e) => { e.preventDefault(); fetchYoutubeMetadata(); }} 
                            className="btn-3d btn-primary" 
                            style={{ fontSize: '0.8rem', minWidth: '80px', height: '44px' }} 
                            disabled={loading}
                        >
                            {loading ? '...' : 'Fetch'}
                        </button>
                     </div>
                 </div>
             )}

             {metadata.coverUrl && (
                <div style={{ marginBottom: '1rem', width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                   <img src={metadata.coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
             )}

             <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
                 <input className="input-flat" placeholder="Song Title" name="title" value={metadata.title} onChange={handleMetadataChange} />
                 <input className="input-flat" placeholder="Artist" name="artist" value={metadata.artist} onChange={handleMetadataChange} />
                 <select className="input-flat" name="emotion" value={metadata.emotion} onChange={handleMetadataChange}>
                    {EMOTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                 </select>
             </div>

             {uploadTab === 'file' && (
                 <div style={{ marginBottom: '1.5rem' }}>
                     <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Audio File (MP3)*</label>
                     <input id="audio-input" type="file" accept="audio/*" onChange={handleFileChange} className="input-flat mb-2" style={{ padding: '0.75rem' }} required={uploadTab === 'file'} />
                     <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Cover Art</label>
                     <input id="cover-input" type="file" accept="image/*" onChange={handleCoverChange} className="input-flat" style={{ padding: '0.75rem' }} />
                 </div>
             )}

             <button type="submit" className="btn-3d btn-primary" style={{ width: '100%', height: '52px', fontSize: '1rem' }} disabled={loading}>
                 {loading ? 'Processing...' : (uploadTab === 'youtube' ? 'Start Import' : 'Upload Song')}
             </button>
          </form>
        </div>
      )}

      {activeTab === 'manage' && (
          <div className="card-flat" style={{ padding: '1.5rem', borderRadius: '24px' }}>
               <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: '800' }}>Manage Library</h2>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                   {songs.slice(0, 10).map(song => (
                       <div key={song.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.25rem' }}>
                           {editingId !== song.id ? (
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ overflow: 'hidden', flex: 1 }}>
                                    <div style={{ fontSize: '1rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                      {song.artist} • <span style={{ color: 'var(--primary)' }}>{song.emotion || 'Neutral'}</span>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                   {deleteConfirm === song.id ? (
                                       <>
                                         <button onClick={() => confirmDelete(song.id)} className="btn-3d btn-danger" style={{ padding: '0 0.75rem', height: '36px', fontSize: '0.8rem' }}>Del</button>
                                         <button onClick={() => setDeleteConfirm(null)} className="btn-3d btn-secondary" style={{ padding: '0 0.75rem', height: '36px', fontSize: '0.8rem' }}>No</button>
                                       </>
                                   ) : (
                                       <>
                                         <button onClick={() => startEditing(song)} className="btn-3d btn-secondary" style={{ padding: '0 1rem', height: '38px', fontSize: '0.85rem', borderRadius: '12px' }}>Edit</button>
                                         <button onClick={() => setDeleteConfirm(song.id)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', padding: '0 0.25rem' }}>🗑️</button>
                                       </>
                                   )}
                                </div>
                             </div>
                           ) : (
                             <div style={{ display: 'grid', gap: '0.6rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <input className="input-flat" name="title" value={editForm.title} onChange={handleEditChange} placeholder="Title" />
                                <input className="input-flat" name="artist" value={editForm.artist} onChange={handleEditChange} placeholder="Artist" />
                                <select className="input-flat" name="emotion" value={editForm.emotion} onChange={handleEditChange}>
                                    {EMOTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                                </select>
                                <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.2rem' }}>
                                   <button onClick={saveEdit} className="btn-3d btn-primary" style={{ flex: 1, height: '42px', borderRadius: '12px' }}>Save</button>
                                   <button onClick={cancelEditing} className="btn-3d btn-secondary" style={{ flex: 1, height: '42px', borderRadius: '12px' }}>Cancel</button>
                                </div>
                             </div>
                           )}
                       </div>
                   ))}
               </div>
           </div>
       )}
      </div>
    </div>
  );
};

export default AdminUpload;
