import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MusicProvider } from './context/MusicContext';

// Pages
import Home from './pages/Home';
import Library from './pages/Library';
import Playlist from './pages/Playlist';
import Login from './pages/Login';
import TestDB from './pages/TestDB';
import AdminUpload from './pages/AdminUpload';
import AdminAnalytics from './pages/AdminAnalytics';

// Components
import MusicPlayer from './components/MusicPlayer';
import BottomNav from './components/BottomNav';
import ScrollToTop from './components/ScrollToTop';
import DebugPanel from './components/DebugPanel';
import ErrorBoundary from './components/ErrorBoundary';

import './App.css';

// Private Route Component - DESKTOP FEATURE
const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading-container">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  
  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MusicProvider>
          <Router>
            <ScrollToTop />
            <div className="app-shell">
              <div className="main-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/playlist" element={<Playlist />} />
                  <Route path="/login" element={<Login />} />
                  
                  {/* Test Route */}
                  <Route path="/test-db" element={<TestDB />} />
                  
                  {/* Admin Routes - DESKTOP FEATURE */}
                  <Route path="/admin" element={
                    <PrivateRoute adminOnly={true}>
                      <AdminUpload />
                    </PrivateRoute>
                  } />
                  <Route path="/admin/upload" element={
                    <PrivateRoute adminOnly={true}>
                      <AdminUpload />
                    </PrivateRoute>
                  } />
                  <Route path="/admin/analytics" element={
                    <PrivateRoute adminOnly={true}>
                      <AdminAnalytics />
                    </PrivateRoute>
                  } />
                  
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </div>
              
              {/* Music Player - Fixed above bottom nav */}
              <MusicPlayer />
              
              {/* Bottom Navigation - Fixed at bottom */}
              <BottomNav />
            </div>
          </Router>
        </MusicProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
