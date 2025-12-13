import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../config/api';

const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
  const { user, updateStats } = useAuth();
  
  // Audio & Queue State
  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Time State
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(new Audio());

  // Helper to ensure nextSong works inside event listener
  // We need to use a Ref to access the latest queue/index inside the event listener without re-attaching listeners constantly
  const queueRef = useRef([]);
  const indexRef = useRef(-1);

  useEffect(() => {
    queueRef.current = queue;
    indexRef.current = currentIndex;
  }, [queue, currentIndex]);

  // Internal helper to play specific index without recreating queue
  const playAtIndex = (index, song) => {
    setCurrentIndex(index);
    setCurrentSong(song);
    
    // Reset time and duration immediately
    setCurrentTime(0);
    setDuration(0);
    
    // CRITICAL iOS FIX: Play synchronously to satisfy browser autoplay policies
    if (song && song.audioUrl) {
        const audio = audioRef.current;
        
        // Always update source for new song
        if (audio.src !== song.audioUrl) {
            audio.src = song.audioUrl;
            audio.load(); // Force metadata reload
        } else {
            // Same song - restart from beginning
            audio.currentTime = 0;
        }
        
        // Force play immediately within the click event loop
        audio.play().catch(e => console.warn("Immediate play failed:", e));
    }
  };

  const nextSong = () => {
    const q = queueRef.current;
    const idx = indexRef.current;
    if (q.length === 0) return;

    if (idx < q.length - 1) {
      const newIndex = idx + 1;
      const song = q[newIndex];
      playAtIndex(newIndex, song);
    } else {
      // End of playlist - Stop or Loop? Let's stops for now.
      setIsPlaying(false);
    }
  };

  const prevSong = () => {
    const index = indexRef.current;
    if (index > 0) {
      const newIndex = index - 1;
      const song = queueRef.current[newIndex];
      playAtIndex(newIndex, song);
    } else {
      // Restart song
      audioRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    const audio = audioRef.current;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    // Auto-play next song
    const handleEnded = () => {
      setIsPlaying(false);
      if (updateStats) updateStats('song_played');
      nextSong();
    };

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      // Validate time is a valid number
      if (!isNaN(time) && isFinite(time)) {
        setCurrentTime(time);
      }
    };

    const handleLoadedMetadata = () => {
      const dur = audio.duration;
      // Validate duration is a valid number and not Infinity
      if (!isNaN(dur) && isFinite(dur) && dur > 0) {
        setDuration(dur);
        console.log('✅ Duration loaded:', dur);
      } else {
        console.warn('⚠️ Invalid duration detected:', dur);
      }
    };

    // Handle duration changes (more reliable than loadedmetadata)
    const handleDurationChange = () => {
      const dur = audio.duration;
      if (!isNaN(dur) && isFinite(dur) && dur > 0) {
        setDuration(dur);
        console.log('✅ Duration updated:', dur);
      }
    };

    // Reset time when loading new song
    const handleLoadStart = () => {
      setCurrentTime(0);
      setDuration(0);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadstart', handleLoadStart);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, [queue, currentIndex]);


  // Watch currentSong changes - Fallback for non-click updates (e.g. Next Song via auto-end)
  useEffect(() => {
    const audio = audioRef.current;
    if (currentSong) {
      // If audio source is already set correctly (by synchronous click handler), don't interrupt.
      if (audio.src === currentSong.audioUrl) {
         if (audio.paused) {
             // Try to play if paused (e.g. if previous play() failed or was blocked)
             audio.play().catch(e => console.error("Effect play error:", e));
         }
         return; 
      }

      // If source mismatch (e.g. automated next song), set it.
      if (audio.src !== currentSong.audioUrl) {
         audio.src = currentSong.audioUrl;
         audio.load(); // Force reload metadata
         audio.play().catch(e => console.error("Effect play error:", e));
      }
    }
  }, [currentSong]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (audio.paused) audio.play().catch(console.error);
    else audio.pause();
  };

  const seek = (time) => {
    const audio = audioRef.current;
    audio.currentTime = time;
  };

  // playSong now accepts an entire list (from Home/Library)
  const playSong = (song, songList = []) => {
    // --- 1-Song Limit Logic ---
    // --- Strict Auth Check ---
    // If not logged in, BLOCK PLAYBACK immediately.
    if (!user) {
        // Option: Show a nice modal/alert before redirect?
        // For now, consistent with request: force login immediately.
        window.location.href = '/login';
        return;
    }
    // --------------------------
    // --------------------------

    let newQueue = songList.length > 0 ? songList : [song];
    let newIndex = newQueue.findIndex(s => s.id === song.id);
    
    if (newIndex === -1 && songList.length > 0) {
        // Didnt find song in list? Add it? Or just play it alone.
        newQueue = [song];
        newIndex = 0;
    } 
    // If no list provided but playing same song?
    if (songList.length === 0 && currentSong?.id === song.id) {
        togglePlay();
        return;
    }

    setQueue(newQueue);
    playAtIndex(newIndex, song);

    // --- Log History to Database ---
    if (user && user.uid && song && song.id) {
       api.post('/log-play', { userId: user.uid, songId: song.id })
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
      seek 
    }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => useContext(MusicContext);
