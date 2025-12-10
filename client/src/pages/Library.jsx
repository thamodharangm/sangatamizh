import { useEffect, useState } from 'react';
import api from '../api/axios';
import SongCard from '../components/SongCard'; // Import unified card
import { useMusic } from '../context/MusicContext'; // Import playback hook

const Library = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playSong } = useMusic(); // Access global player

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const categories = ['All', 'Sad songs', 'Feel Good', 'Vibe', 'Motivation'];

  useEffect(() => {
    // ... (fetch logic remains same)
    const fetchSongs = async () => {
      try {
        const res = await api.get('/songs'); 
        const normalized = res.data.map(s => ({
            ...s,
            coverUrl: s.cover_url || s.coverArt,
            audioUrl: s.file_url || s.filePathHigh
        }));
        setSongs(normalized);
      } catch (error) {
        console.error('Failed to fetch songs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSongs();
  }, []);

  const filteredSongs = songs.filter(song => {
    const matchesSearch = (song.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (song.artist || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // For now, if category data doesn't essentially match, we might want to just show all or strict filter
    // Let's assume song.category might store these values, or we filter loosely for demo
    const matchesCategory = selectedCategory === 'All' 
        ? true 
        : (song.category || '').toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ padding: '2rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div className="library-header" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
           <h1 style={{ color: 'white', margin: 0 }}>Library</h1>
           <input 
             type="text" 
             placeholder="Search songs..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="input-flat search-input"
             style={{ maxWidth: '300px' }}
           />
        </div>

        {/* Category Chips */}
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '5px' }} className="no-scrollbar">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat ? 'var(--primary)' : 'var(--bg-card)',
                color: selectedCategory === cat ? 'white' : 'var(--text-muted)',
                border: selectedCategory === cat ? '2px solid var(--primary)' : '2px solid var(--border-color)',
                padding: '0.5rem 1.25rem',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                boxShadow: selectedCategory === cat ? '0 4px 12px rgba(88, 204, 2, 0.3)' : 'none'
              }}
              onMouseEnter={(e) => {
                 if (selectedCategory !== cat) {
                    e.currentTarget.style.borderColor = 'var(--text-muted)';
                    e.currentTarget.style.color = 'white';
                 }
              }}
              onMouseLeave={(e) => {
                 if (selectedCategory !== cat) {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                 }
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading library...</div>
      ) : filteredSongs.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
          {filteredSongs.map(song => (
            <SongCard key={song.id || song._id} song={song} onPlay={playSong} />
          ))}
        </div>
      ) : (
        <div className="card-flat" style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No songs found in your library.</p>
        </div>
      )}
    </div>
  );
};

export default Library;
