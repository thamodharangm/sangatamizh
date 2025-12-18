import { useState, useEffect } from 'react';
import api from '../config/api';

// Mobile-optimized Admin Analytics Page
const AdminAnalytics = () => {
  const [stats, setStats] = useState({
    totalLogins: 0,
    totalSongs: 0,
    activeUsers: 0,
    totalPlays: 0,
    topPlayed: [],
    topLiked: [],
    loginTrends: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await api.get('/analytics/stats');
        setStats({
          totalLogins: response.data.totalLogins || 0,
          totalSongs: response.data.totalSongs || 0,
          activeUsers: response.data.activeUsers || 0,
          totalPlays: response.data.totalPlays || 0,
          topPlayed: response.data.topPlayed || [],
          topLiked: response.data.topLiked || [],
          loginTrends: response.data.chartData ? response.data.chartData.map(d => ({ date: d.date, count: d.logins })) : []
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="loading-container">Loading analytics...</div>;
  }

  return (
    <div className="admin-analytics-page">
      <h1 className="mb-3">Analytics Dashboard</h1>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem',
        marginBottom: '1.5rem'
      }}>
        <div className="card-flat" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>
            {stats.totalPlays}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Total Plays
          </div>
        </div>

        <div className="card-flat" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>
            {stats.activeUsers}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Active Users (24h)
          </div>
        </div>

        <div className="card-flat" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            {stats.totalSongs}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Total Songs
          </div>
        </div>

        <div className="card-flat" style={{ textAlign: 'center' }}>
           <div style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            {stats.totalLogins}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Total Logins
          </div>
        </div>
      </div>

      {/* Top Played */}
      <div className="card-flat mb-3">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🔥</span> Top Played Songs
        </h2>
        {stats.topPlayed && stats.topPlayed.length > 0 ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stats.topPlayed.map((song, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ overflow: 'hidden', flex: 1, marginRight: '1rem' }}>
                             <div style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                             <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{song.artist}</div>
                         </div>
                         <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                             {song.count} plays
                         </div>
                    </div>
                ))}
             </div>
        ) : <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No play data yet.</div>}
      </div>

       {/* Top Liked */}
      <div className="card-flat mb-3">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>❤️</span> Most Liked
        </h2>
        {stats.topLiked && stats.topLiked.length > 0 ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stats.topLiked.map((song, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ overflow: 'hidden', flex: 1, marginRight: '1rem' }}>
                             <div style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                             <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{song.artist}</div>
                         </div>
                         <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#ec4899' }}>
                             {song.count} likes
                         </div>
                    </div>
                ))}
             </div>
        ) : <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No like data yet.</div>}
      </div>

      {/* Login Trends */}
      <div className="card-flat">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Login Trends (7 Days)</h2>
        
        {stats.loginTrends && stats.loginTrends.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {stats.loginTrends.map((trend, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px'
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  {trend.date}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600' }}>
                  {trend.count} logins
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No login data available
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
