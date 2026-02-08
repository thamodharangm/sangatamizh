import { useState, useEffect, useCallback } from 'react';
import SongCard from '../components/SongCard';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

// Static Mobile-optimized Home Page
const Home = () => {
  const { user } = useAuth();
  const [sections, setSections] = useState({ trending: [], recent: [] });
  const [loading, setLoading] = useState(true);

  const getIdentity = useCallback(() => {
    if (user?.uid) return user.uid;
    let guestId = localStorage.getItem('guestId');
    if (!guestId) {
        guestId = 'guest_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem('guestId', guestId);
    }
    return guestId;
  }, [user]);

  const fetchSections = useCallback(async () => {
    try {
      setLoading(true);
      const userId = getIdentity();
      const response = await api.get(`/home-sections?userId=${userId}`);
      if (response.data) {
        setSections({
          trending: Array.isArray(response.data.trending) ? response.data.trending : [],
          recent: Array.isArray(response.data.recent) ? response.data.recent : []
        });
      }
    } catch (error) {
      console.error("Failed to fetch home sections:", error);
    } finally {
      setLoading(false);
    }
  }, [getIdentity]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  return (
    <div className="home-page">
      {/* Premium 3D Welcome Card */}
      <div style={{ 
        padding: '1.25rem', 
        backgroundColor: '#202f36',
        borderRadius: '20px',
        border: '2px solid #37464f',
        boxShadow: '0px 4px 0px #37464f',
        marginBottom: '1.5rem',
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
             <div style={{
               padding: '4px 10px',
               background: '#111b21',
               borderRadius: '10px',
               border: '1px solid #37464f',
               color: '#ec4899',
               fontSize: '0.65rem',
               fontWeight: '900',
               letterSpacing: '0.5px',
               boxShadow: '0px 2px 0px #37464f'
             }}>STATIC</div>
        </div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.4rem', color: '#e5e5e5', fontWeight: '900', letterSpacing: '0.5px' }}>
          Welcome to <span style={{ color: '#58cc02' }}>Sangatamizh</span>
        </h1>
        <p style={{ color: '#afbacc', margin: 0, fontSize: '0.85rem', fontWeight: '500', lineHeight: '1.4' }}>
          Your premium destination for soulful Tamil music.
        </p>
      </div>


      {/* Recently Played */}
      {sections.recent && sections.recent.length > 0 && (
        <section className="mb-3" id="recent-section">
          <h2 className="mb-2" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#111b21',
              border: '2px solid #37464f',
              boxShadow: '0px 2px 0px #37464f',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              fontSize: '0.9rem'
            }}>🕒</span>
            Recently Played
          </h2>
          <div className="scroll-container no-scrollbar" style={{ scrollSnapType: 'x mandatory' }}>
            {sections.recent.map(song => (
              <div key={song.id} className="scroll-item" style={{ scrollSnapAlign: 'start' }}>
                <SongCard 
                  song={song} 
                  playlist={sections.recent}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trending Now */}
      {sections.trending && sections.trending.length > 0 && (
        <section className="mb-3" id="trending-section">
          <h2 className="mb-2" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#111b21',
              border: '2px solid #37464f',
              boxShadow: '0px 2px 0px #37464f',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              fontSize: '0.9rem'
            }}>🔥</span>
            Trending Now
          </h2>
          <div className="scroll-container no-scrollbar" style={{ scrollSnapType: 'x mandatory' }}>
            {sections.trending.map(song => (
              <div key={song.id} className="scroll-item" style={{ scrollSnapAlign: 'start' }}>
                <SongCard 
                  song={song} 
                  playlist={sections.trending}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
