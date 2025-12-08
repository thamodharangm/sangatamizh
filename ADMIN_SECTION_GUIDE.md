# Admin Section - Complete Implementation

## ✅ Created Files

1. **Admin Dashboard** - `frontend/src/pages/admin/Dashboard.tsx` ✅
   - Stats overview (songs, users, uploads, storage)
   - Quick actions (upload, manage, history)
   - Recent activity feed

---

## 📋 Remaining Admin Pages to Create

### 2. Songs List Page

**File**: `frontend/src/pages/admin/SongsList.tsx`

**Features**:

- Display all songs in a table
- Search by title/artist
- Filter by status/genre
- Pagination
- Edit/Delete actions
- Bulk operations

**API Endpoint Needed**:

```typescript
GET /api/admin/songs?page=1&limit=20&search=query
```

---

### 3. Add Song Page

**File**: `frontend/src/pages/admin/AddSong.tsx`

**Features**:

- Use existing UploadForm component
- Enhanced with admin features
- Bulk upload support
- Metadata auto-fill
- Preview before publish

**Already Have**: Upload form at `/` (can reuse)

---

### 4. Edit Song Page

**File**: `frontend/src/pages/admin/EditSong.tsx`

**Features**:

- Load song by ID
- Edit all metadata fields
- Replace audio file
- Update album art
- Delete song option

**API Endpoints Needed**:

```typescript
GET /api/admin/songs/:id
PUT /api/admin/songs/:id
DELETE /api/admin/songs/:id
```

---

### 5. Upload History Page

**File**: `frontend/src/pages/admin/Uploads.tsx`

**Features**:

- List all uploads with status
- Filter by date/status/user
- Retry failed uploads
- View upload details
- Download logs

**API Endpoint Needed**:

```typescript
GET /api/admin/uploads?status=all&page=1
```

---

## 🛣️ Admin Routes

Add to `App.tsx`:

```typescript
import { Route } from 'react-router-dom';
import AdminDashboard from './pages/admin/Dashboard';
import SongsList from './pages/admin/SongsList';
import AddSong from './pages/admin/AddSong';
import EditSong from './pages/admin/EditSong';
import Uploads from './pages/admin/Uploads';
import AdminRoute from './components/AdminRoute';

// In your Routes:
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

## 🔒 Admin Route Guard

**File**: `frontend/src/components/AdminRoute.tsx`

```typescript
import { Navigate } from "react-router-dom";

export default function AdminRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!user || !user.id) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

---

## 📊 Backend API Endpoints Needed

### Admin Stats

```typescript
// backend/src/controllers/admin.controller.ts

router.get("/stats", authenticate, isAdmin, async (req, res) => {
  const totalSongs = await prisma.song.count();
  const totalUsers = await prisma.user.count();
  const recentUploads = await prisma.song.count({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    },
  });

  res.json({
    totalSongs,
    totalUsers,
    recentUploads,
    storageUsed: "0 MB", // TODO: Calculate from Google Drive
  });
});
```

### List Songs

```typescript
router.get("/songs", authenticate, isAdmin, async (req, res) => {
  const { page = 1, limit = 20, search = "" } = req.query;

  const songs = await prisma.song.findMany({
    where: {
      OR: [
        { title: { contains: search as string, mode: "insensitive" } },
        { artist: { contains: search as string, mode: "insensitive" } },
      ],
    },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    orderBy: { createdAt: "desc" },
    include: {
      uploader: {
        select: { displayName: true, email: true },
      },
    },
  });

  const total = await prisma.song.count({
    where: {
      OR: [
        { title: { contains: search as string, mode: "insensitive" } },
        { artist: { contains: search as string, mode: "insensitive" } },
      ],
    },
  });

  res.json({
    songs,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  });
});
```

### Get Single Song

```typescript
router.get("/songs/:id", authenticate, isAdmin, async (req, res) => {
  const song = await prisma.song.findUnique({
    where: { id: req.params.id },
    include: {
      uploader: {
        select: { displayName: true, email: true },
      },
    },
  });

  if (!song) {
    return res.status(404).json({ error: "Song not found" });
  }

  res.json(song);
});
```

### Update Song

```typescript
router.put("/songs/:id", authenticate, isAdmin, async (req, res) => {
  const { title, artist, album, genre } = req.body;

  const song = await prisma.song.update({
    where: { id: req.params.id },
    data: { title, artist, album, genre },
  });

  res.json(song);
});
```

### Delete Song

```typescript
router.delete("/songs/:id", authenticate, isAdmin, async (req, res) => {
  // TODO: Also delete from Google Drive
  await prisma.song.delete({
    where: { id: req.params.id },
  });

  res.json({ message: "Song deleted successfully" });
});
```

---

## 🎯 Implementation Steps

1. ✅ **Dashboard Created** - Shows stats and quick actions
2. **Create AdminRoute component** - Protect admin pages
3. **Create backend admin endpoints** - Stats, list, CRUD operations
4. **Create SongsList page** - Manage all songs
5. **Update App.tsx** - Add admin routes
6. **Create EditSong page** - Edit metadata
7. **Create Uploads page** - View history

---

## 🚀 Quick Start

To complete the admin section:

1. **Create AdminRoute component**
2. **Add admin routes to App.tsx**
3. **Create backend admin controller**
4. **Test admin dashboard**
5. **Build remaining pages**

---

## 💡 Current Status

✅ **Completed**:

- Admin Dashboard UI
- Stats display
- Quick actions
- Responsive design

⏳ **Next**:

- AdminRoute guard
- Backend admin API
- Songs list page
- Edit/Delete functionality

---

Would you like me to:

1. Create all remaining admin pages now?
2. Create the backend admin API first?
3. Set up the routing and guards?
4. Build one specific page?

Let me know what to focus on next!
