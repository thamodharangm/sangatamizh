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
      padding: '0.5rem 0.25rem',
      borderBottom: '1px solid var(--border-color)',
      position: 'relative',
      backgroundColor: hasChange ? 'rgba(88, 204, 2, 0.05)' : 'transparent',
      zIndex: isOpen ? 10 : 1 // Bring to front when open
    }}>
      {/* 1. Image */}
      <img 
        src={song.cover_url || 'https://via.placeholder.com/50'} 
        alt={song.title}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          objectFit: 'cover',
          flexShrink: 0,
          background: 'var(--bg-card)'
        }}
      />

      {/* 2. Info */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px' }}>
        <div style={{ 
          fontSize: '0.9rem', 
          fontWeight: '700', 
          color: 'white', 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis'
        }}>
          {song.title}
        </div>
        <div style={{ 
          fontSize: '0.75rem', 
          color: 'var(--text-muted)',
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis'
        }}>
          {song.artist}
        </div>
      </div>

      {/* 3. Custom Dropdown */}
      <div ref={dropdownRef} style={{ width: '120px', flexShrink: 0, position: 'relative' }}>
         <div 
           onClick={() => setIsOpen(!isOpen)}
           style={{
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'flex-end',
             gap: '0.35rem',
             cursor: 'pointer',
             padding: '0.4rem',
             borderRadius: '6px',
             transition: 'background 0.2s',
             backgroundColor: isOpen ? 'rgba(255,255,255,0.05)' : 'transparent'
           }}
         >
            <span style={{ 
               color: hasChange ? 'var(--primary)' : 'var(--text-main)', 
               fontSize: '0.8rem', 
               fontWeight: '600',
               whiteSpace: 'nowrap',
               maxWidth: '85px',
               overflow: 'hidden',
               textOverflow: 'ellipsis',
               textAlign: 'right'
            }}>
              {displayValue}
            </span>
            <span style={{ fontSize: '0.65rem', color: hasChange ? 'var(--primary)' : 'var(--text-muted)' }}>
              ▼
            </span>
         </div>

         {/* Dropdown Menu */}
         {isOpen && (
           <div style={{
             position: 'absolute',
             top: '100%',
             right: 0,
             minWidth: '140px',
             background: 'var(--bg-card)',
             border: '1px solid var(--border-color)',
             borderRadius: '12px',
             boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
             padding: '0.5rem',
             zIndex: 100,
             marginTop: '0.25rem'
           }}>
             {emotions.map(emotion => (
               <div
                 key={emotion}
                 onClick={() => handleSelect(emotion)}
                 style={{
                   padding: '0.5rem 0.75rem',
                   fontSize: '0.85rem',
                   color: displayValue === emotion ? 'var(--primary)' : 'white',
                   borderRadius: '8px',
                   cursor: 'pointer',
                   fontWeight: displayValue === emotion ? '600' : '400',
                   background: displayValue === emotion ? 'rgba(88, 204, 2, 0.1)' : 'transparent',
                   marginBottom: '2px',
                   transition: 'background 0.1s'
                 }}
                 onMouseEnter={(e) => { 
                    if(displayValue !== emotion) e.target.style.background = 'rgba(255,255,255,0.05)' 
                 }}
                 onMouseLeave={(e) => { 
                    if(displayValue !== emotion) e.target.style.background = 'transparent' 
                 }}
               >
                 {emotion}
               </div>
             ))}
           </div>
         )}
      </div>

    </div>
  );
};

export default EmotionSongCard;
