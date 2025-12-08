import { useMusic } from '../context/MusicContext';

const MusicPlayer = () => {
  const { currentSong, isPlaying, togglePlay } = useMusic();

  if (!currentSong) return null;

  return (
    <div className="glass-panel" style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '800px',
      padding: '1rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 1000,
      backdropFilter: 'blur(20px)',
      background: 'rgba(15, 23, 42, 0.85)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          borderRadius: '8px', 
          background: `url(${currentSong.coverUrl || 'https://via.placeholder.com/50'}) center/cover`,
          border: '1px solid rgba(255,255,255,0.1)' 
        }} />
        <div>
          <h4 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>{currentSong.title}</h4>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{currentSong.artist}</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button className="control-btn" style={{ background: 'none', color: 'var(--text-muted)', fontSize: '1.2rem' }}>
          ⏮
        </button>
        <button 
          onClick={togglePlay}
          style={{ 
            width: '45px', 
            height: '45px', 
            borderRadius: '50%', 
            background: 'var(--primary-color)',
            color: 'white',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '1.2rem',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)'
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="control-btn" style={{ background: 'none', color: 'var(--text-muted)', fontSize: '1.2rem' }}>
          ⏭
        </button>
      </div>
      
      {/* Progress bar placeholder */}
      <div style={{ width: '30%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: '0%', height: '100%', background: 'var(--secondary-color)' }}></div>
      </div>
    </div>
  );
};

export default MusicPlayer;
