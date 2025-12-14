import { useState, useEffect } from 'react';
import api from '../config/api';
import SongCard from '../components/SongCard';
import { useMusic } from '../context/MusicContext';

// Mobile-optimized Library Page
const Library = () => {
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const { playSong } = useMusic();

  const emotions = ['All', 'Sad', 'Feel Good', 'Vibe', 'Motivation', 'Love', 'Party'];

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true);
        const response = await api.get('/songs');
        
        // Normalize data to ensure consistency
        const normalized = response.data.map(s => ({
            ...s,
            coverUrl: s.cover_url || s.coverArt,
            audioUrl: s.file_url || s.filePathHigh,
            emotion: s.emotion || 'Feel Good'
        }));

        setSongs(normalized);
        setFilteredSongs(normalized);
      } catch (error) {
        console.error('Error fetching songs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, []);

  useEffect(() => {
    let filtered = songs;

    // Filter by category (Emotion)
    if (category !== 'All') {
      filtered = filtered.filter(song => song.emotion === category);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(song =>
        (song.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (song.artist || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredSongs(filtered);
  }, [searchQuery, category, songs]);

  if (loading) {
    return (
      <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
         <div style={{ color: 'var(--text-muted)' }}>Loading library...</div>
      </div>
    );
  }

  return (
    <div className="library-page">
      <h1 className="mb-2">Library</h1>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search songs..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="input-flat mb-3"
      />

      {/* Emotion Filters */}
      <div className="scroll-container mb-3" style={{ paddingLeft: '4px' }}>
        {emotions.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`btn-3d ${category === cat ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              borderRadius: '20px', 
              padding: '0 1.25rem', 
              fontSize: '0.85rem',
              height: '40px' 
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Songs Grid */}
      {filteredSongs.length > 0 ? (
        <div className="songs-grid">
          {filteredSongs.map(song => (
            <SongCard
              key={song.id}
              song={song}
              onPlay={() => playSong(song, filteredSongs)}
            />
          ))}
        </div>
      ) : (
        <div className="card-flat text-center empty-state">
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {searchQuery || category !== 'All' ? 'No songs match your filters.' : 'No songs found in library.'}
          </p>
          {(searchQuery || category !== 'All') && (
            <button 
              className="btn-3d btn-primary"
              onClick={() => { setSearchQuery(''); setCategory('All'); }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Library;
