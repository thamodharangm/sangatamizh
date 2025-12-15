import { useMusic } from '../context/MusicContext';

const DebugPanel = () => {
  const { currentSong, duration, currentTime, bufferedTime, isPlaying } = useMusic();

  if (!currentSong) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.9)',
      color: '#00ff00',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '11px',
      fontFamily: 'monospace',
      maxWidth: '200px',
      zIndex: 99999,
      border: '2px solid #00ff00'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#fff' }}>🔍 DEBUG</div>
      <div>Song: {currentSong.title?.substring(0, 20)}...</div>
      <div style={{ color: duration > 600 ? '#ff0000' : '#00ff00', fontWeight: 'bold' }}>
        Duration: {duration.toFixed(1)}s
      </div>
      <div>Current: {currentTime.toFixed(1)}s</div>
      <div>Buffered: {bufferedTime.toFixed(1)}s</div>
      <div>Playing: {isPlaying ? '▶️ YES' : '⏸️ NO'}</div>
      <div style={{ fontSize: '9px', marginTop: '5px', color: '#888', wordBreak: 'break-all' }}>
        {import.meta.env.VITE_API_URL || 'NO API URL SET'}
      </div>
    </div>
  );
};

export default DebugPanel;
