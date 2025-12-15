// ============================================
// MUSIC PLAYER PRO - REDESIGNED
// Spotify/Apple Music Style - Attractive Layout
// ============================================

import { useEffect } from 'react';
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
    volume,
    isMuted,
    error,
    initializeAudio,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleMute,
    clearError
  } = usePlayerStore();
  
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
  const playPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferPercent = duration > 0 ? (bufferedTime / duration) * 100 : 0;
  
  // Handle seek
  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * duration;
    seek(time);
  };
  
  return (
    <>
      {/* Error Toast */}
      {error && (
        <div className="player-error-toast">
          <span>⚠️ {error}</span>
          <button onClick={clearError}>×</button>
        </div>
      )}
      
      {/* Main Player */}
      <div className="music-player-pro-redesign">
        <div className="player-content">
          {/* Left: Track Info with Cover */}
          <div className="player-track-section">
            <div className="track-cover-wrapper">
              <img 
                src={currentTrack.coverUrl || currentTrack.cover_url || '/placeholder.png'} 
                alt={currentTrack.title}
                className="track-cover-image"
              />
              {isBuffering && (
                <div className="cover-loading-overlay">
                  <div className="spinner-ring"></div>
                </div>
              )}
            </div>
            <div className="track-info-text">
              <div className="track-title-main">{currentTrack.title}</div>
              <div className="track-artist-main">{currentTrack.artist}</div>
            </div>
          </div>
          
          {/* Center: Controls & Progress */}
          <div className="player-controls-section">
            {/* Playback Controls */}
            <div className="playback-controls">
              <button 
                className="control-button prev-button"
                onClick={playPrevious}
                aria-label="Previous"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
              </button>
              
              <button 
                className="control-button play-button-main"
                onClick={togglePlay}
                disabled={isLoading}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading || isBuffering ? (
                  <div className="button-spinner"></div>
                ) : isPlaying ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>
              
              <button 
                className="control-button next-button"
                onClick={playNext}
                aria-label="Next"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 18h2V6h-2zm-11-6l8.5-6v12z"/>
                </svg>
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="progress-container">
              <span className="time-display">{formatTime(currentTime)}</span>
              <div className="progress-bar-wrapper" onClick={handleSeek}>
                <div className="progress-bar-track">
                  <div 
                    className="progress-bar-buffer"
                    style={{ width: `${bufferPercent}%` }}
                  />
                  <div 
                    className="progress-bar-fill"
                    style={{ width: `${playPercent}%` }}
                  />
                  <div 
                    className="progress-bar-thumb"
                    style={{ left: `${playPercent}%` }}
                  />
                </div>
              </div>
              <span className="time-display">{formatTime(duration)}</span>
            </div>
          </div>
          
          {/* Right: Volume Control */}
          <div className="player-volume-section">
            <button 
              className="volume-icon-button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                </svg>
              ) : volume > 0.5 ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 9v6h4l5 5V4l-5 5H7z"/>
                </svg>
              )}
            </button>
            <div className="volume-slider-container">
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume * 100}
                onChange={(e) => setVolume(e.target.value / 100)}
                className="volume-slider-input"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MusicPlayerPro;
