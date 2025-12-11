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
        <div className="library-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
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
        <div className="no-scrollbar category-chips" style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '5px' }}>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`btn-3d ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                borderRadius: '20px', // Overlay to keep them pill-shaped like hips if desired, or remove to match standard buttons. 
                // User asked for "like start listening", which are standard buttons (radius-lg).
                // I will NOT add inline borderRadius to strictly match "Start Listening".
                // However, pills usually look better for categories. 
                // "Start Listening" uses var(--radius-lg) which is 16px. 
                // Let's stick to the class style mainly, but maybe adjust padding/font-size if needed.
                // Actually, I'll stick to the class EXACTLY to match the request.
                whiteSpace: 'nowrap',
                height: '40px', // slightly smaller than main buttons (48px) for chips
                fontSize: '0.85rem',
                padding: '0 20px'
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
        <div className="library-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '1rem' }}>
          {filteredSongs.map(song => (
            <SongCard key={song.id || song._id} song={song} onPlay={() => playSong(song, filteredSongs)} />
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
