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
    // Refresh every 30s
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
    <div style={{ padding: '0 0 2rem 0' }}>
      
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card-flat" style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Logins</div>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white' }}>
            {stats.totalLogins}
          </div>
        </div>

        <div className="card-flat" style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Songs</div>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white' }}>
            {stats.totalSongs}
          </div>
        </div>

        <div className="card-flat" style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Active Users (24h)</div>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#58cc02' }}>
            {stats.activeUsers}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="card-flat" style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
        <h3 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Login Trends (Last 7 Days)</h3>
        
        <div style={{ height: '300px', width: '100%' }}>
          {loading ? (
             <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#58cc02" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#58cc02" stopOpacity={0}/>
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
                  itemStyle={{ color: '#58cc02' }}
                  labelStyle={{ color: '#888' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="logins" 
                  stroke="#58cc02" 
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
