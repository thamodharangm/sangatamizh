import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import './AdminEmotionManager.css';

const AdminEmotionManager = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [changes, setChanges] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const emotions = ['Neutral', 'Feel Good', 'Sad', 'Motivation', 'Love', 'Party', 'Vibe'];

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch songs and stats
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch songs
      const songsRes = await api.get('/songs');
      setSongs(songsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
      alert('Failed to load songs. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize all songs with default emotion
  const initializeEmotions = async () => {
    if (!confirm('Set all songs without emotions to "Feel Good"?')) return;

    try {
      setSaving(true);
      const res = await api.post('/emotions/initialize');
      alert(`✅ Success! Updated ${res.data.updatedCount} songs.`);
      await fetchData();
      setChanges({});
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to initialize', error);
      alert('Failed to initialize emotions. Check console.');
    } finally {
      setSaving(false);
    }
  };

  // Update emotion for a single song
  const updateEmotion = (songId, newEmotion) => {
    setChanges(prev => ({
      ...prev,
      [songId]: newEmotion
    }));
    setHasChanges(true);
  };

  // Save all changes
  const saveChanges = async () => {
    const updates = Object.entries(changes).map(([id, emotion]) => ({
      id,
      emotion
    }));

    console.log('💾 Preparing to save changes...');
    console.log('Changes object:', changes);
    console.log('Updates array:', updates);

    if (updates.length === 0) {
      alert('No changes to save');
      console.warn('⚠️ No changes detected');
      return;
    }

    if (!confirm(`Save ${updates.length} emotion change${updates.length > 1 ? 's' : ''}?`)) {
      console.log('❌ User cancelled save');
      return;
    }

    try {
      setSaving(true);
      console.log(`📤 Sending ${updates.length} updates to /api/emotions/bulk-update...`);
      console.log('Request body:', { updates });
      
      const response = await api.post('/emotions/bulk-update', { updates });
      
      console.log('✅ Response received:', response.data);
      alert(`✅ Successfully updated ${updates.length} song${updates.length > 1 ? 's' : ''}!`);
      
      console.log('🔄 Refreshing song list...');
      await fetchData();
      
      setChanges({});
      setHasChanges(false);
      console.log('✅ Save complete! Changes cleared.');
    } catch (error) {
      console.error('❌ Failed to save changes:', error);
      let errorMessage = 'Failed to save changes.';
      if (error.response) {
        errorMessage += `\nStatus: ${error.response.status}`;
        errorMessage += `\nError: ${JSON.stringify(error.response.data)}`;
      } else if (error.request) {
        errorMessage += '\nNo response from server. Is the backend running?';
      } else {
        errorMessage += `\n${error.message}`;
      }

      
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Discard changes
  const discardChanges = () => {
    if (confirm('Discard all unsaved changes?')) {
      setChanges({});
      setHasChanges(false);
    }
  };

  // Filter songs
  const filteredSongs = songs.filter(song => {
    const matchesSearch = (song.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (song.artist || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const currentEmotion = changes[song.id] || song.emotion || 'No emotion';
    const matchesFilter = filter === 'All' || currentEmotion === filter;

    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const emotionCounts = {};
  songs.forEach(song => {
    const emotion = changes[song.id] || song.emotion || 'No emotion';
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
  });

  if (loading) {
    return (
      <div className="emotion-manager-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading songs...</p>
        </div>
      </div>
    );
  }

  // Render song card (mobile view)
  const renderSongCard = (song) => {
    const currentEmotion = song.emotion || 'No emotion';
    const newEmotion = changes[song.id];
    const hasChange = newEmotion && newEmotion !== currentEmotion;

    return (
      <div 
        key={song.id} 
        className={`emotion-song-card ${hasChange ? 'has-change' : ''}`}
      >
        <div className="song-card-header">
          <img 
            src={song.cover_url} 
            alt={song.title}
            className="song-card-image"
          />
          <div className="song-card-info">
            <div className="song-card-title">{song.title}</div>
            <div className="song-card-artist">{song.artist}</div>
          </div>
        </div>

        <div className="song-card-emotions">
          <div className="emotion-current">
            <div className="emotion-label">Current:</div>
            <span className={`emotion-badge ${currentEmotion === 'No emotion' ? 'no-emotion' : 'has-emotion'}`}>
              {currentEmotion}
            </span>
          </div>

          <div className="emotion-select-wrapper">
            <div className="emotion-label">Change to:</div>
            <select
              className="emotion-select"
              value={newEmotion || currentEmotion}
              onChange={(e) => updateEmotion(song.id, e.target.value)}
            >
              {emotions.map(emotion => (
                <option key={emotion} value={emotion}>{emotion}</option>
              ))}
            </select>
          </div>

          {hasChange && (
            <div className="change-indicator">
              ✏️ Modified
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render song row (desktop table view)
  const renderSongRow = (song) => {
    const currentEmotion = song.emotion || 'No emotion';
    const newEmotion = changes[song.id];
    const hasChange = newEmotion && newEmotion !== currentEmotion;

    return (
      <tr 
        key={song.id} 
        className={hasChange ? 'table-row-changed' : ''}
      >
        <td className="table-cell-song-mini">
          <div className="table-song-content-mini">
            <img 
              src={song.cover_url} 
              alt={song.title}
              className="table-song-image-mini"
            />
            <div className="table-song-title-mini">{song.title}</div>
          </div>
        </td>
        <td className="table-cell-artist-mini">{song.artist}</td>
        <td className="table-cell-emotion-mini">
          <span className={`emotion-badge-mini ${currentEmotion === 'No emotion' ? 'no-emotion' : 'has-emotion'}`}>
            {currentEmotion}
          </span>
        </td>
        <td className="table-cell-select-mini">
          <select
            className="emotion-select-mini"
            value={newEmotion || currentEmotion}
            onChange={(e) => updateEmotion(song.id, e.target.value)}
          >
            {emotions.map(emotion => (
              <option key={emotion} value={emotion}>{emotion}</option>
            ))}
          </select>
        </td>
      </tr>
    );
  };

  return (
    <div className="emotion-manager-container" style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      background: 'var(--bg-main)'
    }}>
      {/* Fixed Header Section */}
      <div className="emotion-header" style={{ flexShrink: 0, padding: '0.5rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.1rem', margin: 0 }}>🎭 Emotion Manager</h1>
            <p className="page-subtitle" style={{ fontSize: '0.65rem', margin: 0 }}>Organize song emotions</p>
          </div>

          {/* Action Buttons - Compact */}
          <div className="action-buttons" style={{ margin: 0, gap: '0.4rem' }}>
            <button className="btn-action-mini btn-initialize" onClick={initializeEmotions} disabled={saving}>
              <span>🔄 Init</span>
            </button>
            {hasChanges && (
              <>
                <button className="btn-action-mini btn-discard" onClick={discardChanges} disabled={saving}>
                  <span>❌ Clear</span>
                </button>
                <button className="btn-action-mini btn-save" onClick={saveChanges} disabled={saving}>
                  <span>💾 {saving ? '...' : `Save (${Object.keys(changes).length})`}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats Grid - Ultra Compact */}
        <div className="stats-grid-mini" style={{ 
          display: 'flex', 
          gap: '0.3rem', 
          overflowX: 'auto', 
          paddingBottom: '0.3rem',
          marginBottom: '0.4rem'
        }}>
          <div className="stat-card-mini total">
            <span className="label">Total</span>
            <span className="value">{songs.length}</span>
          </div>
          {emotions.map(emotion => (
            <div key={emotion} className="stat-card-mini">
              <span className="label">{emotion}</span>
              <span className="value">{emotionCounts[emotion] || 0}</span>
            </div>
          ))}
        </div>

        {/* Search & Filter - Compact */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-input-mini"
              style={{ width: '100%', height: '32px', fontSize: '0.8rem' }}
            />
          </div>
          <div className="filter-scroll-container-mini" style={{ display: 'flex', gap: '0.3rem', overflowX: 'auto', flex: 2 }}>
            <button
              className={`filter-btn-mini ${filter === 'All' ? 'active' : ''}`}
              onClick={() => setFilter('All')}
            >
              All ({songs.length})
            </button>
            {emotions.map(emotion => (
              <button
                key={emotion}
                className={`filter-btn-mini ${filter === emotion ? 'active' : ''}`}
                onClick={() => setFilter(emotion)}
              >
                {emotion} ({emotionCounts[emotion] || 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Independently Scrollable Songs List */}
      <div 
        className="no-scrollbar" 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '0 0.5rem 2rem 0.5rem'
        }}
      >
      {filteredSongs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎵</div>
          <p className="empty-text">No songs found</p>
          <p className="empty-subtext">Try adjusting your search or filter</p>
        </div>
      ) : (
        <>
          {isMobile ? (
            <div className="songs-grid-mobile">
              {filteredSongs.map(renderSongCard)}
            </div>
          ) : (
            <div className="songs-table-container-mini">
              <table className="songs-table-mini">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Song</th>
                    <th style={{ width: '25%' }}>Artist</th>
                    <th style={{ width: '15%' }}>Current</th>
                    <th style={{ width: '20%' }}>Change To</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSongs.map(renderSongRow)}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
};

export default AdminEmotionManager;
