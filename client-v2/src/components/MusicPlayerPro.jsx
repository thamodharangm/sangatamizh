// ============================================
// MODERN COMPACT MUSIC PLAYER
// With Expandable View
// ============================================

import { useEffect, useState } from 'react';
import usePlayerStore from '../stores/usePlayerStore';
import './MusicPlayerPro.css';
import LyricsOverlay from './LyricsOverlay';

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
  const [showLyrics, setShowLyrics] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
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

  // Handle clicking on song info to expand
  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <>
      {/* Lyrics Overlay */}
      <LyricsOverlay 
        isOpen={showLyrics} 
        onClose={() => setShowLyrics(false)} 
        currentTrack={currentTrack} 
      />

      {/* Error Toast */}
      {error && (
        <div className="compact-error-toast">
          <span>⚠️ {error}</span>
          <button onClick={clearError}>×</button>
        </div>
      )}

      {/* Expanded View Overlay */}
      {isExpanded && (
        <div className="expanded-player-overlay" onClick={handleExpand}>
          <div className="expanded-player-container" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button className="expanded-close-btn" onClick={handleExpand}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
              </svg>
            </button>

            {/* Album Art */}
            <div className="expanded-cover-wrapper">
              <img 
                src={currentTrack.coverUrl || currentTrack.cover_url || '/placeholder.png'} 
                alt={currentTrack.title}
                className="expanded-cover-img"
              />
              {isPlaying && (
                <div className="expanded-wave-container">
                  <div className="expanded-wave-bar"></div>
                  <div className="expanded-wave-bar"></div>
                  <div className="expanded-wave-bar"></div>
                  <div className="expanded-wave-bar"></div>
                  <div className="expanded-wave-bar"></div>
                </div>
              )}
            </div>

            {/* Song Info */}
            <div className="expanded-song-info">
              <h2 className="expanded-song-title">{currentTrack.title}</h2>
              <p className="expanded-song-artist">{currentTrack.artist}</p>
            </div>

            {/* Progress Bar */}
            <div className="expanded-progress-section">
              <div 
                className="expanded-progress-bar"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  seek(percent * duration);
                }}
              >
                <div className="expanded-progress-buffer" style={{ width: `${bufferPercent}%` }} />
                <div className="expanded-progress-fill" style={{ width: `${playPercent}%` }} />
              </div>
              <div className="expanded-time-display">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="expanded-controls">
              <button className="expanded-control-btn" onClick={playPrevious}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z"/>
                </svg>
              </button>
              
              <button 
                className="expanded-play-btn"
                onClick={togglePlay}
                disabled={isLoading}
              >
                {isLoading || isBuffering ? (
                  <div className="expanded-spinner"></div>
                ) : isPlaying ? (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                ) : (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>
              
              <button className="expanded-control-btn" onClick={playNext}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
              </button>
            </div>

            {/* Lyrics Button */}
            <button 
              className="expanded-lyrics-btn"
              onClick={() => { setShowLyrics(true); setIsExpanded(false); }}
            >
              🎤 Show Lyrics
            </button>
          </div>
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
          {/* Left: Song Info - Clickable to expand */}
          <div className="compact-song-info" onClick={handleExpand} style={{ cursor: 'pointer' }}>
            <div className="compact-cover-wrapper">
              <img 
                src={currentTrack.coverUrl || currentTrack.cover_url || '/placeholder.png'} 
                alt={currentTrack.title}
                className="compact-cover-img"
              />
              {isPlaying && (
                <div className="wave-container-mini">
                  <div className="wave-bar-mini"></div>
                  <div className="wave-bar-mini"></div>
                  <div className="wave-bar-mini"></div>
                </div>
              )}
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
