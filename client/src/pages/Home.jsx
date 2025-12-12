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

  // State for all songs (keep if needed for other filters) or just sections
  const [sections, setSections] = useState({ trending: [], hits: [], recent: [] });
  // Keep regular songs state if needed for "All", but sections are prioritize
  
  // Helper to get Identity (User ID or Guest ID)
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
    const fetchSections = async () => {
      try {
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
            trending: normalize(sectionRes.data.trending),
            hits: normalize(sectionRes.data.hits),
            recent: normalize(sectionRes.data.recent)
        });
        
      } catch (error) {
        console.error("Error fetching home data: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, []);

  const handlePlay = async (song, playlist) => {
       playSong(song, playlist);
       // Log play in background
       const userId = getIdentity();
       if (userId) {
           api.post('/log-play', { userId, songId: song.id }).catch(e => console.error("Log fail", e));
       }
  };

  return (
    <div className="home-container">
      <main style={{ paddingBottom: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        
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
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', marginTop: 0, color: 'white' }}>
              Welcome to <span style={{ color: 'var(--primary)' }}>Sangatamizh</span>
            </h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '500px', marginBottom: '2rem' }}>
              Your daily streak of soulful music starts here.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => document.getElementById('scroll-hits')?.scrollIntoView({ behavior: 'smooth' })} className="btn-3d btn-primary">Start Listening</button>
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

             {/* 1. Recently Played (User History) */}
             {sections.recent.length > 0 && (
                <SongSection title="Recently Played" songs={sections.recent} playSong={handlePlay} id="recent" />
             )}
            
             {/* 2. Tamil Hits */}
             {sections.hits.length > 0 && (
                <SongSection title="Tamil Hits" songs={sections.hits} playSong={handlePlay} id="hits" />
             )}

             {/* Fallback to local if empty, or show other categories from main list if desired */}
             {songs.length > 0 && sections.hits.length === 0 && (
                 <SongSection title="All Songs" songs={songs.slice(0, 10)} playSong={handlePlay} id="all" />
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
