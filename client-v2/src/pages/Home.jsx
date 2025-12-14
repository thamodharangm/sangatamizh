import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import SongCard from '../components/SongCard';
import { useMusic } from '../context/MusicContext';

// Mobile-optimized Home Page
const Home = () => {
  const [songs, setSongs] = useState([]);
  const [sections, setSections] = useState({
    trending: [],
    hits: [],
    recent: []
  });
  const [loading, setLoading] = useState(true);
  const { playSong } = useMusic();
  const navigate = useNavigate();

  const getIdentity = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.id) return user.id;
    } catch (e) { /* ignore */ }
    
    let guestId = localStorage.getItem('guestId');
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem('guestId', guestId);
    }
    return guestId;
  };

  useEffect(() => {
    const fetchHomeSections = async () => {
      try {
        setLoading(true);
        const userId = getIdentity();
        
        const [songsRes, sectionRes] = await Promise.all([
          api.get('/songs'),
          api.get(`/home-sections?userId=${userId}`)
        ]);

        const normalize = (list) => list.map(s => ({
          ...s,
          audioUrl: s.file_url || s.fileUrl,
          coverUrl: s.cover_url || s.coverArt || s.coverUrl
        }));

        setSongs(normalize(songsRes.data));
        setSections({
          trending: normalize(sectionRes.data.trending || []),
          hits: normalize(sectionRes.data.hits || []),
          recent: normalize(sectionRes.data.recent || [])
        });

      } catch (error) {
        console.error('Error fetching home sections:', error);
        // Fallback
        try {
          const allSongs = await api.get('/songs');
          const normalized = allSongs.data.map(s => ({
            ...s,
            audioUrl: s.file_url || s.fileUrl,
            coverUrl: s.cover_url || s.coverArt || s.coverUrl
          }));
          setSongs(normalized);
          setSections({
            trending: normalized.slice(0, 10),
            hits: normalized.slice(10, 20),
            recent: []
          });
        } catch (err) { /* silent */ }
      } finally {
        setLoading(false);
      }
    };

    fetchHomeSections();
  }, []);

  const handlePlay = (song, playlist) => {
    playSong(song, playlist);
    const userId = getIdentity();
    if (userId) {
      api.post('/log-play', { userId, songId: song.id }).catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
         <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="mb-3" style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
          Welcome to <span style={{ color: 'var(--primary)' }}>Sangatamizh</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Your daily streak of soulful music starts here.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => document.getElementById('hits-section')?.scrollIntoView({ behavior: 'smooth' })} 
            className="btn-3d btn-primary"
          >
            Start Listening
          </button>
          <button 
            onClick={() => navigate('/library')} 
            className="btn-3d btn-secondary"
          >
            My Library
          </button>
        </div>
      </div>

      {/* Recently Played */}
      {sections.recent && sections.recent.length > 0 && (
        <section className="mb-3" id="recent-section">
          <h2 className="mb-2">🕒 Recently Played</h2>
          <div className="scroll-container">
            {sections.recent.map(song => (
              <div key={song.id} className="scroll-item">
                <SongCard 
                  song={song} 
                  onPlay={() => handlePlay(song, sections.recent)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Hits */}
      {sections.hits && sections.hits.length > 0 && (
        <section className="mb-3" id="hits-section">
          <h2 className="mb-2">🎵 Tamil Hits</h2>
          <div className="scroll-container">
            {sections.hits.map(song => (
              <div key={song.id} className="scroll-item">
                <SongCard 
                  song={song} 
                  onPlay={() => handlePlay(song, sections.hits)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Fallback: All Songs (Grid Layout) */}
      {songs.length > 0 && sections.hits.length === 0 && (
        <section className="mb-3">
          <h2 className="mb-2">🎵 All Songs</h2>
          <div className="songs-grid">
            {songs.map(song => (
              <SongCard 
                key={song.id} 
                song={song} 
                onPlay={() => handlePlay(song, songs)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {songs.length === 0 && (
        <div className="card-flat text-center empty-state">
           <p style={{ color: 'var(--text-muted)' }}>No songs available currently.</p>
        </div>
      )}
    </div>
  );
};

export default Home;
