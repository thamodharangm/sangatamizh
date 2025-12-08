import { useState, useEffect } from 'react';
import axios from 'axios'; 

const AdminUpload = () => {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'upload', 'manage'
  const [uploadTab, setUploadTab] = useState('file'); // 'file' or 'youtube' inside Upload tab
  const [youtubeUrl, setYoutubeUrl] = useState('');
  
  // Data State
  const [songs, setSongs] = useState([]);
  const [stats, setStats] = useState({ totalSongs: 0, storageUsed: '0 MB' });

  // Form State
  const [file, setFile] = useState(null);
  const [cover, setCover] = useState(null);
  const [metadata, setMetadata] = useState({ title: '', artist: '', album: '', category: '', coverUrl: '' });
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Initial Data Fetch
  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const res = await axios.get('/api/songs');
      setSongs(res.data);
      setStats({
        totalSongs: res.data.length,
        storageUsed: `${(res.data.length * 3.5).toFixed(1)} MB` // Mock estimation
      });
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setDataLoading(false);
    }
  };

  // Handle YouTube Metadata Fetch
  const fetchYoutubeMetadata = async () => {
    if (!youtubeUrl) return;
    setLoading(true);
    try {
      const res = await axios.post('/api/yt-metadata', { url: youtubeUrl });
      const { title, artist, coverUrl } = res.data;
      setMetadata(prev => ({ ...prev, title, artist, coverUrl }));
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
         // Backend Process (YouTube)
         await axios.post('/api/upload-from-yt', {
           url: youtubeUrl,
           category: metadata.category,
           customMetadata: metadata
         });
         setMessage('YouTube Import Successful!');
         setYoutubeUrl('');
      } else {
         // Backend Process (File Upload)
        if (!file) throw new Error("Please select an audio file.");

        const formData = new FormData();
        formData.append('audio', file);
        if (cover) {
          formData.append('cover', cover);
        }
        formData.append('title', metadata.title || file.name.replace(/\.[^/.]+$/, ""));
        formData.append('artist', metadata.artist || 'Unknown Artist');
        formData.append('album', metadata.album || 'Single');
        formData.append('category', metadata.category || 'General');

        await axios.post('/api/upload-file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        setMessage('File Upload Successful!');
        setFile(null);
        setCover(null);
        document.getElementById('audio-input').value = "";
        if(document.getElementById('cover-input')) document.getElementById('cover-input').value = "";
      }
      
      setMetadata({ title: '', artist: '', album: '', category: '', coverUrl: '' });
      fetchSongs(); // Refresh stats

    } catch (err) {
      console.error("Upload Error:", err);
      setError('Upload Failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async (id) => {
    try {
      await axios.delete(`/api/songs/${id}`);
      fetchSongs();
      setStats(prev => ({ ...prev, totalSongs: prev.totalSongs - 1 }));
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
    <div style={{ padding: '2rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem' }}>
        <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your music library and content.</p>
      </header>
      
      {/* Main Stats (Visible on Dashboard) */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          <div className="card-flat" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>{stats.totalSongs}</h3>
            <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', fontSize: '0.8rem' }}>Total Songs</p>
          </div>
          <div className="card-flat" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '3rem', color: '#10b981', marginBottom: '0.5rem' }}>Active</h3>
            <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', fontSize: '0.8rem' }}>System Status</p>
          </div>
          <div className="card-flat" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '3rem', color: '#f59e0b', marginBottom: '0.5rem' }}>{stats.storageUsed}</h3>
            <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', fontSize: '0.8rem' }}>Est. Storage</p>
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {['dashboard', 'upload', 'manage'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`btn-3d ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
            style={{ textTransform: 'capitalize' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* DASHBOARD TAB CONTENT */}
      {activeTab === 'dashboard' && (
        <div className="card-flat" style={{ padding: '2rem' }}>
          <h2 style={{ color: 'white', marginBottom: '1rem' }}>Recent Activity</h2>
          {dataLoading ? <p>Loading...</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {songs.slice(0, 5).map(song => (
                <li key={song.id || song._id} style={{ padding: '1rem 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden' }}>
                      <img src={song.cover_url || song.coverArt || 'https://via.placeholder.com/40'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="art" />
                    </div>
                    <div>
                      <h4 style={{ color: 'white', margin: 0 }}>{song.title}</h4>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{song.artist}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(song.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* UPLOAD TAB CONTENT */}
      {activeTab === 'upload' && (
        <div className="card-flat" style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
           <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <button 
              onClick={() => setUploadTab('file')}
              style={{ background: 'none', border: 'none', color: uploadTab === 'file' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              File Upload
            </button>
            <button 
              onClick={() => setUploadTab('youtube')}
              style={{ background: 'none', border: 'none', color: uploadTab === 'youtube' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              YouTube Import
            </button>
          </div>

          {message && <div style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.5)', color: '#86efac', padding: '0.5rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: 'bold', fontSize: '0.9rem' }}>{message}</div>}
          {error && <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#fca5a5', padding: '0.5rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: 'bold', fontSize: '0.9rem' }}>{error}</div>}

          <form onSubmit={handleUpload}>
            {uploadTab === 'youtube' && (
              <div style={{ marginBottom: '1.5rem' }}>
                 <h4 style={{ color: 'var(--text-main)', marginBottom: '0.5rem', margin: 0 }}>YouTube Link</h4>
                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                   <input 
                     className="input-flat" 
                     type="text" 
                     placeholder="Paste YouTube URL here..." 
                     value={youtubeUrl}
                     onChange={(e) => setYoutubeUrl(e.target.value)}
                     style={{ flex: 1 }}
                   />
                   <button 
                     type="button" 
                     onClick={(e) => { e.preventDefault(); fetchYoutubeMetadata(); }} 
                     className="btn-3d btn-secondary" 
                     disabled={loading || !youtubeUrl} 
                     style={{ width: '120px', fontSize: '0.8rem', height: '42px', marginTop: '0' }}
                   >
                     Auto-Fill
                   </button>
                 </div>
              </div>
            )}

            {/* Show Cover Preview if Any */}
            {metadata.coverUrl && (
               <div style={{ marginBottom: '1rem', width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <img src={metadata.coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               </div>
            )}

            {uploadTab === 'file' && (
               <div style={{ marginBottom: '1.5rem', display: 'grid', gap: '0.8rem' }}>
                 <h4 style={{ color: 'var(--text-main)', margin: 0 }}>Song Details</h4>
                 <input className="input-flat" type="text" name="title" placeholder="Song Title" value={metadata.title} onChange={handleMetadataChange} />
                 <input className="input-flat" type="text" name="artist" placeholder="Artist Name" value={metadata.artist} onChange={handleMetadataChange} />
                 <input className="input-flat" type="text" name="album" placeholder="Album Name" value={metadata.album} onChange={handleMetadataChange} />
                 <select className="input-flat" name="category" value={metadata.category} onChange={handleMetadataChange} style={{ cursor: 'pointer' }}>
                   <option value="">Select Category</option>
                   <option value="Tamil">Tamil</option>
                   <option value="Malayalam">Malayalam</option>
                   <option value="English">English</option>
                   <option value="Telugu">Telugu</option>
                   <option value="Hindi">Hindi</option>
                 </select>
               </div>
            )}

            {uploadTab === 'youtube' && (
               <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Category</label>
                  <select className="input-flat" name="category" value={metadata.category} onChange={handleMetadataChange} style={{ cursor: 'pointer' }}>
                   <option value="">Select Category</option>
                   <option value="Tamil">Tamil</option>
                   <option value="Malayalam">Malayalam</option>
                   <option value="English">English</option>
                   <option value="Telugu">Telugu</option>
                   <option value="Hindi">Hindi</option>
                 </select>
               </div>
            )}

            {uploadTab === 'file' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ color: 'var(--text-main)', marginBottom: '0.5rem', margin: 0 }}>Files</h4>
                <div style={{ marginBottom: '0.8rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Audio File (MP3)*</label>
                  <input id="audio-input" type="file" accept="audio/*" onChange={handleFileChange} className="input-flat" style={{ padding: '0.4rem', height: 'auto', fontSize: '0.9rem' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cover Art (Image)</label>
                  <input id="cover-input" type="file" accept="image/*" onChange={handleCoverChange} className="input-flat" style={{ padding: '0.4rem', height: 'auto', fontSize: '0.9rem' }} />
                </div>
              </div>
            )}

            <button className="btn-3d btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Processing...' : (uploadTab === 'youtube' ? 'Import from YouTube' : 'Upload Song')}
            </button>
          </form>
        </div>
      )}


      {/* MANAGE TAB CONTENT */}
      {activeTab === 'manage' && (
        <div className="card-flat" style={{ padding: '0' }}>
           {(message || error) && (
             <div style={{ padding: '1rem' }}>
               {message && <div style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.5)', color: '#86efac', padding: '0.5rem', borderRadius: '8px', marginBottom: '0.5rem' }}>{message}</div>}
               {error && <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#fca5a5', padding: '0.5rem', borderRadius: '8px', marginBottom: '0.5rem' }}>{error}</div>}
             </div>
           )}
           <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
             <thead style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-muted)' }}>
               <tr>
                 <th style={{ padding: '1rem' }}>Track</th>
                 <th style={{ padding: '1rem' }}>Artist</th>
                 <th style={{ padding: '1rem' }}>Category</th>
                 <th style={{ padding: '1rem' }}>Date</th>
                 <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
               </tr>
             </thead>
             <tbody>
               {songs.map((song, i) => (
                 <tr key={song.id || i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                   <td style={{ padding: '1rem', color: 'white' }}>{song.title}</td>
                   <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{song.artist}</td>
                   <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{song.category}</td>
                   <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{new Date(song.created_at).toLocaleDateString()}</td>
                   <td style={{ padding: '1rem', textAlign: 'right' }}>
                     {deleteConfirm === song.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                           <button 
                             onClick={() => confirmDelete(song.id)}
                             style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                           >
                             Confirm
                           </button>
                           <button 
                             onClick={() => setDeleteConfirm(null)}
                             style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                           >
                             Cancel
                           </button>
                        </div>
                     ) : (
                       <button 
                         onClick={() => handleDelete(song.id)}
                         style={{ 
                           background: 'rgba(239, 68, 68, 0.1)', 
                           color: '#ef4444', 
                           border: '1px solid rgba(239, 68, 68, 0.3)', 
                           padding: '0.5rem 1rem', 
                           borderRadius: '8px', 
                           cursor: 'pointer',
                           fontWeight: 'bold' 
                         }}
                         title="Delete Song"
                       >
                         🗑️
                       </button>
                     )}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}
    </div>
  );
};
export default AdminUpload;
