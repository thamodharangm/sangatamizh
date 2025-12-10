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
      <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
         <div style={{ 
           width: '180px', 
           height: '180px', 
           background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
           borderRadius: '16px',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           fontSize: '4rem',
           color: 'white',
           boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
         }}>
           ❤️
         </div>
         <div>
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
                <th style={{ padding: '1rem' }}>Title</th>
                <th style={{ padding: '1rem' }}>Artist</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {likedSongs.map((song, index) => (
                <tr key={song.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="playlist-row">
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{index + 1}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <img src={song.coverUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px' }} />
                      <span style={{ fontWeight: '600', color: 'white' }}>{song.title}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{song.artist}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                     <button 
                       className="btn-3d btn-primary" 
                       style={{ height: '32px', padding: '0 1rem', fontSize: '0.8rem' }}
                       onClick={() => playSong(song, likedSongs)}
                     >
                       Play
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
