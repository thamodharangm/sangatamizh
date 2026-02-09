import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import usePlayerStore from '../stores/usePlayerStore';
import api from '../config/api';

// Mobile-optimized Playlist Page - Personal playlist for each user
const Playlist = () => {
  const { user } = useAuth();
  const { loadTrack, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const navigate = useNavigate();
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's personal playlist
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
    fetchPlaylist();

    const handlePlaylistUpdate = () => {
      if (user?.uid) fetchPlaylist();
    };

    window.addEventListener('playlistUpdated', handlePlaylistUpdate);
    return () => window.removeEventListener('playlistUpdated', handlePlaylistUpdate);
  }, [user, fetchPlaylist]);

  const removeFromPlaylist = async (e, songId) => {
    e.stopPropagation();
    const userId = user?.uid || localStorage.getItem('guestId');
    if (!userId) return;
    
    try {
      await api.post('/likes/toggle', { userId, songId });
      setPlaylistSongs(prev => prev.filter(s => s.id !== songId));
      window.dispatchEvent(new CustomEvent('playlistUpdated'));
    } catch (error) {
      console.error('Failed to remove from playlist:', error);
    }
  };

  // Removed login check to allow guest playlists

  if (loading) {
    return <div className="loading-container">Loading your playlist...</div>;
  }

  return (
    <div className="playlist-page">
      <div className="playlist-header mb-3">
        <h1>🎵 My Playlist</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {playlistSongs.length} {playlistSongs.length === 1 ? 'song' : 'songs'} • {user?.displayName || user?.email || 'Guest User'}
        </p>
      </div>

      {playlistSongs.length > 0 ? (
        <div className="card-flat" style={{ 
          padding: '0', 
          borderRadius: '24px', 
          overflow: 'hidden', 
          flex: 1,
          maxHeight: 'calc(100vh - 240px)',
          display: 'flex', 
          flexDirection: 'column',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)'
        }}>
          {/* Internal Header for the List */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', flexShrink: 0 }}>
            <h2 style={{ fontSize: '0.8rem', margin: 0, fontWeight: '900', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>QUEUED TRACKS</h2>
          </div>

          <div className="playlist-list hide-scrollbar" style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '0.75rem',
            paddingBottom: '2rem'
          }}>
            {playlistSongs.map((song, index) => {
              const isCurrent = currentTrack?.id === song.id;
              return (
                <div
                  key={song.id}
                  className="playlist-item"
                  onClick={() => {
                    if (isCurrent) {
                      togglePlay();
                    } else {
                      loadTrack(song, playlistSongs);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0 12px',
                    height: '54px',
                    background: isCurrent ? 'rgba(88, 204, 2, 0.08)' : 'rgba(255,255,255,0.02)',
                    borderRadius: '16px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    border: isCurrent ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                    boxShadow: isCurrent ? '0px 4px 0px var(--primary-depth)' : '0px 3px 0px rgba(0,0,0,0.2)',
                    transition: 'transform 0.1s, box-shadow 0.1s',
                    userSelect: 'none'
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'translateY(3px)';
                    e.currentTarget.style.boxShadow = '0px 0px 0px transparent';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isCurrent ? '0px 4px 0px var(--primary-depth)' : '0px 3px 0px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isCurrent ? '0px 4px 0px var(--primary-depth)' : '0px 3px 0px rgba(0,0,0,0.2)';
                  }}
                >
                  <div style={{ 
                    width: '24px', 
                    textAlign: 'center', 
                    color: isCurrent ? 'var(--primary)' : 'var(--text-muted)', 
                    fontSize: '0.8rem',
                    fontWeight: '900',
                    display: 'flex',
                    justifyContent: 'center'
                  }}>
                    {isCurrent && isPlaying ? (
                      <div className="v2-bars">
                        <span className="v2-bar"></span>
                        <span className="v2-bar"></span>
                        <span className="v2-bar"></span>
                      </div>
                    ) : index + 1}
                  </div>

                  <img
                    src={song.coverUrl || song.cover_url || 'https://via.placeholder.com/50'}
                    alt={song.title}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      objectFit: 'cover',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      color: isCurrent ? 'var(--primary)' : 'white',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {song.title}
                    </div>
                    <div style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      fontWeight: '700',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {song.artist}
                    </div>
                  </div>

                  <button
                    onClick={(e) => removeFromPlaylist(e, song.id)}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'rgba(255, 64, 85, 0.1)',
                      color: '#ff4055',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    ❤️
                  </button>

                  <button
                    className="control-btn"
                    style={{
                      width: '34px',
                      height: '34px',
                      flexShrink: 0,
                      background: isCurrent ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      boxShadow: isCurrent ? '0 2px 8px rgba(88, 204, 2, 0.3)' : 'none',
                      border: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCurrent) {
                        togglePlay();
                      } else {
                        loadTrack(song, playlistSongs);
                      }
                    }}
                  >
                    {isCurrent && isPlaying ? '⏸' : '▶'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="empty-state card-flat">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎵</div>
          <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Your playlist is empty</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Tap the heart ❤️ on any song to add it to your playlist!
          </p>
          <button className="btn-3d btn-primary" onClick={() => navigate('/')}>
            Browse Songs
          </button>
        </div>
      )}
      <style>{`
        .v2-bars { display: flex; align-items: flex-end; gap: 2px; height: 12px; }
        .v2-bar { width: 3px; background: var(--primary); animation: wave-v2 0.5s ease-in-out infinite alternate; }
        .v2-bar:nth-child(2) { animation-delay: 0.1s; }
        .v2-bar:nth-child(3) { animation-delay: 0.2s; }
        @keyframes wave-v2 { from { height: 3px; } to { height: 12px; } }
      `}</style>
    </div>
  );
};

export default Playlist;
