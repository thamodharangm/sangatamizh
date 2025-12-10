import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MusicProvider } from './context/MusicContext';
import Home from './pages/Home';
import Login from './pages/Login';
import TestDB from './pages/TestDB';
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

import Playlist from './pages/Playlist';

function App() {
  return (
    <AuthProvider>
      <MusicProvider>
        <Router>
          <div className="app-shell">
            <Sidebar />
            <div className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/test-db" element={<TestDB />} />
                <Route path="/login" element={<Login />} />
                <Route path="/library" element={<Library />} />
                <Route path="/playlist" element={<Playlist />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={
                  <PrivateRoute adminOnly={true}>
                    <AdminUpload />
                  </PrivateRoute>
                } />
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
