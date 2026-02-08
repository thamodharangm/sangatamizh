import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import usePlayerStore from '../stores/usePlayerStore';
import api from '../config/api';
import confetti from 'canvas-confetti';
import './SongCardExtras.css';

// Mobile-optimized Song Card Component
const SongCard = ({ song, playlist = [] }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  
  const loadTrack = usePlayerStore(state => state.loadTrack);
  const currentTrack = usePlayerStore(state => state.currentTrack);
  const isCurrentSong = currentTrack?.id === song.id;

  const checkStatus = useCallback(async () => {
    const userId = user?.uid || localStorage.getItem('guestId');
    if (!userId) return;
    try {
      const response = await api.get(`/likes/ids?userId=${userId}`);
      setIsLiked(response.data.includes(song.id));
    } catch (error) { /* silent */ }
  }, [user, song.id]);

  useEffect(() => {
    checkStatus();
    window.addEventListener('playlistUpdated', checkStatus);
    return () => window.removeEventListener('playlistUpdated', checkStatus);
  }, [checkStatus]);

  const handleLike = async (e) => {
    e.stopPropagation();
    
    // Use Firebase UID or Guest ID
    let userId = user?.uid || localStorage.getItem('guestId');
    
    // Create Guest ID if neither exists
    if (!userId) {
       userId = 'guest_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
       localStorage.setItem('guestId', userId);
    }

    if (liking) return;

    const previousState = isLiked;
    setIsLiked(!previousState);

    if (!previousState) {
      const rect = e.target.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x, y },
        colors: ['#FF0000', '#58cc02', '#ec4899', '#FFFF00', '#FF00FF'],
        disableForReducedMotion: true,
        zIndex: 9999,
      });
    }

    setLiking(true);
    try {
      const userId = user?.uid || localStorage.getItem('guestId');
      await api.post('/likes/toggle', { userId, songId: song.id });
      window.dispatchEvent(new CustomEvent('playlistUpdated'));
    } catch (error) {
      setIsLiked(previousState);
    } finally {
      setLiking(false);
    }
  };
  
  const handlePlay = () => loadTrack(song, playlist);

  const coverUrl = song.coverUrl || song.cover_url || 'https://via.placeholder.com/300';
  const title = song.title || 'Unknown Title';
  const artist = song.artist || 'Unknown Artist';

  return (
    <div className={`song-card ${isCurrentSong ? 'active' : ''}`} onClick={handlePlay}>
      <div className="song-card-cover">
        <img src={coverUrl} alt={title} loading="lazy" />
        
        <button
          className={`like-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={liking}
        >
          {isLiked ? '❤️' : '🤍'}
        </button>
        
        {isCurrentSong && (
          <div className="playing-indicator">
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </div>
        )}
      </div>

      <div className="song-card-title">{title}</div>
      <div className="song-card-artist">{artist}</div>
    </div>
  );
};

export default SongCard;
