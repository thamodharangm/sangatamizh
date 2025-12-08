import { useEffect, useState } from 'react';
import api from '../api/axios';

const Library = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await api.get('/songs'); // Hits GET /api/songs on backend
        setSongs(res.data);
      } catch (error) {
        console.error('Failed to fetch songs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSongs();
  }, []);

  const filteredSongs = songs.filter(song => 
    (song.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (song.artist || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '2rem 0', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem' }}>
        <h1 style={{ color: 'white' }}>Library</h1>
        <input 
          type="text" 
          placeholder="Search songs..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-flat"
          style={{ width: '300px' }}
        />
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading library...</div>
      ) : filteredSongs.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {filteredSongs.map(song => (
            <div key={song.id || song._id} className="card-flat" style={{ padding: '1rem' }}>
              <div style={{ 
                width: '100%', 
                aspectRatio: '1', 
                borderRadius: '8px', 
                marginBottom: '1rem', 
                overflow: 'hidden',
                border: '2px solid var(--border-color)' 
              }}>
                <img 
                  src={song.cover_url || song.coverArt || 'https://via.placeholder.com/300'} 
                  alt={song.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <h3 style={{ fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'white' }}>{song.title}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{song.artist}</p>
              
              <audio controls style={{ width: '100%', height: '32px' }}>
                <source src={song.file_url || song.filePathHigh || ''} type="audio/mpeg" />
              </audio>
            </div>
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
