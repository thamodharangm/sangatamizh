import { useEffect, useState } from 'react';
import api from '../config/api';
import EmotionSongCard from '../components/EmotionSongCard';

const AdminEmotionManager = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [changes, setChanges] = useState({});

  const emotions = ['Neutral', 'Feel Good', 'Sad', 'Motivation', 'Love', 'Party', 'Vibe'];

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
  const updateEmotion = (songId, newEmotion) => {
    const song = songs.find(s => s.id === songId);
    if (!song) return;

    const originalEmotion = song.emotion || 'No emotion';

    setChanges(prev => {
      const next = { ...prev };
      
      if (newEmotion === originalEmotion) {
        delete next[songId];
      } else {
        next[songId] = newEmotion;
      }
      
      setHasChanges(Object.keys(next).length > 0);
      return next;
    });
  };

  // Save all changes
  const saveChanges = async () => {
    const updates = Object.entries(changes).map(([id, emotion]) => ({
      id,
      emotion
    }));

    if (updates.length === 0) return;

    try {
      setSaving(true);
      await api.post('/emotions/bulk-update', { updates });
      await fetchData();
      setChanges({});
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save changes:', error);
      alert('Failed to save changes: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

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
    const matchesFilter = filter === 'All' || currentEmotion === filter || (filter === 'No emotion' && currentEmotion === 'No emotion');

    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const emotionCounts = { 'No emotion': 0 };
  emotions.forEach(e => emotionCounts[e] = 0);
  
  songs.forEach(song => {
    const emotion = changes[song.id] || song.emotion || 'No emotion';
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
  });

  if (loading) {
    return (
      <div className="card-flat" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
         <p>Loading Emotions...</p>
      </div>
    );
  }

  return (
    <div className="card-flat" style={{ 
      padding: '0', 
      borderRadius: '24px', 
      overflow: 'hidden', 
      height: '560px', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'var(--bg-card)',
      border: '2px solid var(--border-color)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
    }}>
       {/* Premium Glass Header */}
       <div style={{ 
         flexShrink: 0,
         background: 'rgba(255, 255, 255, 0.02)', 
         backdropFilter: 'blur(10px)',
         padding: '1.25rem',
         borderBottom: '1px solid rgba(255,255,255,0.05)',
         zIndex: 10
       }}>
        
        {/* Top Action Row - Fixed Clipping */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            className="btn-3d btn-secondary"
            onClick={initializeEmotions}
            disabled={saving}
            style={{ fontSize: '0.6rem', height: '28px', padding: '0 0.6rem', borderRadius: '8px', color: 'rgba(255,255,255,0.7)' }}
          >
            INIT AI
          </button>

          <div style={{ flex: 1 }} />

          {hasChanges && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-3d btn-secondary"
                onClick={discardChanges}
                disabled={saving}
                style={{ fontSize: '0.6rem', height: '28px', padding: '0 0.6rem', borderRadius: '8px', color: '#ff6b6b' }}
              >
                RESET
              </button>
              <button
                className="btn-3d btn-primary"
                onClick={saveChanges}
                disabled={saving}
                style={{ fontSize: '0.7rem', height: '34px', padding: '0 1rem', borderRadius: '10px' }}
              >
                {saving ? '...' : `SAVE (${Object.keys(changes).length})`}
              </button>
            </div>
          )}
        </div>

        {/* Search Bar - Modern Glass style */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
           <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.9rem' }}>🔍</span>
           <input
             type="text"
             placeholder="Search titles or artists..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="input-flat"
             style={{ 
               height: '42px', 
               fontSize: '0.85rem', 
               borderRadius: '14px', 
               paddingLeft: '38px',
               background: 'rgba(0,0,0,0.2)',
               width: '100%',
               border: '1px solid rgba(255,255,255,0.08)'
             }}
           />
        </div>

        {/* High-Performance Filter Horizontal Scroll */}
        <div className="scroll-container hide-scrollbar" style={{ gap: '0.5rem', paddingBottom: '2px' }}>
          <button
            className={`btn-3d ${filter === 'All' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('All')}
            style={{ fontSize: '0.65rem', padding: '0 0.8rem', height: '28px', borderRadius: '14px', flexShrink: 0 }}
          >
            All Tracks ({songs.length})
          </button>
          
          {emotions.map(emotion => (
            <button
              key={emotion}
              className={`btn-3d ${filter === emotion ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(emotion)}
              style={{ fontSize: '0.65rem', padding: '0 0.8rem', height: '28px', borderRadius: '14px', flexShrink: 0 }}
            >
              {emotion} ({emotionCounts[emotion] || 0})
            </button>
          ))}
          
          <button
            className={`btn-3d ${filter === 'No emotion' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('No emotion')}
            style={{ fontSize: '0.65rem', padding: '0 0.8rem', height: '28px', borderRadius: '14px', flexShrink: 0 }}
          >
            Untagged ({emotionCounts['No emotion'] || 0})
          </button>
        </div>
      </div>

      {/* Independently Scrollable List - Premium Spacing */}
      <div className="hide-scrollbar" style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '0.5rem 0.75rem',
        WebkitOverflowScrolling: 'touch',
        background: 'rgba(0,0,0,0.1)'
      }}>
        {filteredSongs.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💿</div>
            <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>No matching tracks found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {filteredSongs.map(song => (
              <EmotionSongCard
                key={song.id}
                song={song}
                currentEmotion={song.emotion || 'No emotion'}
                newEmotion={changes[song.id]}
                onUpdate={updateEmotion}
                emotions={emotions}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEmotionManager;
