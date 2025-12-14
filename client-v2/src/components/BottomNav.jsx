import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Mobile Bottom Navigation Component
const BottomNav = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bottom-nav">
      <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
        <span>🏠</span>
        <span className="nav-text">Home</span>
      </Link>

      <Link to="/library" className={`nav-item ${isActive('/library') ? 'active' : ''}`}>
        <span>📚</span>
        <span className="nav-text">Library</span>
      </Link>

      <Link to="/playlist" className={`nav-item ${isActive('/playlist') ? 'active' : ''}`}>
        <span>❤️</span>
        <span className="nav-text">Liked</span>
      </Link>

      {user && user.role === 'admin' && (
        <Link to="/admin/upload" className={`nav-item ${isActive('/admin/upload') ? 'active' : ''}`}>
          <span>🛠️</span>
          <span className="nav-text">Admin</span>
        </Link>
      )}

      {user ? (
        <button
          onClick={logout}
          className="nav-item"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit'
          }}
        >
          <span>🚪</span>
          <span className="nav-text">Logout</span>
        </button>
      ) : (
        <Link to="/login" className={`nav-item ${isActive('/login') ? 'active' : ''}`}>
          <span>👤</span>
          <span className="nav-text">Login</span>
        </Link>
      )}
    </nav>
  );
};

export default BottomNav;
