import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Music } from 'lucide-react';

const LyricsOverlay = ({ isOpen, onClose, currentSong, lyrics, loading }) => {
  const lines = lyrics ? lyrics.split('\n') : ["No lyrics found for this vibe."];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3000,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={onClose}
        >
          <motion.div 
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            className="card-tactile"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '800px',
              maxHeight: '85vh',
              background: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              boxShadow: '0 30px 60px rgba(0,0,0,0.3)'
            }}
          >
            {/* Header */}
            <div style={{ 
              padding: '2rem', 
              borderBottom: '2px solid var(--border-light)',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: 'var(--bg-main)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ 
                  width: '60px', height: '60px', borderRadius: '14px', 
                  overflow: 'hidden', border: '2px solid var(--border-light)' 
                }}>
                  <img src={currentSong?.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Cover" />
                </div>
                <div>
                  <h2 style={{ fontWeight: 950, fontSize: '1.2rem', color: 'var(--text-main)' }}>{currentSong?.title}</h2>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="btn-tactile btn-secondary" 
                style={{ width: '44px', height: '44px', padding: 0, borderRadius: '50%' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Lyrics Area */}
            <div className="no-scrollbar" style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '3rem 2rem',
              textAlign: 'center'
            }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="skeleton" style={{ height: '24px', width: i % 2 === 0 ? '50%' : '75%', borderRadius: '12px' }}></div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <Music size={40} color="var(--color-blue)" style={{ opacity: 0.1, margin: '0 auto 1.5rem' }} />
                  {lines.map((line, index) => (
                    <motion.p 
                      key={index} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      style={{ 
                        fontSize: 'min(1.5rem, 5vw)', 
                        fontWeight: 900, 
                        color: 'var(--text-main)',
                        opacity: line.length > 0 ? 1 : 0,
                        margin: 0,
                        lineHeight: 1.4
                      }}
                    >
                      {line || '&nbsp;'}
                    </motion.p>
                  ))}
                </div>
              )}
            </div>

            {/* Footer gradient fade */}
            <div style={{ 
              height: '40px', 
              background: 'linear-gradient(to top, var(--bg-card), transparent)',
              marginTop: '-40px',
              zIndex: 1,
              pointerEvents: 'none'
            }}></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LyricsOverlay;
