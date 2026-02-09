import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMusic } from '../context/MusicContext';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

function Playlist() {
  const { user } = useAuth();
  const { playSong, currentSong, isPlaying, togglePlay } = useMusic();
  const navigate = useNavigate();
  
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlaylist = useCallback(async () => {
    const userId = user?.uid || localStorage.getItem('guestId');
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/likes/songs?userId=${userId}`);
      
      const data = Array.isArray(response.data) ? response.data : [];
      
      // Transform to match frontend format
      const transformedSongs = data.map(song => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        coverUrl: song.cover_url || song.coverUrl,
        audioUrl: song.file_url || song.audioUrl,
        category: song.category,
        emotion: song.emotion
      }));
      
      setPlaylistSongs(transformedSongs);
    } catch (error) {
      console.error('Error fetching playlist:', error);
      setPlaylistSongs([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const userId = user?.uid || localStorage.getItem('guestId');
    if (userId) {
      fetchPlaylist();
    } else {
      setPlaylistSongs([]);
      setLoading(false);
    }

    // Listen for playlist updates from other components
    const handlePlaylistUpdate = () => {
      const userId = user?.uid || localStorage.getItem('guestId');
      if (userId) {
        fetchPlaylist();
      }
    };

    window.addEventListener('playlistUpdated', handlePlaylistUpdate);
    
    return () => {
      window.removeEventListener('playlistUpdated', handlePlaylistUpdate);
    };
  }, [user, fetchPlaylist]);

  // Remove song from playlist
  const removeFromPlaylist = async (e, songId) => {
    e.stopPropagation();
    const userId = user?.uid || localStorage.getItem('guestId');
    if (!userId) return;
    
    try {
      await api.post('/likes/toggle', { userId, songId });
      // Update local state immediately
      setPlaylistSongs(prev => prev.filter(s => s.id !== songId));
      window.dispatchEvent(new CustomEvent('playlistUpdated'));
    } catch (error) {
      console.error('Failed to remove from playlist:', error);
    }
  };

  // Removed login check to allow guest playlists

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <h2>Loading your playlist...</h2>
      </div>
    );
  }

  return (
    <div className="playlist-container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      width: '100%',
      overflow: 'hidden'
    }}>
      <header className="playlist-header" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
         <div className="playlist-info">
            <h4 style={{ textTransform: 'uppercase', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>PLAYLIST</h4>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: '800' }}>🎵 My Playlist</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {playlistSongs.length} songs • By {user?.displayName || user?.email || 'Guest User'}
            </p>
         </div>
      </header>

      {/* Scrollable Song List Container */}
      <div 
        className="no-scrollbar"
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.5rem',
          paddingRight: '4px',
          paddingBottom: '2rem'
        }}
      >
        {playlistSongs.length > 0 ? (
          playlistSongs.map((song, index) => {
            const isCurrent = currentSong?.id === song.id;
            return (
              <div 
                key={song.id} 
                className={`playlist-row-v1 ${isCurrent ? 'active' : ''}`}
                onClick={() => {
                   if (isCurrent) {
                     togglePlay();
                   } else {
                     playSong(song, playlistSongs);
                   }
                }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  padding: '0 1rem',
                  height: '52px',
                  background: isCurrent ? 'rgba(88, 204, 2, 0.1)' : 'var(--bg-card, #202f36)',
                  border: isCurrent ? '2px solid var(--primary, #58cc02)' : '2px solid var(--border-color, #37464f)',
                  boxShadow: isCurrent ? '0px 3px 0px var(--primary-depth, #46a302)' : '0px 3px 0px var(--border-color, #37464f)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                  userSelect: 'none',
                  position: 'relative',
                  marginBottom: '4px',
                  flexShrink: 0
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(3px)';
                  e.currentTarget.style.boxShadow = '0px 0px 0px transparent';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  const currentIsActive = currentSong?.id === song.id;
                  e.currentTarget.style.boxShadow = currentIsActive ? '0px 3px 0px var(--primary-depth, #46a302)' : '0px 3px 0px var(--border-color, #37464f)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  const currentIsActive = currentSong?.id === song.id;
                  e.currentTarget.style.boxShadow = currentIsActive ? '0px 3px 0px var(--primary-depth, #46a302)' : '0px 3px 0px var(--border-color, #37464f)';
                }}
              >
                {/* Index / Indicator */}
                <div style={{ width: '24px', fontSize: '0.8rem', fontWeight: '800', color: isCurrent ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {isCurrent && isPlaying ? (
                    <div className="playing-bars">
                      <span className="bar"></span>
                      <span className="bar"></span>
                      <span className="bar"></span>
                    </div>
                  ) : index + 1}
                </div>

                {/* Cover Art */}
                <img 
                  src={song.coverUrl} 
                  alt="" 
                  style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '8px', 
                    objectFit: 'cover',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }} 
                />

                {/* Song Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: '700', 
                    fontSize: '0.9rem',
                    color: isCurrent ? 'var(--primary)' : 'white',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {song.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                    {song.artist}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button 
                    onClick={(e) => removeFromPlaylist(e, song.id)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#ff4055', 
                      fontSize: '1rem', 
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                    title="Remove"
                  >
                    ❤️
                  </button>
                  
                  <div 
                    className="play-indicator-v1"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isCurrent ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.9rem',
                      boxShadow: isCurrent ? '0 3px 8px rgba(88, 204, 2, 0.3)' : 'none'
                    }}
                  >
                    {isCurrent && isPlaying ? '⏸' : '▶'}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '24px' }}>
             <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎵</div>
             <h3 style={{ marginBottom: '0.25rem', color: 'white', fontSize: '1.25rem', fontWeight: '800' }}>Empty Collection</h3>
             <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Start adding songs to build your vibe.</p>
             <button className="btn-3d btn-primary" style={{ height: '40px', fontSize: '0.85rem' }} onClick={() => navigate('/')}>
                Discover Tracks
             </button>
          </div>
        )}
      </div>
      <style>{`
        .playlist-row-v1:active {
           filter: brightness(0.9);
        }
        .playing-bars {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 12px;
        }
        .playing-bars .bar {
          width: 2.5px;
          background: var(--primary);
          animation: bar-dance 0.5s ease-in-out infinite alternate;
        }
        .playing-bars .bar:nth-child(2) { animation-delay: 0.1s; animation-duration: 0.4s; }
        .playing-bars .bar:nth-child(3) { animation-delay: 0.2s; animation-duration: 0.6s; }
        
        @keyframes bar-dance {
          from { height: 3px; }
          to { height: 12px; }
        }
      `}</style>
    </div>
  );
}

export default Playlist;
