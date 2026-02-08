import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../config/api";
import SongCard from "../components/SongCard";
import { useAuth } from "../context/AuthContext";
import { useMusic } from "../context/MusicContext";
import "./Home.css";

// Helper to keep everything before the 2nd pipe and truncate if too long
const formatTitle = (title) => {
  if (!title) return "";
  let clean = title;
  const parts = title.split("|");

  // 1. Cut at 2nd pipe
  if (parts.length > 2) {
    clean = (parts[0] + " | " + parts[1]).trim();
  } else {
    clean = title.trim();
  }

  // 2. Character length limit
  if (clean.length > 40) {
    return clean.substring(0, 37) + "...";
  }

  return clean;
};

// 1. SongRow: Super compact list item for 'Recently Played'
const SongRow = ({ song, onPlay }) => (
  <div 
    onClick={() => onPlay(song)}
    style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '6px',
      padding: '3px 6px', 
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      background: 'rgba(255,255,255,0.01)',
      marginBottom: '3px',
      border: '1px solid rgba(255,255,255,0.03)',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
      e.currentTarget.style.transform = 'translateX(4px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)';
      e.currentTarget.style.transform = 'translateX(0)';
    }}
  >
    <img 
      src={song.coverUrl} 
      style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} 
      alt="" 
    />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ 
        fontSize: '0.7rem', 
        fontWeight: '600', 
        whiteSpace: 'nowrap', 
        overflow: 'hidden', 
        textOverflow: 'ellipsis', 
        color: '#f1f5f9'
      }}>
        {formatTitle(song.title)}
      </div>
    </div>
    <div style={{ 
      color: 'var(--primary)', 
      fontSize: '0.45rem', 
      opacity: 0.7,
      flexShrink: 0,
      width: '14px',
      height: '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '50%'
    }}>▶</div>
  </div>
);

const SongSection = ({ title, songs, playSong, icon, type }) => {
  if (!songs || songs.length === 0) return null;
  const sectionId = title.replace(/\s+/g, "-").toLowerCase();
  const scrollId = `scroll-${sectionId}`;

  const scroll = (dir) => {
    const el = document.getElementById(scrollId);
    if (el) el.scrollBy({ left: dir * 450, behavior: "smooth" });
  };

  return (
    <div className="song-section-container" style={{ 
      flex: type === 'list' ? 1 : '0 1 auto', 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: 0,
      backgroundColor: '#202f36', // var(--bg-card)
      borderRadius: type === 'list' ? '16px' : '24px',
      padding: type === 'list' ? '1rem' : '1.5rem',
      paddingBottom: type === 'list' ? '1.5rem' : '2rem', // Extra space at bottom
      border: '2px solid #37464f', // var(--border-color)
      boxShadow: '0px 4px 0px #37464f',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      boxSizing: 'border-box',
      marginBottom: '8px' // Increased margin
    }}>
      {/* Title Header with 3D Icon */}
      <div style={{ marginBottom: type === 'list' ? '0.75rem' : '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#111b21', // var(--bg-main)
            color: '#ec4899', // var(--secondary)
            border: '2px solid #37464f',
            boxShadow: '0px 3px 0px #37464f',
            width: type === 'list' ? '32px' : '42px',
            height: type === 'list' ? '32px' : '42px',
            borderRadius: '50%',
            fontSize: type === 'list' ? '0.9rem' : '1.2rem',
            flexShrink: 0
          }}>
            {icon}
          </div>
          <h2 style={{ fontSize: type === 'list' ? '0.85rem' : '1.1rem', margin: 0, fontWeight: '800', color: '#e5e5e5', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            {title}
          </h2>
      </div>

      <div
        style={{
          position: "relative",
          flex: type === "list" ? 1 : "none",
          display: "flex",
          alignItems: "center",
          minHeight: 0,
          width: "100%",
          overflow: "visible", // Allow buttons to float properly
        }}
      >
        {/* 3D Round Left Button */}
        {type === "scroll" && (
          <button onClick={() => scroll(-1)} className="duo-nav-btn left">
            {"<"}
          </button>
        )}

        <div
          id={scrollId}
          className="no-scrollbar"
          style={{
            overflowY: type === "list" ? "auto" : "hidden",
            overflowX: type === "scroll" ? "auto" : "hidden",
            display: type === "scroll" ? "flex" : "block",
            gap: "1.5rem",
            flex: 1,
            scrollBehavior: "smooth",
            width: "100%",
            height: type === "list" ? "100%" : "auto",
            padding: type === "scroll" ? "10px 0" : "0",
          }}
        >
          {songs.map((song) => (
            <div
              key={song.id}
              style={{
                flexShrink: 0,
                minWidth: 0,
                width: type === "scroll" ? "160px" : "100%",
                marginBottom: type === "list" ? "10px" : "0",
              }}
            >
              {type === "list" ? (
                <SongRow
                  song={song}
                  onPlay={(target) => playSong(target, songs)}
                />
              ) : (
                <SongCard
                  song={song}
                  onPlay={(target) => playSong(target, songs)}
                />
              )}
            </div>
          ))}
        </div>

        {/* 3D Round Right Button */}
        {type === "scroll" && (
          <button onClick={() => scroll(1)} className="duo-nav-btn right">
            {">"}
          </button>
        )}
      </div>

      <style>{`
        .duo-nav-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.2rem;
          cursor: pointer;
          user-select: none;
          background-color: #202f36;
          color: #ec4899;
          border: 2px solid #37464f;
          box-shadow: 0px 4px 0px #37464f;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          position: absolute;
          z-index: 100;
          transition: all 0.1s ease;
          top: 50%;
          transform: translateY(-50%);
        }
        .duo-nav-btn.left { left: -10px; }
        .duo-nav-btn.right { right: -10px; }
        .duo-nav-btn:hover {
          filter: brightness(1.1);
        }
        .duo-nav-btn:active {
          transform: translateY(-50%) translateY(4px);
          box-shadow: 0px 0px 0px #37464f;
        }
      `}</style>
    </div>
  );
};

function Home() {
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { playSong } = useMusic();
  const navigate = useNavigate();
  const [sections, setSections] = useState({ trending: [], recent: [] });
  const [favorites, setFavorites] = useState([]);

  const getIdentity = useCallback(() => {
    if (user?.uid) return user.uid;
    
    let guestId = localStorage.getItem("guestId");
    if (!guestId) {
      guestId = "guest_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem("guestId", guestId);
    }
    return guestId;
  }, [user]);

  const fetchSections = useCallback(async () => {
    try {
      const userId = getIdentity();
      const [favRes, sectionRes] = await Promise.allSettled([
        api.get(`/likes/songs?userId=${userId}`),
        api.get(`/home-sections?userId=${userId}`),
      ]);

      const normalize = (list) => {
        if (!Array.isArray(list)) return [];
        return list.map((s) => ({
          ...s,
          audioUrl: s.file_url || s.fileUrl,
          coverUrl: s.cover_url || s.coverArt || s.coverUrl,
        }));
      };

      if (favRes.status === 'fulfilled') {
        setFavorites(normalize(favRes.value.data));
      }
      
      if (sectionRes.status === 'fulfilled') {
        setSections({
          trending: normalize(sectionRes.value.data.trending),
          recent: normalize(sectionRes.value.data.recent),
        });
      }
    } catch (error) {
      console.error("Error fetching home data: ", error);
    } finally {
      setLoading(false);
    }
  }, [getIdentity]);

  useEffect(() => {
    fetchSections();
    window.addEventListener("playlistUpdated", fetchSections);
    return () => window.removeEventListener("playlistUpdated", fetchSections);
  }, [fetchSections]);

  const handlePlay = async (song, playlist) => {
    playSong(song, playlist);
    const userId = getIdentity();
    if (userId) {
      api
        .post("/log-play", { userId, songId: song.id })
        .catch((e) => console.error("Log fail", e));
    }
  };

  return (
    <div className="home-dashboard" style={{ 
      height: 'calc(100vh - 4.5rem)', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '1rem',
      overflow: 'hidden',
      padding: '0 1.5rem 0.5rem 1.5rem'
    }}>
      {/* Mini Hero Header */}
      <section
        className="hero-mini"
        style={{
          padding: "1.25rem 2rem",
          background: "linear-gradient(135deg, #1e293b 0%, #111b21 100%)",
          borderRadius: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="hero-content">
          <h1
            style={{ fontSize: "1.6rem", marginBottom: "0.2rem", marginTop: 0 }}
          >
            Welcome to Sangatamizh
          </h1>
          <p style={{ color: "#94a3b8", margin: 0, fontSize: "0.9rem" }}>
            Exploring soulful tracks together.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => navigate("/library")}
            className="btn-3d btn-secondary"
            style={{ height: "36px", fontSize: "0.8rem" }}
          >
            Library
          </button>
          <button
            onClick={() => navigate("/admin")}
            className="btn-3d btn-primary"
            style={{ height: "36px", fontSize: "0.8rem" }}
          >
            Upload
          </button>
        </div>
      </section>

      {loading ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            className="pulse"
            style={{ color: "var(--text-muted)", fontSize: "1.2rem" }}
          >
            Syncing with your mood...
          </span>
        </div>
      ) : (
        <div
          className="parallel-container no-scrollbar"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            minHeight: 0,
            width: "100%",
            overflow: "hidden", // Disabled main vertical scroll
            paddingRight: "0",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "1.25rem",
              width: "100%",
              flex: 1,
              minHeight: 0,
              alignItems: "stretch",
            }}
          >
            {/* Left Column: Recently Played */}
            <div
              style={{
                flex: 0.7,
                display: "flex",
                minHeight: 0,
                minWidth: "220px",
              }}
            >
              <SongSection
                title="Recently Played"
                icon="🕒"
                songs={sections.recent}
                playSong={handlePlay}
                type="list"
              />
            </div>

            {/* Right Column: Trending Now */}
            <div
              style={{
                flex: 1.5,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <SongSection
                title="Trending Now"
                icon="🔥"
                songs={sections.trending}
                playSong={handlePlay}
                type="scroll"
              />
              {/* This space can be used for extra features or kept clean */}
              <div style={{ flex: 1 }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
