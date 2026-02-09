import React, { useState, useRef, useEffect } from 'react';

const EmotionSongCard = ({ song, currentEmotion, newEmotion, onUpdate, emotions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const hasChange = newEmotion && newEmotion !== currentEmotion;
  const displayValue = newEmotion || currentEmotion;

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (emotion) => {
    onUpdate(song.id, emotion);
    setIsOpen(false);
  };

  return (
    <div className={`emotion-item ${hasChange ? 'modified' : ''}`} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.65rem 0.75rem',
      borderRadius: '16px',
      marginBottom: '2px',
      position: 'relative',
      background: hasChange ? 'rgba(88, 204, 2, 0.08)' : 'rgba(255, 255, 255, 0.02)',
      border: `1.5px solid ${hasChange ? 'rgba(88, 204, 2, 0.2)' : 'transparent'}`,
      boxShadow: hasChange ? '0 4px 15px rgba(88, 204, 2, 0.1)' : 'none',
      transition: 'all 0.2s ' + (hasChange ? 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'ease'),
      zIndex: isOpen ? 10 : 1
    }}>
      {/* Visual Indicator for changes */}
      {hasChange && (
        <div style={{ 
          position: 'absolute', 
          left: '0', 
          top: '25%', 
          bottom: '25%', 
          width: '3px', 
          background: 'var(--primary)', 
          borderRadius: '0 4px 4px 0',
          boxShadow: '0 0 10px var(--primary)'
        }} />
      )}

      {/* 1. Image */}
      <img 
        src={song.cover_url || 'https://via.placeholder.com/40'} 
        alt={song.title}
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          objectFit: 'cover',
          flexShrink: 0,
          border: '1px solid rgba(255,255,255,0.05)',
          background: '#000'
        }}
      />

      {/* 2. Info */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ 
          fontSize: '0.8rem', 
          fontWeight: '750', 
          color: 'white', 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          letterSpacing: '0.2px'
        }}>
          {song.title}
        </div>
        <div style={{ 
          fontSize: '0.65rem', 
          color: 'var(--text-muted)',
          fontWeight: '600',
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {song.artist} • <span style={{ opacity: 0.6 }}>{currentEmotion}</span>
        </div>
      </div>

      {/* 3. Custom Dropdown */}
      <div ref={dropdownRef} style={{ width: '90px', flexShrink: 0, position: 'relative' }}>
         <div 
           onClick={() => setIsOpen(!isOpen)}
           style={{
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'space-between',
             cursor: 'pointer',
             padding: '0.35rem 0.5rem',
             borderRadius: '10px',
             transition: 'background 0.2s',
             background: hasChange ? 'rgba(88, 204, 2, 0.15)' : 'rgba(255,255,255,0.04)',
             border: `1px solid ${hasChange ? 'rgba(88, 204, 2, 0.3)' : 'rgba(255,255,255,0.08)'}`,
             boxShadow: isOpen ? '0 0 0 2px rgba(88, 204, 2, 0.3)' : 'none'
           }}
         >
            <span style={{ 
               color: hasChange ? 'var(--primary)' : 'var(--text-main)', 
               fontSize: '0.65rem', 
               fontWeight: '800',
               whiteSpace: 'nowrap',
               maxWidth: '65px',
               overflow: 'hidden',
               textOverflow: 'ellipsis',
               textTransform: 'uppercase'
            }}>
              {displayValue}
            </span>
            <span style={{ fontSize: '0.5rem', color: hasChange ? 'var(--primary)' : 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              ▼
            </span>
         </div>

         {/* Dropdown Menu */}
         {isOpen && (
           <div style={{
             position: 'absolute',
             top: 'calc(100% + 8px)',
             right: 0,
             minWidth: '140px',
             background: 'rgba(32, 47, 54, 0.95)',
             backdropFilter: 'blur(20px)',
             border: '1px solid rgba(255,255,255,0.1)',
             borderRadius: '16px',
             boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.05)',
             padding: '0.6rem',
             zIndex: 100,
             animation: 'dropdownIn 0.2s cubic-bezier(0, 0.55, 0.45, 1)'
           }}>
             {emotions.map(emotion => (
               <div
                 key={emotion}
                 onClick={() => handleSelect(emotion)}
                 style={{
                   padding: '0.55rem 0.75rem',
                   fontSize: '0.75rem',
                   color: displayValue === emotion ? 'var(--primary)' : 'white',
                   borderRadius: '10px',
                   cursor: 'pointer',
                   fontWeight: displayValue === emotion ? '800' : '500',
                   background: displayValue === emotion ? 'rgba(88, 204, 2, 0.15)' : 'transparent',
                   marginBottom: '2px',
                   transition: 'all 0.1s',
                   display: 'flex',
                   justifyContent: 'space-between',
                   alignItems: 'center'
                 }}
                 onMouseEnter={(e) => { 
                    if(displayValue !== emotion) e.target.style.background = 'rgba(255,255,255,0.05)' 
                 }}
                 onMouseLeave={(e) => { 
                    if(displayValue !== emotion) e.target.style.background = 'transparent' 
                 }}
               >
                 {emotion}
                 {displayValue === emotion && <span style={{ fontSize: '0.6rem' }}>●</span>}
               </div>
             ))}
           </div>
         )}
      </div>
    </div>
  );
};

export default EmotionSongCard;
