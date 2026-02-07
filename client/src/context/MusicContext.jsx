import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../config/api';

const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Audio State
  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedTime, setBufferedTime] = useState(0);

  const audioRef = useRef(new Audio());
  const queueRef = useRef([]);
  const indexRef = useRef(-1);

  useEffect(() => {
    queueRef.current = queue;
    indexRef.current = currentIndex;
  }, [queue, currentIndex]);

  // PLAY SPECIFIC INDEX
  const playAtIndex = useCallback((index, song) => {
    if (!song) return;

    setCurrentIndex(index);
    setCurrentSong(song);

    const audio = audioRef.current;
    
    // Construct stable stream URL
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const streamUrl = `${cleanBase}/stream/${song.id}`;

    if (audio.src !== window.location.origin + streamUrl && audio.src !== streamUrl) {
      audio.src = streamUrl;
      audio.load();
    }
    
    audio.play().catch(err => console.warn("Playback blocked:", err));
    setIsPlaying(true);
  }, []);

  const nextSong = useCallback(() => {
    const q = queueRef.current;
    const idx = indexRef.current;
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

  const togglePlay = () => {
    const audio = audioRef.current;
    if (audio.paused) {
      audio.play().catch(e => console.warn(e));
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const seek = (time) => {
    audioRef.current.currentTime = time;
  };

  const playSong = (song, songList = []) => {
    const newQueue = songList.length ? songList : [song];
    let index = newQueue.findIndex(s => s.id === song.id);
    if (index === -1) index = 0;

    setQueue(newQueue);
    playAtIndex(index, song);

    // Background log
    if (user?.uid) {
      api.post("/log-play", { userId: user.uid, songId: song.id }).catch(() => {});
    }
  };

  useEffect(() => {
    const audio = audioRef.current;

    const syncState = () => {
      setIsPlaying(!audio.paused);
      setCurrentTime(audio.currentTime);
      if (!isNaN(audio.duration)) setDuration(audio.duration);
      
      if (audio.buffered.length > 0) {
        setBufferedTime(audio.buffered.end(audio.buffered.length - 1));
      }
    };

    audio.addEventListener("timeupdate", syncState);
    audio.addEventListener("durationchange", syncState);
    audio.addEventListener("play", () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));
    audio.addEventListener("ended", nextSong);

    return () => {
      audio.removeEventListener("timeupdate", syncState);
      audio.removeEventListener("durationchange", syncState);
      audio.removeEventListener("ended", nextSong);
    };
  }, [nextSong]);

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
      seek
    }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => useContext(MusicContext);

