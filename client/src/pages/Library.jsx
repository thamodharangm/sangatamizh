import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../config/api';

import SongCard from '../components/SongCard';
import { useMusic } from '../context/MusicContext';

const Library = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playSong } = useMusic();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState('All');
  
  const emotions = ['All', 'Sad songs', 'Feel Good', 'Vibe', 'Motivation'];

  const fetchSongs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/songs'); 
      const normalized = res.data.map(s => ({
          ...s,
          coverUrl: s.cover_url || s.coverArt,
          audioUrl: s.file_url || s.filePathHigh,
          emotion: s.emotion || 'Feel Good'
      }));
      setSongs(normalized);
      console.log('✅ Library: Fetched', normalized.length, 'songs with emotions');
    } catch (error) {
      console.error('Failed to fetch songs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  // Auto-refresh when returning from Emotion Manager
  useEffect(() => {
    if (location.state?.refresh) {
      console.log('🔄 Library: Auto-refreshing after emotion changes');
      fetchSongs();
    }
  }, [location]);

  const filteredSongs = songs.filter(song => {
    const matchesSearch = (song.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (song.artist || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmotion = selectedEmotion === 'All' || song.emotion === selectedEmotion;
    return matchesSearch && matchesEmotion;
  });

  const emotionCounts = {};
  songs.forEach(song => {
    const emotion = song.emotion || 'Feel Good';
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
  });

  return (
    <div style={{ padding: '0 1rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ color: 'white', margin: 0 }}>Library</h1>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Search songs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-flat"
              style={{ width: '200px' }}
            />
          </div>
        </div>

        {/* Emotion Filter Chips */}
        <div className="no-scrollbar" style={{ 
          display: 'flex', 
          gap: '0.75rem', 
          overflowX: 'auto', 
          paddingBottom: '0.5rem',
          WebkitOverflowScrolling: 'touch'
        }}>
          {emotions.map(emotion => {
            const count = emotion === 'All' ? songs.length : (emotionCounts[emotion] || 0);
            const isActive = selectedEmotion === emotion;
            return (
              <button 
                key={emotion}
                onClick={() => setSelectedEmotion(emotion)}
                className={`btn-3d ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{ 
                  padding: '0.5rem 1rem', 
                  fontSize: '0.85rem', 
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>{emotion}</span>
                <span style={{ 
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {selectedEmotion !== 'All' && (
          <div style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Showing {filteredSongs.length} {selectedEmotion} {filteredSongs.length === 1 ? 'song' : 'songs'}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <p>Loading library...</p>
        </div>
      ) : songs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <h3 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '0.75rem' }}>No songs in library</h3>
          <p>Upload some songs to get started!</p>
        </div>
      ) : filteredSongs.length > 0 ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {filteredSongs.map(song => (
            <SongCard 
              key={song.id} 
              song={song} 
              onPlay={() => playSong(song, filteredSongs)} 
            />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <h3 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '0.75rem' }}>
            No {selectedEmotion} songs found
          </h3>
          <p style={{ marginBottom: '1.5rem' }}>
            {selectedEmotion === 'All' 
              ? 'Try adjusting your search term'
              : 'No songs in this category yet'
            }
          </p>
          <button
            className="btn-3d btn-primary"
            onClick={() => setSelectedEmotion('All')}
            style={{ padding: '0.75rem 1.5rem' }}
          >
            Show All Songs
          </button>
        </div>
      )}
    </div>
  );
};

export default Library;
