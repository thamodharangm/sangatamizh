# 🔄 SANGATAMIZH MUSIC - COMPLETE DATA FLOW ARCHITECTURE

## 📊 SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                      (React + Vite - Port 5174)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Home Page   │  │ Music Player │  │   Library    │         │
│  │              │  │              │  │              │         │
│  │ - Song Cards │  │ - Play/Pause │  │ - All Songs  │         │
│  │ - Trending   │  │ - Progress   │  │ - Favorites  │         │
│  │ - Sections   │  │ - Buffer Bar │  │ - Search     │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                 │
│         └──────────────────┼──────────────────┘                 │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             │ API Calls (Axios)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      MUSIC CONTEXT                              │
│                   (State Management)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  State:                          Audio Element:                │
│  - currentSong                   - audioRef                    │
│  - isPlaying                     - Event Listeners:            │
│  - currentTime                     • loadedmetadata            │
│  - duration                        • timeupdate                │
│  - bufferedTime                    • progress                  │
│  - isBuffering                     • waiting                   │
│  - queue                           • canplay                   │
│                                    • stalled                   │
│                                    • error                     │
│                                                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP Requests
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    BACKEND API SERVER                           │
│                (Express.js - Port 3002)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Routes:                     Middleware:                       │
│  - GET  /api/songs           - CORS (whitelist)                │
│  - GET  /api/stream/:id      - Rate Limiting                   │
│  - GET  /api/home-sections   - JSON Parser                     │
│  - POST /api/log-play        - Error Handler                   │
│  - GET  /api/likes           - Auth (Firebase)                 │
│                                                                 │
│  Controllers:                                                   │
│  - songController.js         - getAllSongs()                   │
│                              - streamSong()                     │
│                              - getHomeSections()                │
│                              - logPlay()                        │
│                                                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Prisma ORM
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   POSTGRESQL DATABASE                           │
│                    (Supabase - Free Tier)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tables:                                                        │
│  ┌─────────────────────────────────────────────────┐           │
│  │ songs                                           │           │
│  │ - id (UUID)                                     │           │
│  │ - title (String)                                │           │
│  │ - artist (String)                               │           │
│  │ - file_url (String) → Supabase Storage         │           │
│  │ - cover_url (String)                            │           │
│  │ - category (String)                             │           │
│  │ - emotion (String)                              │           │
│  │ - youtube_views (BigInt)                        │           │
│  │ - created_at (DateTime)                         │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  ┌─────────────────────────────────────────────────┐           │
│  │ playHistory                                     │           │
│  │ - id (UUID)                                     │           │
│  │ - userId (String) → Firebase UID                │           │
│  │ - songId (String) → songs.id                    │           │
│  │ - playedAt (DateTime)                           │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  ┌─────────────────────────────────────────────────┐           │
│  │ likes                                           │           │
│  │ - id (UUID)                                     │           │
│  │ - userId (String) → Firebase UID                │           │
│  │ - songId (String) → songs.id                    │           │
│  │ - createdAt (DateTime)                          │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Storage URLs
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    SUPABASE STORAGE                             │
│                  (Audio Files - Public Bucket)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Bucket: music_assets                                           │
│  ├── songs/                                                     │
│  │   ├── 1734262800_videoId.m4a                                │
│  │   ├── 1734262801_videoId.mp3                                │
│  │   └── ...                                                    │
│  └── covers/                                                    │
│      ├── 1734262800_cover.jpg                                  │
│      └── ...                                                    │
│                                                                 │
│  Access: Public URLs with Range Request Support                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 COMPLETE DATA FLOW: SONGS

### 1. **User Opens Home Page**

```
┌─────────────┐
│ User Opens  │
│  Browser    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Frontend: Home.jsx                      │
│                                         │
│ useEffect(() => {                       │
│   fetchHomeSections();                  │
│ }, []);                                 │
└──────┬──────────────────────────────────┘
       │
       │ API Call
       ▼
┌─────────────────────────────────────────┐
│ API: GET /api/home-sections             │
│      ?userId=guest_xxx                  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Backend: songController.getHomeSections │
│                                         │
│ 1. Query trending songs                │
│    prisma.song.findMany({              │
│      orderBy: { youtube_views: 'desc' }│
│    })                                   │
│                                         │
│ 2. Query Tamil hits                    │
│    prisma.song.findMany({              │
│      where: { category: 'Tamil' }      │
│    })                                   │
│                                         │
│ 3. Query user's recent plays           │
│    prisma.playHistory.findMany({       │
│      where: { userId }                 │
│    })                                   │
└──────┬──────────────────────────────────┘
       │
       │ Database Query
       ▼
┌─────────────────────────────────────────┐
│ PostgreSQL: Execute Queries             │
│                                         │
│ SELECT * FROM songs                     │
│ ORDER BY youtube_views DESC             │
│ LIMIT 10;                               │
│                                         │
│ SELECT * FROM songs                     │
│ WHERE category = 'Tamil'                │
│ ORDER BY youtube_views DESC             │
│ LIMIT 10;                               │
└──────┬──────────────────────────────────┘
       │
       │ Return Data
       ▼
┌─────────────────────────────────────────┐
│ Backend: Serialize & Send Response     │
│                                         │
│ res.json({                              │
│   trending: [...],                      │
│   hits: [...],                          │
│   recent: [...]                         │
│ })                                      │
└──────┬──────────────────────────────────┘
       │
       │ JSON Response
       ▼
┌─────────────────────────────────────────┐
│ Frontend: Update State                  │
│                                         │
│ setSections({                           │
│   trending: data.trending,              │
│   hits: data.hits,                      │
│   recent: data.recent                   │
│ })                                      │
└──────┬──────────────────────────────────┘
       │
       │ Render
       ▼
┌─────────────────────────────────────────┐
│ UI: Display Song Cards                  │
│                                         │
│ {sections.trending.map(song =>         │
│   <SongCard                             │
│     song={song}                         │
│     onPlay={() => playSong(song)}       │
│   />                                    │
│ )}                                      │
└─────────────────────────────────────────┘
```

---

## 🎵 COMPLETE DATA FLOW: MUSIC PLAYBACK

### 2. **User Clicks Play Button**

```
┌─────────────┐
│ User Clicks │
│ Play Button │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ SongCard: onClick Handler               │
│                                         │
│ const handlePlay = () => {              │
│   playSong(song, allSongs);             │
│ }                                       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ MusicContext: playSong()                │
│                                         │
│ 1. Set queue                            │
│    setQueue(songList)                   │
│                                         │
│ 2. Set current song                     │
│    setCurrentSong(song)                 │
│                                         │
│ 3. Build stream URL                     │
│    const streamUrl =                    │
│      `${API_URL}/stream/${song.id}`     │
│                                         │
│ 4. Load audio                           │
│    audioRef.current.src = streamUrl     │
│    audioRef.current.load()              │
│                                         │
│ 5. Play audio                           │
│    audioRef.current.play()              │
│                                         │
│ 6. Log play event                       │
│    api.post('/log-play', {              │
│      userId, songId                     │
│    })                                   │
└──────┬──────────────────────────────────┘
       │
       │ HTTP Request
       ▼
┌─────────────────────────────────────────┐
│ API: GET /api/stream/:id                │
│      Range: bytes=0-524287              │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Backend: songController.streamSong()    │
│                                         │
│ 1. Get song from database               │
│    const song = await prisma.song       │
│      .findUnique({ where: { id } })     │
│                                         │
│ 2. Get file_url (Supabase Storage)      │
│    const fileUrl = song.file_url        │
│                                         │
│ 3. Detect mobile device                 │
│    const isMobile = /Mobile/.test(UA)   │
│                                         │
│ 4. Get file size (HEAD request)         │
│    const size = await fetch(fileUrl,    │
│      { method: 'HEAD' })                │
│                                         │
│ 5. Parse Range header                   │
│    const start = parseInt(parts[0])     │
│    const end = parts[1] || size - 1     │
│                                         │
│ 6. Limit chunk for mobile               │
│    if (isMobile && chunk > 512KB) {     │
│      end = start + 512KB - 1            │
│    }                                    │
│                                         │
│ 7. Fetch chunk from Supabase            │
│    const response = await fetch(        │
│      fileUrl,                           │
│      { headers: {                       │
│          Range: `bytes=${start}-${end}` │
│        }                                │
│      }                                  │
│    )                                    │
│                                         │
│ 8. Send 206 Partial Content             │
│    res.status(206)                      │
│    res.setHeader('Content-Range', ...)  │
│    response.body.pipe(res)              │
└──────┬──────────────────────────────────┘
       │
       │ Stream Chunks
       ▼
┌─────────────────────────────────────────┐
│ Supabase Storage: Return Audio Chunk   │
│                                         │
│ File: /music_assets/songs/xxx.m4a      │
│ Bytes: 0-524287 (512KB)                 │
└──────┬──────────────────────────────────┘
       │
       │ Binary Data
       ▼
┌─────────────────────────────────────────┐
│ Browser: Audio Element                  │
│                                         │
│ <audio>                                 │
│   src="/api/stream/song-id"             │
│ </audio>                                │
│                                         │
│ Events Fired:                           │
│ 1. loadstart    → Reset state           │
│ 2. loadedmetadata → Set duration        │
│ 3. canplay      → Stop buffering        │
│ 4. playing      → Set isPlaying=true    │
│ 5. timeupdate   → Update currentTime    │
│ 6. progress     → Update bufferedTime   │
│ 7. waiting      → Set isBuffering=true  │
│ 8. ended        → Play next song        │
└──────┬──────────────────────────────────┘
       │
       │ State Updates
       ▼
┌─────────────────────────────────────────┐
│ MusicContext: Event Handlers            │
│                                         │
│ handleLoadedMetadata() {                │
│   setDuration(audio.duration)           │
│ }                                       │
│                                         │
│ handleTimeUpdate() {                    │
│   setCurrentTime(audio.currentTime)     │
│ }                                       │
│                                         │
│ handleProgress() {                      │
│   const buffered = audio.buffered       │
│   setBufferedTime(buffered.end(0))      │
│ }                                       │
│                                         │
│ handleWaiting() {                       │
│   setIsBuffering(true)                  │
│ }                                       │
│                                         │
│ handleCanPlay() {                       │
│   setIsBuffering(false)                 │
│ }                                       │
└──────┬──────────────────────────────────┘
       │
       │ Re-render
       ▼
┌─────────────────────────────────────────┐
│ MusicPlayer: UI Update                  │
│                                         │
│ - Play button: ▶ → ⏸                    │
│ - Progress bar: 0% → 45%                │
│ - Buffer bar: 0% → 60%                  │
│ - Time display: 0:00 / 3:45             │
│ - Buffering icon: ⏳ (when waiting)     │
└─────────────────────────────────────────┘
```

---

## 📊 COMPLETE DATA FLOW: PROGRESS & BUFFER

### 3. **Real-Time Progress & Buffer Updates**

```
┌─────────────────────────────────────────┐
│ Audio Element (Browser)                 │
│                                         │
│ Every 250ms (timeupdate event):        │
│ ├─ currentTime: 45.2s                   │
│ ├─ duration: 225.0s                     │
│ └─ buffered: TimeRanges                 │
│    ├─ start(0): 0                       │
│    └─ end(0): 135.0s                    │
└──────┬──────────────────────────────────┘
       │
       │ Event: timeupdate
       ▼
┌─────────────────────────────────────────┐
│ MusicContext: handleTimeUpdate()        │
│                                         │
│ const handleTimeUpdate = () => {        │
│   setCurrentTime(audio.currentTime)     │
│   // 45.2s                              │
│ }                                       │
└──────┬──────────────────────────────────┘
       │
       │ State Update
       ▼
┌─────────────────────────────────────────┐
│ MusicPlayer: Re-render                  │
│                                         │
│ const playPercent =                     │
│   (currentTime / duration) * 100        │
│   = (45.2 / 225.0) * 100                │
│   = 20.09%                              │
│                                         │
│ const bufferPercent =                   │
│   (bufferedTime / duration) * 100       │
│   = (135.0 / 225.0) * 100               │
│   = 60.00%                              │
└──────┬──────────────────────────────────┘
       │
       │ CSS Update
       ▼
┌─────────────────────────────────────────┐
│ Progress Bar: Visual Update             │
│                                         │
│ <input                                  │
│   type="range"                          │
│   value={45.2}                          │
│   max={225.0}                           │
│   style={{                              │
│     background: `linear-gradient(       │
│       to right,                         │
│       #58cc02 0%,      ← Played         │
│       #58cc02 20.09%,  ← Current        │
│       #71717a 20.09%,  ← Buffered start │
│       #71717a 60.00%,  ← Buffered end   │
│       #27272a 60.00%,  ← Unbuffered     │
│       #27272a 100%                      │
│     )`                                  │
│   }}                                    │
│ />                                      │
│                                         │
│ Visual:                                 │
│ [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░]   │
│  ↑ Played  ↑ Buffered    ↑ Unbuffered  │
│  20%       60%            100%          │
└─────────────────────────────────────────┘
```

---

## 🔄 COMPLETE DATA FLOW: BUFFERING STATE

### 4. **Network Delay / Buffering**

```
┌─────────────────────────────────────────┐
│ Scenario: User seeks ahead              │
│           or slow network                │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Audio Element: Waiting for Data         │
│                                         │
│ Event: 'waiting' fired                  │
│ Reason: Buffer empty at seek position   │
└──────┬──────────────────────────────────┘
       │
       │ Event: waiting
       ▼
┌─────────────────────────────────────────┐
│ MusicContext: handleWaiting()           │
│                                         │
│ const handleWaiting = () => {           │
│   console.log('[Audio] Buffering...')   │
│   setIsBuffering(true)                  │
│ }                                       │
└──────┬──────────────────────────────────┘
       │
       │ State Update
       ▼
┌─────────────────────────────────────────┐
│ MusicPlayer: Show Buffering Indicator   │
│                                         │
│ <button                                 │
│   disabled={isBuffering}                │
│ >                                       │
│   {isBuffering ? '⏳' : '⏸'}            │
│ </button>                               │
│                                         │
│ Visual: ⏳ (spinning hourglass)         │
└──────┬──────────────────────────────────┘
       │
       │ Meanwhile...
       ▼
┌─────────────────────────────────────────┐
│ Browser: Fetching More Data             │
│                                         │
│ Request: GET /api/stream/:id            │
│          Range: bytes=524288-1048575    │
│                                         │
│ Backend: Streaming next 512KB chunk     │
└──────┬──────────────────────────────────┘
       │
       │ Data Received
       ▼
┌─────────────────────────────────────────┐
│ Audio Element: Can Play Again           │
│                                         │
│ Event: 'canplay' fired                  │
│ Reason: Enough data buffered            │
└──────┬──────────────────────────────────┘
       │
       │ Event: canplay
       ▼
┌─────────────────────────────────────────┐
│ MusicContext: handleCanPlay()           │
│                                         │
│ const handleCanPlay = () => {           │
│   console.log('[Audio] Can play')       │
│   setIsBuffering(false)                 │
│ }                                       │
└──────┬──────────────────────────────────┘
       │
       │ State Update
       ▼
┌─────────────────────────────────────────┐
│ MusicPlayer: Hide Buffering Indicator   │
│                                         │
│ <button>                                │
│   ⏸  ← Back to pause icon               │
│ </button>                               │
│                                         │
│ Audio resumes playing automatically     │
└─────────────────────────────────────────┘
```

---

## 📝 COMPLETE CODE CONNECTIONS

### Frontend → Backend → Database

#### **1. Home Page Song Loading**

**Frontend** (`client-v2/src/pages/Home.jsx`):

```javascript
useEffect(() => {
  const fetchHomeSections = async () => {
    const response = await api.get("/home-sections?userId=guest_xxx");
    setSections(response.data);
  };
  fetchHomeSections();
}, []);
```

**Backend** (`backend/src/controllers/songController.js`):

```javascript
exports.getHomeSections = async (req, res) => {
  const trending = await prisma.song.findMany({
    orderBy: { youtube_views: "desc" },
    take: 10,
  });
  res.json({ trending, hits, recent });
};
```

**Database** (PostgreSQL via Prisma):

```sql
SELECT * FROM songs
ORDER BY youtube_views DESC
LIMIT 10;
```

---

#### **2. Music Playback**

**Frontend** (`client-v2/src/context/MusicContext.jsx`):

```javascript
const playSong = (song) => {
  const streamUrl = `${API_URL}/stream/${song.id}`;
  audioRef.current.src = streamUrl;
  audioRef.current.play();
};
```

**Backend** (`backend/src/controllers/songController.js`):

```javascript
exports.streamSong = async (req, res) => {
  const song = await prisma.song.findUnique({
    where: { id: req.params.id },
  });

  const response = await fetch(song.file_url, {
    headers: { Range: `bytes=${start}-${end}` },
  });

  res.status(206);
  res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
  response.body.pipe(res);
};
```

**Database** (PostgreSQL):

```sql
SELECT * FROM songs WHERE id = 'song-uuid';
-- Returns: file_url = 'https://supabase.co/storage/songs/xxx.m4a'
```

**Storage** (Supabase):

```
GET https://supabase.co/storage/songs/xxx.m4a
Range: bytes=0-524287
→ Returns: 512KB audio chunk
```

---

#### **3. Progress & Buffer Tracking**

**Frontend** (`client-v2/src/context/MusicContext.jsx`):

```javascript
const handleTimeUpdate = () => {
  setCurrentTime(audio.currentTime); // e.g., 45.2s
};

const handleProgress = () => {
  const buffered = audio.buffered.end(0); // e.g., 135.0s
  setBufferedTime(buffered);
};
```

**Frontend** (`client-v2/src/components/MusicPlayer.jsx`):

```javascript
const playPercent = (currentTime / duration) * 100; // 20%
const bufferPercent = (bufferedTime / duration) * 100; // 60%

<input
  type="range"
  value={currentTime}
  max={duration}
  style={{
    background: `linear-gradient(
      to right,
      #58cc02 ${playPercent}%,
      #71717a ${bufferPercent}%,
      #27272a 100%
    )`,
  }}
/>;
```

---

## 🎯 KEY CONNECTIONS SUMMARY

| Component         | Connects To      | Method                   | Purpose          |
| ----------------- | ---------------- | ------------------------ | ---------------- |
| **Home.jsx**      | Backend API      | `GET /api/home-sections` | Fetch song lists |
| **MusicContext**  | Backend API      | `GET /api/stream/:id`    | Stream audio     |
| **MusicContext**  | Backend API      | `POST /api/log-play`     | Log playback     |
| **Backend**       | PostgreSQL       | Prisma ORM               | Query songs      |
| **Backend**       | Supabase Storage | HTTP Fetch               | Get audio files  |
| **Audio Element** | MusicContext     | Event Listeners          | Update UI state  |
| **MusicPlayer**   | MusicContext     | React Context            | Display progress |

---

## 📊 DATA STRUCTURES

### Song Object (Database → Frontend)

```javascript
{
  id: "f532b61d-3b6a-4e6b-91fc-471acd4844c5",
  title: "Vaa Vaathi",
  artist: "Anirudh Ravichander",
  file_url: "https://xxx.supabase.co/storage/v1/object/public/music_assets/songs/1734262800_xxx.m4a",
  cover_url: "https://i.ytimg.com/vi/xxx/maxresdefault.jpg",
  category: "Tamil",
  emotion: "Feel Good",
  youtube_views: "15000000",
  created_at: "2025-12-15T10:00:00.000Z"
}
```

### Audio State (MusicContext)

```javascript
{
  currentSong: { /* song object */ },
  isPlaying: true,
  currentTime: 45.2,      // seconds
  duration: 225.0,        // seconds
  bufferedTime: 135.0,    // seconds
  isBuffering: false,
  queue: [ /* array of songs */ ],
  currentIndex: 0
}
```

---

This is the complete data flow from database to user interface! Every connection, every state update, every API call is documented here. 🎵✨
