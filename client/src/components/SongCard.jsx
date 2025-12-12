import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';

const SongCard = ({ song, onPlay }) => {
  const [isLiked, setIsLiked] = useState(false);
  const { user } = useAuth();

  // On mount, if 'song' has a 'liked' property from backend, use it.
  // Otherwise, we might need to fetch status? 
  // For scalability, let's assume the parent list might pass initial 'isLiked' status if it fetched it.
  // But since we are incrementally upgrading, let's keep it simple: 
  // We won't fetch individual status per card to avoid N+1 requests.
  // We rely on the User doing the action or Parent Component passing 'likedIds'.
  // For now, let's just make the Action work.
  
  const handleLike = async (e) => {
    e.stopPropagation();
    
    if (!user) {
        // Simple alert or redirect
        alert("Please Login to Like Songs!"); 
        return;
    }

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

    try {
        await api.post('/likes/toggle', { 
            userId: user.uid, // Firebase UID 
            songId: song.id 
        });
        // Success
    } catch (err) {
        console.error("Like Toggle Failed", err);
        // Revert UI on failure
        setIsLiked(previousState);
    }
  };

  return (
    <>
      <div 
        className="card-flat song-card" 
        onClick={() => onPlay && onPlay(song)} 
        style={{ 
          cursor: 'pointer', 
          padding: '0.75rem', 
          position: 'relative',
          background: 'rgba(30, 41, 59, 0.4)', // Glassmorphism base
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          transition: 'transform 0.2s ease, background 0.2s ease',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
          const overlay = e.currentTarget.querySelector('.play-overlay');
          if(overlay) overlay.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.background = 'rgba(30, 41, 59, 0.4)';
          const overlay = e.currentTarget.querySelector('.play-overlay');
          if(overlay) overlay.style.opacity = '0';
        }}
      >
        <div style={{ 
          position: 'relative',
          width: '100%', 
          aspectRatio: '1/1', 
          borderRadius: '12px', 
          overflow: 'hidden', 
          marginBottom: '0.75rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
          <img 
            src={song.coverUrl || song.cover_url || 'https://via.placeholder.com/300'} 
            alt={song.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
            className="card-image"
          />
          
          {/* Top Right Like Button (Always visible if liked, or on hover via parent) */}
          <button 
                onClick={handleLike}
                className="like-btn"
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: isLiked ? 'rgba(255, 0, 50, 0.2)' : 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(4px)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: isLiked ? '#ff4055' : 'white',
                  cursor: 'pointer',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
             >
               {isLiked ? '❤️' : '🤍'}
          </button>

          {/* Premium Play Overlay */}
           <div className="play-overlay" style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'all 0.3s ease',
            pointerEvents: 'none' 
          }}>
             <div style={{
               width: '50px',
               height: '50px',
               borderRadius: '50%',
               background: 'var(--primary)',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
               transform: 'scale(1)',
               transition: 'transform 0.2s',
               pointerEvents: 'auto',
               cursor: 'pointer'
             }}
             className="play-btn"
             onClick={(e) => {
               e.stopPropagation();
               onPlay && onPlay(song);
             }}
             >
               <span style={{ fontSize: '1.5rem', color: 'white', marginLeft: '4px' }}>▶</span>
             </div>
          </div>
        </div>
        
        <div style={{ padding: '0 0.25rem' }}>
          <h3 style={{ 
            fontSize: '0.95rem', 
            fontWeight: '600', 
            marginBottom: '0.25rem', 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            color: 'white' 
          }}>
            {song.title}
          </h3>
          <p style={{ 
            fontSize: '0.8rem', 
            color: 'var(--text-muted)', 
            margin: 0,
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis'
          }}>
            {song.artist}
          </p>
        </div>
      </div>
      <style>{`
        .card-flat:hover .card-image {
           transform: scale(1.05);
        }
        .song-card:hover .like-btn {
          opacity: 1;
          transform: scale(1);
        }
      `}</style>
    </>
  );
};

export default SongCard;
