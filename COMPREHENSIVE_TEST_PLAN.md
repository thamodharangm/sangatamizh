# Sangatamizh Music - Comprehensive Testing & Verification Plan

## Table of Contents

1. [Frontend UI Verification](#1-frontend-ui-verification)
2. [Functional Modules Testing](#2-functional-modules-testing)
3. [Backend API Testing](#3-backend-api-testing)
4. [Database Verification](#4-database-verification)
5. [Security Testing](#5-security-testing)
6. [Performance Testing](#6-performance-testing)
7. [Accessibility & SEO](#7-accessibility--seo)
8. [Cross-Browser Testing](#8-cross-browser-testing)
9. [Regression & CI](#9-regression--ci)

---

## 1. Frontend UI Verification

### Desktop Responsive Testing

**Viewport Sizes to Test:**

- 1920x1080 (Full HD Desktop)
- 1366x768 (Standard Laptop)
- 1280x720 (HD Desktop)

**Test Cases:**

- [ ] Sidebar navigation is visible and functional
- [ ] Music player fixed at bottom, doesn't overlap content
- [ ] Song grid displays 6 cards per row (Home/Library)
- [ ] Admin dashboard analytics charts render correctly
- [ ] Search bar is positioned correctly in header
- [ ] Modal dialogs (login/signup) are centered

### Mobile Responsive Testing

**Viewport Sizes to Test:**

- 360x740 (Galaxy S8+)
- 375x812 (iPhone X/XS)
- 414x896 (iPhone XR/11)
- 390x844 (iPhone 12/13)

**Test Cases:**

- [ ] Sidebar converts to bottom navigation
- [ ] Song grid displays 2 cards per row
- [ ] Music player controls are touch-friendly (min 44px targets)
- [ ] Search bar is accessible and doesn't overflow
- [ ] Login/signup forms fit viewport without horizontal scroll
- [ ] Admin upload form is responsive with stacked inputs
- [ ] Hamburger menu (if any) works smoothly

### Layout Breakpoints Verification

```css
/* Key breakpoints to verify */
@media (max-width: 768px) /* Tablet portrait */ @media (max-width: 480px); /* Mobile */
```

**Critical Elements:**

- [ ] Navigation switches at correct breakpoint
- [ ] Grid columns reduce appropriately
- [ ] Typography scales correctly
- [ ] Spacing/padding adjusts for mobile

---

## 2. Functional Modules Testing

### 2.1 Audio Player Controls

**Playback Controls:**

- [ ] Play button starts audio
- [ ] Pause button stops audio
- [ ] Next/Previous buttons navigate queue
- [ ] Seek bar allows scrubbing to any position
- [ ] Volume slider (0-100%) works smoothly
- [ ] Mute/unmute toggle functions
- [ ] Progress time displays (current/total)

**Advanced Features:**

- [ ] Shuffle mode randomizes playback order
- [ ] Repeat modes: Off, Repeat All, Repeat One
- [ ] Auto-advance to next song on completion
- [ ] Queue display shows upcoming songs
- [ ] Album art displays correctly
- [ ] Song metadata (title, artist) updates

**Edge Cases:**

- [ ] Behavior on network interruption
- [ ] Handling of corrupted/unavailable audio files
- [ ] Rapid seek operations
- [ ] Multiple rapid play/pause clicks

### 2.2 Playlist Management

**Actions:**

- [ ] View all playlists
- [ ] Create new playlist
- [ ] Add songs to playlist
- [ ] Remove songs from playlist
- [ ] Delete playlist
- [ ] Reorder songs (if implemented)

### 2.3 Search Functionality

**Test Queries:**

- [ ] Search by song title (exact match)
- [ ] Search by artist name
- [ ] Search by partial text
- [ ] Search with special characters
- [ ] Empty search (should show all or none)
- [ ] Search results update in real-time

### 2.4 Login/Signup Flows

**User Registration:**

- [ ] Valid email/password creates account
- [ ] Email validation (proper format)
- [ ] Password strength requirements enforced
- [ ] Duplicate email shows error
- [ ] Firebase auth integration works
- [ ] Google Sign-In works
- [ ] User redirected to home after signup

**User Login:**

- [ ] Valid credentials allow login
- [ ] Invalid credentials show error
- [ ] "Forgot Password" flow works
- [ ] Session persists on page reload
- [ ] Logout clears session
- [ ] Protected routes redirect to login

### 2.5 Profile Management

- [ ] View user profile
- [ ] Update profile information
- [ ] Change password
- [ ] View listening history
- [ ] Privacy settings (if implemented)

### 2.6 Library & Favorites

**Library:**

- [ ] Displays all songs in user's library
- [ ] Songs load with correct metadata
- [ ] Empty state shows message
- [ ] Pagination/infinite scroll (if implemented)

**Favorites/Likes:**

- [ ] Like button toggles state
- [ ] Liked songs appear in favorites list
- [ ] Unlike removes from favorites
- [ ] Like count updates (if displayed)
- [ ] Syncs across sessions

### 2.7 Trending Section

- [ ] Trending songs load on homepage
- [ ] Sorting by view count/plays works
- [ ] Real-time updates (if implemented)
- [ ] Displays correct metadata

### 2.8 Upload Functionality (Admin)

**YouTube Import:**

- [ ] Valid YouTube URL fetches metadata
- [ ] Auto-fill populates title, artist, thumbnail
- [ ] Category selection works
- [ ] Download progress shown
- [ ] Upload to Supabase/Firebase Storage works
- [ ] Database entry created correctly

**Manual File Upload:**

- [ ] Audio file upload (.mp3, .wav, .m4a)
- [ ] Cover image upload (.jpg, .png)
- [ ] File size validation
- [ ] File type validation
- [ ] Upload progress indicator
- [ ] Metadata form validation

### 2.9 Download/Export

- [ ] Download button available for songs
- [ ] Downloaded file is valid audio format
- [ ] Filename is appropriate

### 2.10 Streaming (Seek/Play/Pause)

- [ ] Streams from Supabase/Firebase Storage
- [ ] HTTP Range requests supported (byte-range seeking)
- [ ] Buffering indicator when loading
- [ ] Seamless playback without stuttering

### 2.11 Comments Feature

- [ ] Add comment on song
- [ ] View all comments
- [ ] Delete own comment
- [ ] Comment validation (length, content)

### 2.12 Share Functionality

- [ ] Share song URL
- [ ] Copy link to clipboard
- [ ] Social media share buttons (if implemented)

### 2.13 Admin Panel

**Song Management:**

- [ ] Add new song
- [ ] Edit song metadata (title, artist, cover, category)
- [ ] Delete song (with confirmation)
- [ ] Bulk operations (if implemented)

**Analytics Dashboard:**

- [ ] Total songs count
- [ ] Total logins count
- [ ] Active users (24h)
- [ ] Login trends chart (last 7 days)
- [ ] Charts render correctly (Recharts)

### 2.14 Subscription/Payment Flows

_(If implemented - add test cases as needed)_

- [ ] View subscription plans
- [ ] Select plan
- [ ] Payment gateway integration
- [ ] Subscription status updates
- [ ] Access control based on subscription

---

## 3. Backend API Testing

### API Endpoints Documentation

#### Authentication (Firebase)

_Handled client-side via Firebase SDK_

#### Songs API

**GET /api/songs**

- Method: `GET`
- Description: Fetch all songs
- Auth: None
- Query Params: None
- Success Response: `200 OK`

```json
[
  {
    "id": "uuid",
    "title": "Song Title",
    "artist": "Artist Name",
    "category": "Tamil",
    "emotion": "Neutral",
    "cover_url": "https://...",
    "file_url": "https://...",
    "source_url": "https://youtube.com/...",
    "created_at": "2025-12-12T...",
    "youtube_views": "1000000"
  }
]
```

- Error Response: `500 Internal Server Error`
- Rate Limit: None

**DELETE /api/songs/:id**

- Method: `DELETE`
- Description: Delete a song by ID
- Auth: Should be admin (verify in production)
- URL Params: `id` (song UUID)
- Success Response: `200 OK`

```json
{ "message": "Song deleted successfully" }
```

- Error Cases:
  - `404 Not Found` - Song doesn't exist
  - `500 Internal Server Error`

**POST /api/yt-metadata**

- Method: `POST`
- Description: Fetch YouTube video metadata
- Auth: None
- Request Body:

```json
{ "url": "https://youtube.com/watch?v=..." }
```

- Success Response: `200 OK`

```json
{
  "title": "Video Title",
  "artist": "Channel Name",
  "thumbnail": "https://...",
  "views": 1000000
}
```

- Error Cases:
  - `400 Bad Request` - Invalid URL
  - `500 Internal Server Error` - Fetch failed

**POST /api/upload-from-yt**

- Method: `POST`
- Description: Download from YouTube and upload to storage
- Auth: Should be admin
- Request Body:

```json
{
  "url": "https://youtube.com/watch?v=...",
  "title": "Song Title",
  "artist": "Artist Name",
  "category": "Tamil",
  "emotion": "Neutral",
  "thumbnail": "https://..."
}
```

- Success Response: `201 Created`

```json
{
  "message": "Song uploaded successfully",
  "song": {
    /* song object */
  }
}
```

- Error Cases:
  - `400 Bad Request` - Missing fields
  - `500 Internal Server Error` - Upload failed

**POST /api/upload-file**

- Method: `POST`
- Description: Upload audio and cover files
- Auth: Should be admin
- Content-Type: `multipart/form-data`
- Form Data:
  - `audio`: Audio file
  - `cover`: Image file
  - `title`: String
  - `artist`: String
  - `category`: String
  - `emotion`: String
- Success Response: `201 Created`
- Error Cases:
  - `400 Bad Request` - Missing files or fields
  - `500 Internal Server Error`

**GET /api/home-sections**

- Method: `GET`
- Description: Get categorized songs for homepage
- Auth: None
- Query Params: `userId` (optional)
- Success Response: `200 OK`

```json
{
  "trending": [
    /* songs */
  ],
  "tamil": [
    /* songs */
  ],
  "malayalam": [
    /* songs */
  ],
  "recentlyPlayed": [
    /* songs */
  ]
}
```

**POST /api/log-play**

- Method: `POST`
- Description: Log a song play event
- Auth: User session
- Request Body:

```json
{
  "userId": "uuid",
  "songId": "uuid"
}
```

- Success Response: `200 OK`

#### Likes API

**POST /api/likes/toggle**

- Method: `POST`
- Description: Toggle like status for a song
- Request Body:

```json
{
  "userId": "uuid",
  "songId": "uuid"
}
```

- Success Response: `200 OK`

```json
{ "liked": true }
```

**GET /api/likes/ids?userId=:userId**

- Method: `GET`
- Description: Get array of liked song IDs
- Query Params: `userId`
- Success Response: `200 OK`

```json
["songId1", "songId2", ...]
```

**GET /api/likes/list?userId=:userId**

- Method: `GET`
- Description: Get full song objects for liked songs
- Query Params: `userId`
- Success Response: `200 OK`

```json
[
  /* array of song objects */
]
```

#### Analytics API

**POST /api/analytics/login**

- Method: `POST`
- Description: Log user login event
- Request Body:

```json
{
  "userId": "uuid",
  "email": "user@example.com"
}
```

- Success Response: `200 OK`

**GET /api/analytics/stats**

- Method: `GET`
- Description: Get admin analytics statistics
- Success Response: `200 OK`

```json
{
  "totalSongs": 150,
  "totalLogins": 1000,
  "activeUsers24h": 50,
  "loginTrends": [
    { "date": "2025-12-06", "count": 10 },
    { "date": "2025-12-07", "count": 15 }
  ]
}
```

#### Test/Debug API

**GET /api/test/supabase**

- Method: `GET`
- Description: Test Supabase connection
- Success Response: `200 OK`

**GET /api/test/prisma**

- Method: `GET`
- Description: Test Prisma/PostgreSQL connection
- Success Response: `200 OK`

### API Testing Checklist

- [ ] All endpoints return correct HTTP status codes
- [ ] Response bodies match expected JSON schema
- [ ] Error responses include helpful messages
- [ ] CORS headers allow frontend domain
- [ ] File uploads handle multipart/form-data correctly
- [ ] Large file uploads don't timeout
- [ ] Concurrent requests handled properly
- [ ] Rate limiting works (if implemented)

---

## 4. Database Verification

### Schema Checks

**User Table:**

```sql
SELECT * FROM "User" LIMIT 5;
```

- [ ] `id` is UUID primary key
- [ ] `email` is unique
- [ ] `role` defaults to USER
- [ ] `createdAt` has timestamp

**Song Table:**

```sql
SELECT * FROM songs LIMIT 5;
```

- [ ] All required fields populated
- [ ] `category` has valid values
- [ ] `cover_url` and `file_url` are accessible URLs
- [ ] `youtube_views` stored as BigInt

**PlayHistory Table:**

```sql
SELECT * FROM "PlayHistory" ORDER BY "playedAt" DESC LIMIT 10;
```

- [ ] Foreign keys reference valid User and Song
- [ ] `playedAt` timestamp is accurate

**Like Table:**

```sql
SELECT * FROM "Like" LIMIT 5;
```

- [ ] Unique constraint on (userId, songId) works
- [ ] Cascades on song deletion

**LoginLog Table:**

```sql
SELECT * FROM "LoginLog" ORDER BY "createdAt" DESC LIMIT 10;
```

- [ ] Login events recorded correctly

### Referential Integrity

**Check for orphaned records:**

```sql
-- PlayHistory without valid user
SELECT ph.* FROM "PlayHistory" ph
LEFT JOIN "User" u ON ph."userId" = u.id
WHERE u.id IS NULL;

-- PlayHistory without valid song
SELECT ph.* FROM "PlayHistory" ph
LEFT JOIN songs s ON ph."songId" = s.id
WHERE s.id IS NULL;

-- Likes without valid user/song
SELECT l.* FROM "Like" l
LEFT JOIN "User" u ON l."userId" = u.id
WHERE u.id IS NULL;
```

- [ ] No orphaned PlayHistory records
- [ ] No orphaned Like records
- [ ] Cascade deletes work correctly

### Data Validation

**Check for duplicates:**

```sql
-- Duplicate emails
SELECT email, COUNT(*) FROM "User" GROUP BY email HAVING COUNT(*) > 1;

-- Duplicate songs (same title + artist)
SELECT title, artist, COUNT(*) FROM songs
GROUP BY title, artist HAVING COUNT(*) > 1;
```

- [ ] No duplicate emails
- [ ] Handle duplicate songs appropriately

**Check data quality:**

```sql
-- Songs with missing metadata
SELECT * FROM songs WHERE title IS NULL OR artist IS NULL OR cover_url IS NULL;

-- Invalid URLs
SELECT * FROM songs WHERE cover_url = '' OR file_url = '';
```

- [ ] No songs with missing critical fields
- [ ] All URLs are valid and accessible

### Indexing Performance

**Verify indexes exist:**

```sql
-- Check indexes on PlayHistory
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename = 'PlayHistory';
```

- [ ] Index on `userId` exists (for fast user queries)
- [ ] Index on `songId` (if needed for analytics)

**Performance Queries:**

```sql
-- Recently played songs for a user (should be fast)
EXPLAIN ANALYZE
SELECT s.* FROM songs s
JOIN "PlayHistory" ph ON s.id = ph."songId"
WHERE ph."userId" = 'user-uuid'
ORDER BY ph."playedAt" DESC LIMIT 10;
```

- [ ] Query uses index (not sequential scan)
- [ ] Execution time < 100ms

### Sample Validation Queries

**Count checks:**

```sql
-- Total counts
SELECT
  (SELECT COUNT(*) FROM "User") as total_users,
  (SELECT COUNT(*) FROM songs) as total_songs,
  (SELECT COUNT(*) FROM "PlayHistory") as total_plays,
  (SELECT COUNT(*) FROM "Like") as total_likes;
```

**Slow queries to optimize:**

```sql
-- Most played songs (might be slow without proper index)
SELECT s.title, s.artist, COUNT(ph.id) as play_count
FROM songs s
JOIN "PlayHistory" ph ON s.id = ph."songId"
GROUP BY s.id
ORDER BY play_count DESC
LIMIT 20;
```

- [ ] Add indexes if execution time > 500ms

---

## 5. Security Testing

### Authentication & Authorization

**Auth Checks:**

- [ ] Protected routes require login
- [ ] Admin routes require admin role
- [ ] JWT tokens expire appropriately
- [ ] Session management is secure
- [ ] Logout properly clears tokens

**Authorization:**

- [ ] Users can only access their own data
- [ ] Non-admins cannot upload/delete songs
- [ ] Non-admins cannot access admin dashboard

### Input Validation

**SQL Injection Tests:**

```
Test inputs: ' OR '1'='1, '; DROP TABLE songs; --
```

- [ ] All inputs sanitized via Prisma ORM
- [ ] No raw SQL queries vulnerable to injection

**XSS Prevention:**

```
Test inputs: <script>alert('XSS')</script>, <img src=x onerror=alert(1)>
```

- [ ] User inputs escaped in React
- [ ] No `dangerouslySetInnerHTML` without sanitization

**File Upload Security:**

- [ ] Only allowed file types accepted (.mp3, .jpg, etc.)
- [ ] File size limits enforced (e.g., 50MB audio, 5MB images)
- [ ] Uploaded files scanned for malware (if possible)
- [ ] File names sanitized (no path traversal: `../../etc/passwd`)
- [ ] MIME type verification (not just extension)

### CORS Configuration

**Check CORS headers:**

```javascript
// backend/src/app.js
origin: [
  "http://localhost:5173",
  "https://sangatamizh-music-premium.vercel.app",
];
```

- [ ] Only trusted origins allowed
- [ ] Credentials properly handled
- [ ] Preflight requests work

### CSP (Content Security Policy)

**Recommended CSP headers:**

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  media-src 'self' https://firebasestorage.googleapis.com https://storage.googleapis.com;
  connect-src 'self' https://firebasestorage.googleapis.com https://render.com;
```

- [ ] CSP headers configured (add to Vercel config)
- [ ] No inline scripts/styles (or properly whitelisted)

### Secrets Management

**Environment Variables:**

- [ ] `.env` files not committed to Git
- [ ] Firebase config secrets in environment variables
- [ ] Supabase keys not exposed in client code
- [ ] Database URL secured

**API Keys:**

- [ ] YouTube API key (if used) properly secured
- [ ] No sensitive keys in frontend bundle

---

## 6. Performance Testing

### Load Testing Plan

**Tools:** Artillery, Apache JMeter, or k6

**Test Scenarios:**

**Scenario 1: Concurrent Streaming**

- Simulate 100 concurrent users
- Each streams a random song
- Measure throughput and latency

**Scenario 2: Bulk Song Fetch**

- 50 concurrent GET /api/songs requests
- Measure response time

**Scenario 3: Upload Stress Test**

- 10 concurrent song uploads
- Measure server resource usage

**Metrics to Track:**

- [ ] Requests per second (RPS)
- [ ] Average response time
- [ ] 95th percentile response time
- [ ] Error rate (should be < 1%)
- [ ] Server CPU/memory usage

### Frontend Performance (Lighthouse)

**Run Lighthouse audits on:**

- Homepage
- Library page
- Admin dashboard

**Target Scores:**

- [ ] Performance: > 90
- [ ] Accessibility: > 95
- [ ] Best Practices: > 90
- [ ] SEO: > 90

**Key Metrics:**

- [ ] First Contentful Paint (FCP): < 1.5s
- [ ] Largest Contentful Paint (LCP): < 2.5s
- [ ] Time to Interactive (TTI): < 3.5s
- [ ] Total Blocking Time (TBT): < 300ms
- [ ] Cumulative Layout Shift (CLS): < 0.1
- [ ] Time to First Byte (TTFB): < 600ms

### Caching Strategy

**Frontend:**

- [ ] Static assets cached (Vite build hash-based)
- [ ] Service Worker for offline support (if implemented)

**Backend:**

- [ ] API responses cached (Redis or in-memory)
- [ ] CDN caching for audio files

**CDN Checks:**

- [ ] Supabase Storage CDN enabled
- [ ] Firebase CDN for media files
- [ ] Cache headers properly set

---

## 7. Accessibility & SEO

### Keyboard Navigation

- [ ] Tab order is logical
- [ ] All interactive elements focusable
- [ ] Focus indicator visible
- [ ] Escape key closes modals
- [ ] Arrow keys navigate song queue (optional)
- [ ] Spacebar toggles play/pause (optional)

### ARIA Roles & Attributes

- [ ] `role="button"` on custom buttons
- [ ] `aria-label` on icon-only buttons
- [ ] `aria-live` for player status updates
- [ ] `aria-expanded` on dropdowns
- [ ] `role="dialog"` and `aria-modal` on modals

### Color Contrast

- [ ] Text contrast ratio ≥ 4.5:1 (WCAG AA)
- [ ] Large text ≥ 3:1
- [ ] Check with browser DevTools or axe extension

### Alt Text

- [ ] All song cover images have `alt` attributes
- [ ] Descriptive alt text (e.g., "Album cover for [Song Title]")

### Meta Tags (SEO)

**Homepage:**

```html
<title>Sangatamizh Music - Stream Tamil, Malayalam & More</title>
<meta
  name="description"
  content="Stream and discover Tamil, Malayalam, and regional Indian music. High-quality audio streaming platform."
/>
<meta property="og:title" content="Sangatamizh Music" />
<meta property="og:description" content="..." />
<meta property="og:image" content="https://.../preview-image.jpg" />
```

- [ ] Unique title on each page
- [ ] Meta descriptions < 160 characters
- [ ] Open Graph tags for social sharing
- [ ] Favicon present

---

## 8. Cross-Browser/Device Testing

### Desktop Browsers

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (macOS)

**Test on each:**

- [ ] Audio playback works
- [ ] Seek bar interactive
- [ ] Styling consistent
- [ ] No console errors

### Mobile Browsers

- [ ] Chrome (Android)
- [ ] Samsung Internet
- [ ] Safari (iOS)

**Known Differences:**

- [ ] iOS Safari autoplay restrictions (user interaction required)
- [ ] Android WebView audio format support
- [ ] Mobile Safari volume control limitations

### Browser-Specific Issues

- [ ] Test on older browsers (1-2 versions back)
- [ ] Polyfills for older JavaScript features
- [ ] CSS vendor prefixes where needed

---

## 9. Regression & CI

### Critical Smoke Tests

**Run on every deploy:**

1. **Authentication**

   - [ ] User can sign up
   - [ ] User can log in
   - [ ] User can log out

2. **Core Functionality**

   - [ ] Homepage loads with songs
   - [ ] Song playback works
   - [ ] Song search returns results
   - [ ] Like/unlike a song works

3. **Admin Features**

   - [ ] Admin can upload song (YouTube)
   - [ ] Admin can delete song
   - [ ] Analytics dashboard loads

4. **API Health**
   - [ ] GET /api/songs returns 200
   - [ ] Backend health check returns 200

### Automation Suggestions

**Frontend E2E Tests (Playwright/Cypress):**

```javascript
// tests/e2e/playback.spec.js
test("should play a song from library", async ({ page }) => {
  await page.goto("/library");
  await page.click('[data-testid="song-card-play"]');
  await page.waitForSelector('[data-testid="player-playing"]');
  expect(await page.isVisible('[data-testid="pause-button"]')).toBe(true);
});
```

**API Tests (Postman/Newman):**

```json
{
  "name": "Get All Songs",
  "request": {
    "method": "GET",
    "url": "{{baseUrl}}/api/songs"
  },
  "test": "pm.expect(pm.response.code).to.equal(200);"
}
```

**CI/CD Pipeline (GitHub Actions):**

```yaml
name: Test & Deploy
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run test
      - run: npm run build
```

### Test Coverage Goals

- [ ] Frontend: > 70% code coverage
- [ ] Backend: > 80% code coverage
- [ ] Critical paths: 100% coverage

---

## Testing Execution Plan

### Phase 1: Manual Testing (Week 1)

- Complete all UI verification checklists
- Test all functional modules
- Document bugs in issue tracker

### Phase 2: API & Database (Week 2)

- Test all API endpoints with Postman
- Run database validation queries
- Performance benchmarking

### Phase 3: Security & Performance (Week 3)

- Security audit
- Load testing
- Lighthouse optimization

### Phase 4: Cross-Browser & Accessibility (Week 4)

- Test on all browsers/devices
- Accessibility audit
- SEO verification

### Phase 5: Automation Setup (Ongoing)

- Write E2E tests for critical paths
- Set up CI/CD pipeline
- Integrate automated testing

---

## Bug Tracking Template

**Bug Report Format:**

```
Title: [Short description]
Severity: Critical / High / Medium / Low
Component: Frontend / Backend / Database
Steps to Reproduce:
1. ...
2. ...
Expected: ...
Actual: ...
Environment: Browser/OS, Device
Screenshot: [if applicable]
```

---

**Testing Lead:** [Your Name]  
**Last Updated:** 2025-12-12  
**Version:** 1.0
