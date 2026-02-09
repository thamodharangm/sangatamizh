import { useState, useEffect } from 'react';
import api from '../config/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const AdminAnalytics = () => {
  const [stats, setStats] = useState({ 
    totalLogins: 0, 
    totalSongs: 0, 
    totalPlays: 0,
    activeUsers: 0, 
    chartData: [],
    topPlayed: [],
    topLiked: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/analytics/stats');
        if (res.data) {
          setStats({
            totalLogins: res.data.totalLogins || 0,
            totalSongs: res.data.totalSongs || 0,
            totalPlays: res.data.totalPlays || 0,
            activeUsers: res.data.activeUsers || 0, 
            chartData: Array.isArray(res.data.chartData) ? res.data.chartData : [],
            topPlayed: Array.isArray(res.data.topPlayed) ? res.data.topPlayed : [],
            topLiked: Array.isArray(res.data.topLiked) ? res.data.topLiked : []
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#32D74B', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
            <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>Loading Analytics...</p>
        </div>
    </div>
  );

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '0.5rem',
      height: 'calc(100vh - 220px)', // Precise height to fit in Admin Hub without outer scroll
      minHeight: '520px',
      overflow: 'hidden'
    }}>
      
      {/* 1. Performance Row - High Visibility Icons */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '0.5rem',
        flexShrink: 0
      }}>
        <div className="card-flat" style={{ 
          padding: '0.75rem 0.85rem', 
          borderRadius: '18px', 
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, boxShadow: '0 4px 12px rgba(88, 204, 2, 0.2)' }}>
            <span style={{ filter: 'brightness(100) grayscale(1)' }}>▶️</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'white', lineHeight: 1.1 }}>{stats.totalPlays}</div>
            <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '1px' }}>PLAYS</div>
          </div>
        </div>

        <div className="card-flat" style={{ 
          padding: '0.75rem 0.85rem', 
          borderRadius: '18px', 
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#007AFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, boxShadow: '0 4px 12px rgba(0, 122, 255, 0.2)' }}>
            <span style={{ filter: 'brightness(100) grayscale(1)' }}>👥</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'white', lineHeight: 1.1 }}>{stats.activeUsers}</div>
            <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '1px' }}>ACTIVE</div>
          </div>
        </div>
      </div>

      {/* 2. Compressed Quick Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
             <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>SONGS</span>
             <span style={{ fontSize: '0.7rem', color: 'white', fontWeight: '900' }}>{stats.totalSongs}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
             <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>LOGINS</span>
             <span style={{ fontSize: '0.7rem', color: 'white', fontWeight: '900' }}>{stats.totalLogins}</span>
          </div>
      </div>

      {/* 3. Trend Visualizer - Optimized for High Density */}
      <div className="card-flat" style={{ 
        padding: '0.75rem', 
        borderRadius: '20px', 
        background: 'var(--bg-card)', 
        border: '1px solid var(--border-color)',
        flexBasis: '180px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ color: 'white', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Audience Retention</h3>
            <div style={{ fontSize: '0.5rem', color: 'var(--primary)', fontWeight: '900', background: 'rgba(88, 204, 2, 0.1)', padding: '0.15rem 0.4rem', borderRadius: '5px' }}>DAILY</div>
        </div>
        
        <div style={{ flex: 1, width: '100%', minHeight: '110px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData} margin={{ top: 5, right: 5, left: -35, bottom: -10 }}>
                <defs>
                  <linearGradient id="premiumTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis 
                    dataKey="date" 
                    stroke="rgba(255,255,255,0.2)" 
                    fontSize={8} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(str) => {
                        const date = new Date(str);
                        return `${date.getDate()}`;
                    }}
                />
                <Tooltip 
                    contentStyle={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '9px', padding: '5px' }}
                    cursor={{ stroke: 'var(--primary)', strokeWidth: 1 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="logins" 
                  stroke="var(--primary)" 
                  strokeWidth={2.5}
                  fill="url(#premiumTrend)" 
                  activeDot={{ r: 4 }}
                  dot={false}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Leaderboard - Self-contained Scroll */}
      <div className="card-flat" style={{ 
        padding: '0', 
        borderRadius: '20px', 
        background: 'var(--bg-card)', 
        border: '1px solid var(--border-color)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
            <h3 style={{ color: 'white', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Top Performing</h3>
        </div>
        <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0.25rem 0.75rem' }}>
            {stats.topPlayed.length > 0 ? stats.topPlayed.slice(0, 8).map((song, i) => (
                <div key={i} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '0.5rem 0', 
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  gap: '0.75rem'
                }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: i === 0 ? 'var(--primary)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '900', color: i === 0 ? 'black' : 'white', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: 'white', fontSize: '0.75rem', fontWeight: '750', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>{song.artist}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '900', lineHeight: 1 }}>{song.count}</div>
                        <div style={{ fontSize: '0.45rem', color: 'var(--text-muted)', fontWeight: '800' }}>PLAYS</div>
                    </div>
                </div>
            )) : (
                <div style={{ textAlign: 'center', padding: '1rem', opacity: 0.2, fontSize: '0.6rem' }}>NO DATA</div>
            )}
        </div>
      </div>
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AdminAnalytics;
