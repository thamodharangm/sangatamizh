import { useState, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import './MusicPlayer.css';

const MusicPlayer = () => {
  const { 
    currentSong, 
    isPlaying, 
    togglePlay, 
    nextSong, 
    prevSong,
    currentTime,
    duration,
    seek 
  } = useMusic();
  
  // Local state for smooth scrubbing
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
  // Calculate percentage for gradient background
  const currentProgress = isScrubbing ? scrubTime : currentTime;
  const percent = duration ? (currentProgress / duration) * 100 : 0;
  
  // iPhone Neon Green styling
  const trackStyle = {
    background: `linear-gradient(to right, #32D74B ${percent}%, #535353 ${percent}%)`
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

  return (
    <div className="music-player">
      <div className="mp-song-info">
        <div 
          className="mp-art" 
          style={{ backgroundImage: `url(${currentSong.coverUrl || 'https://via.placeholder.com/50'})` }} 
        />
        <div className="mp-details">
          <h4 className="mp-title">{currentSong.title}</h4>
          <p className="mp-artist">{currentSong.artist}</p>
        </div>
      </div>

      <div className="mp-controls" style={{ gap: '1rem' }}>
        <button 
          className="btn-3d btn-secondary" 
          onClick={prevSong} 
          aria-label="Previous"
          style={{ padding: '0', width: '48px', height: '48px', borderRadius: '50%' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
             <path d="M19 20L9 12l10-8v16zM5 4h2v16H5V4z"/>
          </svg>
        </button>
        
        <button 
          onClick={togglePlay}
          className="btn-3d btn-primary"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          style={{ padding: '0', width: '56px', height: '56px', borderRadius: '50%' }}
        >
          {isPlaying ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
        
        <button 
          className="btn-3d btn-secondary" 
          onClick={nextSong} 
          aria-label="Next"
          style={{ padding: '0', width: '48px', height: '48px', borderRadius: '50%' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 4l10 8-10 8V4zm14 0h2v16h-2V4z"/>
          </svg>
        </button>
      </div>

      {/* Progress Bar (Spotify Style Range Input) */}
      <div className="mp-progress-container">
        <span className="mp-time">{formatTime(currentProgress)}</span>
        
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
            style={trackStyle}
        />
        
        <span className="mp-time">{formatTime(duration)}</span>
      </div>
    </div>
  );
};

// Helper
const formatTime = (time) => {
    if (!time) return '0:00';
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
};

export default MusicPlayer;
