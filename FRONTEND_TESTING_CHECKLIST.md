# Frontend Desktop & Mobile Testing Checklist

**Priority: HIGH** | Execute before every release

---

## Viewport Testing Matrix

| Viewport | Resolution | Device Type      | Grid Columns |
| -------- | ---------- | ---------------- | ------------ |
| Desktop  | 1440×900   | Desktop          | 6            |
| Laptop   | 1366×768   | Laptop           | 5-6          |
| Tablet L | 1024×768   | Tablet Landscape | 4            |
| Tablet P | 768×1024   | Tablet Portrait  | 3            |
| iPhone X | 375×812    | Mobile           | 2            |
| Android  | 360×800    | Mobile           | 2            |

---

## Test Execution Guide

### Setup Chrome DevTools

```
1. Open Chrome DevTools (F12)
2. Click Toggle Device Toolbar (Ctrl+Shift+M)
3. Select "Responsive" mode
4. Set dimensions manually or choose preset
```

---

## 1. Layout & Responsiveness Tests

### Header/Navigation (All Viewports)

**Desktop (1440×900, 1366×768):**

- [ ] Logo visible in top-left
- [ ] Search bar visible in header
- [ ] Navigation links visible (Home, Library, Playlists)
- [ ] User avatar/profile icon visible
- [ ] No hamburger menu

**Tablet (1024×768, 768×1024):**

- [ ] Logo visible
- [ ] Search bar may collapse to icon
- [ ] Navigation adapts (may use hamburger)
- [ ] Layout doesn't break

**Mobile (375×812, 360×800):**

- [ ] Logo visible (may be smaller)
- [ ] Hamburger menu replaces full nav
- [ ] Search icon expands to full search bar
- [ ] Bottom navigation bar visible
- [ ] No horizontal scroll

---

### Music Player (Sticky Bottom)

**All Viewports:**

- [ ] Player fixed at bottom of viewport
- [ ] Remains visible when scrolling pages
- [ ] Doesn't overlap content
- [ ] controls accessible on all screen sizes

**Desktop Layout:**

- [ ] Album art (left), Song info (center-left), Controls (center), Volume (right)
- [ ] All controls visible simultaneously

**Mobile Layout:**

- [ ] Compact view: Song info + Play/Pause visible
- [ ] Tap to expand for full controls
- [ ] Seek bar above controls
- [ ] Volume may be hidden (device volume used)

---

### Song Grid Layout

**Test Page:** `/` (Home) and `/library`

**Desktop (1440×900):**

```
Navigate to Home page
✓ Song cards display in 6-column grid
✓ Cards have equal width/height
✓ Proper spacing between cards (16-24px)
✓ Hover effect shows play button overlay
```

**Laptop (1366×768):**

- [ ] 5-6 column grid
- [ ] Cards scale proportionally

**Tablet Landscape (1024×768):**

- [ ] 4 column grid
- [ ] Touch targets min 44×44px

**Tablet Portrait (768×1024):**

- [ ] 3 column grid
- [ ] Scrollable without horizontal overflow

**Mobile (375×812, 360×800):**

- [ ] 2 column grid
- [ ] Cards fill available width
- [ ] Tap to play (no hover required)

---

### Playlist/Queue Overflow

**Test:** Create playlist with 50+ songs

- [ ] Scrollable container (vertical)
- [ ] Long titles truncate with ellipsis (...)
- [ ] Hover/tap shows tooltip with full title
- [ ] Scroll position persists during playback

---

## 2. Player Controls Testing

### Basic Playback

**Test Case: Play a Song**

```
Steps:
1. Navigate to /library
2. Click first song card
3. Observe player at bottom

Expected:
✓ Audio starts within 2 seconds
✓ Play button changes to Pause icon
✓ Progress bar animates
✓ Time label shows 0:00 / [duration]
✓ Album art displays
✓ Song title & artist visible
```

**Test Case: Pause/Resume**

```
Steps:
1. While song playing, click Pause
2. Wait 3 seconds
3. Click Play

Expected:
✓ Audio pauses immediately
✓ Progress bar stops
✓ Resume from same position
```

---

### Seek Functionality

**Test Case: Seek Bar Interaction**

```
Steps:
1. Play any song
2. Click/drag progress bar to 50% position

Expected:
✓ Audio jumps to ~50% timestamp
✓ Current time label updates (e.g., 1:32 / 3:05)
✓ Playback continues from new position
✓ No buffering delay > 1s
```

**Mobile Test:**

- [ ] Touch-drag on seek bar works smoothly
- [ ] No accidental swipes/scrolls

---

### Next/Previous

**Test Case: Next Song**

```
Steps:
1. Play song A
2. Click Next button

Expected:
✓ Song B starts playing immediately
✓ UI updates (title, artist, album art)
✓ Progress resets to 0:00
✓ Queue advances
```

**Test Case: Previous Song**

- [ ] If > 3s into song: restarts current song
- [ ] If < 3s: goes to previous song

---

### Shuffle & Repeat

**Test Case: Shuffle Mode**

```
Steps:
1. Play first song in library
2. Enable Shuffle (button active state)
3. Click Next 5 times

Expected:
✓ Songs play in random order
✓ No immediate repeats
✓ Shuffle icon highlighted
```

**Test Case: Repeat Modes**

```
Cycle through repeat states:
1. Click Repeat → Repeat All (icon: ⟲)
2. Click again → Repeat One (icon: ⟲¹)
3. Click again → Repeat Off

Test Repeat One:
✓ Song loops when finished
```

---

### Volume Controls

**Test Case: Volume Slider**

```
Desktop:
1. Drag volume slider to 50%
2. Check audio output level
3. Set to 0% (mute)
4. Set to 100%

Expected:
✓ Audio volume adjusts accordingly
✓ Mute icon appears at 0%
✓ No distortion at 100%
```

**Mobile:**

- [ ] Volume slider may be hidden (use device volume)
- [ ] If visible, test touch interaction

---

### Progress Bar Time Labels

**Test:**

- [ ] Current time updates every second (0:00, 0:01, 0:02...)
- [ ] Total duration shows correctly (matches actual file duration)
- [ ] Format: M:SS or H:MM:SS for long tracks

---

### Simultaneous Stream Prevention

**Test Case: Multi-Tab Playback**

```
Steps:
1. Open app in Tab 1, play song A
2. Open app in Tab 2 (same browser)
3. Play song B in Tab 2

Expected:
✓ Song A pauses in Tab 1
✓ Only Song B plays
✓ Only one active stream per user session
```

---

## 3. Network State Testing

### Offline Mode

**Test:**

```
1. Open app, play song
2. Disconnect internet (DevTools: Offline)
3. Try to play another song

Expected:
✓ Error message: "No internet connection"
✓ UI shows offline indicator
✓ Retry button appears
✓ Reconnect → app resumes normally
```

---

### Slow 3G Simulation

**Chrome DevTools:**

```
1. Network tab → Throttling → Slow 3G
2. Play a song

Expected:
✓ Loading spinner shows while buffering
✓ Audio plays once buffered (may start at lower quality)
✓ Progress bar shows buffered range
✓ Playback doesn't stutter after initial buffer
```

---

## 4. Authentication Flows

### Signup Validation

**Test Page:** `/login` → Sign Up tab

**Test Case: Valid Signup**

```
Email: testuser+123@example.com
Password: SecurePass123!

Expected:
✓ Email validation (proper format)
✓ Password strength indicator (if present)
✓ Min 8 chars enforced
✓ Account created → redirect to /home
```

**Test Case: Invalid Inputs**

```
Test:
- Email: "notanemail" → Error: "Invalid email format"
- Password: "123" → Error: "Password must be 8+ characters"
- Existing email → Error: "Email already registered"
```

---

### Login Persistence

**Test:**

```
1. Login as testuser@example.com
2. Reload page (F5)
3. Close browser, reopen app URL

Expected:
✓ User remains logged in
✓ Session persists in localStorage/sessionStorage
✓ Protected routes accessible
```

---

### Logout

**Test:**

```
1. Click Logout button
2. Attempt to visit /library

Expected:
✓ Session cleared
✓ Redirected to /login
✓ Protected routes block access
```

---

### Social Login (if implemented)

**Test: Google Sign-In**

```
1. Click "Sign in with Google"
2. Complete Google OAuth flow

Expected:
✓ Popup opens
✓ Returns with user token
✓ Creates account in DB
✓ Redirects to /home
```

---

## 5. Library & User Data

### Favorites/Likes

**Test Case: Like a Song**

```
Steps:
1. Navigate to /home
2. Click heart icon on song card

Expected:
✓ Heart icon fills/changes color
✓ POST /api/likes/toggle returns 200
✓ Song appears in /library favorites section
```

**Test Case: Unlike**

```
✓ Click filled heart
✓ Icon returns to outline state
✓ Removed from favorites
```

---

### Playlists

**Test Case: Create Playlist**

```
Steps:
1. Click "New Playlist"
2. Name: "Test Playlist"
3. Add 3 songs

Expected:
✓ Playlist appears in sidebar
✓ Songs display in order
✓ Play all button starts queue
```

**Test Case: Edit Playlist**

```
✓ Rename playlist
✓ Add/remove songs
✓ Reorder songs (drag-drop if available)
```

**Test Case: Delete Playlist**

```
✓ Confirmation modal appears
✓ Playlist removed from UI and DB
✓ Songs remain in library (not deleted)
```

---

### Song Metadata Display

**Check:**

- [ ] Title
- [ ] Artist
- [ ] Album (if available)
- [ ] Duration (3:45 format)
- [ ] Genre/Category
- [ ] Upload date

---

## 6. Upload Flow (Admin/Artist)

**Test Page:** `/admin/upload` (requires admin role)

### File Validation (Client-Side)

**Test Case: Valid Upload**

```
File: song.mp3 (15MB)
Title: "Test Song"
Artist: "Test Artist"
Category: "Tamil"

Expected:
✓ File type accepted (.mp3, .wav, .m4a)
✓ File size < 50MB passes
✓ All metadata fields required
✓ Upload button enabled
```

**Test Case: Invalid File Type**

```
File: document.pdf

Expected:
✗ Error: "Only audio files allowed (.mp3, .wav, .m4a)"
✗ Upload button disabled
```

**Test Case: Oversize File**

```
File: large.mp3 (75MB)

Expected:
✗ Error: "File size must be < 50MB"
✗ Upload prevented
```

---

### YouTube Import

**Test Case: Fetch Metadata**

```
Steps:
1. Enter YouTube URL: https://youtube.com/watch?v=dQw4w9WgXcQ
2. Click "Auto-fill"

Expected:
✓ Title field populates
✓ Artist field populates
✓ Thumbnail loads
✓ Category dropdown available
```

**Test Case: Invalid URL**

```
URL: https://notayoutubelink.com

Expected:
✗ Error: "Invalid YouTube URL"
```

---

## 7. Search & Filtering

### Search Functionality

**Test Case: Search with Debouncing**

```
Steps:
1. Navigate to /library
2. Type quickly: "l" → "lo" → "lov" → "love"

Expected:
✓ Search debounced (500ms delay)
✓ Only final search "love" triggers API call
✓ Results filter in real-time
```

**Test Case: Empty Results**

```
Search: "xyznonexistentsong123"

Expected:
✓ "No results found" message displays
✓ Clear search button visible
```

---

### Suggestions

**Test:**

- [ ] Recent searches shown (if implemented)
- [ ] Autocomplete suggestions dropdown
- [ ] Click suggestion fills search

---

### Filters & Sort

**Test:**

```
Filters: Genre=Tamil, Mood=Happy
Sort: By Date (Newest first)

Expected:
✓ Only Tamil songs with Happy mood display
✓ Sorted correctly by upload date
✓ Filter count badge (e.g., "Filters: 2")
✓ Clear filters button
```

---

## 8. Sharing & Embeds (if implemented)

### Link Sharing

**Test:**

```
1. Click Share icon on song
2. Copy link
3. Open link in incognito tab

Expected:
✓ Link includes song ID
✓ Opens to song detail or auto-plays
✓ Preview metadata (og:image, og:title) loads
```

---

### Embed Player

**Test:**

```
1. Get embed code
2. Paste in test.html iframe

Expected:
✓ Iframe loads mini player
✓ Playback works in iframe
✓ Styling consistent
```

---

## 9. UI States

### Loading States

**Check All Pages:**

- [ ] Initial page load: skeleton screens
- [ ] Song loading: spinner on play button
- [ ] Search: loading indicator while fetching
- [ ] Upload: progress bar (0-100%)

---

### Error States

**Test:**

```
Trigger errors:
1. API down (DevTools: Block request)
2. Invalid song ID (/songs/invalid-id)

Expected:
✓ Error message displays
✓ Retry button available
✓ No app crash (graceful degradation)
```

---

### Empty States

**Test:**

- [ ] New user library: "No songs yet. Start exploring!"
- [ ] Empty playlist: "Add songs to this playlist"
- [ ] No search results: "Try different keywords"

---

## 10. Accessibility Tests

### Keyboard Navigation

**Test:**

```
1. Tab through page
2. Focus order: Header → Search → Song grid → Player
3. Enter/Space activates buttons
4. Escape closes modals

Expected:
✓ All interactive elements focusable
✓ Focus indicator visible (outline)
✓ Logical tab order
```

---

### ARIA Labels

**Check:**

- [ ] `<button aria-label="Play">` for icon buttons
- [ ] `<div role="slider" aria-valuenow="50">` for volume
- [ ] `<div aria-live="polite">` for player status updates

---

### Alt Text

**Check:**

- [ ] All album art: `<img alt="Album cover for [Song Title]">`
- [ ] User avatars: `<img alt="[Username]'s profile picture">`

---

### Color Contrast

**Test with Contrast Checker:**

- [ ] Body text: ≥ 4.5:1 ratio
- [ ] Buttons: ≥ 4.5:1
- [ ] Large text (18px+): ≥ 3:1

---

## Test Execution Log

**Date:** ****\_\_\_\_****  
**Tester:** ****\_\_\_\_****  
**Build/Commit:** ****\_\_\_\_****

| Test Case         | Desktop | Laptop | Tablet | Mobile | Pass/Fail |
| ----------------- | ------- | ------ | ------ | ------ | --------- |
| Layout responsive | ☐       | ☐      | ☐      | ☐      |           |
| Player controls   | ☐       | ☐      | ☐      | ☐      |           |
| Search/filter     | ☐       | ☐      | ☐      | ☐      |           |
| Auth flows        | ☐       | ☐      | ☐      | ☐      |           |
| Upload (admin)    | ☐       | ☐      | ☐      | ☐      |           |
| Network states    | ☐       | ☐      | ☐      | ☐      |           |
| Accessibility     | ☐       | ☐      | ☐      | ☐      |           |

**Critical Issues Found:** ****\_\_\_\_****  
**Sign-off:** ****\_\_\_\_****
