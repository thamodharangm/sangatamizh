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

  // Optional buffer bar (if UI needs later)
  const [bufferedTime, setBufferedTime] = useState(0);

  const audioRef = useRef(new Audio());
  const queueRef = useRef([]);
  const indexRef = useRef(-1);

  useEffect(() => {
    queueRef.current = queue;
    indexRef.current = currentIndex;
  }, [queue, currentIndex]);


  // PLAY SPECIFIC INDEX
  const playAtIndex = (index, song) => {
    setCurrentIndex(index);
    setCurrentSong(song);

    const audio = audioRef.current;

    setCurrentTime(0);
    setDuration(0);
    setBufferedTime(0);

    if (!song || !song.audioUrl) return;

    // Update src only if changed
    if (audio.src !== song.audioUrl) {
      audio.src = song.audioUrl;
      audio.load();
    } else {
      audio.currentTime = 0;
    }

    audio.play().catch(err => console.warn("Play blocked:", err));
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


  useEffect(() => {
    const audio = audioRef.current;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleEnded = () => {
      setIsPlaying(false);
      if (updateStats) updateStats("song_played");
      nextSong();
    };

    const handleTimeUpdate = () => {
      if (!isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (!isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleDurationChange = () => {
      if (!isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    // 🔥 BUFFER FIX — prevents double duration
    const handleProgress = () => {
      try {
        if (audio.buffered.length > 0) {
          const end = audio.buffered.end(audio.buffered.length - 1);
          const safeEnd = Math.min(end, audio.duration || 0);
          setBufferedTime(safeEnd);
        }
      } catch (e) {
        console.warn("Buffer error:", e);
      }
    };

    const handleLoadStart = () => {
      setCurrentTime(0);
      setDuration(0);
      setBufferedTime(0);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("progress", handleProgress); // ✅ Added
    audio.addEventListener("loadstart", handleLoadStart);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("progress", handleProgress);
      audio.removeEventListener("loadstart", handleLoadStart);
    };
  }, []);


  // When currentSong changes
  useEffect(() => {
    const audio = audioRef.current;

    if (!currentSong) return;

    if (audio.src !== currentSong.audioUrl) {
      audio.src = currentSong.audioUrl;
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
      bufferedTime, // <-- UI can use this if needed
      seek
    }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => useContext(MusicContext);
