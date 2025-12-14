import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import confetti from 'canvas-confetti';

// Mobile-optimized Song Card Component
const SongCard = ({ song, onPlay }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  // Fetch initial liked status when component mounts
  useEffect(() => {
    const checkLikedStatus = async () => {
      if (!user?.uid) return;
      
      try {
        const response = await api.get(`/likes/ids?userId=${user.uid}`);
        const likedIds = response.data;
        setIsLiked(likedIds.includes(song.id));
      } catch (error) {
        // Silent error
      }
    };

    checkLikedStatus();
  }, [user, song.id]);

  const handleLike = async (e) => {
    e.stopPropagation();
    
    if (!user) {
      alert('Please Login to Like Songs!');
      return;
    }

    if (liking) return;

    // Optimistic Update
    const previousState = isLiked;
    setIsLiked(!previousState);

    // Confetti Effect if Liking
    if (!previousState) {
      const rect = e.target.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x, y },
        colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'],
        disableForReducedMotion: true,
        zIndex: 9999,
      });
    }

    setLiking(true);

    try {
      await api.post('/likes/toggle', {
        userId: user.uid,
        songId: song.id
      });

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('playlistUpdated'));

    } catch (error) {
      console.error('Like Toggle Failed', error);
      setIsLiked(previousState);
    } finally {
      setLiking(false);
    }
  };

  const coverUrl = song.coverUrl || song.cover_url || 'https://via.placeholder.com/300';
  const title = song.title || 'Unknown Title';
  const artist = song.artist || 'Unknown Artist';

  return (
    <div className="song-card" onClick={onPlay}>
      <div className="song-card-cover">
        <img 
          src={coverUrl} 
          alt={title}
          loading="lazy"
        />
        
        {/* Like Button */}
        <button
          className={`like-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={liking}
        >
          {isLiked ? '❤️' : '🤍'}
        </button>
      </div>

      <div className="song-card-title">{title}</div>
      <div className="song-card-artist">{artist}</div>
    </div>
  );
};

export default SongCard;
