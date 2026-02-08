import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';

const SongCard = ({ song, onPlay }) => {
  const [isLiked, setIsLiked] = useState(false);
  const { user } = useAuth();
  
  const handleCardClick = (e) => {
    if (e.target.closest('.song-card-like')) return;
    if (onPlay) onPlay(song);
  };

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

    try {
        const userId = user?.uid || localStorage.getItem('guestId');
        await api.post('/likes/toggle', { userId, songId: song.id });
        window.dispatchEvent(new CustomEvent('playlistUpdated'));
    } catch (err) {
        setIsLiked(previousState);
    }
  };

  return (
    <>
      <div className="song-card-3d" onClick={handleCardClick}>
        <div className="song-card-cover">
          <img 
            src={song.coverUrl || song.cover_url || 'https://via.placeholder.com/300'} 
            alt={song.title}
            className="song-card-image"
          />
          
          <button 
            onClick={handleLike}
            className={`song-card-like ${isLiked ? 'liked' : ''}`}
          >
            {isLiked ? '❤️' : '🤍'}
          </button>

          <div className="song-card-play-overlay">
            <div className="song-card-play-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </div>
        
        <div className="song-card-info">
          <h3 className="song-card-title">{song.title}</h3>
          <p className="song-card-artist">{song.artist}</p>
        </div>
      </div>
      
      <style>{`
        .song-card-3d {
          background: #202f36;
          border: 2px solid #37464f;
          border-radius: 16px;
          padding: 10px;
          box-shadow: 0px 4px 0px #37464f;
          cursor: pointer;
          transition: transform 0.1s, box-shadow 0.1s;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .song-card-3d:active { transform: translateY(4px); box-shadow: 0px 0px 0px #37464f; }
        
        .song-card-cover {
          position: relative;
          width: 100%;
          aspect-ratio: 1/1;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 8px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        
        .song-card-image { width: 100%; height: 100%; object-fit: cover; }
        
        .song-card-like {
          position: absolute; top: 6px; right: 6px;
          width: 32px; height: 32px;
          border-radius: 50%;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.1);
          color: white; font-size: 0.9rem;
          display: flex; align-items: center; justify-content: center;
          z-index: 10; cursor: pointer;
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          opacity: 0;
        }
        .song-card-3d:hover .song-card-like { opacity: 1; }
        .song-card-like.liked { opacity: 1; color: #ff4055; background: rgba(0,0,0,0.6); animation: pulse-v1 0.4s ease; border-color: rgba(255, 64, 85, 0.4); }
        .song-card-like:hover { transform: scale(1.1); }

        @keyframes pulse-v1 {
          0% { transform: scale(1); }
          50% { transform: scale(1.4); }
          100% { transform: scale(1); }
        }

        .song-card-play-overlay {
          position: absolute; inset: 0;
          background: rgba(0, 0, 0, 0.3);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.2s;
        }
        .song-card-3d:hover .song-card-play-overlay { opacity: 1; }
        
        .song-card-play-btn {
          width: 44px; height: 44px;
          border-radius: 50%; background: #58cc02;
          box-shadow: 0px 4px 0px #46a302;
          display: flex; align-items: center; justify-content: center;
        }
        
        .song-card-title { font-size: 0.85rem; font-weight: 800; color: #f8fafc; margin: 0 0 2px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .song-card-artist { font-size: 0.7rem; color: #afbacc; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      `}</style>
    </>
  );
};

export default SongCard;
