import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path) => pathname === path ? 'active' : '';

  return (
    <aside className="sidebar">
      {/* Logo removed as requested */}

      {/* Navigation */}
      <nav className="sidebar-nav">
        <Link to="/" className={`nav-item ${isActive('/')}`}>
          <span>🏠</span> <span className="nav-text">Home</span>
        </Link>
        <Link to="/library" className={`nav-item ${isActive('/library')}`}>
          <span>📚</span> <span className="nav-text">Library</span>
        </Link>
        <Link to="/playlist" className={`nav-item ${isActive('/playlist')}`}>
          <span>🎵</span> <span className="nav-text">My Playlist</span>
        </Link>
        
        {user && user.role === 'admin' && (
          <Link to="/admin" className={`nav-item ${isActive('/admin')}`}>
            <span>⚡</span> <span className="nav-text">Admin</span>
          </Link>
        )}
      </nav>

      {/* User Section */}
      <div className="sidebar-footer">
        {user ? (
          <div className="user-info">
            <p className="user-login-label">Logged in as</p>
            <p className="user-name">{user.email.split('@')[0]}</p>
            <button onClick={logout} className="btn-logout">
              LOGOUT
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
