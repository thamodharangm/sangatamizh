import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';

const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
  const { updateStats } = useAuth();
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio());

  useEffect(() => {
    const audio = audioRef.current;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      if (updateStats) updateStats('song_played'); 
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (currentSong) {
      if (audio.src !== currentSong.audioUrl) {
        audio.src = currentSong.audioUrl;
        audio.play().catch(err => console.error("Playback failed:", err));
      } else {
        // If same song, just ensure it plays if it was paused
         audio.play().catch(err => console.error("Playback failed:", err));
      }
    } else {
      audio.pause();
    }
  }, [currentSong]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (audio.paused) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  };

  const playSong = (song) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      setCurrentSong(song);
      // The effect will handle the actual playing
    }
  };

  const pauseSong = () => {
    audioRef.current.pause();
  };

  return (
    <MusicContext.Provider value={{ currentSong, isPlaying, playSong, pauseSong, togglePlay }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => useContext(MusicContext);
