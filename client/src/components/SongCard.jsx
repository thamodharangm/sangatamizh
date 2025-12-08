import React from 'react';

const SongCard = ({ song, onPlay }) => {
  return (
    <div className="card-flat" onClick={() => onPlay && onPlay(song)} style={{ cursor: 'pointer', padding: '1rem', position: 'relative' }}>
      <div style={{ 
        position: 'relative',
        width: '100%', 
        aspectRatio: '1/1', 
        borderRadius: '12px', 
        overflow: 'hidden', 
        marginBottom: '1rem',
        border: '2px solid var(--border-color)'
      }}>
        <img 
          src={song.coverUrl || 'https://via.placeholder.com/300'} 
          alt={song.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        
        {/* Play Overlay - simple hover effect handled by CSS group hover if needed, or inline here */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          transition: 'opacity 0.2s',
        }} className="play-overlay">
           <div style={{
             width: '48px',
             height: '48px',
             borderRadius: '50%',
             background: 'var(--primary)',
             boxShadow: '0 4px 0 var(--primary-depth)',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             fontSize: '1.5rem',
             color: 'white'
           }}>
             ▶
           </div>
        </div>
      </div>
      
      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'white' }}>
        {song.title}
      </h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        {song.artist}
      </p>

      <style>{`
        .card-flat:hover .play-overlay {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default SongCard;
