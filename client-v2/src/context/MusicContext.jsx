import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../config/api';

const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
  const { user, updateStats } = useAuth();
  
  // Audio State
  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  // Time State
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Buffer State
  const [bufferedTime, setBufferedTime] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const audioRef = useRef(new Audio());
  const queueRef = useRef([]);
  const indexRef = useRef(-1);
  
  // Store corrected duration for buffer calculations
  const correctedDurationRef = useRef(0);

  useEffect(() => {
    queueRef.current = queue;
    indexRef.current = currentIndex;
  }, [queue, currentIndex]);

  // iOS Audio Unlock Pattern
  useEffect(() => {
    const unlockAudio = () => {
      if (audioUnlocked) return;
      
      const audio = audioRef.current;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        setAudioUnlocked(true);
        console.log('[iOS] Audio unlocked successfully');
      }).catch(() => {
        console.log('[iOS] Audio unlock failed, will retry on next interaction');
      });
    };

    // Unlock on first touch (iOS requirement)
    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('click', unlockAudio, { once: true });
    
    return () => {
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('click', unlockAudio);
    };
  }, [audioUnlocked]);

  // Media Session API for Background Audio Controls
  useEffect(() => {
    if (!currentSong || !('mediaSession' in navigator)) return;
    
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        album: 'Sangatamizh Music',
        artwork: [
          { 
            src: currentSong.coverUrl || currentSong.cover_url || 'https://via.placeholder.com/512', 
            sizes: '512x512', 
            type: 'image/png' 
          }
        ]
      });
      
      navigator.mediaSession.setActionHandler('play', () => {
        audioRef.current.play();
      });
      
      navigator.mediaSession.setActionHandler('pause', () => {
        audioRef.current.pause();
      });
      
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        prevSong();
      });
      
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        nextSong();
      });
      
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime) {
          audioRef.current.currentTime = details.seekTime;
        }
      });
      
      console.log('[MediaSession] Updated for:', currentSong.title);
    } catch (error) {
      console.warn('[MediaSession] Not supported or error:', error);
    }
  }, [currentSong]);


  // PLAY SPECIFIC INDEX
  const playAtIndex = (index, song) => {
    setCurrentIndex(index);
    setCurrentSong(song);

    const audio = audioRef.current;

    setCurrentTime(0);
    setDuration(0);
    setBufferedTime(0);

    if (!song || !song.id) return;

    // Use Backend Streaming (Required for M4A metadata fix)
    // M4A files from YouTube have corrupted duration metadata
    // Backend /stream endpoint rewrites headers correctly
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const streamUrl = `${cleanBase}/stream/${song.id}`;

    // Update src only if changed
    if (audio.src !== streamUrl) {
      audio.src = streamUrl;
      audio.load();
    } else {
      audio.currentTime = 0;
    }

    // Try to play (may be blocked by autoplay policy)
    audio.play().catch(err => {
      if (err.name === 'AbortError' || err.name === 'NotAllowedError') {
        // Normal - browser autoplay policy, will play on next user interaction
      }
    });
  };


  const nextSong = () => {
    const q = queueRef.current;
    const idx = indexRef.current;
    if (!q.length) return;

    if (idx < q.length - 1) {
      playAtIndex(idx + 1, q[idx + 1]);
    } else {
      setIsPlaying(false);
    }
  };


  const prevSong = () => {
    const idx = indexRef.current;
    if (idx > 0) {
      playAtIndex(idx - 1, queueRef.current[idx - 1]);
    } else {
      audioRef.current.currentTime = 0;
    }
  };
  // AUDIO EVENT LISTENERS (Production-Ready)
  useEffect(() => {
    const audio = audioRef.current;

    // Playback state
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleEnded = () => {
      setIsPlaying(false);
      if (updateStats) updateStats("song_played");
      nextSong();
    };

    // Current time update
    const handleTimeUpdate = () => {
      if (!isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
        
        // If we have a corrected duration (M4A fix), end song when reaching it
        // Prevents playing past 303s when actual file is 607s
        if (correctedDurationRef.current > 0 && 
            audio.currentTime >= correctedDurationRef.current) {
          audio.pause();
          setIsPlaying(false);
          if (updateStats) updateStats("song_played");
          nextSong();
        }
      }
    };

    // CRITICAL: Use ONLY loadedmetadata for duration (mobile-safe)
    // loadedmetadata fires ONCE when metadata is first available
    // durationchange fires MULTIPLE times and causes double duration bug on mobile Safari
    const handleLoadedMetadata = () => {
      if (!isNaN(audio.duration) && audio.duration > 0) {
        // Sanity check: Most songs under 10 minutes
        // M4A metadata corruption often doubles duration
        let finalDuration = audio.duration;
        
        if (audio.duration > 600) {
          // Estimate as half (common M4A corruption pattern)
          finalDuration = audio.duration / 2;
        }
        
        // Store corrected duration for buffer calculations
        correctedDurationRef.current = finalDuration;
        setDuration(finalDuration);
      }
    };

    // Buffer progress tracking
    const handleProgress = () => {
      try {
        if (audio.buffered.length > 0 && correctedDurationRef.current > 0) {
          const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
          // Use CORRECTED duration, not audio.duration (which is corrupted)
          const safeBuffered = Math.min(bufferedEnd, correctedDurationRef.current);
          setBufferedTime(safeBuffered);
        }
      } catch (e) {
        // Silently handle buffer errors
      }
    };

    // Buffering state tracking (Mobile Critical)
    const handleWaiting = () => {
      console.log('[Audio] Buffering...');
      setIsBuffering(true);
    };

    const handleCanPlay = () => {
      console.log('[Audio] Can play');
      setIsBuffering(false);
    };

    const handleStalled = () => {
      console.error('[Audio] Stalled - network issue');
      setIsBuffering(true);
    };

    const handleError = (e) => {
      console.error('[Audio] Error:', e);
      setIsBuffering(false);
    };

    // Reset state when new audio starts loading
    const handleLoadStart = () => {
      setCurrentTime(0);
      setDuration(0);
      setBufferedTime(0);
    };

    // Attach listeners
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("progress", handleProgress);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("stalled", handleStalled);
    audio.addEventListener("error", handleError);

    // Cleanup
    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("progress", handleProgress);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("stalled", handleStalled);
      audio.removeEventListener("error", handleError);
    };
  }, []);


  // When currentSong changes
  useEffect(() => {
    const audio = audioRef.current;

    if (!currentSong || !currentSong.id) return;

    // IMPORTANT: Use same stream URL logic as playAtIndex!
    // Don't use currentSong.audioUrl (has corrupted M4A metadata)
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const streamUrl = `${cleanBase}/stream/${currentSong.id}`;

    if (audio.src !== streamUrl) {
      audio.src = streamUrl;
      audio.load();
    }

    audio.play().catch(e => console.warn("Play failed:", e));
  }, [currentSong]);


  const togglePlay = () => {
    const audio = audioRef.current;
    audio.paused ? audio.play() : audio.pause();
  };

  const seek = (time) => {
    const audio = audioRef.current;
    audio.currentTime = time;
  };

  // PLAY SONG ENTRY
  const playSong = (song, songList = []) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    let newQueue = songList.length ? songList : [song];
    let index = newQueue.findIndex(s => s.id === song.id);
    if (index === -1) index = 0;

    setQueue(newQueue);
    playAtIndex(index, song);

    // Log play
    if (user?.uid && song?.id) {
      api.post("/log-play", { userId: user.uid, songId: song.id })
        .catch(err => console.error("History Log Failed", err));
    }
  };

  return (
    <MusicContext.Provider value={{
      currentSong,
      isPlaying,
      playSong,
      togglePlay,
      nextSong,
      prevSong,
      currentTime,
      duration,
      bufferedTime,
      isBuffering, // <-- NEW: Buffering state for UI
      seek
    }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => useContext(MusicContext);
