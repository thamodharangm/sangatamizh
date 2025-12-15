// ============================================
// PROGRESS BAR COMPONENT
// Seekable progress with buffer indicator
// ============================================

import { useState, useRef } from 'react';
import './ProgressBar.css';

const ProgressBar = ({ currentTime, duration, bufferedTime, onSeek }) => {
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const progressRef = useRef(null);
  
  // Calculate percentages
  const playPercent = duration > 0 ? ((isSeeking ? seekTime : currentTime) / duration) * 100 : 0;
  const bufferPercent = duration > 0 ? (bufferedTime / duration) * 100 : 0;
  
  // Handle seek start
  const handleSeekStart = (e) => {
    setIsSeeking(true);
    handleSeekMove(e);
  };
  
  // Handle seek move
  const handleSeekMove = (e) => {
    if (!progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const percent = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
    const time = percent * duration;
    
    setSeekTime(time);
  };
  
  // Handle seek end
  const handleSeekEnd = () => {
    if (isSeeking) {
      onSeek(seekTime);
      setIsSeeking(false);
    }
  };
  
  // Handle click
  const handleClick = (e) => {
    if (!progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * duration;
    
    onSeek(time);
  };
  
  return (
    <div 
      ref={progressRef}
      className="progress-bar"
      onClick={handleClick}
      onMouseDown={handleSeekStart}
      onMouseMove={isSeeking ? handleSeekMove : undefined}
      onMouseUp={handleSeekEnd}
      onMouseLeave={handleSeekEnd}
      onTouchStart={handleSeekStart}
      onTouchMove={isSeeking ? handleSeekMove : undefined}
      onTouchEnd={handleSeekEnd}
    >
      {/* Background Track */}
      <div className="progress-track">
        {/* Buffer Bar (Gray) */}
        <div 
          className="progress-buffer"
          style={{ width: `${bufferPercent}%` }}
        />
        
        {/* Play Bar (Green) */}
        <div 
          className="progress-play"
          style={{ width: `${playPercent}%` }}
        />
        
        {/* Seek Handle */}
        <div 
          className="progress-handle"
          style={{ left: `${playPercent}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
