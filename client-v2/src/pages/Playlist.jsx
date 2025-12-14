import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMusic } from '../context/MusicContext';
import api from '../config/api';

// Mobile-optimized Playlist Page (Full Feature Parity with Desktop)
const Playlist = () => {
  const { user } = useAuth();
  const { playSong, currentSong } = useMusic();
  const navigate = useNavigate();
  const [likedSongs, setLikedSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Use callback for event listener - DESKTOP FEATURE
  const fetchLikedSongs = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Use desktop API endpoint: /likes/list
      const response = await api.get(`/likes/list?userId=${user.uid}`);
      
      // Transform to match frontend format
      const transformedSongs = response.data.map(song => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        coverUrl: song.cover_url,
        audioUrl: song.file_url,
        cover_url: song.cover_url,
        file_url: song.file_url,
        category: song.category,
        emotion: song.emotion
      }));
      
      setLikedSongs(transformedSongs);
    } catch (error) {
      console.error('Error fetching liked songs:', error);
      setLikedSongs([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLikedSongs();

    // Listen for playlist updates from other components - DESKTOP FEATURE
    const handlePlaylistUpdate = () => {
      if (user?.uid) {
        fetchLikedSongs();
      }
    };

    window.addEventListener('playlistUpdated', handlePlaylistUpdate);
    
    return () => {
      window.removeEventListener('playlistUpdated', handlePlaylistUpdate);
    };
  }, [user, fetchLikedSongs]);

  if (!user) {
    return (
      <div className="playlist-page">
        <h1 className="mb-3">❤️ Liked Songs</h1>
        <div className="empty-state card-flat">
          <p>Please login to view your liked songs</p>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/login')}
            style={{ marginTop: '1rem', fontSize: '0.8rem', padding: '0.6rem 1.2rem' }}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="loading-container">Loading liked songs...</div>;
  }

  return (
    <div className="playlist-page">
      <div className="playlist-header mb-3">
        <h1>❤️ Liked Songs</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {likedSongs.length} {likedSongs.length === 1 ? 'song' : 'songs'} • By {user.displayName || user.email || 'User'}
        </p>
      </div>

      {likedSongs.length > 0 ? (
        <div className="playlist-list">
          {likedSongs.map((song, index) => (
            <div
              key={song.id}
              className="playlist-item"
              onClick={() => playSong(song, likedSongs)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                background: currentSong?.id === song.id ? 'rgba(88, 204, 2, 0.08)' : 'rgba(255, 255, 255, 0.03)', // Subtle green tint
                borderRadius: '12px',
                marginBottom: '0.5rem',
                cursor: 'pointer',
                border: '1px solid rgba(255, 255, 255, 0.05)', // Consistent subtle border
                transition: 'all 0.2s ease'
              }}
            >
              {/* Cover */}
              <img
                src={song.coverUrl || song.cover_url || 'https://via.placeholder.com/50'}
                alt={song.title}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '8px',
                  objectFit: 'cover'
                }}
              />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: 'white', // Revert to white for clarity
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {song.title}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: currentSong?.id === song.id ? 'var(--primary)' : 'var(--text-muted)', // Green Artist/Subtitle instead if needed, or keep muted
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {song.artist}
                  </div>
                </div>

                {/* Play Button - Consistent with Player */}
                <button
                  className="control-btn"
                  style={{
                    width: '36px',
                    height: '36px',
                    flexShrink: 0,
                    background: currentSong?.id === song.id ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    borderRadius: '50%',
                    fontSize: '0.9rem',
                    boxShadow: currentSong?.id === song.id ? '0 2px 8px rgba(88, 204, 2, 0.4)' : 'none',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    playSong(song, likedSongs);
                  }}
                >
                  {currentSong?.id === song.id ? '⏸' : '▶'}
                </button>
              </div>
          ))}
        </div>
      ) : (
        <div className="empty-state card-flat">
          <p>No liked songs yet</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
            Start liking songs to build your playlist!
          </p>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/')}
            style={{ marginTop: '1rem', fontSize: '0.8rem', padding: '0.6rem 1.2rem' }}
          >
            Browse Songs
          </button>
        </div>
      )}
    </div>
  );
};

export default Playlist;

