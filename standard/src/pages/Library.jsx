import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ListMusic, Disc, Mic2, Play, Plus, ArrowLeft, Trash2, X, Music, PlusCircle } from 'lucide-react';

const API_URL = 'http://localhost:3002/api';

const Library = ({ user, onPlay, songs = [], likedIds = [], toggleLike, openPlaylistModal, playlists, setPlaylists, setConfirmDialog }) => {
  const [likedSongs, setLikedSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('main'); // 'main', 'liked', 'playlists', 'artists', 'albums', 'playlist_detail'
  const [selectedSubItem, setSelectedSubItem] = useState(null); // Used for artist/album name
  const [selectedPlaylist, setSelectedPlaylist] = useState(null); // Used for playlist object
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Playlist Creation State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  useEffect(() => {
    // Sync Liked Songs
    if (likedIds.length > 0) {
      const filtered = songs.filter(s => likedIds.includes(s.id));
      setLikedSongs(filtered);
    } else {
      setLikedSongs([]);
    }
    setLoading(false);
    setPage(1);

    // Fetch Playlists if User Logged In
    if (user && playlists.length === 0) {
      fetch(`${API_URL}/playlists?userId=${user.uid}`)
        .then(res => res.json())
        .then(data => setPlaylists(data))
        .catch(err => console.error("Fetch playlists failed:", err));
    }
  }, [likedIds, songs, user, playlists.length, setPlaylists]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim() || !user) return;
    try {
      const res = await fetch(`${API_URL}/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, name: newPlaylistName })
      });
      const newPlaylist = await res.json();
      setPlaylists([...playlists, newPlaylist]);
      setNewPlaylistName('');
      setShowCreateModal(false);
      // Optional: Show notification
    } catch (err) {
      console.error("Create playlist failed:", err);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [view]);

  const handleDeletePlaylist = async (playlist) => {
    try {
      const res = await fetch(`${API_URL}/playlists/${playlist.id}`, { method: 'DELETE' });
      if (res.ok) {
        setPlaylists(playlists.filter(p => p.id !== playlist.id));
        if (selectedPlaylist?.id === playlist.id) setView('main');
        setConfirmDialog(null);
      } else {
        const data = await res.json();
        console.error(data.error || "Failed to delete");
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const confirmDelete = (playlist, e) => {
    if (e) e.stopPropagation();
    setConfirmDialog({
      msg: `Delete "${playlist.name}"? This cannot be undone.`,
      onConfirm: () => handleDeletePlaylist(playlist)
    });
  };

  const artists = [...new Set(songs.map(s => s.artist))];
  const albums = [...new Set(songs.map(s => s.album || 'Single'))];

  const sections = [
    { id: 'liked', title: 'Liked', count: likedSongs.length, icon: Heart, color: 'var(--color-pink)' },
    { id: 'playlists', title: 'Playlists', count: playlists.length, icon: ListMusic, color: 'var(--color-blue)' },
    { id: 'albums', title: 'Albums', count: albums.length, icon: Disc, color: 'var(--color-green)' },
  ];

  // Helper to render song list
  // Helper to render song list
  const renderSongList = (list) => {
    const totalPages = Math.ceil(list.length / ITEMS_PER_PAGE);
    const paginatedList = list.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
         {list.length === 0 ? (
           <div className="card-tactile" style={{ textAlign: 'center', padding: '3rem', borderStyle: 'dashed' }}>
              <p style={{ fontWeight: 800, color: 'var(--text-muted)' }}>No songs found here.</p>
           </div>
         ) : (
           <>
             {paginatedList.map((song, i) => (
               <div key={song.id} onClick={() => onPlay(song)} className="card-tactile glass-shine" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', cursor: 'pointer' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 950, width: '30px', fontSize: '0.8rem' }}>{((page - 1) * ITEMS_PER_PAGE) + i + 1}</span>
                  <img src={song.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745'} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} alt="Cover" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 className="truncate" style={{ fontSize: '0.9rem', fontWeight: 900, marginBottom: '2px' }}>{song.title}</h4>
                    <p className="truncate" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>{song.artist}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); openPlaylistModal(song); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: 'var(--text-muted)' }}
                    >
                      <PlusCircle size={18} />
                    </button>
                    <button 
                      onClick={(e) => toggleLike(e, song.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
                    >
                       <Heart size={18} fill={likedIds.includes(song.id) ? "var(--color-pink)" : "none"} color={likedIds.includes(song.id) ? "var(--color-pink)" : "var(--text-muted)"} />
                    </button>
                    <Play size={18} color="var(--color-blue)" />
                  </div>
               </div>
             ))}

             {totalPages > 1 && (
               <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.25rem', marginTop: '1.5rem', paddingBottom: '1rem' }}>
                 <button 
                   className={`btn-tactile ${page === 1 ? 'btn-secondary' : 'btn-blue'}`}
                   style={{ height: '36px', padding: '0 1.25rem', opacity: page === 1 ? 0.6 : 1, fontSize: '0.75rem' }}
                   onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(1, p - 1)); }}
                   disabled={page === 1}
                 >
                   PREV
                 </button>
                 
                 <div style={{ background: 'var(--bg-card)', padding: '6px 12px', borderRadius: '15px', border: '2px solid var(--border-light)', fontWeight: 950, fontSize: '0.75rem' }}>
                   {page} / {totalPages}
                 </div>

                 <button 
                   className={`btn-tactile ${page === totalPages ? 'btn-secondary' : 'btn-blue'}`}
                   style={{ height: '36px', padding: '0 1.25rem', opacity: page === totalPages ? 0.6 : 1, fontSize: '0.75rem' }}
                   onClick={(e) => { e.stopPropagation(); setPage(p => Math.min(totalPages, p + 1)); }}
                   disabled={page === totalPages}
                 >
                   NEXT
                 </button>
               </div>
             )}
           </>
         )}
      </div>
    );
  };

  if (view === 'liked') {
    return (
      <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <button onClick={() => setView('main')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--color-blue)', fontWeight: 800, cursor: 'pointer', marginBottom: '1.5rem', padding: 0 }}>
           <ArrowLeft size={18} /> BACK TO LIBRARY
        </button>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Heart size={32} fill="var(--color-pink)" color="var(--color-pink)" />
          Liked Songs
        </h2>
        {renderSongList(likedSongs)}
      </div>
    );
  }

  if (view === 'playlists') {
    return (
      <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <button onClick={() => setView('main')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--color-blue)', fontWeight: 800, cursor: 'pointer', marginBottom: '1.5rem', padding: 0 }}>
           <ArrowLeft size={18} /> BACK TO LIBRARY
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
           <h2 style={{ fontSize: '1.75rem', fontWeight: 900 }}>Your Playlists</h2>
           <button onClick={() => setShowCreateModal(true)} className="btn-tactile btn-blue" style={{ height: '40px', gap: '8px' }}>
              <Plus size={18} /> New
           </button>
        </div>
        
        <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1.5rem' }}>
           {playlists.length === 0 ? (
             <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <ListMusic size={40} style={{ opacity: 0.2, marginBottom: '10px' }} />
                <p style={{ fontWeight: 800 }}>No playlists yet. Create one!</p>
             </div>
           ) : (
             playlists.map(playlist => (
               <div key={playlist.id} className="card-tactile glass-shine" style={{ padding: '1.5rem 1rem', cursor: 'pointer', position: 'relative' }} 
                    onClick={() => { setSelectedPlaylist(playlist); setView('playlist_detail'); }}>
                  <button 
                    onClick={(e) => confirmDelete(playlist, e)}
                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--color-pink)', cursor: 'pointer', opacity: 0.8, padding: '6px', borderRadius: '50%' }}
                    className="hover-lift"
                  >
                     <Trash2 size={16} />
                  </button>
                  <div style={{ width: '100px', height: '100px', margin: '0 auto 1rem', background: 'var(--bg-main)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border-light)' }}>
                     <Music size={40} color="var(--color-blue)" />
                  </div>
                  <h4 className="truncate" style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 900 }}>{playlist.name}</h4>
                  <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>{playlist.songIds.length} Songs</p>
               </div>
             ))
           )}
        </div>
      </div>
    );
  }

  if (view === 'playlist_detail') {
    const playlistSongs = songs.filter(s => selectedPlaylist?.songIds.includes(s.id));
    return (
      <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <button onClick={() => setView('playlists')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--color-blue)', fontWeight: 800, cursor: 'pointer', marginBottom: '1.5rem', padding: 0 }}>
           <ArrowLeft size={18} /> BACK TO PLAYLISTS
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
           <div style={{ width: '120px', height: '120px', borderRadius: '20px', background: 'linear-gradient(135deg, var(--color-blue), var(--color-pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
              <ListMusic size={60} color="white" />
           </div>
           <div>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '5px' }}>{selectedPlaylist?.name}</h2>
               <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <p style={{ fontWeight: 800, color: 'var(--text-muted)', margin: 0 }}>Created by You • {playlistSongs.length} songs</p>
                  <button 
                    onClick={() => confirmDelete(selectedPlaylist)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-pink)', cursor: 'pointer', fontWeight: 900, fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(255, 75, 75, 0.2)' }}
                    className="hover-lift"
                  >
                     <Trash2 size={14} /> DELETE PLAYLIST
                  </button>
               </div>
           </div>
        </div>
        {renderSongList(playlistSongs)}
      </div>
    );
  }

  // Reuse logic for albums/artists from previous implementation...
  if (view === 'albums') {
    return (
      <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <button onClick={() => setView('main')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--color-blue)', fontWeight: 800, cursor: 'pointer', marginBottom: '1.5rem', padding: 0 }}>
           <ArrowLeft size={18} /> BACK TO LIBRARY
        </button>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '2rem' }}>Your Albums</h2>
        <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1.5rem' }}>
           {albums.map(album => (
             <div key={album} className="card-tactile glass-shine" style={{ textAlign: 'center', padding: '1.5rem 1rem' }} onClick={() => { setSelectedSubItem(album); setView('album_songs'); }}>
                <div style={{ width: '90px', height: '90px', borderRadius: '16px', background: 'var(--bg-main)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border-light)' }}>
                   <Disc size={40} color="var(--color-green)" />
                </div>
                <h4 className="truncate" style={{ fontSize: '0.85rem', fontWeight: 900 }}>{album}</h4>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>{songs.filter(s => (s.album || 'Single') === album).length} Songs</p>
             </div>
           ))}
        </div>
      </div>
    );
  }



  if (view === 'artist_songs' || view === 'album_songs') {
    const isArtist = view === 'artist_songs';
    const filteredSongs = isArtist ? songs.filter(s => s.artist === selectedSubItem) : songs.filter(s => (s.album || 'Single') === selectedSubItem);
    return (
      <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <button onClick={() => setView(isArtist ? 'artists' : 'albums')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--color-blue)', fontWeight: 800, cursor: 'pointer', marginBottom: '1.5rem', padding: 0 }}>
           <ArrowLeft size={18} /> BACK
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
           <div style={{ width: '100px', height: '100px', borderRadius: '20px', background: isArtist ? 'var(--color-yellow)' : 'var(--color-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isArtist ? <Mic2 size={50} color="white" /> : <Disc size={50} color="white" />}
           </div>
           <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900 }}>{selectedSubItem}</h2>
              <p style={{ fontWeight: 800, color: 'var(--text-muted)' }}>{filteredSongs.length} total vibes</p>
           </div>
        </div>
        {renderSongList(filteredSongs)}
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Create Playlist Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
               style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
               onClick={() => setShowCreateModal(false)}>
             <div onClick={e => e.stopPropagation()} className="card-tactile" style={{ width: '300px', padding: '1.5rem', background: 'var(--bg-card)' }}>
                <h3 style={{ marginBottom: '1rem' }}>New Playlist</h3>
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Playlist Name" 
                  value={newPlaylistName}
                  onChange={e => setNewPlaylistName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid var(--border-light)', marginBottom: '1rem', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                   <button onClick={() => setShowCreateModal(false)} className="btn-tactile btn-secondary">Cancel</button>
                   <button onClick={handleCreatePlaylist} className="btn-tactile btn-blue">Create</button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900 }}>Your Library</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 700 }}>Your personal universe of Tamil music</p>
        </div>
        <button onClick={() => {
           if (!user) return alert("Please login first!");
           setShowCreateModal(true);
        }} className="btn-tactile btn-blue desktop-only" style={{ height: '44px', gap: '8px' }}>
           <Plus size={18} />
           Create Playlist
        </button>
      </header>

      <div className="grid-responsive" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        {sections.map(({ id, title, count, icon: Icon, color }) => (
          <div key={title} onClick={() => setView(id)} className="card-tactile glass-shine" style={{ 
            textAlign: 'center', padding: '1.5rem 1rem', display: 'flex', 
            flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer'
          }}>
            <Icon size={32} color={color} fill={id === 'liked' ? color : 'none'} />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 900 }}>{title}</h4>
            <span style={{ 
              fontSize: '0.7rem', fontWeight: 800, background: 'var(--border-light)', 
              padding: '4px 10px', borderRadius: '20px', color: 'var(--text-main)'
            }}>
              {count} Items
            </span>
          </div>
        ))}
      </div>

      <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Heart size={20} fill="var(--color-pink)" color="var(--color-pink)" />
        Recent Favorites
      </h3>
      
      {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             {[1,2,3].map(i => (
                <div key={i} className="card-tactile" style={{ height: '60px', width: '100%', padding: '10px' }}>
                   <div className="skeleton" style={{ height: '100%', width: '100%', borderRadius: '8px' }}></div>
                </div>
             ))}
          </div>
        ) : likedSongs.length === 0 ? (
          <div className="card-tactile" style={{ textAlign: 'center', padding: '3rem', borderStyle: 'dashed' }}>
             <p style={{ fontWeight: 800, color: 'var(--text-muted)' }}>No liked songs yet. Start hearting!</p>
          </div>
        ) : (
          renderSongList(likedSongs.slice(0, 5))
        )}
    </div>
  );
};

export default Library;
