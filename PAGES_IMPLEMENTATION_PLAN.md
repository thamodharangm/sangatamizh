# Complete Page Structure Implementation Plan

## 🎯 Overview

This document outlines the complete page structure for Sangatamizh Music with Firebase authentication.

---

## 📁 File Structure

```
frontend/src/
├── config/
│   └── firebase.ts                    ✅ Created
├── pages/
│   ├── Home.tsx                       → Featured songs
│   ├── auth/
│   │   ├── Login.tsx                  ✅ Exists (update for Firebase)
│   │   └── Register.tsx               ✅ Exists (update for Firebase)
│   ├── Browse.tsx                     → Search & filters
│   ├── SongDetail.tsx                 → Song player
│   ├── Profile.tsx                    → User profile
│   └── admin/
│       ├── Dashboard.tsx              → Admin overview
│       ├── SongsList.tsx              → List all songs
│       ├── AddSong.tsx                → Upload form
│       ├── EditSong.tsx               → Edit metadata
│       └── Uploads.tsx                → Upload history
├── components/
│   ├── Navbar.tsx                     → Navigation
│   ├── SongCard.tsx                   → Song display
│   ├── AudioPlayer.tsx                → Music player
│   ├── SearchBar.tsx                  → Search component
│   └── ProtectedRoute.tsx             → Auth guard
└── App.tsx                            → Update routes
```

---

## 🔐 Authentication Flow

### Firebase + Backend Integration

```typescript
// Login Flow:
1. User logs in with Firebase (Email or Google)
2. Get Firebase ID token
3. Send token to backend for verification
4. Backend creates/updates user in PostgreSQL
5. Backend returns JWT access token
6. Store both Firebase user + JWT token
7. Use JWT for API calls
```

### Why Both Firebase + Backend Auth?

- **Firebase**: Easy OAuth, user management UI
- **Backend JWT**: Secure API calls, database operations
- **Best of both worlds**: Firebase UX + Backend control

---

## 📄 Page Implementations

### 1. Home Page (/)

**Purpose**: Featured songs, trending, recent uploads

```typescript
// frontend/src/pages/Home.tsx
Features:
- Hero section
- Featured songs carousel
- Trending songs grid
- Recent uploads
- Quick search
```

### 2. Login (/auth/login)

**Purpose**: Email + Google OAuth login

```typescript
// Update existing Login.tsx
Features:
- Email/password login
- Google OAuth button
- Firebase authentication
- Redirect after login
- Remember me option
```

### 3. Register (/auth/register)

**Purpose**: Email + Google OAuth registration

```typescript
// Update existing Signup.tsx → Register.tsx
Features:
- Email/password signup
- Google OAuth button
- Firebase authentication
- Auto-login after signup
```

### 4. Browse (/browse)

**Purpose**: Search, filter, browse all songs

```typescript
// frontend/src/pages/Browse.tsx
Features:
- Search bar
- Filters (genre, artist, album)
- Sort options
- Pagination
- Song grid/list view
```

### 5. Song Detail (/song/:id)

**Purpose**: Song details + streaming player

```typescript
// frontend/src/pages/SongDetail.tsx
Features:
- Song info (title, artist, album, genre)
- Album art
- Audio player with controls
- Lyrics (if available)
- Related songs
- Share button
```

### 6. Admin Dashboard (/admin)

**Purpose**: Admin overview

```typescript
// frontend/src/pages/admin/Dashboard.tsx
Features:
- Total songs count
- Total users count
- Recent uploads
- Storage usage
- Quick actions
```

### 7. Admin Songs List (/admin/songs)

**Purpose**: Manage all songs

```typescript
// frontend/src/pages/admin/SongsList.tsx
Features:
- Search songs
- Filter by status
- Pagination
- Edit/Delete actions
- Bulk actions
```

### 8. Admin Add Song (/admin/songs/new)

**Purpose**: Upload new song

```typescript
// frontend/src/pages/admin/AddSong.tsx
Features:
- File upload (drag & drop)
- Metadata form
- Album art upload
- Preview before save
- Progress indicator
```

### 9. Admin Edit Song (/admin/songs/:id/edit)

**Purpose**: Edit song metadata

```typescript
// frontend/src/pages/admin/EditSong.tsx
Features:
- Edit metadata
- Replace audio file
- Update album art
- Delete song
```

### 10. Admin Uploads (/admin/uploads)

**Purpose**: Upload history

```typescript
// frontend/src/pages/admin/Uploads.tsx
Features:
- Upload history
- Status (pending, processing, complete, failed)
- Retry failed uploads
- Filter by date/status
```

### 11. Profile (/profile)

**Purpose**: User profile

```typescript
// frontend/src/pages/Profile.tsx
Features:
- User info
- My uploads (if uploader)
- Favorites/playlists
- Settings
- Sign out
```

---

## 🛣️ Routes Configuration

```typescript
// frontend/src/App.tsx

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Public routes
<Route path="/" element={<Home />} />
<Route path="/auth/login" element={<Login />} />
<Route path="/auth/register" element={<Register />} />
<Route path="/browse" element={<Browse />} />
<Route path="/song/:id" element={<SongDetail />} />

// Protected routes (logged in users)
<Route path="/profile" element={
  <ProtectedRoute>
    <Profile />
  </ProtectedRoute>
} />

// Admin routes (admin users only)
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
<Route path="/admin/songs/new" element={
  <AdminRoute>
    <AddSong />
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
```

---

## 🔒 Protected Routes

```typescript
// frontend/src/components/ProtectedRoute.tsx

import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/auth/login" />;

  return children;
}
```

```typescript
// frontend/src/components/AdminRoute.tsx

import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/auth/login" />;
  if (user.role !== "admin") return <Navigate to="/" />;

  return children;
}
```

---

## 🎨 Component Structure

### Navbar

```typescript
// frontend/src/components/Navbar.tsx

Features:
- Logo
- Search bar
- Navigation links (Home, Browse)
- User menu (Profile, Admin, Logout)
- Login/Register buttons (if not logged in)
```

### Audio Player

```typescript
// frontend/src/components/AudioPlayer.tsx

Features:
- Play/pause
- Progress bar
- Volume control
- Next/previous
- Shuffle/repeat
- Current song info
```

---

## 📦 Required Packages

```bash
# Firebase
npm install firebase

# Additional UI (optional)
npm install @headlessui/react @heroicons/react
```

---

## 🚀 Implementation Priority

### Phase 1: Core Pages (Week 1)

1. ✅ Firebase config
2. Update Login/Register with Firebase
3. Create Home page
4. Create Browse page
5. Create Song Detail page

### Phase 2: Admin Pages (Week 2)

6. Admin Dashboard
7. Admin Songs List
8. Admin Add Song (already have upload form)
9. Admin Edit Song
10. Admin Uploads

### Phase 3: Polish (Week 3)

11. Profile page
12. Audio player component
13. Search functionality
14. Filters and sorting
15. UI polish and animations

---

## 💡 Quick Start

To implement this structure:

1. **Start with Firebase Auth**

   - Update Login.tsx
   - Update Signup.tsx → Register.tsx
   - Add Google OAuth buttons

2. **Create Basic Pages**

   - Home.tsx
   - Browse.tsx
   - SongDetail.tsx

3. **Add Routing**

   - Update App.tsx
   - Add ProtectedRoute
   - Add AdminRoute

4. **Build Admin Section**
   - Dashboard
   - Songs management
   - Upload history

---

## 🎯 Next Steps

**Would you like me to:**

1. Create all page files with basic structure?
2. Implement Firebase authentication first?
3. Build specific pages one by one?
4. Focus on admin section?

Let me know which approach you prefer!
