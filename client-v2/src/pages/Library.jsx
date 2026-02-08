import { useState, useEffect, useCallback } from 'react';
import api from '../config/api';
import SongCard from '../components/SongCard';
import usePlayerStore from '../stores/usePlayerStore';
import { useAuth } from '../context/AuthContext';

// Mobile-optimized Library Page
const Library = () => {
  const { user } = useAuth();
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const loadTrack = usePlayerStore(state => state.loadTrack);

  const [allSongs, setAllSongs] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState(true);

  const fetchAllSongs = useCallback(async () => {
    try {
      setLoadingSongs(true);
      const response = await api.get('/songs');
      setAllSongs(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setLoadingSongs(false);
    }
  }, []);

  useEffect(() => {
    fetchAllSongs();
  }, [fetchAllSongs]);

  const emotions = ['All', 'Love', 'Sad', 'Motivation', 'Party'];

  const fetchPlaylist = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const response = await api.get(`/likes/songs?userId=${user.uid}`);
      const data = Array.isArray(response.data) ? response.data : [];
      setPlaylistSongs(data.map(s => ({
        ...s,
        coverUrl: s.cover_url || s.coverUrl,
        audioUrl: s.file_url || s.audioUrl,
      })));
    } catch (error) {
      console.error('Error fetching playlist:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user?.uid) fetchPlaylist();
    
    const handlePlaylistUpdate = () => {
      if (user?.uid) fetchPlaylist();
    };
    window.addEventListener('playlistUpdated', handlePlaylistUpdate);
    return () => window.removeEventListener('playlistUpdated', handlePlaylistUpdate);
  }, [user, fetchPlaylist]);

  const combinedSongs = allSongs;

  const filteredSongs = combinedSongs.filter(song => {
    let matchesCategory = category === 'All' || song.emotion === category;
    let matchesSearch = !searchQuery || 
      (song.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (song.artist || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
         <div style={{ color: 'var(--text-muted)' }}>Loading library...</div>
      </div>
    );
  }

  return (
    <div className="library-page" style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      <div className="library-header" style={{ flexShrink: 0 }}>
        <h1 className="mb-2">Library</h1>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search songs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-flat mb-3"
        />

        {/* Emotion Filters */}
        <div className="scroll-container mb-3" style={{ paddingLeft: '4px' }}>
          {emotions.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`btn-3d ${category === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                borderRadius: '20px', 
                padding: '0 1.25rem', 
                fontSize: '0.85rem',
                height: '40px' 
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="library-content no-scrollbar" style={{ flex: 1, overflowY: 'auto', paddingBottom: '2rem' }}>
        
        {/* Netflix Style Horizontal Rows */}
        {category === 'All' && !searchQuery && (
          <>
          <>
            {/* Row 1: All Songs */}
            <section className="mb-4">
              <h2 className="mb-2" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🎶 All Songs
              </h2>
              <div className="scroll-container no-scrollbar">
                {loadingSongs ? (
                  <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading...</div>
                ) : allSongs.length > 0 ? (
                  allSongs.map(song => (
                    <div key={`all-${song.id}`} className="scroll-item">
                      <SongCard song={song} playlist={allSongs} />
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>No songs found.</div>
                )}
              </div>
            </section>
          </>
          </>
        )}

        {/* Search/Filter Grid - Only shows when actively filtering */}
        {(category !== 'All' || searchQuery) && (
          <>
            <h2 className="mb-2" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🔍 {searchQuery ? 'Search Results' : `${category} Songs`}
            </h2>
            
            {filteredSongs.length > 0 ? (
              <div className="songs-grid">
                {filteredSongs.map(song => (
                  <SongCard
                    key={song.id}
                    song={song}
                    playlist={filteredSongs}
                  />
                ))}
              </div>
            ) : (
              <div className="card-flat text-center empty-state">
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  No songs match your filters.
                </p>
                <button 
                  className="btn-3d btn-primary"
                  onClick={() => { setSearchQuery(''); setCategory('All'); }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      <style>{`
        .library-content::-webkit-scrollbar {
          display: none;
        }
        .library-content {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Library;
