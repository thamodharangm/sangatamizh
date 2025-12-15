// ============================================
// PLAYER CONTROLS COMPONENT
// Play / Pause / Next / Previous
// ============================================

import './PlayerControls.css';

const PlayerControls = ({ 
  isPlaying, 
  isLoading, 
  isBuffering,
  onTogglePlay, 
  onNext, 
  onPrevious 
}) => {
  return (
    <div className="player-controls">
      {/* Previous Button */}
      <button 
        className="control-btn prev-btn"
        onClick={onPrevious}
        aria-label="Previous track"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
        </svg>
      </button>
      
      {/* Play/Pause Button */}
      <button 
        className="control-btn play-btn"
        onClick={onTogglePlay}
        disabled={isLoading}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isLoading || isBuffering ? (
          <div className="spinner"></div>
        ) : isPlaying ? (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
          </svg>
        ) : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>
      
      {/* Next Button */}
      <button 
        className="control-btn next-btn"
        onClick={onNext}
        aria-label="Next track"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 18h2V6h-2zm-11-6l8.5-6v12z"/>
        </svg>
      </button>
    </div>
  );
};

export default PlayerControls;
