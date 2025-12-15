import { useState, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';

// Mobile-optimized Compact Music Player (Full Feature Parity with Desktop)
const MusicPlayer = () => {
  const {
    currentSong,
    isPlaying,
    togglePlay,
    nextSong,
    prevSong,
    currentTime,
    duration,
    bufferedTime,
    isBuffering, // Import buffering state
    seek
  } = useMusic();

  // Local state for smooth scrubbing (DESKTOP FEATURE)
  const [scrubTime, setScrubTime] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Sync scrubTime only when NOT scrubbing
  useEffect(() => {
    if (!isScrubbing) {
      setScrubTime(currentTime);
    }
  }, [currentTime, isScrubbing]);

  if (!currentSong) return null;

  // Calculate percentage for gradient background
  const currentProgress = isScrubbing ? scrubTime : currentTime;
  const playPercent = duration ? (currentProgress / duration) * 100 : 0;
  const bufferPercent = duration ? (bufferedTime / duration) * 100 : 0;

  // iPhone Neon Green styling + Buffer visual
  // Green (#58cc02) -> Played
  // Gray (#71717a) -> Buffered
  // Dark (#27272a) -> Unloaded
  const trackStyle = {
    background: `linear-gradient(to right, 
      #58cc02 0%, 
      #58cc02 ${playPercent}%, 
      #71717a ${playPercent}%, 
      #71717a ${bufferPercent}%, 
      #27272a ${bufferPercent}%, 
      #27272a 100%)`
  };

  const handleScrubChange = (e) => {
    // User is dragging
    setScrubTime(Number(e.target.value));
  };

  const handleScrubStart = () => {
    setIsScrubbing(true);
  };

  const handleScrubEnd = (e) => {
    // User let go
    setIsScrubbing(false);
    seek(Number(e.target.value));
  };
 
  // ... rest of file
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="music-player">
      <div className="player-content">
        {/* Cover */}
        <img
          src={currentSong.coverUrl || currentSong.cover_url || 'https://via.placeholder.com/50'}
          alt={currentSong.title}
          className="player-cover"
        />

        {/* Info */}
        <div className="player-info">
          <div className="player-title">{currentSong.title}</div>
          <div className="player-artist">{currentSong.artist}</div>
        </div>

        {/* Controls */}
        <div className="player-controls">
          <button className="control-btn secondary" onClick={prevSong}>
            <span>⏮</span>
          </button>
          
          <button className="control-btn" onClick={togglePlay} disabled={isBuffering}>
            <span>{isBuffering ? '⏳' : (isPlaying ? '⏸' : '▶')}</span>
          </button>
          
          <button className="control-btn secondary" onClick={nextSong}>
            <span>⏭</span>
          </button>
        </div>
      </div>

      {/* Progress Bar with Scrubbing (DESKTOP FEATURE) */}
      <div style={{ marginTop: '0.5rem' }}>
        <input
          type="range"
          className="prog-range"
          min="0"
          max={duration || 0}
          value={currentProgress}
          onChange={handleScrubChange}
          onMouseDown={handleScrubStart}
          onTouchStart={handleScrubStart}
          onMouseUp={handleScrubEnd}
          onTouchEnd={handleScrubEnd}
          style={{
            width: '100%',
            height: '4px',
            borderRadius: '2px',
            outline: 'none',
            WebkitAppearance: 'none',
            appearance: 'none',
            cursor: 'pointer',
            ...trackStyle
          }}
        />
      </div>

      {/* Time Display */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        marginTop: '0.25rem'
      }}>
        <span>{formatTime(currentProgress)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default MusicPlayer;
