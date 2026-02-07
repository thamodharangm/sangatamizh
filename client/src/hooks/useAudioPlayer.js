import { useEffect, useRef, useState } from "react";

export default function useAudioPlayer() {
  const audioRef = useRef(new Audio());
  const [current, setCurrent] = useState(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    a.onended = () => setPlaying(false);
    return () => a.pause();
  }, []);

  const play = (url) => {
    const a = audioRef.current;
    if (a.src !== url) a.src = url;
    a.play();
    setCurrent(url);
    setPlaying(true);
  };

  const pause = () => {
    audioRef.current.pause();
    setPlaying(false);
  };

  return { play, pause, playing, current };
}
