import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Upload, Settings, Music, Users, ShieldCheck, 
  PlayCircle, Clock, Trash2, CheckCircle2, AlertCircle, Activity,
  ArrowUpRight, TrendingUp, Flame, PieChart, Zap, Globe, Server, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3002/api';
const HEALTH_URL = API_URL.replace('/api', '/health');

const Admin = () => {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('st-admin-tab') || 'dashboard');

  useEffect(() => {
    localStorage.setItem('st-admin-tab', activeTab);
  }, [activeTab]);

  const [stats, setStats] = useState([
    { label: 'Total Songs', value: '...', icon: Music, color: 'var(--color-green)' },
    { label: 'Total Plays', value: '...', icon: PlayCircle, color: 'var(--color-blue)' },
    { label: 'Active Users', value: '...', icon: Users, color: 'var(--color-yellow)' },
  ]);
  const [analytics, setAnalytics] = useState(null);
  
  // Upload State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadArtist, setUploadArtist] = useState('');
  const [uploadEmotion, setUploadEmotion] = useState('vibe');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadCoverUrl, setUploadCoverUrl] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file' or 'link'
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  
  // Library State
  const [managementSongs, setManagementSongs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Server Health State
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking', 'online', 'offline'
  const [lastPing, setLastPing] = useState(null);

  const EMOTIONS = [
    { id: 'love', label: 'Love', icon: '❤️', color: '#FF4B4B' },
    { id: 'sad', label: 'Sad', icon: '🥺', color: '#1CB0F6' },
    { id: 'motivate', label: 'Motivate', icon: '💪', color: '#58CC02' },
    { id: 'vibe', label: 'Vibe', icon: '✨', color: '#FFC800' },
    { id: 'neutral', label: 'Feel Good', icon: '😊', color: '#10B981' },
  ];

  const checkServerHealth = async () => {
    try {
      const start = Date.now();
      const res = await fetch(HEALTH_URL);
      const end = Date.now();
      if (res.ok) {
        setServerStatus('online');
        setLastPing(end - start);
      } else {
        setServerStatus('offline');
      }
    } catch (e) {
      console.error("Health check failed:", e);
      setServerStatus('offline');
    }
  };

  useEffect(() => {
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  const handleUpdateEmotion = (id, newEmotion) => {
    fetch(`${API_URL}/songs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emotion: newEmotion })
    })
    .then(res => res.json())
    .then(() => {
      setManagementSongs(prev => prev.map(s => s.id === id ? { ...s, emotion: newEmotion } : s));
    })
    .catch(err => console.error("Update failed:", err));
  };

  useEffect(() => {
    const fetchStats = async () => {
      if (serverStatus === 'offline') return;
      try {
        const res = await fetch(`${API_URL}/analytics/stats`);
        const data = await res.json();
        setAnalytics(data);
        setStats([
          { label: 'Total Songs', value: data.totalSongs || '0', icon: Music, color: 'var(--color-green)' },
          { label: 'Total Plays', value: data.totalPlays || '0', icon: PlayCircle, color: 'var(--color-blue)' },
          { label: 'Active Users', value: data.activeUsers || '0', icon: Users, color: 'var(--color-yellow)' },
        ]);
      } catch (err) {
        console.error("Stats fetch failed:", err);
      }
    };

    fetchStats();
    
    fetch(`${API_URL}/songs`)
      .then(res => res.json())
      .then(data => setManagementSongs(data))
      .catch(err => console.error("Management fetch failed:", err));
  }, [serverStatus]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vibe?")) return;
    try {
      const res = await fetch(`${API_URL}/songs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setManagementSongs(prev => prev.filter(s => s.id !== id));
      }
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  const handleUpload = async () => {
    if (!uploadTitle && uploadMethod === 'link' && (uploadUrl.includes('youtube.com') || uploadUrl.includes('youtu.be'))) {
      setUploading(true);
      setUploadStatus({ type: 'info', msg: 'Fetching metadata first...' });
      try {
        const res = await fetch(`${API_URL}/yt-metadata`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: uploadUrl })
        });
        const data = await res.json();
        if (data.title) {
          setUploadTitle(data.title);
          setUploadArtist(data.movie || '');
          setUploadCoverUrl(data.coverUrl);
          processUpload(data.title, data.movie || '', data.coverUrl);
          return;
        }
      } catch (e) {
        setUploadStatus({ type: 'error', msg: 'Failed to auto-fetch title. Please enter manually.' });
        setUploading(false);
        return;
      }
    }

    if (!uploadTitle) {
      setUploadStatus({ type: 'error', msg: 'Title is required!' });
      return;
    }

    processUpload(uploadTitle, uploadArtist, uploadCoverUrl);
  };

  const processUpload = async (title, artist, coverUrl) => {
    if (uploadMethod === 'file' && !audioFile) {
        setUploadStatus({ type: 'error', msg: 'Audio file is required for File Upload mode!' });
        setUploading(false);
        return;
    }

    if (uploadMethod === 'link' && !uploadUrl) {
        setUploadStatus({ type: 'error', msg: 'Audio URL is required for Link mode!' });
        setUploading(false);
        return;
    }

    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('artist', artist || 'Unknown Artist');
    formData.append('emotion', uploadEmotion);

    if (uploadMethod === 'file') {
        formData.append('audio', audioFile);
    } else {
        formData.append('audioUrl', uploadUrl);
        if (coverUrl) formData.append('coverUrl', coverUrl);
    }

    try {
      const res = await fetch(`${API_URL}/upload-file`, { method: 'POST', body: formData });
      const result = await res.json();
      if (res.ok) {
        setUploadStatus({ type: 'success', msg: 'Vibe uploaded successfully! 🚀' });
        setUploadTitle('');
        setUploadArtist('');
        setAudioFile(null);
        setUploadUrl('');
        setUploadCoverUrl('');
        // Refresh library
        const updatedSongs = await fetch(`${API_URL}/songs`).then(r => r.json());
        setManagementSongs(updatedSongs);
      } else {
        setUploadStatus({ type: 'error', msg: result.error || 'Upload failed' });
      }
    } catch (e) {
      setUploadStatus({ type: 'error', msg: 'Network error during upload' });
    } finally {
      setUploading(false);
    }
  };

  const handleUrlBlur = async () => {
    if (!uploadUrl) return;
    if (!uploadUrl.includes('youtube.com') && !uploadUrl.includes('youtu.be')) return;

    setMetadataLoading(true);
    try {
      const res = await fetch(`${API_URL}/yt-metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: uploadUrl })
      });
      const data = await res.json();
      
      if (data.title) {
        setUploadTitle(data.title);
        setUploadArtist(data.movie || '');
        setUploadCoverUrl(data.coverUrl);
        if (data.suggestedEmotion) {
          const emotionMap = {
            'Love': 'love', 'Sad': 'sad', 'Motivate': 'motivate', 'Vibe': 'vibe', 'Feel Good': 'neutral'
          };
          setUploadEmotion(emotionMap[data.suggestedEmotion] || 'vibe');
        }
      }
    } catch (e) {
      console.error("Metadata fetch failed", e);
    } finally {
      setMetadataLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px' }}>Admin Nexus</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 700 }}>Control Panel & Analytics</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
          <div className="glass-card" style={{ padding: '6px 14px', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '8px', border: serverStatus === 'online' ? '1px solid rgba(88, 204, 2, 0.4)' : '1px solid rgba(255, 75, 75, 0.4)', background: 'var(--bg-card)' }}>
             <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: serverStatus === 'online' ? 'var(--color-green)' : 'var(--color-pink)', boxShadow: serverStatus === 'online' ? '0 0 10px var(--color-green)' : 'none' }}></div>
             <span style={{ fontSize: '0.75rem', fontWeight: 900, color: serverStatus === 'online' ? 'var(--color-green)' : 'var(--color-pink)' }}>
               {serverStatus === 'online' ? 'SYSTEM ONLINE' : 'DISCONNECTED'}
             </span>
          </div>
          {serverStatus === 'online' && lastPing && (
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>Latency: {lastPing}ms</span>
          )}
        </div>
      </header>

      {/* Connection Error Banner */}
      {serverStatus === 'offline' && (
        <div style={{ padding: '1rem', background: 'rgba(255, 75, 75, 0.1)', border: '1px solid rgba(255, 75, 75, 0.2)', borderRadius: '12px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
           <AlertCircle size={20} color="var(--color-pink)" />
           <div>
             <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--color-pink)' }}>Connection Lost</h4>
             <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Unable to reach backend. Please ensure the server is running on port 3002.</p>
           </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '10px', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-light)' }}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'analytics', label: 'Deep Analytics', icon: PieChart },
          { id: 'upload', label: 'Upload Vibe', icon: Upload },
          { id: 'management', label: 'Library', icon: Settings },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '12px',
              border: 'none', background: activeTab === tab.id ? 'var(--color-blue)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
              fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ minHeight: '400px' }}>
        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {/* KPI Cards */}
            <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
              {stats.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="card-tactile glass-shine" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '1.5rem', border: '1px solid var(--border-light)' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
                    <Icon size={30} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</p>
                    <h3 style={{ fontSize: '2rem', fontWeight: 950, lineHeight: 1 }}>{value}</h3>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
              {/* Activity Chart */}
              <div className="card-tactile" style={{ padding: '2rem', background: 'var(--bg-main)', border: '2px dashed var(--border-light)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Activity size={18} color="var(--color-blue)" />
                      Activity Pulse
                    </h4>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-light)' }}>LAST 7 DAYS</span>
                 </div>
                 
                 <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '10px' }}>
                    {analytics?.chartData?.map((d, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                         <motion.div 
                           initial={{ height: 0 }}
                           animate={{ height: `${Math.max(10, Math.min(100, (d.logins / 10) * 100))}%` }}
                           transition={{ duration: 0.5, delay: i * 0.1 }}
                           style={{ width: '100%', background: i === 6 ? 'var(--color-green)' : 'var(--color-blue)', borderRadius: '6px', minHeight: '4px', opacity: 0.8 }}
                         />
                         <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>{d.date.split('-')[2]}</span>
                      </div>
                    )) || <p style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)' }}>Loading analytics...</p>}
                 </div>
              </div>

              {/* System Health */}
              <div className="card-tactile" style={{ padding: '2rem' }}>
                 <h4 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Server size={18} color="var(--color-yellow)" />
                    System Metrics
                 </h4>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '10px', height: '10px', background: 'var(--color-green)', borderRadius: '2px' }}></div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>Database</span>
                       </div>
                       <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--color-green)' }}>OPERATIONAL</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '10px', height: '10px', background: 'var(--color-green)', borderRadius: '2px' }}></div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>Storage (Local/Cloud)</span>
                       </div>
                       <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--color-green)' }}>READY</span>
                    </div>

                    <div style={{ height: '1px', background: 'var(--border-light)', margin: '0.5rem 0' }}></div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                       <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-light)' }}>
                          <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>LATENCY</p>
                          <p style={{ fontSize: '1.1rem', fontWeight: 950, color: 'var(--text-main)' }}>{lastPing || '-'} ms</p>
                       </div>
                       <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-light)' }}>
                          <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>STATUS</p>
                          <p style={{ fontSize: '1.1rem', fontWeight: 950, color: serverStatus === 'online' ? 'var(--color-green)' : 'var(--color-pink)' }}>
                             {serverStatus === 'online' ? 'GOOD' : 'ERROR'}
                          </p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
             {/* Top Songs */}
             <div className="card-tactile" style={{ padding: '1.5rem', background: 'var(--bg-main)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 900, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <TrendingUp size={18} color="var(--color-blue)" />
                   MOST PLAYED TRACKS
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   {analytics?.topPlayed?.map((song, i) => (
                      <div key={song.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: i < 4 ? '1px solid var(--border-light)' : 'none' }}>
                         <span style={{ fontSize: '1.2rem', fontWeight: 950, color: i === 0 ? 'var(--color-yellow)' : 'var(--border-light)', width: '24px' }}>#{i+1}</span>
                         <img src={song.cover || song.cover_url} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} alt="" />
                         <div style={{ flex: 1 }}>
                            <p className="truncate" style={{ fontSize: '0.85rem', fontWeight: 800 }}>{song.title}</p>
                            <div style={{ width: '100%', height: '4px', background: 'var(--border-light)', borderRadius: '2px', marginTop: '6px' }}>
                               <div style={{ width: `${Math.min(100, (song.count / (analytics.totalPlays || 1)) * 100 * 3)}%`, height: '100%', background: 'var(--color-blue)', borderRadius: '2px' }}></div>
                            </div>
                         </div>
                         <span style={{ fontSize: '0.8rem', fontWeight: 900 }}>{song.count}</span>
                      </div>
                   ))}
                </div>
             </div>

             {/* Top Likes */}
             <div className="card-tactile" style={{ padding: '1.5rem', background: 'var(--bg-main)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 900, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <Flame size={18} color="var(--color-pink)" />
                   MOST LOVED
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   {analytics?.topLiked?.map((song, i) => (
                      <div key={song.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: i < 4 ? '1px solid var(--border-light)' : 'none' }}>
                         <span style={{ fontSize: '1.2rem', fontWeight: 950, color: 'var(--border-light)', width: '24px' }}>#{i+1}</span>
                         <div style={{ flex: 1 }}>
                            <p className="truncate" style={{ fontSize: '0.85rem', fontWeight: 800 }}>{song.title}</p>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-pink)', fontWeight: 900 }}>
                            <Flame size={14} fill="var(--color-pink)" />
                            {song.count}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </motion.div>
        )}
        
        {/* UPLOAD TAB */}
        {activeTab === 'upload' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '600px', margin: '0 auto' }}>
             {/* Upload Method Toggles */}
             <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
                <button onClick={() => setUploadMethod('file')} className={`btn-tactile ${uploadMethod === 'file' ? 'btn-blue' : 'btn-secondary'}`} style={{ padding: '0 1.5rem', height: '40px' }}><Upload size={18} style={{ marginRight: '8px' }} /> File Upload</button>
                <button onClick={() => setUploadMethod('link')} className={`btn-tactile ${uploadMethod === 'link' ? 'btn-blue' : 'btn-secondary'}`} style={{ padding: '0 1.5rem', height: '40px' }}><Globe size={18} style={{ marginRight: '8px' }} /> External Link</button>
             </div>

             <div className="card-tactile" style={{ padding: '2rem' }}>
               {uploadMethod === 'file' ? (
                  <div onClick={() => document.getElementById('audio-input').click()} style={{ border: '3px dashed var(--border-light)', borderRadius: '20px', padding: '3rem 1rem', textAlign: 'center', marginBottom: '1.5rem', cursor: 'pointer', background: audioFile ? 'rgba(88, 204, 2, 0.05)' : 'transparent', transition: 'all 0.3s var(--smooth)' }} className="glass-shine">
                     <input id="audio-input" type="file" hidden accept="audio/*" onChange={(e) => setAudioFile(e.target.files[0])} />
                     <Upload size={48} color="var(--color-blue)" style={{ marginBottom: '1rem' }} />
                     <h4 style={{ fontWeight: 900, fontSize: '1rem' }}>{audioFile ? audioFile.name : 'Click to Select Audio'}</h4>
                  </div>
               ) : (
                  <div style={{ marginBottom: '1.5rem' }}>
                     <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, marginBottom: '6px', color: 'var(--text-muted)' }}>SOURCE URL</label>
                     <input type="text" placeholder="Paste YouTube link here..." value={uploadUrl} onChange={(e) => setUploadUrl(e.target.value)} onBlur={handleUrlBlur} className="auth-input" style={{ width: '100%', height: '45px', padding: '0 1rem', borderRadius: '10px', border: '2px solid var(--border-light)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                     {metadataLoading && <p style={{ fontSize: '0.7rem', color: 'var(--color-blue)', marginTop: '5px' }}>✨ Fetching magic metadata...</p>}
                  </div>
               )}

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, marginBottom: '6px', color: 'var(--text-muted)' }}>TITLE</label>
                    <input type="text" placeholder="Track Title" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} className="auth-input" style={{ width: '100%', height: '45px', padding: '0 1rem', borderRadius: '10px', border: '2px solid var(--border-light)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                  </div>
                   <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, marginBottom: '6px', color: 'var(--text-muted)' }}>ARTIST / MOVIE</label>
                    <input type="text" placeholder="Artist Name" value={uploadArtist} onChange={(e) => setUploadArtist(e.target.value)} className="auth-input" style={{ width: '100%', height: '45px', padding: '0 1rem', borderRadius: '10px', border: '2px solid var(--border-light)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                  </div>
               </div>

               <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, marginBottom: '6px', color: 'var(--text-muted)' }}>EMOTIONAL VIBE</label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                     {EMOTIONS.map(e => (
                        <div key={e.id} onClick={() => setUploadEmotion(e.id)} style={{ padding: '8px 16px', borderRadius: '20px', background: uploadEmotion === e.id ? e.color : 'var(--bg-main)', border: '2px solid', borderColor: uploadEmotion === e.id ? e.color : 'var(--border-light)', color: uploadEmotion === e.id ? 'white' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                           <span>{e.icon}</span> <span>{e.label}</span>
                        </div>
                     ))}
                  </div>
               </div>

               <button className={`btn-tactile ${uploading ? 'btn-secondary' : 'btn-blue'}`} style={{ width: '100%', height: '50px', fontSize: '1rem' }} onClick={handleUpload} disabled={uploading}>
                  {uploading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div className="pulse-node"></div> INITIALIZING UPLOAD...</span>
                  ) : 'PUBLISH VIBE'}
               </button>

                {uploadStatus && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '1rem', padding: '0.85rem', borderRadius: '12px', background: uploadStatus.type === 'success' ? 'rgba(88, 204, 2, 0.1)' : 'rgba(255, 75, 75, 0.1)', color: uploadStatus.type === 'success' ? 'var(--color-green)' : 'var(--color-pink)', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                     {uploadStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                     {uploadStatus.msg}
                  </motion.div>
                )}
             </div>
          </motion.div>
        )}

        {/* LIBRARY MANAGEMENT TAB */}
        {activeTab === 'management' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 900, fontSize: '1.2rem' }}>Library Management</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {managementSongs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                   <Music size={40} style={{ opacity: 0.2, marginBottom: '10px' }} />
                   <p style={{ fontWeight: 800 }}>No songs found in core database.</p>
                </div>
              ) : (
                <>
                  {managementSongs
                    .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                    .map(song => (
                    <div key={song.id} className="card-tactile glass-shine" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '12px 20px', boxShadow: 'none' }}>
                      <img src={song.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745'} style={{ width: '42px', height: '42px', borderRadius: '10px' }} alt="Thumb" />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <h4 className="truncate" style={{ fontSize: '0.95rem', fontWeight: 900 }}>{song.title}</h4>
                         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                           {EMOTIONS.map(e => (
                             <button key={e.id} onClick={() => handleUpdateEmotion(song.id, e.id)} className="hover-lift" style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.65rem', border: '2px solid', borderColor: (song.emotion || 'vibe') === e.id ? e.color : 'var(--border-light)', background: (song.emotion || 'vibe') === e.id ? `${e.color}15` : 'transparent', color: (song.emotion || 'vibe') === e.id ? e.color : 'var(--text-muted)', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s ease', opacity: (song.emotion || 'vibe') === e.id ? 1 : 0.6 }}>
                               <span>{e.icon}</span>
                               <span style={{ textTransform: 'uppercase' }}>{e.label}</span>
                             </button>
                           ))}
                         </div>
                      </div>
                      <button onClick={() => handleDelete(song.id)} className="btn-tactile btn-secondary" style={{ width: '38px', height: '38px', padding: 0 }} title="Delete from Server">
                        <Trash2 size={18} color="var(--color-pink)" />
                      </button>
                    </div>
                  ))}

                  {/* Pagination Controls */}
                  {managementSongs.length > ITEMS_PER_PAGE && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
                      <button className={`btn-tactile ${currentPage === 1 ? 'btn-secondary' : 'btn-blue'}`} style={{ height: '38px', padding: '0 1rem', opacity: currentPage === 1 ? 0.5 : 1 }} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
                      <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Page {currentPage} of {Math.ceil(managementSongs.length / ITEMS_PER_PAGE)}</span>
                      <button className={`btn-tactile ${currentPage === Math.ceil(managementSongs.length / ITEMS_PER_PAGE) ? 'btn-secondary' : 'btn-blue'}`} style={{ height: '38px', padding: '0 1rem', opacity: currentPage === Math.ceil(managementSongs.length / ITEMS_PER_PAGE) ? 0.5 : 1 }} onClick={() => setCurrentPage(p => Math.min(Math.ceil(managementSongs.length / ITEMS_PER_PAGE), p + 1))} disabled={currentPage === Math.ceil(managementSongs.length / ITEMS_PER_PAGE)}>Next</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
};

export default Admin;
