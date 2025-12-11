import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import SongCard from '../components/SongCard';
import { useMusic } from '../context/MusicContext';

// Helper Component for Horizontal Scroll Sections
const SongSection = ({ title, songs, playSong, id }) => {
  const scrollId = `scroll-${id}`;

  if (!songs || songs.length === 0) return null;

  const scrollLeft = () => {
    const el = document.getElementById(scrollId);
    if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    const el = document.getElementById(scrollId);
    if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
  };

  return (
    <section style={{ marginBottom: '2rem' }}>
      <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'white', fontWeight: '700' }}>{title}</h2>
      </div>

      <div style={{ position: 'relative' }}>
        {/* Left Arrow */}
        <button 
          onClick={scrollLeft}
          className="nav-arrow"
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
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>

        {/* Scroll Container */}
        <div 
          id={scrollId}
          className="no-scrollbar"
          style={{ 
            display: 'flex', 
            gap: '1.5rem', 
            overflowX: 'auto', 
            padding: '4px 4px 1rem 4px', // Extra padding for shadows
            scrollBehavior: 'smooth',
            scrollSnapType: 'x mandatory'
          }}
        >
          {songs.map(song => (
            <div key={song.id} style={{ minWidth: '160px', maxWidth: '160px', flex: '0 0 auto', scrollSnapAlign: 'start' }}>
              <SongCard song={song} onPlay={() => playSong(song, songs)} />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button 
          onClick={scrollRight}
          className="nav-arrow"
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
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>
    </section>
  );
};

function Home() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playSong } = useMusic();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await api.get('/songs');
        const songsList = res.data.map(song => ({
          ...song,
          audioUrl: song.file_url,
          coverUrl: song.cover_url || song.coverUrl
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

  // Define Sections Data
  const trendingSongs = songs.slice(0, 10); // First 10
  const recentSongs = [...songs].reverse().slice(0, 10); // Last 10 reversed
  const tamilSongs = songs.filter(s => (s.category || '').toLowerCase().includes('tamil'));
  const malayalamSongs = songs.filter(s => (s.category || '').toLowerCase().includes('malayalam'));

  return (
    <div className="home-container">
      <main style={{ padding: '20px 0', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Hero Section */}
        <section className="hero-section" style={{ 
          marginBottom: '3rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '2px solid var(--border-color)',
          paddingBottom: '2rem'
        }}>
          <div className="hero-content">
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'white' }}>
              Welcome to <span style={{ color: 'var(--primary)' }}>Sangatamizh</span>
            </h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '500px', marginBottom: '2rem' }}>
              Your daily streak of soulful music starts here.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => document.getElementById('scroll-trending')?.scrollIntoView({ behavior: 'smooth' })} className="btn-3d btn-primary">Start Listening</button>
              <button onClick={() => navigate('/library')} className="btn-3d btn-secondary">My Library</button>
            </div>
          </div>
          <div className="hero-image" style={{ 
             width: '150px', height: '150px', background: 'var(--bg-card)', 
             borderRadius: '50%', border: '2px solid var(--border-color)',
             display: 'flex', alignItems: 'center', justifyContent: 'center',
             overflow: 'hidden'
          }}>
            <img src="/mascot.png" alt="Mascot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </section>

        {loading ? (
             <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading your music...</div>
        ) : (
          <>
            <SongSection title="Trending Now" songs={trendingSongs} playSong={playSong} id="trending" />
            <SongSection title="Recently Played" songs={recentSongs} playSong={playSong} id="recent" />
            
            {/* Conditional Sections - only show if there are songs */}
            {tamilSongs.length > 0 && (
               <SongSection title="Tamil Hits" songs={tamilSongs} playSong={playSong} id="tamil" />
            )}
            {malayalamSongs.length > 0 && (
               <SongSection title="Malayalam Vibes" songs={malayalamSongs} playSong={playSong} id="malayalam" />
            )}

            {songs.length === 0 && (
               <div className="card-flat" style={{ textAlign: 'center', padding: '3rem' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No songs available. Upload some music in the Admin Panel!</p>
               </div>
            )}
          </>
        )}

      </main>
    </div>
  )
}

export default Home
