import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import SongCard from '../components/SongCard';
import { useMusic } from '../context/MusicContext';

function Home() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playSong } = useMusic();

  const navigate = useNavigate();

  const scrollToTrending = () => {
    const element = document.getElementById('trending');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await api.get('/songs');
        const songsList = res.data.map(song => ({
          ...song,
          audioUrl: song.file_url, // Map for MusicContext
          coverUrl: song.cover_url || song.coverUrl // Normalize cover
        }));
        setSongs(songsList);
      } catch (error) {
        console.error("Error fetching songs: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, []);

  return (
    <div className="home-container">
      <main style={{ padding: '2rem 0', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Welcome / Hero Section - Duolingo Style (Clean, Bold) */}
        <section style={{ 
          marginBottom: '4rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '2px solid var(--border-color)',
          paddingBottom: '2rem'
        }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'white' }}>
              Welcome to <span style={{ color: 'var(--primary)' }}>Sangatamizh</span>
            </h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '500px', marginBottom: '2rem' }}>
              Your daily streak of soulful music starts here.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={scrollToTrending} className="btn-3d btn-primary">Start Listening</button>
              <button onClick={() => navigate('/library')} className="btn-3d btn-secondary">My Library</button>
            </div>
          </div>
          {/* Optional: Hero Image or Icon here? */}
          <div style={{ 
             width: '150px', 
             height: '150px', 
             background: 'var(--bg-card)', 
             borderRadius: '50%', 
             border: '2px solid var(--border-color)',
             display: 'flex', 
             alignItems: 'center', 
             justifyContent: 'center',
             fontSize: '4rem',
             overflow: 'hidden'
          }}>
            <img src="/mascot.png" alt="Mascot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </section>

        {/* Trending Section */}
        <section id="trending">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2>Trending Now</h2>
            <button 
              className="btn-3d btn-secondary" 
              style={{ height: '36px', fontSize: '0.8rem' }}
              onClick={() => navigate('/playlist')}
            >
              My Playlist
            </button>
          </div>
          
          
          {loading ? (
             <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading songs...</div>
          ) : songs.length > 0 ? (
            <div style={{ position: 'relative' }}>
              {/* Left Arrow */}
              <button 
                onClick={() => document.getElementById('trending-scroll').scrollBy({ left: -400, behavior: 'smooth' })}
                style={{
                  position: 'absolute',
                  left: '-20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '2px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 20,
                  opacity: 1, /* Always visible */
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}
                className="nav-arrow"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              {/* Scroll Container */}
              <div 
                id="trending-scroll"
                className="no-scrollbar"
                style={{ 
                  display: 'flex', 
                  gap: '1.5rem', 
                  overflowX: 'auto', 
                  padding: '1rem 0',
                  scrollBehavior: 'smooth'
                }}
              >
                {songs.map(song => (
                  <div key={song.id} style={{ minWidth: '160px', maxWidth: '160px', flex: '0 0 auto', transition: 'transform 0.3s' }} className="song-card-wrapper">
                    <SongCard song={song} onPlay={() => playSong(song, songs)} />
                  </div>
                ))}
              </div>

              {/* Right Arrow */}
              <button 
                 onClick={() => document.getElementById('trending-scroll').scrollBy({ left: 400, behavior: 'smooth' })}
                 style={{
                  position: 'absolute',
                  right: '-20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '2px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 20,
                  opacity: 1, /* Always visible */
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}
                className="nav-arrow"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          ) : (
             <div className="card-flat" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--text-muted)' }}>No songs available yet.</p>
             </div>
          )}
        </section>

        {/* Features / Info Grid */}
        <section style={{ marginTop: '4rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '1rem', letterSpacing: '1px' }}>
            Why Sangatamizh?
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div className="card-flat">
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔥</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Curated Playlists</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Hand-picked tracks for every mood.</p>
            </div>
            <div className="card-flat">
               <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💎</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Hi-Res Audio</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Crystal clear sound quality.</p>
            </div>
            <div className="card-flat">
               <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏆</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Weekly Charts</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>See what's topping the leaderboards.</p>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}

export default Home
