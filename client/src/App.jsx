import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MusicProvider } from './context/MusicContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Library from './pages/Library';
import AdminUpload from './pages/AdminUpload';
import Sidebar from './components/Sidebar';
import MusicPlayer from './components/MusicPlayer';
import './App.css';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <MusicProvider>
        <Router>
          <div className="app-shell">
            <Sidebar />
            <div className="main-content" style={{ marginLeft: 'var(--sidebar-width)', width: 'calc(100% - var(--sidebar-width))' }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/library" element={<Library />} />
                <Route path="/admin" element={<AdminUpload />} />
              </Routes>
            </div>
          </div>
          <MusicPlayer />
        </Router>
      </MusicProvider>
    </AuthProvider>
  )
}

export default App
