# Bug Report Template & Severity Guide

Use this template for all bug reports to ensure consistent, actionable issue tracking.

---

## Bug Report Template

```markdown
## [Component] Short Description of Bug

### Environment

- **URL:** https://sangatamizh-music-premium.vercel.app/library
- **User/Role:** testuser@example.com (USER) or admin@example.com (ADMIN)
- **Browser/Version:** Chrome 120.0.6099.130 / Safari 17.2 (iOS)
- **Device:** Desktop (1920x1080) / iPhone 12 (375x812)
- **OS:** Windows 11 / macOS Sonoma / iOS 17
- **Build/Commit:** abc123def (from GitHub Actions or deployment log)
- **Time:** 2025-12-12 21:00 IST
- **Network:** WiFi / 4G / Slow 3G (if relevant)

### Steps to Reproduce

1. Navigate to `/library`
2. Click on first song card
3. Observe player at bottom
4. Click seek bar at 50% position

### Expected Behavior

- Song should seek to 50% timestamp
- Time label updates to match position
- Playback continues from new position

### Actual Behavior

- Player freezes
- Time label shows 0:00
- Console error: `TypeError: Cannot read property 'currentTime' of undefined`
- Network request shows 206 response but audio doesn't update

### Reproduction Artifacts

**Screenshot:**
[Attach screenshot showing frozen player UI]

**Console Logs:**
```

MusicPlayer.jsx:45 TypeError: Cannot read property 'currentTime' of undefined
at handleSeek (MusicPlayer.jsx:45:18)
at onClick (MusicPlayer.jsx:89:5)

````

**Network Request (curl):**
```bash
curl -i -H "Range: bytes=500000-1000000" \
  -H "Authorization: Bearer eyJhbGc..." \
  "https://backend.render.com/api/songs/abc-123/stream"

Response: 206 Partial Content
Content-Range: bytes 500000-1000000/2500000
````

**Video (optional):**
[Link to screen recording showing bug]

### Debugging Information

**SQL Query to Check Data:**

```sql
SELECT id, title, file_url, created_at
FROM songs
WHERE id = 'abc-123';
```

Result: Song exists, file_url is valid

**API Response:**

```json
GET /api/songs/abc-123
{
  "id": "abc-123",
  "title": "Test Song",
  "file_url": "https://storage.googleapis.com/...",
  "duration": 180
}
```

**Browser Storage:**

- LocalStorage: `authToken` present
- SessionStorage: `currentSong` = `{"id": "abc-123", ...}`

### Impact

- **Affected Users:** All users trying to seek during playback
- **Workaround:** Restart song from beginning
- **Data Loss:** None
- **Security Risk:** None

### Severity: **High (P1)**

### Priority: **P1** (Fix within 24 hours)

### Suggested Fix

Check if `audioRef.current` exists before accessing `currentTime`:

```javascript
const handleSeek = (newTime) => {
  if (audioRef.current) {
    audioRef.current.currentTime = newTime;
  }
};
```

### Related Issues

- #123: Similar seek bug on iOS Safari
- #145: Player state not updating

### Assigned To

@developer-username

### Labels

`bug`, `player`, `P1`, `frontend`

````

---

## Severity & Priority Guide

### Severity Levels

#### **Critical (P0)**
**Definition:** System-wide failure, complete outage, or data loss

**Examples:**
- Site completely down (500 error on all pages)
- Database connection lost (all API calls fail)
- Payment system broken (users charged incorrectly)
- Data loss (songs deleted unintentionally)
- Security breach (user data exposed)
- Streaming fails for 100% of users

**Response Time:** Immediate (drop everything)
**Fix Timeline:** Within 1-4 hours

---

#### **High (P1)**
**Definition:** Major feature broken, blocks core functionality

**Examples:**
- Login fails for all users (not able to authenticate)
- Upload broken (admins can't add new songs)
- Playback fails on specific browser (e.g., all iOS users)
- Search returns no results
- Security vulnerability (XSS, SQL injection discovered)
- Severe performance regression (page load > 10s)
- Payment checkout fails intermittently

**Response Time:** Same day
**Fix Timeline:** Within 24-48 hours

---

#### **Medium (P2)**
**Definition:** Feature partially broken, workaround exists

**Examples:**
- Seek bar doesn't update visual position (but seek works)
- Like button doesn't show active state (like still saves)
- Album art doesn't load on specific device
- Search debouncing not working (multiple API calls)
- Mobile layout slightly off (content overlaps by few pixels)
- Playlist reordering drag-drop broken
- Admin analytics chart doesn't render

**Response Time:** Within 3 days
**Fix Timeline:** Within 1 week

---

#### **Low (P3)**
**Definition:** Minor visual bugs, polish, enhancements

**Examples:**
- Button hover state color slightly off
- Text alignment off by 2px
- Tooltip position not optimal
- Minor typo in UI ("Favourites" vs "Favorites")
- Optimization opportunity (reduce bundle size 10%)
- Accessibility improvement (add aria-label)
- SEO enhancement (better meta description)

**Response Time:** When bandwidth allows
**Fix Timeline:** Within 1 month or backlog

---

### Priority Matrix (Severity + Impact)

| Severity | High Impact (>50% users) | Medium Impact (10-50%) | Low Impact (<10%) |
|----------|--------------------------|------------------------|-------------------|
| Critical | **P0** - Immediate | **P0** - Immediate | **P1** - Same day |
| High | **P1** - 24h | **P1** - 24-48h | **P2** - 1 week |
| Medium | **P2** - 1 week | **P2** - 2 weeks | **P3** - Backlog |
| Low | **P3** - Backlog | **P3** - Backlog | **P3** - Backlog |

---

## Example Bug Reports

### Example 1: Critical Bug

```markdown
## [Backend] Complete Streaming Failure on Production

### Environment
- **URL:** https://sangatamizh-music-premium.vercel.app/*
- **User/Role:** All users
- **Backend:** https://backend.render.com
- **Time:** 2025-12-12 14:30 IST
- **Affected:** 100% of users

### Steps to Reproduce
1. Login as any user
2. Click play on any song
3. Observe player

### Expected
Song streams and plays

### Actual
- Loading spinner infinite
- Console: `Failed to fetch`
- Network: `503 Service Unavailable`

### Console Logs
````

Error: Network request failed
at fetch (MusicPlayer.jsx:89)
Status: 503

````

### API Response
```bash
curl -i https://backend.render.com/api/songs/123/stream
HTTP/1.1 503 Service Unavailable
{"error": "Service temporarily unavailable"}
````

### Debugging

**Backend Logs (Render.com):**

```
[ERROR] Supabase connection timeout
[ERROR] Storage bucket unreachable
```

**Impact:** All users unable to stream music

### Severity: **Critical (P0)**

### Priority: **P0**

### Action Taken

1. Investigated Supabase status page (no outage reported)
2. Checked Render logs (rate limit hit on storage API)
3. Temporary fix: Restarted Render service
4. Permanent fix needed: Implement retry logic + caching

### Assigned To: @backend-dev

### Labels: `critical`, `P0`, `backend`, `streaming`

````

---

### Example 2: High Priority Bug

```markdown
## [Auth] Google Sign-In Fails on Mobile Safari

### Environment
- **Browser:** Safari 17.2 (iOS 17.3)
- **Device:** iPhone 13 (390x844)
- **URL:** https://sangatamizh-music-premium.vercel.app/login

### Steps to Reproduce
1. Open app in Safari (iOS)
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Return to app

### Expected
User logged in, redirected to /home

### Actual
- OAuth popup opens
- User approves
- Redirects to /login (not logged in)
- Console: `firebase.auth.popup.blocked`

### Screenshot
[Attach: popup blocker message]

### Impact
- ~30% of users use iOS Safari
- Workaround: Use email/password login

### Severity: High (P1)
### Priority: P1 (Fix within 24h)

### Suggested Fix
Use redirect flow instead of popup on mobile:
```javascript
if (isMobile) {
  await signInWithRedirect(auth, provider);
} else {
  await signInWithPopup(auth, provider);
}
````

### Assigned To: @auth-dev

### Labels: `bug`, `auth`, `iOS`, `P1`

````

---

### Example 3: Medium Priority Bug

```markdown
## [UI] Song Grid Breaks on Tablet Portrait (768x1024)

### Environment
- **Device:** iPad Air (768x1024)
- **Browser:** Safari 17
- **URL:** /library

### Steps to Reproduce
1. Open app on iPad in portrait mode
2. Navigate to /library
3. Observe song grid

### Expected
3-column grid with even spacing

### Actual
- 2.5 columns (cards cut off on right)
- Horizontal scrollbar appears
- Last column partially hidden

### Screenshot
[Attach: grid layout issue]

### CSS Issue
```css
/* Current (broken) */
.song-grid {
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  padding: 24px; /* This causes overflow */
}

/* Fix */
@media (max-width: 768px) {
  .song-grid {
    padding: 16px; /* Reduce padding */
    gap: 16px;
  }
}
````

### Impact

- Affects iPad users (~10% of traffic)
- Workaround: Switch to landscape or zoom out

### Severity: Medium (P2)

### Priority: P2 (Fix within 1 week)

### Assigned To: @frontend-dev

### Labels: `bug`, `UI`, `responsive`, `P2`

````

---

### Example 4: Low Priority Bug

```markdown
## [UI] Tooltip Text Overlaps on Long Song Titles

### Environment
- **Browser:** Chrome 120
- **Device:** Desktop (1920x1080)
- **URL:** /library

### Steps to Reproduce
1. Hover over song with title > 50 characters
2. Observe tooltip

### Expected
Tooltip truncates or wraps text

### Actual
Tooltip extends off-screen

### Screenshot
[Attach: tooltip overflow]

### Suggested Fix
```css
.tooltip {
  max-width: 300px;
  word-wrap: break-word;
}
````

### Impact

- Minor visual annoyance
- Only affects very long titles
- No functional impact

### Severity: Low (P3)

### Priority: P3 (Backlog)

### Assigned To: Backlog

### Labels: `UI`, `polish`, `P3`

```

---

## Bug Tracking Workflow

### 1. Report Bug
- Use template above
- Add to GitHub Issues or Jira
- Tag with severity & priority

### 2. Triage
- Team reviews daily
- Assigns priority
- Assigns developer

### 3. Fix
- Developer creates branch: `fix/issue-123-seek-bar`
- Writes fix + unit test
- Creates pull request

### 4. Test
- QA verifies fix on all affected platforms
- Regression tests run

### 5. Deploy
- Merge to main
- Deploy to production
- Monitor for 24h

### 6. Close
- Verify in production
- Close issue with note: "Fixed in v1.2.3"

---

**Last Updated:** 2025-12-12
```
