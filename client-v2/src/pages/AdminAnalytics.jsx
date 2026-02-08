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
    <div style={{ padding: '1.5rem', paddingBottom: '120px' }}>
      <h1 style={{ color: 'white', fontSize: '2.2rem', fontWeight: '900', marginBottom: '2rem', letterSpacing: '-1px' }}>
        Analytics
      </h1>

      {/* Grid Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '1rem', 
        marginBottom: '2.5rem' 
      }}>
        <div className="card-flat" style={{ padding: '1.5rem 1rem', textAlign: 'center', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(50, 215, 75, 0.1)' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--primary)', marginBottom: '0.2rem', lineHeight: 1 }}>{stats.totalPlays}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Plays</div>
        </div>

        <div className="card-flat" style={{ padding: '1.5rem 1rem', textAlign: 'center', borderRadius: '20px', background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', marginBottom: '0.2rem', lineHeight: 1 }}>{stats.activeUsers}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Active</div>
        </div>

        <div className="card-flat" style={{ padding: '1.5rem 1rem', textAlign: 'center', borderRadius: '20px', background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', marginBottom: '0.2rem', lineHeight: 1 }}>{stats.totalSongs}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Songs</div>
        </div>

        <div className="card-flat" style={{ padding: '1.5rem 1rem', textAlign: 'center', borderRadius: '20px', background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', marginBottom: '0.2rem', lineHeight: 1 }}>{stats.totalLogins}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Logins</div>
        </div>
      </div>

      {/* Login Trends - WITH X & Y AXIS */}
      <div className="card-flat" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: '800' }}>
            Login Trends
        </h3>
        <div style={{ height: '220px', width: '100%', marginLeft: '-20px' }}>
            <ResponsiveContainer width="105%" height="100%">
              <AreaChart data={stats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mobileTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#32D74B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#32D74B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis 
                    dataKey="date" 
                    stroke="rgba(255,255,255,0.4)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(str) => {
                        const date = new Date(str);
                        return `${date.getMonth()+1}/${date.getDate()}`;
                    }}
                />
                <YAxis 
                    stroke="rgba(255,255,255,0.4)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    width={30}
                />
                <Tooltip 
                    contentStyle={{ background: '#1c1c1e', border: 'none', borderRadius: '12px', fontSize: '11px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    labelStyle={{ color: '#888' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="logins" 
                  stroke="#32D74B" 
                  strokeWidth={3}
                  fill="url(#mobileTrend)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', fontWeight: '700', marginTop: '1.5rem', textTransform: 'uppercase' }}>
            <span>Timeline (Last 7 Days)</span>
            <span style={{ color: '#32D74B' }}>● Frequency</span>
        </div>
      </div>

      {/* Top Performing */}
      <div className="card-flat" style={{ padding: '1.5rem', borderRadius: '24px', background: 'rgba(255,255,255,0.03)' }}>
        <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: '800' }}>
            Top Performing
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {stats.topPlayed.length > 0 ? stats.topPlayed.map((song, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '900', color: i === 0 ? 'var(--primary)' : 'white' }}>{i + 1}</div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ color: 'white', fontSize: '0.95rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{song.artist}</div>
                    </div>
                    <div style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: '800' }}>{song.count}</div>
                </div>
            )) : (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'rgba(255,255,255,0.3)' }}>
                    <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📊</span>
                    <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>No statistics available</p>
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
