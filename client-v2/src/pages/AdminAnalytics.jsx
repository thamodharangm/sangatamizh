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
    <div style={{ padding: '1rem', paddingBottom: '100px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '900', marginBottom: '1.25rem', letterSpacing: '-0.5px' }}>
        Analytics
      </h1>

      {/* Grid Stats - Compact */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '0.75rem', 
        marginBottom: '1.5rem' 
      }}>
        <div className="card-flat" style={{ padding: '1rem', textAlign: 'center', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(50, 215, 75, 0.1)' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--primary)', marginBottom: '0.1rem', lineHeight: 1 }}>{stats.totalPlays}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plays</div>
        </div>

        <div className="card-flat" style={{ padding: '1rem', textAlign: 'center', borderRadius: '16px', background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: 'white', marginBottom: '0.1rem', lineHeight: 1 }}>{stats.activeUsers}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active</div>
        </div>

        <div className="card-flat" style={{ padding: '1rem', textAlign: 'center', borderRadius: '16px', background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: 'white', marginBottom: '0.1rem', lineHeight: 1 }}>{stats.totalSongs}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Songs</div>
        </div>

        <div className="card-flat" style={{ padding: '1rem', textAlign: 'center', borderRadius: '16px', background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: 'white', marginBottom: '0.1rem', lineHeight: 1 }}>{stats.totalLogins}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Logins</div>
        </div>
      </div>

      {/* Login Trends - Compact */}
      <div className="card-flat" style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 style={{ color: 'white', fontSize: '0.95rem', marginBottom: '1rem', fontWeight: '800' }}>
            Login Trends
        </h3>
        <div style={{ height: '160px', width: '100%', marginLeft: '-15px' }}>
            <ResponsiveContainer width="105%" height="100%">
              <AreaChart data={stats.chartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mobileTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#32D74B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#32D74B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                    dataKey="date" 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(str) => {
                        const date = new Date(str);
                        return `${date.getMonth()+1}/${date.getDate()}`;
                    }}
                />
                <YAxis 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false}
                    width={25}
                />
                <Tooltip 
                    contentStyle={{ background: '#1c1c1e', border: 'none', borderRadius: '8px', fontSize: '10px', boxShadow: '0 8px 20px rgba(0,0,0,0.5)', padding: '5px 8px' }}
                    labelStyle={{ color: '#888', marginBottom: '2px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="logins" 
                  stroke="#32D74B" 
                  strokeWidth={2}
                  fill="url(#mobileTrend)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performing - Compact */}
      <div className="card-flat" style={{ padding: '1rem', borderRadius: '20px', background: 'rgba(255,255,255,0.03)' }}>
        <h3 style={{ color: 'white', fontSize: '0.95rem', marginBottom: '1rem', fontWeight: '800' }}>
            Top Performing
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {stats.topPlayed.length > 0 ? stats.topPlayed.map((song, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '900', color: i === 0 ? 'var(--primary)' : 'white' }}>{i + 1}</div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>{song.artist}</div>
                    </div>
                    <div style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '800' }}>{song.count}</div>
                </div>
            )) : (
                <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'rgba(255,255,255,0.3)' }}>
                    <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.3rem' }}>📊</span>
                    <p style={{ fontSize: '0.8rem', fontWeight: '600' }}>No statistics available</p>
                </div>
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
