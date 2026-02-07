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

  const emotions = ['Sad songs', 'Feel Good', 'Vibe', 'Motivation'];

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
        <td className="table-cell-song">
          <div className="table-song-content">
            <img 
              src={song.cover_url} 
              alt={song.title}
              className="table-song-image"
            />
            <div className="table-song-title">{song.title}</div>
          </div>
        </td>
        <td className="table-cell-artist">{song.artist}</td>
        <td className="table-cell-emotion">
          <span className={`emotion-badge ${currentEmotion === 'No emotion' ? 'no-emotion' : 'has-emotion'}`}>
            {currentEmotion}
          </span>
        </td>
        <td className="table-cell-select">
          <select
            className="emotion-select-desktop"
            value={newEmotion || currentEmotion}
            onChange={(e) => updateEmotion(song.id, e.target.value)}
          >
            {emotions.map(emotion => (
              <option key={emotion} value={emotion}>{emotion}</option>
            ))}
          </select>
        </td>
        <td className="table-cell-status">
          {hasChange && (
            <span className="status-badge">Modified</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="emotion-manager-container">
      {/* Header Section */}
      <div className="emotion-header">
        <div className="header-title-section">
          <h1 className="page-title">🎭 Emotion Manager</h1>
          <p className="page-subtitle">Manage and organize song emotions</p>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            className="btn-action btn-initialize"
            onClick={initializeEmotions}
            disabled={saving}
          >
            <span className="btn-icon">🔄</span>
            <span className="btn-text">Initialize</span>
          </button>
          {hasChanges && (
            <>
              <button
                className="btn-action btn-discard"
                onClick={discardChanges}
                disabled={saving}
              >
                <span className="btn-icon">❌</span>
                <span className="btn-text">Discard</span>
              </button>
              <button
                className="btn-action btn-save"
                onClick={saveChanges}
                disabled={saving}
              >
                <span className="btn-icon">💾</span>
                <span className="btn-text">
                  {saving ? 'Saving...' : `Save (${Object.keys(changes).length})`}
                </span>
              </button>
            </>
          )}
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card stat-total">
            <div className="stat-value">{songs.length}</div>
            <div className="stat-label">Total Songs</div>
          </div>
          {emotions.map(emotion => (
            <div key={emotion} className="stat-card">
              <div className="stat-value">{emotionCounts[emotion] || 0}</div>
              <div className="stat-label">{emotion.replace(' songs', '')}</div>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="🔍 Search by song or artist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Filter Buttons */}
        <div className="filter-scroll-container">
          <button
            className={`filter-btn ${filter === 'All' ? 'active' : ''}`}
            onClick={() => setFilter('All')}
          >
            All ({songs.length})
          </button>
          {emotions.map(emotion => (
            <button
              key={emotion}
              className={`filter-btn ${filter === emotion ? 'active' : ''}`}
              onClick={() => setFilter(emotion)}
            >
              {emotion.replace(' songs', '')} ({emotionCounts[emotion] || 0})
            </button>
          ))}
          <button
            className={`filter-btn ${filter === 'No emotion' ? 'active' : ''}`}
            onClick={() => setFilter('No emotion')}
          >
            None ({emotionCounts['No emotion'] || 0})
          </button>
        </div>
      </div>

      {/* Songs List */}
      {filteredSongs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎵</div>
          <p className="empty-text">No songs found</p>
          <p className="empty-subtext">Try adjusting your search or filter</p>
        </div>
      ) : (
        <>
          {/* Mobile View - Cards */}
          {isMobile ? (
            <div className="songs-grid-mobile">
              {filteredSongs.map(renderSongCard)}
            </div>
          ) : (
            /* Desktop View - Table */
            <div className="songs-table-container">
              <table className="songs-table">
                <thead>
                  <tr>
                    <th>Song</th>
                    <th>Artist</th>
                    <th>Current</th>
                    <th>Change To</th>
                    <th>Status</th>
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
  );
};

export default AdminEmotionManager;
