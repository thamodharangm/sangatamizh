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
