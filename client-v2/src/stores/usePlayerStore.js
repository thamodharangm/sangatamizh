// ============================================
// PRODUCTION-GRADE MUSIC PLAYER STORE
// Apple Music / Spotify Level
// ============================================

import { create } from 'zustand';

const usePlayerStore = create((set, get) => ({
  // ============================================
  // STATE
  // ============================================
  
  // Current Track
  currentTrack: null,
  
  // Playlist Queue
  playlistQueue: [],
  currentIndex: -1,
  
  // Playback State
  isPlaying: false,
  isLoading: false,
  isBuffering: false,
  
  // Time State
  currentTime: 0,
  duration: 0,
  bufferedTime: 0,
  
  // Volume
  volume: 1.0,
  isMuted: false,
  
  // Audio Instance (Singleton)
  audioInstance: null,
  
  // Error State
  error: null,
  
  // ============================================
  // ACTIONS
  // ============================================
  
  /**
   * Initialize audio instance (called once on app mount)
   */
  initializeAudio: () => {
    if (get().audioInstance) return;
    
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = get().volume;
    
    // Event Listeners
    audio.addEventListener('loadstart', () => {
      set({ isLoading: true, error: null });
    });
    
    audio.addEventListener('loadedmetadata', () => {
      const duration = audio.duration;
      set({ 
        duration: isNaN(duration) ? 0 : duration,
        isLoading: false 
      });
    });
    
    audio.addEventListener('canplay', () => {
      set({ isBuffering: false });
    });
    
    audio.addEventListener('playing', () => {
      set({ isPlaying: true, isBuffering: false });
    });
    
    audio.addEventListener('pause', () => {
      set({ isPlaying: false });
    });
    
    audio.addEventListener('waiting', () => {
      set({ isBuffering: true });
    });
    
    audio.addEventListener('timeupdate', () => {
      set({ currentTime: audio.currentTime });
    });
    
    audio.addEventListener('progress', () => {
      if (audio.buffered.length > 0) {
        const buffered = audio.buffered.end(audio.buffered.length - 1);
        set({ bufferedTime: buffered });
      }
    });
    
    audio.addEventListener('ended', () => {
      get().playNext();
    });
    
    audio.addEventListener('error', (e) => {
      console.error('[AudioPlayer] Error:', e);
      set({ 
        error: 'Failed to load audio',
        isLoading: false,
        isBuffering: false,
        isPlaying: false
      });
    });
    
    set({ audioInstance: audio });
  },
  
  /**
   * Load and play a track
   */
  loadTrack: (track, playlist = []) => {
    const audio = get().audioInstance;
    if (!audio) {
      console.error('[AudioPlayer] Audio not initialized');
      return;
    }
    
    // Set queue
    const queue = playlist.length > 0 ? playlist : [track];
    const index = queue.findIndex(t => t.id === track.id);
    
    set({
      currentTrack: track,
      playlistQueue: queue,
      currentIndex: index !== -1 ? index : 0,
      currentTime: 0,
      duration: 0,
      bufferedTime: 0,
      error: null
    });
    
    // Load audio
    const streamUrl = `/api/stream/${track.id}`;
    audio.src = streamUrl;
    audio.load();
    
    // Auto-play
    audio.play().catch(err => {
      console.warn('[AudioPlayer] Autoplay blocked:', err);
      set({ isPlaying: false });
    });
  },
  
  /**
   * Toggle play/pause
   */
  togglePlay: () => {
    const audio = get().audioInstance;
    if (!audio || !get().currentTrack) return;
    
    if (audio.paused) {
      audio.play().catch(err => {
        console.error('[AudioPlayer] Play failed:', err);
        set({ error: 'Playback failed' });
      });
    } else {
      audio.pause();
    }
  },
  
  /**
   * Play next track
   */
  playNext: () => {
    const { playlistQueue, currentIndex } = get();
    
    if (currentIndex < playlistQueue.length - 1) {
      const nextTrack = playlistQueue[currentIndex + 1];
      get().loadTrack(nextTrack, playlistQueue);
    } else {
      // End of playlist
      set({ isPlaying: false });
    }
  },
  
  /**
   * Play previous track
   */
  playPrevious: () => {
    const { playlistQueue, currentIndex, currentTime } = get();
    
    // If more than 3 seconds played, restart current track
    if (currentTime > 3) {
      get().seek(0);
      return;
    }
    
    // Otherwise, go to previous track
    if (currentIndex > 0) {
      const prevTrack = playlistQueue[currentIndex - 1];
      get().loadTrack(prevTrack, playlistQueue);
    } else {
      // Restart current track
      get().seek(0);
    }
  },
  
  /**
   * Seek to specific time
   */
  seek: (time) => {
    const audio = get().audioInstance;
    if (!audio) return;
    
    audio.currentTime = time;
    set({ currentTime: time });
  },
  
  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume: (volume) => {
    const audio = get().audioInstance;
    if (!audio) return;
    
    const clampedVolume = Math.max(0, Math.min(1, volume));
    audio.volume = clampedVolume;
    set({ volume: clampedVolume, isMuted: clampedVolume === 0 });
  },
  
  /**
   * Toggle mute
   */
  toggleMute: () => {
    const { isMuted, volume } = get();
    const audio = get().audioInstance;
    if (!audio) return;
    
    if (isMuted) {
      audio.volume = volume || 0.5;
      set({ isMuted: false });
    } else {
      audio.volume = 0;
      set({ isMuted: true });
    }
  },
  
  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  }
}));

export default usePlayerStore;
