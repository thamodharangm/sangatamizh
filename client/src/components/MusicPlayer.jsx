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
      // ensure numeric
      setScrubTime(typeof currentTime === 'number' && !isNaN(currentTime) ? currentTime : 0);
    }
  }, [currentTime, isScrubbing]);

  if (!currentSong) return null;

  // Current progress used for UI (either live audio time or scrub time while dragging)
  const currentProgress = isScrubbing ? scrubTime : (typeof currentTime === 'number' && !isNaN(currentTime) ? currentTime : 0);

  // Ensure duration is numeric and > 0 before dividing
  const safeDuration = typeof duration === 'number' && !isNaN(duration) && duration > 0 ? duration : 0;
  const percent = safeDuration ? (currentProgress / safeDuration) * 100 : 0;

  // clamp percent between 0..100
  const clampedPercent = Math.max(0, Math.min(100, percent));

  // iPhone Neon Green styling (track gradient)
  const trackStyle = {
    background: `linear-gradient(to right, #32D74B ${clampedPercent}%, #535353 ${clampedPercent}%)`
  };

  const handleScrubChange = (e) => {
    const v = Number(e.target.value);
    if (!isNaN(v)) setScrubTime(v);
  };
  
  const handleScrubStart = () => {
    setIsScrubbing(true);
  };

  const handleScrubEnd = (e) => {
    // value might come from event or fall back to scrubTime
    const valFromEvent = e && e.target && typeof e.target.value !== 'undefined' ? Number(e.target.value) : NaN;
    const newTime = !isNaN(valFromEvent) ? valFromEvent : scrubTime;
    // Seek only if valid
    if (!isNaN(newTime) && safeDuration >= 0) {
      seek(newTime);
      setScrubTime(newTime);
    }
    setIsScrubbing(false);
  };

  // ensure input value never exceeds max (avoids React warning)
  const inputValue = safeDuration ? Math.max(0, Math.min(currentProgress, safeDuration)) : 0;

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

      {/* Progress Bar (Spotify / iPhone style range input) */}
      <div className="mp-progress-container">
        <span className="mp-time">{formatTime(inputValue)}</span>
        
        <input 
          type="range"
          className="prog-range"
          min="0"
          max={safeDuration}
          step="0.1"
          value={inputValue}
          onChange={handleScrubChange}
          onMouseDown={handleScrubStart}
          onTouchStart={handleScrubStart}
          onPointerDown={handleScrubStart}
          onMouseUp={handleScrubEnd}
          onTouchEnd={handleScrubEnd}
          onPointerUp={handleScrubEnd}
          onKeyUp={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
              // commit keyboard seek when user releases key
              const v = Number(e.target.value);
              if (!isNaN(v)) seek(v);
            }
          }}
          aria-valuemin={0}
          aria-valuemax={safeDuration}
          aria-valuenow={inputValue}
          style={trackStyle}
        />
        
        <span className="mp-time">{formatTime(safeDuration)}</span>
      </div>
    </div>
  );
};

// Helper
const formatTime = (time) => {
  const t = typeof time === 'number' && !isNaN(time) ? Math.floor(time) : 0;
  const min = Math.floor(t / 60);
  const sec = t % 60;
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
};

export default MusicPlayer;
