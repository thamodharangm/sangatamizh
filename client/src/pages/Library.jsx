import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import SongCard from '../components/SongCard';
import { useMusic } from '../context/MusicContext';

const Library = () => {
  const { user } = useAuth();
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const { playSong, currentSong } = useMusic();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState('All');

  // Refs for each horizontal row to handle scrolling
  const allScrollRef = useRef(null);
  const loveScrollRef = useRef(null);
  const sadScrollRef = useRef(null);
  const motScrollRef = useRef(null);
  const partyScrollRef = useRef(null);

  const scrollRow = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = 800;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const [allSongs, setAllSongs] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState(true);

  const fetchAllSongs = useCallback(async () => {
    try {
      setLoadingSongs(true);
      const response = await api.get('/songs');
      setAllSongs(response.data);
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setLoadingSongs(false);
    }
  }, []);

  useEffect(() => {
    fetchAllSongs();
  }, [fetchAllSongs]);

  const emotions = ['All', 'Love', 'Sad', 'Motivation', 'Party'];

  const fetchPlaylist = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const response = await api.get(`/likes/songs?userId=${user.uid}`);
      const transformedSongs = response.data.map(song => ({
        ...song,
        coverUrl: song.cover_url || song.coverUrl,
        audioUrl: song.file_url || song.audioUrl,
      }));
      setPlaylistSongs(transformedSongs);
    } catch (error) {
      console.error('Error fetching playlist:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user?.uid) {
      fetchPlaylist();
    }
  }, [user, fetchPlaylist]);

  const combinedSongs = allSongs;

  const filteredSongs = combinedSongs.filter(song => {
    const matchesSearch = (song.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (song.artist || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmotion = selectedEmotion === 'All' || song.emotion === selectedEmotion;
    return matchesSearch && matchesEmotion;
  });

  const emotionCounts = {
    'All': allSongs.length,
    'Love': allSongs.filter(s => s.emotion === 'Love').length,
    'Sad': allSongs.filter(s => s.emotion === 'Sad').length,
    'Motivation': allSongs.filter(s => s.emotion === 'Motivation').length,
    'Party': allSongs.filter(s => s.emotion === 'Party').length
  };

  return (
    <div className="library-container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 80px)', // Adjusted height
      padding: '2rem 2.5rem', // Increased top padding to prevent cutoff
      maxWidth: '1400px',
      margin: '0 auto',
      overflow: 'hidden',
      color: 'var(--text-main)',
      backgroundColor: '#111b21'
    }}>
      {/* Single Screen Content Container */}
      <div style={{ 
        flex: 1, 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center', // Center content vertically
        paddingBottom: '1rem',
        overflow: 'hidden'
      }}>
        
        {/* Header Section - Ultra Compact */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <h1 style={{ 
              color: 'white', 
              margin: 0, 
              fontSize: '2rem', 
              fontWeight: '900',
              letterSpacing: '-0.5px'
            }}>Library</h1>
            
            <div style={{ position: 'relative', width: '250px' }}>
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-flat"
                style={{ 
                  width: '100%', 
                  borderRadius: '12px',
                  backgroundColor: '#202f36',
                  border: '1.5px solid #37464f',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

          {/* Emotion Filters - Ultra Compact */}
          <div className="no-scrollbar" style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            overflowX: 'auto', 
            paddingBottom: '0.5rem'
          }}>
            {emotions.map(emotion => {
              const count = emotionCounts[emotion] || 0;
              const isActive = selectedEmotion === emotion;
              
              const isAll = emotion === 'All';
              const activeColor = isAll ? '#58cc02' : '#202f36';
              const activeDepth = isAll ? '#46a302' : '#37464f';
              const textColor = isAll && isActive ? '#ffffff' : (isActive ? '#ec4899' : '#afbacc');
              
              return (
                <button 
                  key={emotion}
                  onClick={() => setSelectedEmotion(emotion)}
                  className={`btn-3d-custom ${isActive ? 'active' : ''}`}
                  style={{ 
                    padding: '8px 18px', 
                    fontSize: '0.75rem', 
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderRadius: '12px',
                    backgroundColor: isActive ? activeColor : '#202f36',
                    border: `1.5px solid ${isActive ? activeDepth : '#37464f'}`,
                    boxShadow: `0px 3px 0px ${isActive ? activeDepth : '#37464f'}`,
                    color: textColor,
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                    transform: isActive ? 'translateY(1.5px)' : 'none'
                  }}
                >
                  <span>{emotion}</span>
                  <span style={{ 
                    background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                    padding: '1.5px 6px',
                    borderRadius: '6px',
                    fontSize: '0.65rem',
                    color: isActive && isAll ? '#fff' : (isActive ? '#ec4899' : '#afbacc')
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Netflix Style Rows (Perfectly centered on screen) */}
        {selectedEmotion === 'All' && !searchTerm && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            
            {/* Row 1: All Songs */}
            <section className="netflix-section">
              <h2 className="section-title">🎶 All Songs</h2>
              <div className="row-wrapper">
                <button className="btn-netflix left" onClick={() => scrollRow(allScrollRef, 'left')}>‹</button>
                <div ref={allScrollRef} className="row-scroll-container no-scrollbar">
                  {loadingSongs ? (
                    <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading songs...</div>
                  ) : allSongs.length > 0 ? (
                    allSongs.map(song => (
                      <div key={`all-${song.id}`} className="song-card-wrapper">
                        <SongCard song={song} onPlay={() => playSong(song, allSongs)} />
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>No songs found in database.</div>
                  )}
                </div>
                <button className="btn-netflix right" onClick={() => scrollRow(allScrollRef, 'right')}>›</button>
              </div>
            </section>
          </div>
        )}

        {/* Search Results - Fixed height to avoid scroll */}
        {(selectedEmotion !== 'All' || searchTerm) && (
          <section style={{ height: '100%', overflow: 'hidden' }}>
            <h2 className="section-title">🔍 Search Results</h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
              gap: '1rem',
              maxHeight: 'calc(100vh - 250px)', // Dynamic height based on viewport
              overflowY: 'auto',
              paddingBottom: '1rem'
            }} className="no-scrollbar">
              {filteredSongs.length > 0 ? (
                filteredSongs.map(song => (
                  <SongCard 
                    key={song.id} 
                    song={song} 
                    onPlay={() => playSong(song, filteredSongs)} 
                  />
                ))
              ) : (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No songs found.</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <style>{`
        .library-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .library-container::-webkit-scrollbar {
          width: 6px;
        }
        .library-container::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .netflix-section {
          position: relative;
          width: 100%;
        }
        .section-title {
          font-size: 1rem;
          color: white;
          margin-bottom: 1rem;
          padding-left: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
        }
        .row-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          padding: 0 5px; 
        }
        .row-scroll-container {
          display: flex;
          gap: 0.75rem;
          overflow-x: auto;
          scroll-behavior: smooth;
          width: 100%;
          padding: 5px 5px 10px 5px;
        }
        .song-card-wrapper {
          min-width: 120px; /* Reduced to 120px */
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .song-card-wrapper:hover {
          transform: scale(1.12) translateY(-8px);
          z-index: 10;
        }
        .btn-netflix {
          position: absolute;
          z-index: 100;
          top: 38%;
          transform: translateY(-50%);
          width: 32px; /* Small, refined buttons */
          height: 32px;
          border-radius: 50%;
          background-color: rgba(32, 47, 54, 0.9);
          color: #ec4899;
          border: 1.5px solid #37464f;
          box-shadow: 0px 2px 0px #37464f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 1.1rem;
          cursor: pointer;
          user-select: none;
          transition: all 0.15s ease;
          padding-bottom: 1.5px;
          backdrop-filter: blur(4px);
        }
        .btn-netflix:hover {
          transform: translateY(-54%) scale(1.15);
          background-color: #2a3d46;
          color: #ff5eaa;
        }
        .btn-netflix:active {
          transform: translateY(-46%);
          box-shadow: 0px 1px 0px #37464f;
        }
        .btn-netflix.left {
          left: -8px;
        }
        .btn-netflix.right {
          right: -8px;
        }
        .btn-3d-custom:hover:not(.active) {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
      `}</style>
    </div>
  );
};

export default Library;
