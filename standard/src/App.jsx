import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Search, Library as LibraryIcon, Settings, Flame, Play, Pause, 
  SkipBack, SkipForward, Heart, Volume2, Moon, Sun, Bell, Music, Disc, 
  Mic2, AlertCircle, User, PlusCircle, Shuffle, Repeat, X,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import Admin from './pages/Admin';
import Library from './pages/Library';
import LyricsOverlay from './components/LyricsOverlay';
import ImmersivePlayer from './components/ImmersivePlayer';

import { auth } from './config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import AuthModal from './components/AuthModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3002/api';

const EMOTIONS = [
  { id: 'love', label: 'Love', icon: '❤️', color: '#FF4B4B' },
  { id: 'sad', label: 'Sad', icon: '🥺', color: '#1CB0F6' },
  { id: 'motivate', label: 'Motivate', icon: '💪', color: '#58CC02' },
  { id: 'vibe', label: 'Vibe', icon: '✨', color: '#FFC800' },
  { id: 'neutral', label: 'Feel Good', icon: '😊', color: '#10B981' },
];

const App = () => {
  const [activeTab, setActiveTab] = useState(localStorage.getItem('st-active-tab') || 'home');
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [homePage, setHomePage] = useState(1);
  const [searchPage, setSearchPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showImmersive, setShowImmersive] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [volume, setVolume] = useState(parseFloat(localStorage.getItem('st-volume') || '0.7'));
  const [theme, setTheme] = useState(localStorage.getItem('st-theme') || 'light');
  
  // Lyrics State
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState('');
  const [lyricsLoading, setLyricsLoading] = useState(false);

  // Auth State
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Likes State
  const [likedIds, setLikedIds] = useState([]);

  const [progress, setProgress] = useState(0);
  const [timeInfo, setTimeInfo] = useState({ current: '0:00', total: '0:00' });

  const [confirmDialog, setConfirmDialog] = useState(null);
  const audioRef = useRef(new Audio());
  const historyScrollRef = useRef(null);
  const playTimeoutRef = useRef(null);

  // Playlists State
  const [playlists, setPlaylists] = useState([]);
  const [playlistModalSong, setPlaylistModalSong] = useState(null); // The song we want to add

  // Gamification State
  const [xp, setXp] = useState(() => Number(localStorage.getItem('st-xp')) || 0);
  const [streak, setStreak] = useState(() => Number(localStorage.getItem('st-streak')) || 1);
  const [lastActivityDate, setLastActivityDate] = useState(() => localStorage.getItem('st-last-activity') || '');

  const [xpGained, setXpGained] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showStreakPopover, setShowStreakPopover] = useState(false);

  useEffect(() => {
    localStorage.setItem('st-xp', xp);
    localStorage.setItem('st-streak', streak);
    localStorage.setItem('st-last-activity', lastActivityDate);
  }, [xp, streak, lastActivityDate]);

  const gainXP = (amount) => {
    const today = new Date().toDateString();
    
    // Check for streak maintenance/reset
    if (lastActivityDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastActivityDate === yesterday.toDateString()) {
        // Streak continues, but we only increment streak once PER daily goal completion
      } else if (lastActivityDate !== '') {
        // Streak broken
        // setStreak(1); // Optional: keep it friendly?
      }
      setLastActivityDate(today);
    }

    setXp(prev => {
      let newXp = prev + amount;
      setXpGained(true);
      setTimeout(() => setXpGained(false), 1000);
      
      if (newXp >= 100) {
        setStreak(s => s + 1);
        setTimeout(() => setShowCelebration(true), 500);
        return newXp - 100; // Correct overflow
      }
      return newXp;
    });
  };

  // Auto-hide celebration modal
  useEffect(() => {
    if (showCelebration) {
      const timer = setTimeout(() => setShowCelebration(false), 4500);
      return () => clearTimeout(timer);
    }
  }, [showCelebration]);

  // Passive XP Sync: Earn 5 XP every 20 seconds of listening for better "sync" feel
  useEffect(() => {
    let passiveXpTimer;
    if (isPlaying && currentSong) {
      passiveXpTimer = setInterval(() => {
        gainXP(3); // Smaller chunks, more frequent
      }, 20000); 
    }
    return () => clearInterval(passiveXpTimer);
  }, [isPlaying, currentSong?.id]);



  // Initial Data Fetch
  useEffect(() => {
    setLoading(true);
    // Fetch Songs
    fetch(`${API_URL}/songs`)
      .then(res => res.json())
      .then(data => {
        // Clean titles: cut after 2nd pipe symbol & set defaults
        const cleaned = data.map(song => {
          let cleanedSong = { ...song };
          
          // Clean title
          if (song.title && song.title.includes('|')) {
            const parts = song.title.split('|');
            if (parts.length > 2) {
              cleanedSong.title = parts.slice(0, 2).join(' | ').trim();
            }
          }
          
          // Set default emotion if not present
          if (!cleanedSong.emotion) {
            cleanedSong.emotion = 'Neutral';
          }
          
          // Set default category if not present
          if (!cleanedSong.category) {
            cleanedSong.category = 'General';
          }
          
          return cleanedSong;
        });
        setSongs(cleaned);
        const lastSong = localStorage.getItem('st-last-song');
        if (data.length > 0 && !currentSong) {
           const saved = data.find(s => s.id === lastSong);
           setCurrentSong(saved || data[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch songs failed:", err);
        setLoading(false);
      });

    // Set theme attribute on load
    document.documentElement.setAttribute('data-theme', theme);

    // Auth Listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch Liked IDs for User
        fetch(`${API_URL}/likes/ids?userId=${currentUser.uid}`)
          .then(res => res.json())
          .then(data => setLikedIds(data))
          .catch(err => console.error("Fetch likes failed:", err));
        
        // Fetch Playlists
        fetch(`${API_URL}/playlists?userId=${currentUser.uid}`)
          .then(res => res.json())
          .then(data => setPlaylists(data))
          .catch(err => console.error("Fetch playlists failed:", err));
      } else {
        setLikedIds([]);
        setPlaylists([]);
      }
    });

    return () => unsubscribe();
  }, [theme]);

  const openPlaylistAction = (e, song) => {
    e.stopPropagation();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setPlaylistModalSong(song);
  };

  const addToPlaylist = async (playlistId) => {
    if (!playlistModalSong || !playlistId) return;
    try {
      const res = await fetch(`${API_URL}/playlists`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistId, songId: playlistModalSong.id })
      });
      const data = await res.json();
      if (data.error) {
        console.error(data.error);
      } else {
        setPlaylists(prev => prev.map(p => p.id === playlistId ? data.playlist : p));
      }
      setPlaylistModalSong(null);
    } catch (err) {
      console.error("Failed to add to playlist");
    }
  };

  // Persist Active Tab
  useEffect(() => {
    localStorage.setItem('st-active-tab', activeTab);
  }, [activeTab]);

  // Audio Playback Handling
  useEffect(() => {
    if (isPlaying) {
      audioRef.current.play().catch(e => console.error("Playback failed:", e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (currentSong) {
      audioRef.current.src = `${API_URL}/stream/${currentSong.id}`;
      // Apply volume before playing
      audioRef.current.volume = volume;
      if (isPlaying) audioRef.current.play().catch(e => console.error("Playback failed:", e));
      
      // Persist last song
      localStorage.setItem('st-last-song', currentSong.id);
      
      setLyrics('');
      
      // Clear any existing play timer from previous song
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);

      if (user) {
        // Only log play after 5 seconds of listening (prevents skip spam)
        playTimeoutRef.current = setTimeout(() => {
          fetch(`${API_URL}/log-play`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.uid, songId: currentSong.id })
          }).catch(e => console.error("Log play failed:", e));
        }, 5000);
      }
    }
    
    return () => {
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    };
  }, [currentSong]);

  useEffect(() => {
    audioRef.current.volume = volume;
    localStorage.setItem('st-volume', volume.toString());
  }, [volume]);

  // Fetch Lyrics logic
  useEffect(() => {
    if (showLyrics && currentSong && !lyrics) {
      setLyricsLoading(true);
      fetch(`${API_URL}/lyrics?title=${encodeURIComponent(currentSong.title)}&artist=${encodeURIComponent(currentSong.artist)}`)
        .then(res => res.json())
        .then(data => {
          setLyrics(data.lyrics);
          setLyricsLoading(false);
        })
        .catch(err => {
          console.error("Lyrics fetch failed:", err);
          setLyrics("Lyrics not found.");
          setLyricsLoading(false);
        });
    }
  }, [showLyrics, currentSong]);

  useEffect(() => {
    setHomePage(1);
    setSearchPage(1);
  }, [selectedEmotion, searchTerm]);

  useEffect(() => {
    const audio = audioRef.current;
    
    const onTimeUpdate = () => {
      const p = (audio.currentTime / audio.duration) * 100;
      setProgress(p || 0);

      const formatTime = (time) => {
        if (!time || isNaN(time)) return '0:00';
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      };

      setTimeInfo({
        current: formatTime(audio.currentTime),
        total: formatTime(audio.duration)
      });
    };

    const onEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play();
      } else {
        handleNext();
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [songs, currentSong, isRepeat, isShuffle]);


  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      
      switch(e.code) {
        case 'Space':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
        case 'ArrowLeft':
          audioRef.current.currentTime -= 10;
          break;
        case 'ArrowRight':
          audioRef.current.currentTime += 10;
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(prev => Math.min(1, prev + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(prev => Math.max(0, prev - 0.1));
          break;
        case 'KeyM':
          setVolume(prev => prev > 0 ? 0 : 0.7);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('st-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleLike = async (e, songId) => {
    // Prevent song from playing when clicking heart
    e.stopPropagation();
    
    // Check if user is logged in
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    
    try {
      // Call backend API to toggle like
      const res = await fetch(`${API_URL}/likes/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, songId })
      });
      
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.ok) {
        if (data.liked) {
          // Song was liked - add to likedIds array
          setLikedIds(prev => [...prev, songId]);
        } else {
          // Song was unliked - remove from likedIds array
          setLikedIds(prev => prev.filter(id => id !== songId));
        }
      } else {
        throw new Error("Toggle failed");
      }
    } catch (err) {
      console.error("Toggle like failed:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentSong(null);
      setIsPlaying(false);
      setIsPlaying(false);
    } catch (error) {
      console.error("Logout Error", error);
    }
  };

  const ADMIN_EMAIL = "admin@sangatamizh.com";
  
  const navItems = [
    { id: 'home', Icon: Home, label: 'Home' },
    { id: 'search', Icon: Search, label: 'Search' },
    { id: 'library', Icon: LibraryIcon, label: 'Library' },
    ...(user && user.email === ADMIN_EMAIL ? [{ id: 'admin', Icon: Settings, label: 'Admin' }] : []),
  ];

  // Stabilized History Init
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('st-history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("History parse failed, resetting.");
      return [];
    }
  });

  const handleSongSelect = (song) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setCurrentSong(song);
    setIsPlaying(true);
    
    // Gamification
    gainXP(10); // Reward for active selection
    
    // Update History
    const updatedHistory = [song, ...history.filter(s => s.id !== song.id)].slice(0, 12);
    setHistory(updatedHistory);
    localStorage.setItem('st-history', JSON.stringify(updatedHistory));
  };

  const handleNext = () => {
    if (songs.length === 0) return;
    const currentIndex = songs.findIndex(s => s.id === currentSong?.id);
    let nextIndex;
    
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * songs.length);
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= songs.length) nextIndex = 0;
    }
    
    handleSongSelect(songs[nextIndex]);
  };

  const handlePrev = () => {
    if (songs.length === 0) return;
    const currentIndex = songs.findIndex(s => s.id === currentSong?.id);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = songs.length - 1;
    handleSongSelect(songs[prevIndex]);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: 'var(--bg-main)' }}>
      <div className="app-shell">
        {/* 🖥️ SIDEBAR */}
        <aside className="sidebar">
          <div style={{ padding: '0 1rem 3.5rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-green)', letterSpacing: '-1.5px' }}>SANGATAMIZH</h1>
          </div>

          <nav style={{ flexGrow: 1 }}>
            {navItems.map(({ id, Icon, label }) => (
              <div 
                key={id} 
                className={`nav-link ${activeTab === id ? 'active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                <Icon size={24} strokeWidth={2.5} />
                <span>{label}</span>
              </div>
            ))}
          </nav>

          <div style={{ padding: '0 1rem 1.5rem' }}>
             
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={toggleTheme} className="btn-tactile btn-secondary" style={{ width: '100%', height: '42px', gap: '10px', fontSize: '0.8rem', padding: '0 1rem' }}>
                    {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                    {theme === 'light' ? 'NIGHT MODE' : 'DAY MODE'}
                </button>

                <div style={{ borderTop: '2px solid var(--border-light)', paddingTop: '10px', marginTop: '5px' }}>
                    {user ? (
                      <div className="card-tactile" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--bg-main)', borderColor: 'var(--border-light)' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, color: 'white', border: '2px solid var(--border-light)' }}>
                            {user.email ? user.email[0].toUpperCase() : <User size={18} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p className="truncate" style={{ fontWeight: 950, fontSize: '0.75rem', color: 'var(--text-main)', marginBottom: '1px' }}>{user.displayName || (user.email ? user.email.split('@')[0] : 'User')}</p>
                            <button onClick={handleLogout} style={{ fontSize: '0.65rem', color: 'var(--color-pink)', cursor: 'pointer', fontWeight: 900, background: 'none', border: 'none', padding: 0 }}>SIGN OUT</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setAuthModalOpen(true)} className="btn-tactile btn-blue" style={{ width: '100%', height: '48px', gap: '10px' }}>
                        <User size={18} />
                        LOGIN / SIGNUP
                      </button>
                    )}
                </div>
             </div>

             
             {/* DEV ONLY: Test Animation Trigger */}
             <button onClick={() => setShowCelebration(true)} style={{ marginTop: '10px', fontSize: '0.6rem', padding: '4px', opacity: 0.3, background: 'none', border: '1px dashed var(--text-muted)', color: 'var(--text-muted)', cursor: 'pointer', width: '100%' }}>
                TEST CELEBRATION
             </button>
          </div>
        </aside>

        {/* 📱 MAIN CONTENT */}
        <main className="main-viewport">
          <header style={{ 
            padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            position: 'sticky', top: 0, background: 'var(--bg-main)', zIndex: 500
          }}>
             <div>
                <h2 style={{ fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {activeTab === 'home' ? 'Vaazhga Tamizh!' : activeTab.toUpperCase()}
                    {activeTab === 'home' && <div style={{ width: '8px', height: '8px', background: 'var(--color-green)', borderRadius: '50%' }}></div>}
                </h2>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>
                  {isPlaying ? 'Enjoying the vibe...' : 'Choose your melody'}
                </p>
             </div>

              <div style={{ display: 'flex', gap:  '12px', position: 'relative' }}>
                <button 
                  onClick={() => {
                    if (user) {
                      setConfirmDialog({
                        msg: "Are you sure you want to LOGOUT?",
                        onConfirm: () => {
                          handleLogout();
                          setConfirmDialog(null);
                        }
                      });
                    } else {
                      setAuthModalOpen(true);
                    }
                  }}
                  className="btn-tactile btn-secondary" 
                  style={{ width: '42px', height: '42px', padding: 0, borderRadius: '12px', background: user ? 'var(--color-blue)' : undefined, color: user ? 'white' : undefined, border: user ? 'none' : undefined }}
                >
                   {user ? (
                     <span style={{ fontWeight: 900, fontSize: '1rem' }}>{user.email ? user.email[0].toUpperCase() : 'U'}</span>
                   ) : (
                     <User size={20} />
                   )}
                </button>

                <div style={{ position: 'relative' }}>
                  <motion.button 
                     animate={{ 
                       scale: xpGained ? [1, 1.2, 1] : 1,
                       boxShadow: xpGained ? '0 0 15px var(--color-yellow)' : '0 4px 0 var(--color-blue-depth)' 
                     }}
                     transition={{ duration: 0.3 }}
                     onClick={() => setShowStreakPopover(!showStreakPopover)}
                     className="btn-tactile btn-blue" 
                     style={{ width: '42px', height: '42px', padding: 0, borderRadius: '12px', border: xpGained ? '2px solid var(--color-yellow)' : 'none' }}
                  >
                     <Flame size={20} fill={streak > 0 ? "white" : "none"} color={xpGained ? "var(--color-yellow)" : "currentColor"} />
                  </motion.button>

                  {/* Streak Detail Container */}
                  <AnimatePresence>
                    {showStreakPopover && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        style={{ 
                          position: 'absolute', top: '55px', right: '-40px', width: '220px', 
                          background: 'var(--bg-card)', borderRadius: '20px', border: '2px solid var(--border-light)',
                          padding: '1.25rem', zIndex: 600, boxShadow: '0 15px 40px rgba(0,0,0,0.2)'
                        }}
                      >
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ fontWeight: 950, fontSize: '0.75rem', color: 'var(--text-main)' }}>🔥 {streak} DAY STREAK</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--color-blue)' }}>LVL 1</span>
                         </div>
                         <div style={{ height: '6px', background: 'var(--border-light)', borderRadius: '10px', overflow: 'hidden', marginBottom: '8px' }}>
                            <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${xp}%` }}
                               style={{ height: '100%', background: 'var(--color-blue)', borderRadius: '10px' }}
                            />
                         </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>{xp}/100 XP</span>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>GOAL</span>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button className="btn-tactile btn-secondary" style={{ width: '42px', height: '42px', padding: 0, borderRadius: '12px' }}>
                   <Bell size={20} />
                </button>
             </div>
          </header>

          <section className="scroll-content no-scrollbar">
            <AnimatePresence mode="wait">
              {activeTab === 'home' && (
                <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  {/* V2 Style - Emotion Row */}
                  <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1.5rem' }} className="no-scrollbar">
                    <div 
                      onClick={() => setSelectedEmotion(null)}
                      className="glass-card" 
                      style={{ 
                        padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px', 
                        cursor: 'pointer', whiteSpace: 'nowrap', minWidth: '130px', 
                        borderBottom: !selectedEmotion ? '4px solid var(--color-blue)' : '4px solid transparent',
                        opacity: !selectedEmotion ? 1 : 0.7
                      }}
                    >
                      <span>🎯</span>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>All Vibes</span>
                    </div>
                    {EMOTIONS.map(emotion => (
                      <div 
                        key={emotion.id} 
                        onClick={() => setSelectedEmotion(emotion.id)}
                        className="glass-card" 
                        style={{ 
                          padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px', 
                          cursor: 'pointer', whiteSpace: 'nowrap', minWidth: '130px', 
                          borderBottom: selectedEmotion === emotion.id ? `4px solid ${emotion.color}` : '4px solid transparent',
                          opacity: selectedEmotion === emotion.id ? 1 : 0.7
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>{emotion.icon}</span>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{emotion.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="card-tactile hero-card" style={{ 
                    background: 'linear-gradient(135deg, var(--color-blue), #8A2BE2)', 
                    borderColor: 'var(--color-blue-depth)',
                    boxShadow: '0 8px 0 var(--color-blue-depth)', color: 'white',
                    marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '2rem',
                    overflow: 'hidden', padding: '2.5rem', position: 'relative'
                  }}>
                    <div className="glass-shine" style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none' }}></div>
                    <div style={{ flex: 1, zIndex: 1 }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                         <span style={{ fontWeight: 900, background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', textTransform: 'uppercase' }}>New Discovery</span>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--color-yellow)', color: '#4B4B4B', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 950 }}>
                            <Flame size={12} fill="#4B4B4B" /> 2X STREAK BONUS
                         </div>
                      </div>
                      <h1 style={{ color: 'white', fontSize: 'clamp(1.75rem, 6vw, 2.75rem)', fontWeight: 950, lineHeight: 1, marginBottom: '15px' }}>Ilaiyaraaja's <br/> Golden Era</h1>
                      <p style={{ fontSize: '0.9rem', fontWeight: 700, opacity: 0.9, marginBottom: '20px', maxWidth: '400px' }}>Curated collection of remastered classics for the modern soul.</p>
                      <button className="btn-tactile btn-green" style={{ height: '48px', padding: '0 2.5rem' }}>START VIBING</button>
                    </div>
                    <div className="hero-visual desktop-only" style={{ width: '180px', height: '180px', background: 'rgba(255,255,255,0.1)', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(5px)' }}>
                      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                        <Play size={80} color="white" fill="white" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Recently Played History */}
                  {history.length > 0 && (
                    <div style={{ marginBottom: '2.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            <div style={{ width: '4px', height: '20px', background: 'var(--color-blue)', borderRadius: '10px' }}></div>
                            Recently Played
                        </h3>
                        <div className="desktop-only" style={{ display: 'flex', gap: '8px' }}>
                          <button className="scroll-nav-btn" onClick={() => historyScrollRef.current.scrollBy({ left: -240, behavior: 'smooth' })}>
                            <ChevronLeft size={18} />
                          </button>
                          <button className="scroll-nav-btn" onClick={() => historyScrollRef.current.scrollBy({ left: 240, behavior: 'smooth' })}>
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </div>
                      <div 
                        ref={historyScrollRef}
                        style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '1.5rem', scrollBehavior: 'smooth', paddingLeft: '2px' }} 
                        className="no-scrollbar"
                      >
                           {history.map(song => (
                             <motion.div 
                               key={song.id} 
                               onClick={() => handleSongSelect(song)} 
                               style={{ minWidth: '220px', cursor: 'pointer', position: 'relative' }}
                               whileHover={{ scale: 1.05, zIndex: 10 }}
                               transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                             >
                                <div className={`card-tactile glass-shine ${currentSong?.id === song.id ? 'playing-glow' : ''}`} style={{ padding: '0', overflow: 'hidden', borderRadius: '14px', background: 'var(--bg-card)', border: '2px solid var(--border-light)' }}>
                                   <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden' }}>
                                      <img src={song.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={song.title} />
                                      {/* Play Overlay */}
                                      <div className="hover-visible" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', opacity: 0, transition: '0.3s' }}>
                                         <div onClick={(e) => openPlaylistAction(e, song)} style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(5px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }} className="hover-lift">
                                            <PlusCircle size={20} color="white" />
                                         </div>
                                         <div style={{ width: '44px', height: '44px', background: '#FF4B4B', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 5px 15px rgba(255, 75, 75, 0.4)' }}>
                                            <Play size={20} fill="white" color="white" />
                                         </div>
                                      </div>
                                      {/* Bottom Progress Bar (Netflix Style) */}
                                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.2)' }}>
                                         <div style={{ width: '60%', height: '100%', background: '#FF4B4B' }}></div>
                                      </div>
                                   </div>
                                   <div style={{ padding: '12px', background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                         <div style={{ flex: 1, minWidth: 0 }}>
                                            <h4 className="truncate" style={{ fontSize: '0.85rem', fontWeight: 950, marginBottom: '2px', color: 'white' }}>{song.title}</h4>
                                            <p className="truncate" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>{song.artist || 'Unknown Artist'}</p>
                                         </div>
                                         <div style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>HD</div>
                                      </div>
                                   </div>
                                </div>
                             </motion.div>
                           ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '4px', height: '20px', background: 'var(--color-pink)', borderRadius: '10px' }}></div>
                      Recent Hits
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--bg-card)', padding: '6px 16px', borderRadius: '30px', border: '2px solid var(--border-light)', boxShadow: '0 3px 0 var(--border-light)' }} className="hover-lift">
                      <span style={{ color: 'var(--color-blue)', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.5px' }}>EXPLORE ALL</span>
                    </div>
                  </div>

                  {/* Song Grid */}
                  <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '2rem' }}>
                    {loading ? (
                      [1,2,3,4,5,6].map(i => (
                        <div key={i} className="card-tactile" style={{ height: '230px', padding: '12px' }}>
                           <div className="skeleton" style={{ width: '100%', aspectRatio: '1/1', borderRadius: '14px', marginBottom: '12px' }}></div>
                        </div>
                      ))
                    ) : songs.filter(s => !selectedEmotion || (s.emotion && s.emotion.toLowerCase() === selectedEmotion.toLowerCase())).length === 0 ? (
                      <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                         <Music size={40} style={{ opacity: 0.2, marginBottom: '10px' }} />
                         <p style={{ fontWeight: 800 }}>No vibes found for this mood.</p>
                      </div>
                    ) : (
                      songs
                        .filter(s => !selectedEmotion || (s.emotion && s.emotion.toLowerCase() === selectedEmotion.toLowerCase()))
                        .slice((homePage - 1) * ITEMS_PER_PAGE, homePage * ITEMS_PER_PAGE)
                        .map(song => (
                        <motion.div 
                          key={song.id} 
                          whileHover={{ scale: 1.02 }} 
                          className={`card-tactile glass-shine hover-lift ${currentSong?.id === song.id ? 'playing-glow' : ''}`} 
                          style={{ padding: '12px', cursor: 'pointer' }}
                          onClick={() => handleSongSelect(song)}
                        >
                          <div style={{ position: 'relative' }}>
                            <img 
                              src={song.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745'} 
                              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745'; }}
                              style={{ width: '100%', aspectRatio: '1/1', borderRadius: '14px', objectFit: 'cover', marginBottom: '12px' }} 
                              alt={song.title}
                            />
                            <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', gap: '8px' }}>
                              <motion.div 
                                whileTap={{ scale: 0.8 }}
                                onClick={(e) => toggleLike(e, song.id)}
                                style={{ 
                                  cursor: 'pointer', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(5px)',
                                  width: '32px', height: '32px', borderRadius: '50%',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  border: '1px solid rgba(255,255,255,0.2)'
                                }}
                              >
                                 <motion.div
                                   initial={false}
                                   animate={{ 
                                     scale: likedIds.includes(song.id) ? [1, 1.5, 1] : 1,
                                     color: likedIds.includes(song.id) ? '#FF4B4B' : '#FFFFFF'
                                   }}
                                   transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
                                 >
                                    <Heart size={16} fill={likedIds.includes(song.id) ? 'currentColor' : 'none'} color={likedIds.includes(song.id) ? '#FF4B4B' : '#FFFFFF'} />
                                 </motion.div>
                              </motion.div>
                              <div 
                                onClick={(e) => openPlaylistAction(e, song)}
                                style={{ 
                                  cursor: 'pointer', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(5px)',
                                  width: '32px', height: '32px', borderRadius: '50%',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  border: '1px solid rgba(255,255,255,0.2)'
                                }}
                              >
                                 <PlusCircle size={16} color="white" />
                              </div>
                            </div>
                          </div>
                          <h4 className="truncate" style={{ fontSize: '1rem', marginBottom: '4px' }}>{song.title}</h4>
                          <p className="truncate" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{song.artist}</p>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Home Pagination */}
                  {!loading && songs.filter(s => !selectedEmotion || (s.emotion && s.emotion.toLowerCase() === selectedEmotion.toLowerCase())).length > ITEMS_PER_PAGE && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.25rem', marginTop: '3rem', paddingBottom: '2rem' }}>
                      <button 
                        className={`btn-tactile ${homePage === 1 ? 'btn-secondary' : 'btn-blue'}`}
                        style={{ height: '42px', padding: '0 1.5rem', opacity: homePage === 1 ? 0.6 : 1 }}
                        onClick={() => { setHomePage(p => Math.max(1, p - 1)); document.querySelector('.scroll-content').scrollTo({ top: 0, behavior: 'smooth' }); }}
                        disabled={homePage === 1}
                      >
                        <ChevronLeft size={20} style={{ marginRight: '8px' }} /> PREV
                      </button>
                      
                      <div style={{ background: 'var(--bg-card)', padding: '8px 16px', borderRadius: '20px', border: '2px solid var(--border-light)', fontWeight: 950, fontSize: '0.85rem' }}>
                        {homePage} / {Math.ceil(songs.filter(s => !selectedEmotion || (s.emotion && s.emotion.toLowerCase() === selectedEmotion.toLowerCase())).length / ITEMS_PER_PAGE)}
                      </div>

                      <button 
                        className={`btn-tactile ${homePage === Math.ceil(songs.filter(s => !selectedEmotion || (s.emotion && s.emotion.toLowerCase() === selectedEmotion.toLowerCase())).length / ITEMS_PER_PAGE) ? 'btn-secondary' : 'btn-blue'}`}
                        style={{ height: '42px', padding: '0 1.5rem', opacity: homePage === Math.ceil(songs.filter(s => !selectedEmotion || (s.emotion && s.emotion.toLowerCase() === selectedEmotion.toLowerCase())).length / ITEMS_PER_PAGE) ? 0.6 : 1 }}
                        onClick={() => { setHomePage(p => p + 1); document.querySelector('.scroll-content').scrollTo({ top: 0, behavior: 'smooth' }); }}
                        disabled={homePage === Math.ceil(songs.filter(s => !selectedEmotion || (s.emotion && s.emotion.toLowerCase() === selectedEmotion.toLowerCase())).length / ITEMS_PER_PAGE)}
                      >
                        NEXT <ChevronRight size={20} style={{ marginLeft: '8px' }} />
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'library' && <motion.div key="library"><Library user={user} onPlay={handleSongSelect} songs={songs} likedIds={likedIds} toggleLike={toggleLike} openPlaylistModal={openPlaylistAction} playlists={playlists} setPlaylists={setPlaylists} setConfirmDialog={setConfirmDialog} /></motion.div>}
              {activeTab === 'admin' && user?.email === ADMIN_EMAIL && <motion.div key="admin"><Admin user={user} /></motion.div>}
              {activeTab === 'search' && (
                <motion.div key="search">
                  <div style={{ marginBottom: '2rem', position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={22} />
                    <input 
                      type="text" 
                      placeholder="Search songs, mood..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ 
                        width: '100%', height: '60px', borderRadius: '18px', border: '2px solid var(--border-light)', 
                        padding: '0 3.5rem', fontSize: '1.05rem', fontWeight: 600, outline: 'none',
                        background: 'var(--bg-card)', color: 'var(--text-main)', boxShadow: '0 4px 0 var(--border-light)'
                      }}
                    />
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')}
                        style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 900 }}
                      >
                        CLEAR
                      </button>
                    )}
                  </div>
                  <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '2rem' }}>
                    {!searchTerm ? (
                      <div style={{ gridColumn: '1/-1' }}>
                         {/* Discover by Mood */}
                         <div style={{ marginBottom: '2.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Flame size={18} color="var(--color-pink)" fill="var(--color-pink)" />
                              Discover by Mood
                            </h3>
                            <div style={{ display: 'flex', gap: '0.85rem', overflowX: 'auto', paddingBottom: '0.5rem' }} className="no-scrollbar">
                               {EMOTIONS.map(e => (
                                 <button 
                                   key={e.id} 
                                   onClick={() => setSearchTerm(e.label)}
                                   className="btn-tactile btn-secondary" 
                                   style={{ height: '40px', padding: '0 1.25rem', fontSize: '0.75rem', gap: '8px', borderStyle: 'solid', background: 'var(--bg-card)' }}
                                 >
                                    <span>{e.icon}</span>
                                    {e.label}
                                 </button>
                               ))}
                            </div>
                         </div>

                         <div style={{ marginBottom: '2.5rem' }}>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Music size={18} color="var(--color-blue)" />
                            Explore Genres
                          </h3>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                              {['Melody', 'Folk', 'Carnatic', 'Indie', 'Retro', 'Pop'].map(genre => (
                                <div 
                                  key={genre} 
                                  onClick={() => setSearchTerm(genre)}
                                  className="card-tactile glass-shine" 
                                  style={{ padding: '1.25rem', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-main)', borderStyle: 'dashed' }}
                                >
                                    <p style={{ fontWeight: 800, fontSize: '0.9rem' }}>{genre}</p>
                                </div>
                              ))}
                          </div>
                         </div>

                         <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
                            <Disc size={40} className="spin-slow" style={{ marginBottom: '10px' }} />
                            <p style={{ fontWeight: 800, fontSize: '0.8rem' }}>Start typing to discover melodies</p>
                         </div>
                      </div>
                    ) : songs.filter(s => 
                        s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        s.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (s.emotion && s.emotion.toLowerCase().includes(searchTerm.toLowerCase()))
                      ).length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem 2rem' }}>
                           <Search size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
                           <h3 style={{ fontWeight: 900, marginBottom: '8px' }}>No Melodies Found</h3>
                           <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 700 }}>Try searching for a different song</p>
                        </div>
                      ) : (
                        <div style={{ gridColumn: '1/-1' }}>
                          <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '2rem' }}>
                             {songs
                                .filter(s => 
                                  s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  s.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (s.emotion && s.emotion.toLowerCase().includes(searchTerm.toLowerCase()))
                                )
                                .slice((searchPage - 1) * ITEMS_PER_PAGE, searchPage * ITEMS_PER_PAGE)
                                .map(song => (
                                  <motion.div key={song.id} whileHover={{ scale: 1.02 }} className={`card-tactile glass-shine hover-lift ${currentSong?.id === song.id ? 'playing-glow' : ''}`} style={{ padding: '12px', cursor: 'pointer', position: 'relative' }} onClick={() => handleSongSelect(song)}>
                                    <div style={{ position: 'relative' }}>
                                      <img src={song.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745'} style={{ width: '100%', aspectRatio: '1/1', borderRadius: '14px', objectFit: 'cover', marginBottom: '12px' }} alt={song.title} />
                                      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', gap: '8px' }}>
                                        <motion.div 
                                          whileTap={{ scale: 0.8 }}
                                          onClick={(e) => toggleLike(e, song.id)}
                                          style={{ 
                                            cursor: 'pointer', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(5px)',
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: '1px solid rgba(255,255,255,0.2)'
                                          }}
                                        >
                                           <motion.div
                                             initial={false}
                                             animate={{ 
                                               scale: likedIds.includes(song.id) ? [1, 1.5, 1] : 1,
                                               color: likedIds.includes(song.id) ? '#FF4B4B' : '#FFFFFF'
                                             }}
                                             transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
                                           >
                                              <Heart size={16} fill={likedIds.includes(song.id) ? 'currentColor' : 'none'} color={likedIds.includes(song.id) ? '#FF4B4B' : '#FFFFFF'} />
                                           </motion.div>
                                        </motion.div>
                                        <div 
                                          onClick={(e) => openPlaylistAction(e, song)}
                                          style={{ 
                                            cursor: 'pointer', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(5px)',
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: '1px solid rgba(255,255,255,0.2)'
                                          }}
                                        >
                                           <PlusCircle size={16} color="white" />
                                        </div>
                                      </div>
                                    </div>
                                    <h4 className="truncate" style={{ fontSize: '1rem', marginBottom: '4px' }}>{song.title}</h4>
                                    <p className="truncate" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{song.artist}</p>
                                  </motion.div>
                                ))}
                          </div>

                          {/* Search Pagination */}
                          {songs.filter(s => 
                              s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              s.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (s.emotion && s.emotion.toLowerCase().includes(searchTerm.toLowerCase()))
                            ).length > ITEMS_PER_PAGE && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.25rem', marginTop: '3rem', paddingBottom: '2rem' }}>
                                <button 
                                  className={`btn-tactile ${searchPage === 1 ? 'btn-secondary' : 'btn-blue'}`}
                                  style={{ height: '42px', padding: '0 1.5rem', opacity: searchPage === 1 ? 0.6 : 1 }}
                                  onClick={() => { setSearchPage(p => Math.max(1, p - 1)); document.querySelector('.scroll-content').scrollTo({ top: 0, behavior: 'smooth' }); }}
                                  disabled={searchPage === 1}
                                >
                                  <ChevronLeft size={20} style={{ marginRight: '8px' }} /> PREV
                                </button>
                                
                                <div style={{ background: 'var(--bg-card)', padding: '8px 16px', borderRadius: '20px', border: '2px solid var(--border-light)', fontWeight: 950, fontSize: '0.85rem' }}>
                                  {searchPage} / {Math.ceil(songs.filter(s => 
                                      s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                      s.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      (s.emotion && s.emotion.toLowerCase().includes(searchTerm.toLowerCase()))
                                    ).length / ITEMS_PER_PAGE)}
                                </div>

                                <button 
                                  className={`btn-tactile ${searchPage === Math.ceil(songs.filter(s => 
                                      s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                      s.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      (s.emotion && s.emotion.toLowerCase().includes(searchTerm.toLowerCase()))
                                    ).length / ITEMS_PER_PAGE) ? 'btn-secondary' : 'btn-blue'}`}
                                  style={{ height: '42px', padding: '0 1.5rem', opacity: searchPage === Math.ceil(songs.filter(s => 
                                      s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                      s.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      (s.emotion && s.emotion.toLowerCase().includes(searchTerm.toLowerCase()))
                                    ).length / ITEMS_PER_PAGE) ? 0.6 : 1 }}
                                  onClick={() => { setSearchPage(p => p + 1); document.querySelector('.scroll-content').scrollTo({ top: 0, behavior: 'smooth' }); }}
                                  disabled={searchPage === Math.ceil(songs.filter(s => 
                                      s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                      s.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      (s.emotion && s.emotion.toLowerCase().includes(searchTerm.toLowerCase()))
                                    ).length / ITEMS_PER_PAGE)}
                                >
                                  NEXT <ChevronRight size={20} style={{ marginLeft: '8px' }} />
                                </button>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* 🔊 MASTER PLAYER */}
          {currentSong && (
            <div className="master-player mobile-player-fix">
               {/* Progress Bar (Dynamic Position via CSS) */}
               <div className="player-progress-container"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const p = x / rect.width;
                      if (audioRef.current.duration) { audioRef.current.currentTime = p * audioRef.current.duration; }
                    }}>
                  <div className="player-progress-fill" style={{ width: `${progress}%` }}></div>
               </div>

                {/* LEFT: INFO - Click to expand */}
                <div className="player-info-side" onClick={() => setShowImmersive(true)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', minWidth: 0, flex: 1 }}>
                   <div style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0 }}>
                     <img src={currentSong.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745'} 
                          style={{ width: '100%', height: '100%', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', border: '1px solid var(--border-light)' }} alt="Cover" />
                     {isPlaying && (
                       <div className="vibe-wave-mini" style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'var(--color-blue)', borderRadius: '50%', padding: '4px', border: '2px solid var(--bg-card)', scale: '0.75' }}>
                          <div className="vibe-wave" style={{ height: '14px', gap: '2px' }}>
                             <span style={{ width: '2px', background: 'white' }}></span>
                             <span style={{ width: '2px', background: 'white' }}></span>
                             <span style={{ width: '2px', background: 'white' }}></span>
                          </div>
                       </div>
                     )}
                   </div>
                   <div style={{ overflow: 'hidden', minWidth: 0 }}>
                      <p className="truncate" style={{ fontSize: '0.95rem', fontWeight: 950, color: 'var(--text-main)', marginBottom: '1px' }}>{currentSong.title}</p>
                      <p className="truncate" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>{currentSong.artist || 'Unknown Artist'}</p>
                   </div>
                </div>

                {/* CENTER: CONTROLS */}
                <div className="player-controls-center" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <button className="btn-tactile btn-secondary" onClick={handlePrev} style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%' }}>
                         <SkipBack size={20} fill="currentColor" />
                      </button>
                      <div onClick={() => setIsPlaying(!isPlaying)} style={{ 
                         width: '54px', height: '54px', borderRadius: '50%', background: 'var(--text-main)', color: 'var(--bg-main)', 
                         display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                         boxShadow: '0 5px 0 rgba(0,0,0,0.2)',
                         transition: 'all 0.1s var(--smooth)'
                      }} className="btn-vibe hover-lift">
                         {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" style={{ marginLeft: '4px' }} />}
                      </div>
                      <button className="btn-tactile btn-secondary" onClick={handleNext} style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%' }}>
                         <SkipForward size={20} fill="currentColor" />
                      </button>
                   </div>
                </div>

               {/* RIGHT: ACTIONS */}
               <div className="player-actions-side desktop-only" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '1.25rem', alignItems: 'center' }}>
                  <button className="btn-tactile btn-secondary" style={{ width: '38px', height: '38px', padding: 0, background: isShuffle ? 'var(--color-blue)' : undefined, borderColor: isShuffle ? 'var(--color-blue)' : undefined, color: isShuffle ? 'white' : undefined }} onClick={() => setIsShuffle(!isShuffle)}>
                    <Shuffle size={16} color={isShuffle ? 'white' : 'currentColor'} strokeWidth={isShuffle ? 3 : 2} />
                  </button>
                  <button className="btn-tactile btn-secondary" style={{ width: '38px', height: '38px', padding: 0, background: isRepeat ? 'var(--color-blue)' : undefined, borderColor: isRepeat ? 'var(--color-blue)' : undefined, color: isRepeat ? 'white' : undefined }} onClick={() => setIsRepeat(!isRepeat)}>
                    <Repeat size={16} color={isRepeat ? 'white' : 'currentColor'} strokeWidth={isRepeat ? 3 : 2} />
                  </button>
                  <div style={{ width: '1px', height: '24px', background: 'var(--border-light)', opacity: 0.5 }}></div>
                  <button className="btn-tactile btn-secondary" style={{ width: '38px', height: '38px', padding: 0 }} onClick={() => setShowLyrics(true)}>
                     <Mic2 size={18} />
                  </button>
                  <motion.div 
                     whileTap={{ scale: 0.8 }}
                     onClick={(e) => toggleLike(e, currentSong.id)} 
                     style={{ cursor: 'pointer' }}
                  >
                     <motion.div
                       initial={false}
                       animate={{ 
                         scale: likedIds.includes(currentSong.id) ? [1, 1.5, 1] : 1,
                         color: likedIds.includes(currentSong.id) ? '#FF4B4B' : 'var(--text-muted)'
                       }}
                       transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
                     >
                        <Heart size={22} fill={likedIds.includes(currentSong.id) ? 'currentColor' : 'none'} />
                     </motion.div>
                  </motion.div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '10px' }}>
                     <Volume2 size={18} color="var(--text-muted)" />
                     <div 
                        onClick={(e) => {
                           const rect = e.currentTarget.getBoundingClientRect();
                           const x = e.clientX - rect.left;
                           const vol = Math.max(0, Math.min(1, x / rect.width));
                           setVolume(vol);
                        }}
                        style={{ width: '90px', height: '6px', background: 'var(--border-light)', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
                     >
                        <div style={{ width: `${volume * 100}%`, height: '100%', background: 'var(--color-blue)', boxShadow: '0 0 8px var(--color-blue)' }}></div>
                     </div>
                  </div>
               </div>
            </div>
          )}


         <ImmersivePlayer 
            isOpen={showImmersive}
            onClose={() => setShowImmersive(false)}
            currentSong={currentSong}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            progress={progress}
            setProgress={setProgress}
            audioRef={audioRef}
            volume={volume}
            setVolume={setVolume}
            likedIds={likedIds}
            toggleLike={toggleLike}
            isShuffle={isShuffle}
            setIsShuffle={setIsShuffle}
            isRepeat={isRepeat}
            setIsRepeat={setIsRepeat}
            setShowLyrics={setShowLyrics}
            handleNext={handleNext}
            handlePrev={handlePrev}
            timeInfo={timeInfo}
         />

          {/* 📱 BOTTOM NAV */}
          <nav className="bottom-nav">
            {navItems.map(({ id, Icon, label }) => (
              <div key={id} className={`nav-link ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
                <Icon size={26} strokeWidth={activeTab === id ? 3 : 2} color={activeTab === id ? 'var(--color-blue)' : 'var(--text-muted)'} />
                <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>{label}</span>
              </div>
            ))}
          </nav>
        </main>
        <style>{`.desktop-only { display: block; } .mobile-only { display: none; } @media (max-width: 768px) { .desktop-only { display: none; } .mobile-only { display: block; } }`}</style>
      </div>

      {/* 🧩 GLOBAL OVERLAYS - Efficient Top-Center Notification */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 10000, 
              background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setShowCelebration(false)}
          >
            {/* 💥 EXPLOSION CENTER */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                
                {/* Layer 1: Comic Burst Lines (Black/White style from image) */}
                {[...Array(16)].map((_, i) => (
                    <motion.div
                        key={`burst-${i}`}
                        initial={{ opacity: 0, height: 0, y: 0 }}
                        animate={{ opacity: [0, 1, 0], height: [0, 100, 150], y: [-20, -100, -150] }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                        style={{
                            position: 'absolute',
                            top: 0, left: 0,
                            width: '4px', 
                            background: 'white',
                            borderRadius: '4px',
                            transformOrigin: 'bottom center',
                            transform: `rotate(${i * 22.5}deg) translateY(-50px)` // 360 / 16 = 22.5
                        }}
                    />
                ))}

                 {/* Layer 2: Colorful Confetti Explosion */}
                 {[...Array(60)].map((_, i) => {
                    const angle = (i / 60) * 360; // Spread evenly in a circle
                    const velocity = 300 + Math.random() * 500;
                    return (
                      <motion.div
                        key={`confetti-${i}`}
                        initial={{ x: 0, y: 0, scale: 0 }}
                        animate={{ 
                          x: Math.cos(angle * Math.PI / 180) * velocity, 
                          y: Math.sin(angle * Math.PI / 180) * velocity, 
                          rotate: Math.random() * 720,
                          opacity: [1, 1, 0],
                          scale: [0, 1.5, 0]
                        }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        style={{
                          position: 'absolute',
                          width: Math.random() > 0.5 ? '12px' : '8px', 
                          height: Math.random() > 0.5 ? '12px' : '8px',
                          background: ['#FFC800', '#FF4B4B', '#1CB0F6', '#58CC02', '#FF00FF'][i % 5],
                          borderRadius: i % 2 === 0 ? '50%' : '2px',
                        }}
                      />
                    );
                 })}
            </div>

            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              style={{ 
                padding: '3rem 2rem', textAlign: 'center', width: '100%', maxWidth: '380px', 
                background: '#202F36', position: 'relative', zIndex: 10,
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '32px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 4px rgba(255, 200, 0, 0.2)'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Central Badge */}
              <div style={{ 
                width: '100px', height: '100px', 
                background: 'linear-gradient(135deg, #FFC800, #FF9500)', 
                borderRadius: '30px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                margin: '0 auto 1.5rem',
                boxShadow: '0 10px 30px rgba(255, 200, 0, 0.4)',
                transform: 'rotate(-5deg)'
              }}>
                 <Flame size={55} fill="white" color="white" />
              </div>

              <h2 style={{ fontSize: '1.75rem', fontWeight: 950, marginBottom: '8px', color: 'white', letterSpacing: '-0.5px' }}>Streak Unlocked!</h2>
              
              <div style={{ marginBottom: '2rem' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--color-blue)', marginBottom: '8px' }}>
                   {user?.displayName || (user?.email ? user.email.split('@')[0] : 'Music Lover')}
                </p>
                <p style={{ fontSize: '0.9rem', color: '#8E9BA7', fontWeight: 700, lineHeight: 1.5 }}>
                  Innaiku unga vibe vera level! <br/>
                  You've hit your daily goal. Keep the rhythm going! 🎵🔥
                </p>
              </div>

              <button 
                onClick={() => setShowCelebration(false)}
                className="btn-tactile btn-blue" 
                style={{ width: '100%', height: '56px', fontSize: '1rem', borderRadius: '18px', boxShadow: '0 8px 20px rgba(28, 176, 246, 0.3)' }}
              >
                KEEP VIBING
              </button>
            </motion.div>
          </motion.div>
        )}
        {authModalOpen && (
          <AuthModal 
            isOpen={authModalOpen} 
            onClose={() => setAuthModalOpen(false)} 
            onSuccess={(u) => { setUser(u); setAuthModalOpen(false); }}
          />
        )}



        {playlistModalSong && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 5000000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setPlaylistModalSong(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="card-tactile"
                style={{ width: '400px', maxWidth: '90vw', background: 'var(--bg-card)', padding: '2rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                   <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <PlusCircle color="var(--color-blue)" /> Add to Playlist
                   </h3>
                   <button onClick={() => setPlaylistModalSong(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                     <CheckCircle2 size={24} />
                   </button>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', background: 'var(--bg-main)', padding: '10px', borderRadius: '12px' }}>
                   <img src={playlistModalSong.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745'} style={{ width: '50px', height: '50px', borderRadius: '8px' }} />
                   <div style={{ minWidth: 0 }}>
                      <p className="truncate" style={{ fontWeight: 900, margin: 0 }}>{playlistModalSong.title}</p>
                      <p className="truncate" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{playlistModalSong.artist}</p>
                   </div>
                </div>

                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }} className="no-scrollbar">
                   {playlists.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', border: '2px dashed var(--border-light)', borderRadius: '15px' }}>
                         <p style={{ color: 'var(--text-muted)', fontWeight: 700 }}>No playlists found. Create one in Library!</p>
                      </div>
                   ) : (
                      playlists.map(p => (
                         <button 
                           key={p.id} 
                           onClick={() => addToPlaylist(p.id)}
                           className="btn-tactile hover-lift" 
                           style={{ justifyContent: 'space-between', padding: '12px 20px', background: 'var(--bg-main)', border: '2px solid var(--border-light)' }}
                         >
                            <span style={{ fontWeight: 800 }}>{p.name}</span>
                            <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{p.songIds.length} Songs</span>
                         </button>
                      ))
                   )}
                </div>
              </motion.div>
            </motion.div>
          )}
        {confirmDialog && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 2000000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
              onClick={() => setConfirmDialog(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="toast-tactile"
                onClick={e => e.stopPropagation()}
                style={{ position: 'relative', top: 0, left: 0, transform: 'none', width: '380px', display: 'flex', flexDirection: 'column', gap: '20px', padding: '1.5rem' }}
              >
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ width: '50px', height: '50px', background: 'var(--color-yellow)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertCircle size={28} color="#202F36" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.7rem', color: 'var(--color-yellow)', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4px' }}>CONFIRMATION</p>
                        <h3 style={{ fontSize: '1.1rem', color: 'white', fontWeight: 900, lineHeight: 1.3 }}>{confirmDialog.msg}</h3>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '5px' }}>
                      <button 
                        onClick={confirmDialog.onConfirm}
                        className="btn-tactile btn-blue" 
                        style={{ flex: 1, height: '48px', fontWeight: 950, fontSize: '0.85rem' }}
                      >
                        YES, PROCEED
                      </button>
                      <button 
                        onClick={() => setConfirmDialog(null)}
                        className="btn-tactile btn-secondary" 
                        style={{ flex: 1, height: '48px', fontWeight: 950, fontSize: '0.85rem', background: '#35464D', border: 'none', color: 'white' }}
                      >
                        CANCEL
                      </button>
                  </div>
              </motion.div>
            </motion.div>
          )}
      </AnimatePresence>

      <LyricsOverlay 
        isOpen={showLyrics} 
        onClose={() => setShowLyrics(false)} 
        currentSong={currentSong} 
        lyrics={lyrics}
        loading={lyricsLoading}
      />
    </div>
  );
};

export default App;
