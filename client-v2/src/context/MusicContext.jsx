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
  const [isBuffering, setIsBuffering] = useState(false);

  const audioRef = useRef(new Audio());
  const queueRef = useRef([]);
  const indexRef = useRef(-1);
  
  // Sync refs for latest state in event listeners
  useEffect(() => {
    queueRef.current = queue;
    indexRef.current = currentIndex;
  }, [queue, currentIndex]);

  // iOS Audio Unlock Requirement
  useEffect(() => {
    const unlock = () => {
      const audio = audioRef.current;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch(() => {});
    };
    document.addEventListener('touchstart', unlock, { once: true });
    return () => document.removeEventListener('touchstart', unlock);
  }, []);

  // PLAY SPECIFIC INDEX
  const playAtIndex = useCallback((index, song) => {
    if (!song) return;

    setCurrentIndex(index);
    setCurrentSong(song);

    const audio = audioRef.current;
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

  const playSong = useCallback((song, songList = []) => {
    const newQueue = songList.length ? songList : [song];
    let index = newQueue.findIndex(s => s.id === song.id);
    if (index === -1) index = 0;

    setQueue(newQueue);
    playAtIndex(index, song);

    if (user?.uid) {
      api.post("/log-play", { userId: user.uid, songId: song.id }).catch(() => {});
    }
  }, [user, playAtIndex]);

  // Media Session Support
  useEffect(() => {
    if (!currentSong || !('mediaSession' in navigator)) return;
    
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: currentSong.artist,
      album: 'Sangatamizh Music',
      artwork: [{ src: currentSong.cover_url || '/logo512.png', sizes: '512x512', type: 'image/png' }]
    });

    navigator.mediaSession.setActionHandler('play', () => audioRef.current.play());
    navigator.mediaSession.setActionHandler('pause', () => audioRef.current.pause());
    navigator.mediaSession.setActionHandler('previoustrack', prevSong);
    navigator.mediaSession.setActionHandler('nexttrack', nextSong);
  }, [currentSong, nextSong, prevSong]);

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

    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);

    audio.addEventListener("timeupdate", syncState);
    audio.addEventListener("durationchange", syncState);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("play", () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));
    audio.addEventListener("ended", nextSong);

    return () => {
      audio.removeEventListener("timeupdate", syncState);
      audio.removeEventListener("durationchange", syncState);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplay", handleCanPlay);
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
      isBuffering,
      seek
    }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => useContext(MusicContext);

