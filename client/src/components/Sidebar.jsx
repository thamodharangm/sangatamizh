import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { pathname } = useLocation();
  const { user, logout, stats } = useAuth(); // Get stats

  const isActive = (path) => pathname === path ? 'active' : '';

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      borderRight: '2px solid var(--border-color)',
      background: 'var(--bg-main)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100
    }}>
      {/* Logo */}
      <div style={{ padding: '0 12px 32px 12px' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', letterSpacing: '-0.5px' }}>
            Sangatamizh Music
          </h2>
       </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <Link to="/" className={`nav-item ${isActive('/')}`}>
          <span>🏠</span> Home
        </Link>
        <Link to="/library" className={`nav-item ${isActive('/library')}`}>
          <span>📚</span> Library
        </Link>
        
        {/* Always visible for testing, or check user existence if preferred */}
        <Link to="/admin" className={`nav-item ${isActive('/admin')}`}>
             <span>⚡</span> Admin
        </Link>
      </nav>

      {/* User Section */}
      <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '16px' }}>
        {user ? (
          <div style={{ padding: '0 12px' }}>
             {/* Gamification Stats */}
             <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                <span style={{ color: '#0ea5e9' }} title="Daily Gems">💎 {stats?.gems || 0}</span>
                <span style={{ color: '#f59e0b' }} title="Streak">🔥 {stats?.streak || 0}</span>
             </div>
             <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
               Logged in as <br/> <strong style={{ color: 'white' }}>{user.email.split('@')[0]}</strong>
             </p>
             <button onClick={logout} className="btn-3d btn-secondary" style={{ width: '100%', height: '40px', fontSize: '0.8rem' }}>
               Logout
             </button>
          </div>
        ) : (
          <Link to="/login" className="btn-3d btn-primary" style={{ width: '100%', textAlign: 'center', textDecoration: 'none' }}>
            Login
          </Link>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
