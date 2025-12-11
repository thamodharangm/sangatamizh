import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { pathname } = useLocation();
  const { user, logout, stats } = useAuth(); // Get stats

  const isActive = (path) => pathname === path ? 'active' : '';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
          <h2 className="brand-title">
            Sangatamizh Music
          </h2>
       </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <Link to="/" className={`nav-item ${isActive('/')}`}>
          <span>🏠</span> <span className="nav-text">Home</span>
        </Link>
        <Link to="/library" className={`nav-item ${isActive('/library')}`}>
          <span>📚</span> <span className="nav-text">Library</span>
        </Link>
        
        {user && user.role === 'admin' && (
          <Link to="/admin" className={`nav-item ${isActive('/admin')}`}>
               <span>⚡</span> <span className="nav-text">Admin</span>
          </Link>
        )}

        {/* Mobile Logout (Hidden on Desktop via CSS) */}
        {user && (
          <button onClick={logout} className="nav-item mobile-logout">
              <span>🚪</span> <span className="nav-text">Logout</span>
          </button>
        )}

        {/* Mobile Login (Hidden on Desktop via CSS) */}
        {!user && (
            <Link to="/login" className="nav-item mobile-login">
                <span>👤</span> <span className="nav-text">Login</span>
            </Link>
        )}
      </nav>

      {/* User Section */}
      <div className="sidebar-footer">
        {user ? (
          <div className="user-info">
             {/* Gamification Stats */}
             <div className="user-stats">
                <span className="stat-item gems" title="Daily Gems">💎 {stats?.gems || 0}</span>
                <span className="stat-item streak" title="Streak">🔥 {stats?.streak || 0}</span>
             </div>
             <p className="user-login-msg">
               Logged in as <br/> <strong>{user.email.split('@')[0]}</strong>
             </p>
             <button onClick={logout} className="btn-3d btn-secondary logout-btn">
               Logout
             </button>
          </div>
        ) : (
          <Link to="/login" className="btn-3d btn-primary login-btn">
            Login
          </Link>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
