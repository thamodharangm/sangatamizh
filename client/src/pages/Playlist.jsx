import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMusic } from '../context/MusicContext';
import { useNavigate } from 'react-router-dom';

// Use relative path to leverage Vite proxy (defined in vite.config.js)
const API_URL = import.meta.env.VITE_API_URL || '/api';

function Playlist() {
  const { user } = useAuth();
  const { playSong } = useMusic();
  const navigate = useNavigate();
  
  const [likedSongs, setLikedSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLikedSongs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/likes/list?userId=${user.uid}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch liked songs');
      }
      
      const songs = await response.json();
      
      // Transform to match frontend format
      const transformedSongs = songs.map(song => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        coverUrl: song.cover_url,
        audioUrl: song.file_url,
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
    if (user?.uid) {
      fetchLikedSongs();
    } else {
      setLikedSongs([]);
      setLoading(false);
    }

    // Listen for playlist updates from other components
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
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <h2>Please log in to view your playlist</h2>
        <button className="btn-3d btn-primary" onClick={() => navigate('/login')} style={{ marginTop: '1rem' }}>
            Login
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <h2>Loading your playlist...</h2>
      </div>
    );
  }

  return (
    <div className="playlist-container" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <header className="playlist-header" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
         <div className="playlist-info">
            <h4 style={{ textTransform: 'uppercase', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>PLAYLIST</h4>
            <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', fontWeight: '800' }}>My Playlist</h1>
            <p style={{ color: 'var(--text-muted)' }}>
               {likedSongs.length} songs • By {user.displayName || user.email || 'User'}
            </p>
            {/* Debug removed */}
         </div>
      </header>

      {/* Song List */}
      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', overflow: 'hidden' }}>
        {likedSongs.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <th style={{ padding: '1rem', width: '50px' }}>#</th>
                <th style={{ padding: '1rem' }}>Song</th>
                <th style={{ padding: '1rem', textAlign: 'right', width: '80px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {likedSongs.map((song, index) => (
                <tr key={song.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="playlist-row">
                  <td style={{ padding: '1rem', color: 'var(--text-muted)', width: '50px', verticalAlign: 'middle' }}>{index + 1}</td>
                  <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <img src={song.coverUrl} alt="" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: '600', color: 'white', fontSize: '0.95rem', lineHeight: '1.2' }}>{song.title}</span>
                         <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{song.artist}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', verticalAlign: 'middle' }}>
                     <button 
                       className="btn-3d btn-primary"
                       style={{ height: '40px', width: '40px', padding: 0, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                       onClick={() => playSong(song, likedSongs)}
                       title="Play"
                     >
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                         <path d="M8 5v14l11-7z" />
                       </svg>
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
             <p>No songs in your playlist yet. Start listening and click ❤️!</p>
             <button className="btn-3d btn-secondary" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
                Browse Songs
             </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Playlist;
