import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, SkipBack, SkipForward, Heart, Volume2, Disc, Mic2, Shuffle, Repeat } from 'lucide-react';

const ImmersivePlayer = ({ 
  isOpen, onClose, currentSong, isPlaying, setIsPlaying, 
  progress, setProgress, audioRef, volume, setVolume, 
  likedIds, toggleLike, isShuffle, setIsShuffle, 
  isRepeat, setIsRepeat, setShowLyrics,
  handleNext, handlePrev, timeInfo
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 4000,
            background: 'var(--bg-main)',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <button className="btn-tactile btn-secondary" style={{ width: '44px', height: '44px', padding: 0, borderRadius: '50%' }} onClick={onClose}>
              <X size={24} />
            </button>
            <div style={{ textAlign: 'center' }}>
               <p style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Playing from Library</p>
               <p style={{ fontSize: '0.85rem', fontWeight: 950 }}>{currentSong?.album || 'Single'}</p>
            </div>
            <div style={{ width: '44px' }}></div> {/* Spacer */}
          </div>

          {/* Main Visual Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2.5rem' }}>
             <motion.div 
               animate={{ 
                  scale: isPlaying ? [1, 1.02, 1] : 1,
                  rotate: isPlaying ? [0, 1, -1, 0] : 0
               }}
               transition={{ repeat: Infinity, duration: 4 }}
               style={{ 
                  width: 'min(350px, 80vw)', 
                  aspectRatio: '1/1', 
                  borderRadius: '30px', 
                  overflow: 'hidden',
                  boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
                  border: '4px solid var(--border-light)'
               }}
             >
                <img src={currentSong?.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Cover" />
             </motion.div>

             <div style={{ textAlign: 'center', width: '100%' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 950, marginBottom: '8px' }}>{currentSong?.title}</h1>
                <p style={{ fontSize: '1.1rem', color: 'var(--color-blue)', fontWeight: 800 }}>{currentSong?.artist}</p>
             </div>
          </div>

          {/* Controls Section */}
          <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             {/* Waveform Visualization Mock */}
             <div className="vibe-wave" style={{ justifyContent: 'center', height: '40px', opacity: isPlaying ? 1 : 0.3 }}>
                {[...Array(20)].map((_, i) => (
                  <motion.span 
                    key={i} 
                    animate={{ height: isPlaying ? [10, Math.random() * 40 + 10, 10] : 10 }} 
                    transition={{ repeat: Infinity, duration: 0.5 + Math.random(), delay: i * 0.05 }}
                    style={{ width: '4px', background: 'var(--color-blue)', borderRadius: '10px' }}
                  />
                ))}
             </div>

             {/* Progress Bar */}
             <div style={{ width: '100%' }}>
                <div 
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const p = x / rect.width;
                    if (audioRef.current.duration) { audioRef.current.currentTime = p * audioRef.current.duration; }
                  }}
                  style={{ width: '100%', height: '8px', background: 'var(--border-light)', borderRadius: '10px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
                >
                  <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-blue)', transition: 'width 0.1s linear' }}></div>
                </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                    <span>{timeInfo.current}</span>
                    <span>{timeInfo.total}</span>
                 </div>
             </div>

             {/* Main Buttons */}
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly' }}>
                <button 
                  onClick={() => setIsShuffle(!isShuffle)}
                  style={{ background: 'none', border: 'none', color: isShuffle ? 'var(--color-blue)' : 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <Shuffle size={24} strokeWidth={isShuffle ? 3 : 2} />
                </button>
                <SkipBack size={32} style={{ cursor: 'pointer', fill: 'var(--text-main)' }} onClick={handlePrev} />
                <div 
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{ 
                    width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-blue)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    boxShadow: '0 8px 0 var(--color-blue-depth)', transform: isPlaying ? 'translateY(4px)' : 'none',
                    transition: 'all 0.1s'
                  }}
                >
                  {isPlaying ? <Pause size={40} color="white" fill="white" /> : <Play size={40} color="white" fill="white" style={{ marginLeft: '6px' }} />}
                </div>
                <SkipForward size={32} style={{ cursor: 'pointer', fill: 'var(--text-main)' }} onClick={handleNext} />
                <button 
                  onClick={() => setIsRepeat(!isRepeat)}
                  style={{ background: 'none', border: 'none', color: isRepeat ? 'var(--color-blue)' : 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <Repeat size={24} strokeWidth={isRepeat ? 3 : 2} />
                </button>
             </div>

             {/* Bottom Actions */}
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingBottom: '2rem' }}>
                <button className="btn-tactile btn-secondary" style={{ width: '48px', height: '48px', padding: 0 }} onClick={() => setShowLyrics(true)}>
                  <Mic2 size={20} />
                </button>
                <motion.div 
                   whileTap={{ scale: 0.8 }}
                   onClick={(e) => toggleLike(e, currentSong?.id)} 
                   style={{ cursor: 'pointer' }}
                >
                   <motion.div
                     initial={false}
                     animate={{ 
                       scale: likedIds.includes(currentSong?.id) ? [1, 1.5, 1] : 1,
                       color: likedIds.includes(currentSong?.id) ? '#FF4B4B' : 'var(--text-muted)'
                     }}
                     transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
                   >
                      <Heart size={28} fill={likedIds.includes(currentSong?.id) ? 'currentColor' : 'none'} />
                   </motion.div>
                </motion.div>
                <button className="btn-tactile btn-secondary" style={{ width: '48px', height: '48px', padding: 0 }}>
                   <Volume2 size={20} />
                </button>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImmersivePlayer;
