import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
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


  // PLAY SPECIFIC INDEX
  const playAtIndex = useCallback((index, song) => {
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
  }, []);


  const nextSong = useCallback(() => {
    const q = queueRef.current;
    const idx = indexRef.current;
    if (!q.length) return;

    if (idx < q.length - 1) {
      playAtIndex(idx + 1, q[idx + 1]);
    } else {
      setIsPlaying(false);
    }
  }, [playAtIndex]);


  const prevSong = useCallback(() => {
    const idx = indexRef.current;
    if (idx > 0) {
      playAtIndex(idx - 1, queueRef.current[idx - 1]);
    } else {
      audioRef.current.currentTime = 0;
    }
  }, [playAtIndex]);

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
      
      navigator.mediaSession.setActionHandler('previoustrack', prevSong);
      navigator.mediaSession.setActionHandler('nexttrack', nextSong);
      
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime) {
          audioRef.current.currentTime = details.seekTime;
        }
      });
      
      console.log('[MediaSession] Updated for:', currentSong.title);
    } catch (error) {
      console.warn('[MediaSession] Not supported or error:', error);
    }
  }, [currentSong]); // nextSong and prevSong are stable with useCallback

  // ========================================
  // MODERN AUDIO EVENT SYSTEM
  // Clean, efficient progress & buffer tracking
  // ========================================
  useEffect(() => {
    const audio = audioRef.current;

    // === PLAYBACK STATE HANDLERS ===
    const handlePlay = () => {
      console.log('[Audio] Playing');
      setIsPlaying(true);
      setIsBuffering(false);
    };

    const handlePause = () => {
      console.log('[Audio] Paused');
      setIsPlaying(false);
    };

    const handleEnded = () => {
      console.log('[Audio] Ended');
      setIsPlaying(false);
      if (updateStats) updateStats("song_played");
      nextSong();
    };

    // === PROGRESS TRACKING (Real-time) ===
    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime;
      
      // Update current time (fires every ~250ms)
      if (!isNaN(currentTime)) {
        setCurrentTime(currentTime);
        
        // Auto-end if we have corrected duration (M4A fix)
        const correctedDuration = correctedDurationRef.current;
        if (correctedDuration > 0 && currentTime >= correctedDuration) {
          audio.pause();
          setIsPlaying(false);
          if (updateStats) updateStats("song_played");
          nextSong();
        }
      }
    };

    // === DURATION DETECTION (Mobile-Safe) ===
    const handleLoadedMetadata = () => {
      const rawDuration = audio.duration;
      
      if (!isNaN(rawDuration) && rawDuration > 0) {
        // M4A corruption fix: Duration often doubled
        let finalDuration = rawDuration;
        
        if (rawDuration > 600) {
          // Songs over 10 minutes are likely corrupted M4A
          finalDuration = rawDuration / 2;
          console.log(`[Audio] M4A fix applied: ${rawDuration}s → ${finalDuration}s`);
        }
        
        correctedDurationRef.current = finalDuration;
        setDuration(finalDuration);
        console.log(`[Audio] Duration set: ${finalDuration}s`);
      }
    };

    // === BUFFER TRACKING (Visual Feedback) ===
    const handleProgress = () => {
      try {
        const buffered = audio.buffered;
        
        if (buffered.length > 0) {
          // Get the end of the last buffered range
          const bufferedEnd = buffered.end(buffered.length - 1);
          const correctedDuration = correctedDurationRef.current;
          
          // Clamp to corrected duration (prevent buffer > duration)
          const safeBuffered = correctedDuration > 0 
            ? Math.min(bufferedEnd, correctedDuration)
            : bufferedEnd;
          
          setBufferedTime(safeBuffered);
        }
      } catch (error) {
        // Silently handle buffer errors (can occur during seeking)
      }
    };

    // === BUFFERING STATE (Loading Indicators) ===
    const handleWaiting = () => {
      console.log('[Audio] Buffering...');
      setIsBuffering(true);
    };

    const handleCanPlay = () => {
      console.log('[Audio] Ready to play');
      setIsBuffering(false);
    };

    const handleStalled = () => {
      console.warn('[Audio] Network stalled');
      setIsBuffering(true);
    };

    const handleError = (event) => {
      console.error('[Audio] Playback error:', event);
      setIsBuffering(false);
    };

    // === RESET ON NEW SONG ===
    const handleLoadStart = () => {
      console.log('[Audio] Loading new song');
      setCurrentTime(0);
      setDuration(0);
      setBufferedTime(0);
      setIsBuffering(true);
    };

    // === ATTACH EVENT LISTENERS ===
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("progress", handleProgress);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("stalled", handleStalled);
    audio.addEventListener("error", handleError);
    audio.addEventListener("loadstart", handleLoadStart);

    // === CLEANUP ===
    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("progress", handleProgress);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("stalled", handleStalled);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("loadstart", handleLoadStart);
    };
  }, [nextSong]); // nextSong is stable (useCallback with stable deps)


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
  const playSong = useCallback((song, songList = []) => {
    let newQueue = songList.length ? songList : [song];
    let index = newQueue.findIndex(s => s.id === song.id);
    if (index === -1) index = 0;

    setQueue(newQueue);
    playAtIndex(index, song);

    // Log play (if user is authenticated)
    if (user?.uid && song?.id) {
      api.post("/log-play", { userId: user.uid, songId: song.id })
        .catch(err => console.error("History Log Failed", err));
    }
  }, [user, playAtIndex]);

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
