// ============================================
// PRODUCTION-GRADE MUSIC PLAYER COMPONENT
// Apple Music / Spotify Level UI
// ============================================

import { useEffect } from 'react';
import usePlayerStore from '../stores/usePlayerStore';
import PlayerControls from './PlayerControls';
import ProgressBar from './ProgressBar';
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
  
  return (
    <div className="music-player-pro">
      {/* Error Toast */}
      {error && (
        <div className="player-error">
          <span>{error}</span>
          <button onClick={clearError}>×</button>
        </div>
      )}
      
      {/* Main Player */}
      <div className="player-container">
        {/* Track Info */}
        <div className="track-info">
          <img 
            src={currentTrack.coverUrl || currentTrack.cover_url || '/placeholder.png'} 
            alt={currentTrack.title}
            className="track-cover"
          />
          <div className="track-details">
            <div className="track-title">{currentTrack.title}</div>
            <div className="track-artist">{currentTrack.artist}</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="progress-section">
          <span className="time-current">{formatTime(currentTime)}</span>
          <ProgressBar 
            currentTime={currentTime}
            duration={duration}
            bufferedTime={bufferedTime}
            onSeek={seek}
          />
          <span className="time-total">{formatTime(duration)}</span>
        </div>
        
        {/* Controls */}
        <PlayerControls
          isPlaying={isPlaying}
          isLoading={isLoading}
          isBuffering={isBuffering}
          onTogglePlay={togglePlay}
          onNext={playNext}
          onPrevious={playPrevious}
        />
        
        {/* Volume Control (Desktop Only) */}
        <div className="volume-control desktop-only">
          <button 
            className="volume-btn"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : volume > 0.5 ? '🔊' : '🔉'}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume * 100}
            onChange={(e) => setVolume(e.target.value / 100)}
            className="volume-slider"
          />
        </div>
      </div>
    </div>
  );
};

export default MusicPlayerPro;
