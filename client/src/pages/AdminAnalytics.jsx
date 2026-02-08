import { useState, useEffect } from 'react';
import api from '../config/api';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminAnalytics = () => {
  const [stats, setStats] = useState({ 
    totalLogins: 0, 
    totalSongs: 0, 
    activeUsers: 0, 
    chartData: [] 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/analytics/stats');
      if (res.data) {
        setStats({
          totalLogins: res.data.totalLogins || 0,
          totalSongs: res.data.totalSongs || 0,
          activeUsers: res.data.activeUsers || 0,
          chartData: Array.isArray(res.data.chartData) ? res.data.chartData : []
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '0.5rem 0.75rem', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Compact Header */}
      <div style={{ marginBottom: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem', flexShrink: 0 }}>
        <h1 style={{ color: 'white', margin: '0 0 0.2rem 0', fontSize: '0.95rem', fontWeight: '800' }}>
          Analytics
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.7rem' }}>
          Platform statistics
        </p>
      </div>

      {/* Compact Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '0.5rem', 
        marginBottom: '0.6rem',
        flexShrink: 0
      }}>
        <div className="card-flat" style={{ padding: '0.6rem 0.4rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.2rem', letterSpacing: '0.5px' }}>
            TOTAL LOGINS
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white', lineHeight: 1 }}>
            {stats.totalLogins}
          </div>
        </div>

        <div className="card-flat" style={{ padding: '0.6rem 0.4rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.2rem', letterSpacing: '0.5px' }}>
            TOTAL SONGS
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white', lineHeight: 1 }}>
            {stats.totalSongs}
          </div>
        </div>

        <div className="card-flat" style={{ padding: '0.6rem 0.4rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(50, 215, 75, 0.1)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.2rem', letterSpacing: '0.5px' }}>
            ACTIVE (24H)
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#10b981', lineHeight: 1 }}>
            {stats.activeUsers}
          </div>
        </div>
      </div>

      {/* Compact Chart Section */}
      <div className="card-flat" style={{ padding: '0.6rem', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 style={{ color: 'white', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: '700', flexShrink: 0 }}>
          Login Trends (7 Days)
        </h3>
        
        <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
          {loading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
              Loading...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--text-muted)" 
                  fontSize={9} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(str) => {
                    const date = new Date(str);
                    return `${date.getMonth()+1}/${date.getDate()}`;
                  }}
                />
                <YAxis 
                  stroke="var(--text-muted)" 
                  fontSize={9} 
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ background: '#1c1c1c', border: '1px solid #333', borderRadius: '6px', color: 'white', fontSize: '0.7rem', padding: '0.4rem' }}
                  itemStyle={{ color: '#10b981' }}
                  labelStyle={{ color: '#888' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="logins" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorLogins)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
