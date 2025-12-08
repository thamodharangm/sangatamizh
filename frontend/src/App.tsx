import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PlayerBar from './components/PlayerBar'
import UploadForm from './components/UploadForm'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminRoute from './components/AdminRoute'
import AdminDashboard from './pages/admin/Dashboard'
import SongsList from './pages/admin/SongsList'
import EditSong from './pages/admin/EditSong'
import Uploads from './pages/admin/Uploads'

function Home() {
  const [currentTrack, setCurrentTrack] = useState<{
    src?: string;
    title?: string;
    artist?: string;
  }>({});

  const user = localStorage.getItem('user');
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            🎵 Sangtamizh Music
          </h1>
          <div className="flex gap-4">
            <a
              href="/admin"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Admin
            </a>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Upload Your Music</h2>
          <UploadForm />
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Test Player</h2>
          <button
            onClick={() => setCurrentTrack({
              src: 'http://localhost:4000/api/upload/stream/test-song-id?quality=preview',
              title: 'Test Song',
              artist: 'Test Artist'
            })}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Load Test Track
          </button>
        </div>
      </main>

      <PlayerBar {...currentTrack} />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Home />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/songs" element={
          <AdminRoute>
            <SongsList />
          </AdminRoute>
        } />
        <Route path="/admin/songs/:id/edit" element={
          <AdminRoute>
            <EditSong />
          </AdminRoute>
        } />
        <Route path="/admin/uploads" element={
          <AdminRoute>
            <Uploads />
          </AdminRoute>
        } />
        <Route path="/admin/songs/new" element={
          <AdminRoute>
            <Home />
          </AdminRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App

export default App

