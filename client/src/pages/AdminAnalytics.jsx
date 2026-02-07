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
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '0 1rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1.5rem' }}>
        <h1 style={{ color: 'white', margin: '0 0 0.5rem 0', fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>
          Analytics
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
          Platform statistics and trends
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        <div className="card-flat" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Total Logins
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white' }}>
            {stats.totalLogins}
          </div>
        </div>

        <div className="card-flat" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Total Songs
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white' }}>
            {stats.totalSongs}
          </div>
        </div>

        <div className="card-flat" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Active Users (24h)
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#10b981' }}>
            {stats.activeUsers}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="card-flat" style={{ padding: '1.5rem' }}>
        <h3 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
          Login Trends (Last 7 Days)
        </h3>
        
        <div style={{ height: '300px', width: '100%' }}>
          {loading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
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
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(str) => {
                    const date = new Date(str);
                    return `${date.getMonth()+1}/${date.getDate()}`;
                  }}
                />
                <YAxis 
                  stroke="var(--text-muted)" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ background: '#1c1c1c', border: '1px solid #333', borderRadius: '8px', color: 'white' }}
                  itemStyle={{ color: '#10b981' }}
                  labelStyle={{ color: '#888' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="logins" 
                  stroke="#10b981" 
                  strokeWidth={3}
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
