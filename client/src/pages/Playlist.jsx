import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMusic } from '../context/MusicContext';
import { useNavigate } from 'react-router-dom';

function Playlist() {
  const { user } = useAuth();
  const { playSong } = useMusic();
  const navigate = useNavigate();
  
  const [likedSongs, setLikedSongs] = useState([]);

  useEffect(() => {
    const loadLiked = () => {
      const stored = localStorage.getItem('likedSongs');
      if (stored) {
        setLikedSongs(JSON.parse(stored));
      } else {
        setLikedSongs([]);
      }
    };
    
    loadLiked();
    window.addEventListener('storage', loadLiked);
    return () => window.removeEventListener('storage', loadLiked);
  }, []);


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

  return (
    <div className="playlist-container" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <header className="playlist-header" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
         <div className="playlist-info">
            <h4 style={{ textTransform: 'uppercase', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Playlist</h4>
            <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', fontWeight: '800' }}>Liked Songs</h1>
            <p style={{ color: 'var(--text-muted)' }}>
               {likedSongs.length} songs • By {user.displayName || 'User'}
            </p>
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
             <p>No songs liked yet. Start listening and click ❤️!</p>
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
