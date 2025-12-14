import { useEffect, useState } from 'react';
import api from '../config/api';
// import './AdminEmotionManager.css'; // Removing custom CSS request to use global index.css
import EmotionSongCard from '../components/EmotionSongCard';

const AdminEmotionManager = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [changes, setChanges] = useState({});

  const emotions = ['Sad', 'Feel Good', 'Vibe', 'Motivation', 'Love', 'Party', 'Neutral'];

  // Fetch songs
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const songsRes = await api.get('/songs');
      setSongs(songsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
      // alert('Failed to load songs');
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
      alert('Failed to initialize emotions.');
    } finally {
      setSaving(false);
    }
  };

  // Update emotion for a single song
  // Update emotion for a single song
  const updateEmotion = (songId, newEmotion) => {
    const song = songs.find(s => s.id === songId);
    if (!song) return;

    const originalEmotion = song.emotion || 'No emotion';

    setChanges(prev => {
      const next = { ...prev };
      
      // If new emotion roughly equals original, check if we should remove it
      if (newEmotion === originalEmotion) {
        delete next[songId];
      } else {
        next[songId] = newEmotion;
      }
      
      // Important to use the 'next' object to check for keys, as 'prev' is stale
      setHasChanges(Object.keys(next).length > 0);
      return next;
    });
  };

  // Save all changes
  // Save all changes
  const saveChanges = async () => {
    const updates = Object.entries(changes).map(([id, emotion]) => ({
      id,
      emotion
    }));

    if (updates.length === 0) return;

    // Direct save without confirm dialog
    try {
      setSaving(true);
      await api.post('/emotions/bulk-update', { updates });
      // Refresh data
      await fetchData();
      setChanges({});
      setHasChanges(false);
      // Optional: Success feedback could go here
    } catch (error) {
      console.error('Failed to save changes:', error);
      alert('Failed to save changes: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  // Discard changes
  // Discard changes
  const discardChanges = () => {
    setChanges({});
    setHasChanges(false);
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
      <div className="card-flat" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
         <p>Loading songs...</p>
      </div>
    );
  }

  return (
    <div>
       <div style={{ marginBottom: '1rem' }}>
        
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            className="btn-3d btn-secondary"
            onClick={initializeEmotions}
            disabled={saving}
            style={{ fontSize: '0.8rem', padding: '0 1rem' }}
          >
            <span style={{ marginRight: '6px' }}>🔄</span> Init
          </button>
          {hasChanges && (
            <>
              <button
                className="btn-3d btn-danger"
                onClick={discardChanges}
                disabled={saving}
                style={{ fontSize: '0.8rem', padding: '0 1rem' }}
              >
                <span style={{ marginRight: '6px' }}>❌</span> Discard
              </button>
              <button
                className="btn-3d btn-primary"
                onClick={saveChanges}
                disabled={saving}
                style={{ fontSize: '0.8rem', padding: '0 1rem' }}
              >
                <span style={{ marginRight: '6px' }}>💾</span> 
                {saving ? '...' : `Save (${Object.keys(changes).length})`}
              </button>
            </>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-2">
          <input
            type="text"
            placeholder="🔍 Search songs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-flat"
          />
        </div>

        {/* Filter Buttons */}
        <div className="scroll-container hide-scrollbar" style={{ paddingLeft: '4px' }}>
          <button
            className={`btn-3d ${filter === 'All' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('All')}
            style={{ fontSize: '0.75rem', padding: '0 0.75rem', height: '36px', borderRadius: '16px' }}
          >
            All ({songs.length})
          </button>
          {emotions.map(emotion => (
            <button
              key={emotion}
              className={`btn-3d ${filter === emotion ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(emotion)}
              style={{ fontSize: '0.75rem', padding: '0 0.75rem', height: '36px', borderRadius: '16px', flexShrink: 0 }}
            >
              {emotion} ({emotionCounts[emotion] || 0})
            </button>
          ))}
          <button
            className={`btn-3d ${filter === 'No emotion' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('No emotion')}
            style={{ fontSize: '0.75rem', padding: '0 0.75rem', height: '36px', borderRadius: '16px', flexShrink: 0 }}
          >
            None ({emotionCounts['No emotion'] || 0})
          </button>
        </div>
      </div>

      {/* Songs Grid */}
      {filteredSongs.length === 0 ? (
        <div className="card-flat text-center" style={{ color: 'var(--text-muted)' }}>
           <p>No matching songs found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {/* Header Row */}
          <div style={{ 
            display: 'flex', 
            padding: '0 0.25rem 0.5rem', 
            borderBottom: '2px solid var(--border-color)',
            marginBottom: '0.5rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            <div style={{ flex: 1 }}>Song Info</div>
            <div style={{ width: '100px', textAlign: 'right' }}>Emotion</div>
          </div>
          {filteredSongs.map(song => {
             const currentEmotion = song.emotion || 'No emotion';
             const newEmotion = changes[song.id];
             return (
                 <EmotionSongCard
                    key={song.id}
                    song={song}
                    currentEmotion={currentEmotion}
                    newEmotion={newEmotion}
                    onUpdate={updateEmotion}
                    emotions={emotions}
                 />
             );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminEmotionManager;
