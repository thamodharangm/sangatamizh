import { useState } from 'react';
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
  const [isExpanded, setIsExpanded] = useState(false);

  if (!currentSong) return null;

  // Calculate percentage for gradient background
  // When scrubbing, use scrubTime; otherwise use currentTime
  const currentProgress = isScrubbing ? scrubTime : currentTime;
  const percent = duration ? (currentProgress / duration) * 100 : 0;
  
  // Duolingo Style Green styling
  const trackStyle = {
    background: `linear-gradient(to right, #58cc02 ${percent}%, #535353 ${percent}%)`
  };

  const handleScrubChange = (e) => {
    // User is dragging
    setScrubTime(Number(e.target.value));
  };
  
  const handleScrubStart = () => {
    setIsScrubbing(true);
    setScrubTime(currentTime); // Initialize scrubTime to current time when starting
  };

  const handleScrubEnd = (e) => {
    // User let go
    const newTime = Number(e.target.value);
    seek(newTime);
    setIsScrubbing(false);
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Expanded View Overlay */}
      {isExpanded && (
        <div className="expanded-overlay" onClick={handleExpand}>
          <div className="expanded-container" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button className="expanded-close" onClick={handleExpand}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
              </svg>
            </button>

            {/* Album Art - Left Side */}
            <div className="expanded-art-wrapper">
              <div 
                className="expanded-art" 
                style={{ backgroundImage: `url(${currentSong.coverUrl || 'https://via.placeholder.com/300'})` }}
              />
              {isPlaying && (
                <div className="expanded-wave">
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                </div>
              )}
            </div>

            {/* Right Section - Song Info, Progress, Controls */}
            <div className="expanded-right-section">
              {/* Song Info */}
              <div className="expanded-info">
                <h2 className="expanded-title">{currentSong.title}</h2>
                <p className="expanded-artist">{currentSong.artist}</p>
              </div>

              {/* Progress Bar */}
              <div className="expanded-progress">
                <input 
                  type="range"
                  className="expanded-slider"
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
                <div className="expanded-times">
                  <span>{formatTime(currentProgress)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="expanded-controls">
                <button className="btn-3d btn-secondary expanded-btn" onClick={prevSong}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 20L9 12l10-8v16zM5 4h2v16H5V4z"/>
                  </svg>
                </button>
                
                <button className="btn-3d btn-primary expanded-play-btn" onClick={togglePlay}>
                  {isPlaying ? (
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  ) : (
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
                
                <button className="btn-3d btn-secondary expanded-btn" onClick={nextSong}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 4l10 8-10 8V4zm14 0h2v16h-2V4z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact Player */}
      <div className="music-player">
        <div className="mp-song-info" onClick={handleExpand} style={{ cursor: 'pointer' }}>
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
    </>
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
