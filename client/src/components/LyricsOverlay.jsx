import { useState, useEffect } from 'react';
import api from '../config/api';
import './LyricsOverlay.css';

const LyricsOverlay = ({ isOpen, onClose, currentTrack }) => {
  const [lyrics, setLyrics] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !currentTrack) return;
    
    // Reset state when track changes
    setLyrics('');
    setLoading(true);
    setError(null);
    
    const fetchLyrics = async () => {
      try {
        const { title, artist } = currentTrack;
        console.log(`Fetching lyrics for ${title} - ${artist}`);
        
        const response = await api.get('/lyrics', {
          params: { title, artist }
        });
        
        if (response.data.lyrics && response.data.lyrics !== "Lyrics not found.") {
           setLyrics(response.data.lyrics);
        } else {
           setError('Lyrics not found for this song.');
        }
      } catch (err) {
        console.error('Lyrics fetch error:', err);
        setError('Could not load lyrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchLyrics();
  }, [isOpen, currentTrack]); // Re-fetch on open or track change

  if (!isOpen) return null;

  return (
    <div className="lyrics-overlay open">
      <div className="lyrics-header">
        <div className="track-info">
            <h3>{currentTrack?.title}</h3>
            <p>{currentTrack?.artist}</p>
        </div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="lyrics-content">
        {loading ? (
             <div className="lyrics-loading">
                <div className="spinner"></div>
                <p>Finding Lyrics...</p>
             </div>
        ) : error ? (
             <div className="lyrics-error">
                <p>😔 {error}</p>
             </div>
        ) : (
             <pre className="lyrics-text">{lyrics}</pre>
        )}
      </div>
    </div>
  );
};

export default LyricsOverlay;
