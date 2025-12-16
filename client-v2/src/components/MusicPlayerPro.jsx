// ============================================
// MODERN COMPACT MUSIC PLAYER
// Horizontal layout matching reference design
// ============================================

import { useEffect, useState } from 'react';
import usePlayerStore from '../stores/usePlayerStore';
import './MusicPlayerPro.css';

const MusicPlayerPro = () => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    isBuffering,
    currentTime,
    duration,
    bufferedTime,
    error,
    initializeAudio,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    clearError
  } = usePlayerStore();
  
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  
  // Initialize audio on mount
  useEffect(() => {
    initializeAudio();
  }, [initializeAudio]);
  
  // Don't render if no track
  if (!currentTrack) return null;
  
  // Format time (seconds to MM:SS)
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate percentages
  const displayTime = isSeeking ? seekTime : currentTime;
  const playPercent = duration > 0 ? (displayTime / duration) * 100 : 0;
  const bufferPercent = duration > 0 ? (bufferedTime / duration) * 100 : 0;
  
  // Handle seek
  const handleSeekStart = (e) => {
    setIsSeeking(true);
    handleSeekMove(e);
  };
  
  const handleSeekMove = (e) => {
    if (!isSeeking && e.type !== 'click') return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.type.includes('mouse') ? e.clientX : e.touches?.[0]?.clientX || e.clientX;
    const percent = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
    const time = percent * duration;
    
    if (e.type === 'click') {
      seek(time);
    } else {
      setSeekTime(time);
    }
  };
  
  const handleSeekEnd = () => {
    if (isSeeking) {
      seek(seekTime);
      setIsSeeking(false);
    }
  };
  
  return (
    <>
      {/* Error Toast */}
      {error && (
        <div className="compact-error-toast">
          <span>⚠️ {error}</span>
          <button onClick={clearError}>×</button>
        </div>
      )}
      
      {/* Compact Music Player */}
      <div className="compact-music-player">
        {/* Progress Bar (Top - Thin Green Line) */}
        <div 
          className="compact-progress-bar"
          onClick={handleSeekMove}
          onMouseDown={handleSeekStart}
          onMouseMove={isSeeking ? handleSeekMove : undefined}
          onMouseUp={handleSeekEnd}
          onMouseLeave={handleSeekEnd}
          onTouchStart={handleSeekStart}
          onTouchMove={isSeeking ? handleSeekMove : undefined}
          onTouchEnd={handleSeekEnd}
        >
          <div className="compact-progress-track">
            <div 
              className="compact-progress-buffer"
              style={{ width: `${bufferPercent}%` }}
            />
            <div 
              className="compact-progress-fill"
              style={{ width: `${playPercent}%` }}
            />
          </div>
        </div>
        
        {/* Main Content - Horizontal Layout */}
        <div className="compact-player-main">
          {/* Left: Song Info */}
          <div className="compact-song-info">
            <div className="compact-cover-wrapper">
              <img 
                src={currentTrack.coverUrl || currentTrack.cover_url || '/placeholder.png'} 
                alt={currentTrack.title}
                className="compact-cover-img"
              />
              {(isLoading || isBuffering) && (
                <div className="compact-loading-overlay">
                  <div className="compact-spinner"></div>
                </div>
              )}
            </div>
            <div className="compact-text-info">
              <div className="compact-song-title">{currentTrack.title}</div>
              <div className="compact-song-artist">{currentTrack.artist}</div>
            </div>
          </div>
          
          {/* Right: Controls */}
          <div className="compact-controls">
            <button 
              className="compact-btn compact-prev"
              onClick={playPrevious}
              aria-label="Previous"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z"/>
              </svg>
            </button>
            
            <button 
              className="compact-btn compact-play"
              onClick={togglePlay}
              disabled={isLoading}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading || isBuffering ? (
                <div className="compact-play-spinner"></div>
              ) : isPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
            
            <button 
              className="compact-btn compact-next"
              onClick={playNext}
              aria-label="Next"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MusicPlayerPro;
