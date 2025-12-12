import { useState, useRef, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
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

  const [isExpanded, setIsExpanded] = useState(false);
  const progressInnerRef = useRef(null);

  if (!currentSong) return null;

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e) => {
    e.stopPropagation(); // Prevent drag/click propagation
    const width = e.currentTarget.clientWidth;
    const clickX = e.nativeEvent.offsetX;
    const newTime = (clickX / width) * duration;
    seek(newTime);
  };

  // Gestures
  const bind = useDrag(({ swipe: [swipeX, swipeY], tap }) => {
    // If user tapped, handle click (expand or nothing if already handled)
    if (tap && !isExpanded) {
        setIsExpanded(true);
        return;
    }

    if (swipeY === -1) {
        // Swipe Up -> Expand
        if (!isExpanded) setIsExpanded(true);
    } else if (swipeY === 1) {
        // Swipe Down -> Minimize
        if (isExpanded) setIsExpanded(false);
    } else if (swipeX === -1) {
        // Swipe Left -> Next
        nextSong();
    } else if (swipeX === 1) {
        // Swipe Right -> Prev
        prevSong();
    }
  }, { 
      filterTaps: true, 
      axis: 'lock', // Detect axis movement
  });

  return (
    <AnimatePresence>
      {!isExpanded ? (
        /* MINI PLAYER */
        <motion.div 
            className="music-player mini-player"
            {...bind()}
            key="mini-player"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
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

            <div className="mp-controls">
                <button 
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="btn-3d btn-primary mp-play-btn"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                {isPlaying ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                )}
                </button>
            </div>

            {/* Progress Bar (Interactive) */}
            <div className="mp-progress-container" onClick={handleSeek}>
                <div 
                    className="mp-progress-bar" 
                    style={{ width: `${progressPercent}%` }}
                ></div>
            </div>
        </motion.div>
      ) : (
        /* FULL SCREEN PLAYER */
        <motion.div 
            className="music-player-full"
            {...bind()}
            key="full-player"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
            <div className="full-player-header">
                <button 
                    onClick={() => setIsExpanded(false)}
                    className="icon-btn"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                <span>Now Playing</span>
                <div style={{width: 24}}></div> {/* Spacer */}
            </div>

            <div className="full-player-art-container">
                <motion.div 
                    className="full-player-art"
                    style={{ backgroundImage: `url(${currentSong.coverUrl || 'https://via.placeholder.com/300'})` }}
                    animate={{ scale: isPlaying ? 1 : 0.9 }}
                    transition={{ duration: 0.4 }}
                />
            </div>

            <div className="full-player-info">
                <h2>{currentSong.title}</h2>
                <p>{currentSong.artist}</p>
            </div>

            <div className="full-player-progress-wrapper" onClick={handleSeek}>
                 <div className="full-time-codes">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                 </div>
                 <div className="full-progress-bg">
                    <div 
                        className="full-progress-fill"
                        style={{ width: `${progressPercent}%` }}
                    >
                        <div className="full-progress-knob" />
                    </div>
                 </div>
            </div>

            <div className="full-player-controls">
                <button onClick={(e) => { e.stopPropagation(); prevSong(); }} className="ctrl-btn-lg">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                </button>

                <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="play-btn-lg">
                    {isPlaying ? (
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    ) : (
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    )}
                </button>

                <button onClick={(e) => { e.stopPropagation(); nextSong(); }} className="ctrl-btn-lg">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                </button>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
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

  if (!currentSong) return null;

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e) => {
    const width = e.currentTarget.clientWidth;
    const clickX = e.nativeEvent.offsetX;
    const newTime = (clickX / width) * duration;
    seek(newTime);
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

      {/* Progress Bar (Interactive) */}
      <div className="mp-progress-container" onClick={handleSeek}>
        <div 
          className="mp-progress-bar" 
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
    </div>
  );
};

export default MusicPlayer;
