import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import SongCard from '../components/SongCard';
import { useMusic } from '../context/MusicContext';

const Library = () => {
  const { user } = useAuth();
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const { playSong } = useMusic();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState('All');

  // Refs for each horizontal row to handle scrolling
  const allScrollRef = useRef(null);
  const loveScrollRef = useRef(null);

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
      height: '100%',
      width: '100%',
      padding: '0.5rem 1rem',
      overflow: 'hidden',
      color: 'var(--text-main)',
    }}>
      {/* Single Screen Content Container */}
      <div style={{ 
        flex: 1, 
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden'
      }}>
        
        {/* Header Section - Ultra Compact */}
        <div style={{ marginBottom: '1rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h1 style={{ 
              color: 'white', 
              margin: 0, 
              fontSize: '1.5rem', 
              fontWeight: '900',
              letterSpacing: '-0.5px'
            }}>Library</h1>
            
            <div style={{ position: 'relative', width: '200px' }}>
              <input 
                type="text" 
                placeholder="Search songs..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-flat"
                style={{ 
                  width: '100%', 
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#202f36',
                  border: '1.5px solid #37464f',
                  padding: '0 12px',
                  color: 'white',
                  fontSize: '0.8rem'
                }}
              />
            </div>
          </div>

          {/* Emotion Filters - Ultra Compact */}
          <div className="no-scrollbar" style={{ 
            display: 'flex', 
            gap: '0.5rem', 
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
                    padding: '6px 14px', 
                    fontSize: '0.7rem', 
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: 'none',
                    borderRadius: '10px',
                    backgroundColor: isActive ? activeColor : '#202f36',
                    boxShadow: `0px 2px 0px ${isActive ? activeDepth : '#37464f'}`,
                    color: textColor,
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                    transform: isActive ? 'translateY(1.5px)' : 'none',
                    marginBottom: '2px'
                  }}
                >
                  <span>{emotion}</span>
                  <span style={{ 
                    background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                    padding: '1px 5px',
                    borderRadius: '5px',
                    fontSize: '0.6rem',
                    color: isActive && isAll ? '#fff' : (isActive ? '#ec4899' : '#afbacc')
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Area */}
        <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', paddingBottom: '2rem' }}>
            {selectedEmotion === 'All' && !searchTerm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Row 1: All Songs */}
                <section className="netflix-section">
                <h2 className="section-title" style={{ fontSize: '0.85rem' }}>🎶 All Songs</h2>
                <div className="row-wrapper">
                    <button className="btn-netflix left" style={{ width: '28px', height: '28px', fontSize: '1rem' }} onClick={() => scrollRow(allScrollRef, 'left')}>‹</button>
                    <div ref={allScrollRef} className="row-scroll-container no-scrollbar">
                    {loadingSongs ? (
                        <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading songs...</div>
                    ) : allSongs.length > 0 ? (
                        allSongs.map(song => (
                        <div key={`all-${song.id}`} className="library-card-scaler">
                            <SongCard song={song} onPlay={() => playSong(song, allSongs)} />
                        </div>
                        ))
                    ) : (
                        <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>No songs found.</div>
                    )}
                    </div>
                    <button className="btn-netflix right" style={{ width: '28px', height: '28px', fontSize: '1rem' }} onClick={() => scrollRow(allScrollRef, 'right')}>›</button>
                </div>
                </section>

                {/* Additional Sections can be added here if needed */}
                <section className="netflix-section">
                <h2 className="section-title" style={{ fontSize: '0.85rem' }}>❤️ Your Library</h2>
                <div className="row-wrapper">
                    <button className="btn-netflix left" style={{ width: '28px', height: '28px', fontSize: '1rem' }} onClick={() => scrollRow(loveScrollRef, 'left')}>‹</button>
                    <div ref={loveScrollRef} className="row-scroll-container no-scrollbar" style={{ minHeight: '130px' }}>
                    {playlistSongs.length > 0 ? (
                        playlistSongs.map(song => (
                        <div key={`fav-${song.id}`} className="library-card-scaler">
                            <SongCard song={song} onPlay={() => playSong(song, playlistSongs)} />
                        </div>
                        ))
                    ) : (
                        <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No liked songs yet.</div>
                    )}
                    </div>
                    <button className="btn-netflix right" style={{ width: '28px', height: '28px', fontSize: '1rem' }} onClick={() => scrollRow(loveScrollRef, 'right')}>›</button>
                </div>
                </section>
            </div>
            )}

            {/* Search Results */}
            {(selectedEmotion !== 'All' || searchTerm) && (
            <section style={{ height: 'auto' }}>
                <h2 className="section-title" style={{ fontSize: '0.85rem' }}>🔍 Search Results ({filteredSongs.length})</h2>
                <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', 
                gap: '0.75rem',
                paddingBottom: '1rem'
                }}>
                {filteredSongs.length > 0 ? (
                    filteredSongs.map(song => (
                    <div key={song.id} className="library-card-scaler">
                        <SongCard 
                            song={song} 
                            onPlay={() => playSong(song, filteredSongs)} 
                        />
                    </div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No matching songs found.</p>
                    </div>
                )}
                </div>
            </section>
            )}
        </div>
      </div>

      <style>{`
        .library-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .library-container::-webkit-scrollbar {
          width: 5px;
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
          margin-bottom: 0.5rem;
        }
        .section-title {
          font-size: 0.8rem !important;
          color: white;
          margin-bottom: 0.5rem !important;
          padding-left: 5px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.8;
        }
        .row-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          padding: 0 2px; 
        }
        .row-scroll-container {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          scroll-behavior: smooth;
          width: 100%;
          padding: 2px 2px 8px 2px;
        }

        /* CARD SCALING FOR LIBRARY ONLY */
        .library-card-scaler {
          min-width: 105px;
          max-width: 105px;
          transition: transform 0.2s ease;
        }
        .library-card-scaler:hover {
          transform: translateY(-4px);
          z-index: 10;
        }
        .library-card-scaler .song-card-3d {
          padding: 6px !important;
          border-radius: 10px !important;
          box-shadow: 0px 2px 0px #37464f !important;
        }
        .library-card-scaler .song-card-cover {
          border-radius: 8px !important;
          margin-bottom: 4px !important;
        }
        .library-card-scaler .song-card-title {
          font-size: 0.7rem !important;
          margin-bottom: 1px !important;
        }
        .library-card-scaler .song-card-artist {
          font-size: 0.6rem !important;
        }
        .library-card-scaler .song-card-play-btn {
          width: 32px !important;
          height: 32px !important;
        }
        .library-card-scaler .song-card-like {
          width: 24px !important;
          height: 24px !important;
          font-size: 0.7rem !important;
        }

        .btn-netflix {
          position: absolute;
          z-index: 100;
          top: 45%;
          transform: translateY(-50%);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background-color: rgba(32, 47, 54, 0.95);
          color: #ec4899;
          border: 1.5px solid #37464f;
          box-shadow: 0px 2px 0px #37464f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 1rem;
          cursor: pointer;
          user-select: none;
          transition: all 0.15s ease;
          backdrop-filter: blur(4px);
        }
        .btn-netflix:hover {
          background-color: #2a3d46;
          color: #ff5eaa;
        }
        .btn-netflix:active {
          transform: translateY(-50%) translateY(2px);
          box-shadow: 0px 0px 0px #37464f;
        }
        .btn-netflix.left { left: -6px; }
        .btn-netflix.right { right: -6px; }

        .btn-3d-custom:hover:not(.active) {
          transform: translateY(-1px);
          filter: brightness(1.1);
        }
      `}</style>
    </div>
  );
};

export default Library;
