# Responsive UI & Security Testing Checklist

Comprehensive manual testing checklists for responsive design and security verification.

---

## Part 1: Responsive UI Verification

### Testing Tools

**Browser DevTools:**

- Chrome DevTools (F12 → Toggle Device Toolbar)
- Firefox Responsive Design Mode
- Safari Web Inspector

**Online Tools:**

- [Responsive Design Checker](https://responsivedesignchecker.com/)
- [BrowserStack](https://www.browserstack.com/)
- [LambdaTest](https://www.lambdatest.com/)

**Physical Devices** (if available):

- Test on actual phones/tablets for touch interaction

---

### Desktop Resolutions

#### **1920x1080 (Full HD)**

**Homepage (/):**

- [ ] Song grid displays 6 cards per row
- [ ] Sidebar fully visible on left
- [ ] Music player doesn't overlap content
- [ ] Search bar fits in header without wrapping
- [ ] No horizontal scrollbar
- [ ] Album art renders at proper size (not pixelated)
- [ ] Text is readable (not too small or large)

**Library (/library):**

- [ ] 6-column grid maintained
- [ ] Filters/sort options visible
- [ ] Song metadata fully displayed

**Admin Dashboard (/admin):**

- [ ] Analytics charts render correctly
- [ ] Stats cards in proper grid layout
- [ ] Upload form fits on screen
- [ ] Manage section table is readable

---

#### **1366x768 (Standard Laptop)**

- [ ] All elements from 1920x1080 still visible
- [ ] Grid adjusts gracefully (might be 5 columns)
- [ ] No text cutoff
- [ ] Buttons/inputs not too cramped

---

#### **1280x720 (HD Desktop)**

- [ ] Layout remains functional
- [ ] Sidebar width appropriate
- [ ] Music player controls accessible
- [ ] Modal dialogs fit viewport

---

### Tablet Resolutions

#### **768x1024 (iPad Portrait)**

**Layout:**

- [ ] Song grid: 3-4 columns (check CSS breakpoint)
- [ ] Sidebar visible OR collapses to hamburger menu
- [ ] Touch targets min 44x44px
- [ ] Forms use full width effectively

**Navigation:**

- [ ] All sidebar links accessible
- [ ] Bottom nav (if implemented) displays
- [ ] Modal dialogs centered and sized appropriately

**Music Player:**

- [ ] All controls visible and tappable
- [ ] Seek bar functional with touch
- [ ] Volume controls accessible

---

#### **1024x768 (iPad Landscape)**

- [ ] Grid expands to 4-5 columns
- [ ] Sidebar returns (if hidden in portrait)
- [ ] Player controls spread out more
- [ ] Charts render larger

---

### Mobile Resolutions

#### **390x844 (iPhone 12/13)**

**Homepage:**

- [ ] Song grid: 2 columns
- [ ] Sidebar hidden, replaced with bottom nav or hamburger
- [ ] Header fits without horizontal scroll
- [ ] Search bar accessible (might be icon → expand)
- [ ] Trending section title readable

**Library:**

- [ ] 2-column grid
- [ ] Search bar functional
- [ ] Songs have proper spacing
- [ ] Scroll smooth (no jank)

**Login/Signup:**

- [ ] Forms fit viewport
- [ ] Inputs large enough to tap
- [ ] Password visibility toggle works
- [ ] Keyboard doesn't hide submit button (viewport adjusts)
- [ ] Social login buttons (Google) sized correctly

**Music Player:**

- [ ] Fixed at bottom
- [ ] All controls visible:
  - [ ] Play/Pause
  - [ ] Next/Previous
  - [ ] Seek bar
  - [ ] Current time / Total time
  - [ ] Volume (might be hidden in favor of device volume)
  - [ ] Shuffle/Repeat icons
- [ ] Tappable targets (min 44x44px)
- [ ] Doesn't block content

**Admin Upload (Mobile):**

- [ ] Form inputs stack vertically
- [ ] File upload button large enough
- [ ] YouTube URL input expandable
- [ ] Category dropdown accessible

---

#### **375x812 (iPhone X/XS)**

- [ ] Similar to iPhone 12, verify:
- [ ] Notch doesn't hide content
- [ ] Safe area insets respected
- [ ] Bottom nav above home indicator

---

#### **360x740 (Galaxy S8+)**

- [ ] Everything fits (slightly narrower than iPhone)
- [ ] Text doesn't overflow
- [ ] Grid still 2 columns
- [ ] Player controls not overcrowded

---

#### **414x896 (iPhone 11/XR)**

- [ ] Larger screen, more breathing room
- [ ] Verify grid doesn't go to 3 columns (should stay at 2)
- [ ] Album art larger but not disproportionate

---

### Landscape Mode (Mobile)

#### **844x390 (iPhone 12 Landscape)**

- [ ] Layout adapts:
  - [ ] Grid might expand to 4 columns
  - [ ] Or content spreads horizontally
- [ ] Navigation accessible
- [ ] Player doesn't take too much vertical space
- [ ] Modals adjust

---

### Breakpoint Testing

**Test CSS Media Queries:**

Open DevTools → Responsive mode → Drag to resize

**Critical Breakpoints:**

1. **480px** - Mobile portrait
2. **768px** - Tablet portrait / large mobile
3. **1024px** - Tablet landscape / small desktop
4. **1280px** - Desktop

**At each breakpoint, verify:**

- [ ] Grid columns change at boundary
- [ ] Navigation switches (sidebar ↔ bottom nav)
- [ ] Typography scales (font sizes adjust)
- [ ] Spacing adjusts (padding/margin)
- [ ] Hidden elements appear/disappear smoothly

---

### Touch & Interaction Testing

**On Real Devices or Simulators:**

**Touch Targets:**

- [ ] All buttons min 44x44px (iOS guideline) or 48x48dp (Android)
- [ ] Spacing between targets (avoid mis-taps)

**Gestures:**

- [ ] Pinch-to-zoom disabled (or intentional)
- [ ] Scroll is smooth (no janky animations)
- [ ] Swipe gestures (if implemented) work
- [ ] Pull-to-refresh (if implemented)

**Keyboard:**

- [ ] Virtual keyboard doesn't hide input fields
- [ ] Input focused brings up correct keyboard type:
  - Email → email keyboard
  - Password → password keyboard (hide text)
  - Number → numeric keyboard
- [ ] Submit on Enter key works

**Hover States:**

- [ ] On desktop: hover effects work
- [ ] On mobile: no "sticky" hover (tap shows, tap away hides)

---

### Performance on Mobile

**Lighthouse Mobile Test:**

```bash
# In Chrome DevTools → Lighthouse → Mobile
```

- [ ] Performance score > 80
- [ ] Large Contentful Paint < 3.5s
- [ ] Total Blocking Time < 400ms

**Network Throttling:**

- [ ] Test on "Slow 3G" (DevTools)
- [ ] Images load progressively
- [ ] Placeholders shown while loading
- [ ] No broken layout before assets load

---

## Part 2: Security Testing

### Authentication Security

#### **Password Security**

**Test Cases:**

- [ ] Minimum password length enforced (8+ characters)
- [ ] Password strength indicator (if implemented)
- [ ] Passwords hashed (not stored plaintext) - verify in database
- [ ] Password reset requires email verification
- [ ] Old passwords invalidated after reset

**Brute Force Protection:**

- [ ] Rate limiting on login endpoint (max 5 attempts/minute)
- [ ] Account lockout after X failed attempts (if implemented)
- [ ] CAPTCHA after multiple failures (if implemented)

---

#### **Session Management**

**Token Security:**

- [ ] JWT tokens stored securely (httpOnly cookie OR sessionStorage)
- [ ] Tokens expire appropriately (15-60 min recommended)
- [ ] Refresh tokens implemented (if using short-lived tokens)
- [ ] Logout invalidates tokens (backend blacklist OR token versioning)

**Session Hijacking Prevention:**

- [ ] Tokens not exposed in URL
- [ ] No token leakage in console.log (check production build)
- [ ] HTTPS enforced (no mixed content)

---

### Authorization Checks

**Role-Based Access:**

- [ ] Non-admin users cannot access /admin routes
- [ ] API endpoints check user role (backend validation)
- [ ] Frontend hides admin features, but backend enforces permissions

**Test with Postman:**

```javascript
// Try deleting a song without admin token
DELETE {{baseUrl}}/api/songs/:id
Authorization: Bearer <non-admin-token>

// Expected: 403 Forbidden or 401 Unauthorized
```

**User Data Access:**

- [ ] Users can only see their own play history
- [ ] Users can only modify their own likes
- [ ] No user ID enumeration (can't guess other user IDs)

---

### Input Validation

#### **SQL Injection**

**Test Inputs:**

```
' OR '1'='1
'; DROP TABLE songs; --
1' UNION SELECT * FROM "User"--
```

**Where to test:**

- [ ] Search bar
- [ ] Login email field
- [ ] Song upload metadata (title, artist)
- [ ] Any user-provided text input

**Expected Behavior:**

- No database errors exposed to user
- Input sanitized/escaped
- Prisma ORM prevents SQL injection by default (verify)

**Verify in logs:** No raw SQL with user input

---

#### **Cross-Site Scripting (XSS)**

**Test Inputs:**

```html
<script>
  alert("XSS");
</script>
<img src="x" onerror="alert(1)" />
<iframe src="javascript:alert('XSS')"></iframe>
<svg onload=alert('XSS')>
```

**Where to test:**

- [ ] Song title/artist in upload form
- [ ] Comment feature (if implemented)
- [ ] User profile name
- [ ] Any displayed user input

**Expected Behavior:**

- React escapes output by default
- No `dangerouslySetInnerHTML` without sanitization
- Script tags render as text, not executed

**Verify:**

```javascript
// In browser console, check:
document.querySelector('[data-testid="song-title"]').innerHTML;
// Should be escaped: &lt;script&gt; not <script>
```

---

#### **File Upload Security**

**Test Cases:**

**File Type Validation:**

- [ ] Upload .exe file → Should reject
- [ ] Upload .php file disguised as .mp3 → Should reject
- [ ] Upload .mp3 with .js extension → Should reject
- [ ] Only allow: .mp3, .wav, .m4a, .jpg, .png

**MIME Type Verification:**

```javascript
// Backend should check actual file content, not just extension
const fileType = require("file-type");
const type = await fileType.fromBuffer(buffer);
if (!["audio/mpeg", "audio/wav", "image/jpeg"].includes(type.mime)) {
  throw new Error("Invalid file type");
}
```

**File Size Limits:**

- [ ] Upload 100MB audio file → Should reject (if limit is 50MB)
- [ ] Upload 10MB image → Should reject (if limit is 5MB)
- [ ] Error message shown clearly

**Path Traversal Prevention:**

```
// Test filename
../../etc/passwd.mp3
..\\windows\\system32\\config.mp3
```

- [ ] Backend sanitizes filenames
- [ ] Files saved to designated directory only

**Malware Scanning (if implemented):**

- [ ] Uploaded files scanned before storage
- [ ] Integration with ClamAV or cloud service

---

### CORS & CSP

#### **CORS Testing**

**From DevTools Console:**

```javascript
fetch("https://your-backend.render.com/api/songs", {
  credentials: "include",
})
  .then((r) => r.json())
  .then(console.log);
```

**From Unauthorized Origin:**

```javascript
// Try from https://evil.com
fetch("https://your-backend.render.com/api/songs");
// Expected: CORS error
```

**Verify in Network Tab:**

- [ ] `Access-Control-Allow-Origin` header present
- [ ] Only trusted origins allowed (not `*` with credentials)
- [ ] Preflight requests handled (OPTIONS)

---

#### **Content Security Policy (CSP)**

**Check Headers:**

```bash
curl -I https://your-frontend.vercel.app
```

Look for:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
```

**Recommended CSP for Sangatamizh:**

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://www.gstatic.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
media-src 'self' https://firebasestorage.googleapis.com https://*.supabase.co;
connect-src 'self' https://your-backend.render.com https://firebasestorage.googleapis.com;
font-src 'self' data:;
```

**Test:**

- [ ] External scripts blocked (unless whitelisted)
- [ ] Inline event handlers blocked (onclick="...")
- [ ] Browser console shows CSP violations (if any)

---

### Secrets Management

**Checklist:**

- [ ] `.env` file in `.gitignore`
- [ ] No API keys in frontend bundle (check with: `cat dist/assets/*.js | grep "API_KEY"`)
- [ ] Firebase config uses public keys only (API keys are restricted by domain)
- [ ] Backend environment variables set on hosting platform (Render/Railway)
- [ ] No hardcoded passwords in code
- [ ] Database URL not exposed

**Test:**

```bash
# Check if .env is committed
git log --all --full-history -- "**/env"

# Should return empty (no .env files in history)
```

---

### HTTPS & Encryption

**Enforce HTTPS:**

- [ ] Production site redirects HTTP → HTTPS
- [ ] HSTS header set: `Strict-Transport-Security: max-age=31536000`
- [ ] No mixed content warnings (all resources load over HTTPS)

**Test Mixed Content:**

```javascript
// In browser console on HTTPS site
fetch("http://insecure-api.com/data");
// Should be blocked by browser
```

**Verify in DevTools:**

- [ ] Security tab shows "Secure" (lock icon)
- [ ] Certificate valid and not expired

---

### Race Conditions & Data Integrity

**Concurrent Requests:**

```javascript
// Rapidly like/unlike a song
for (let i = 0; i < 10; i++) {
  fetch('/api/likes/toggle', { method: 'POST', body: ... });
}
```

- [ ] Final state is consistent (not duplicate likes)
- [ ] Database constraints prevent duplicates

**Idempotency:**

- [ ] Duplicate POST requests don't create duplicate records
- [ ] Use unique constraints or transaction locking

---

### Error Handling

**Security Through Obscurity:**

- [ ] Error messages don't expose stack traces in production
- [ ] No database schema revealed in errors
- [ ] Generic error messages to user ("Something went wrong")
- [ ] Detailed errors logged server-side only

**Test:**

```javascript
// Trigger database error (wrong field type)
POST /api/upload-from-yt
{ "title": 123 } // Should be string

// Response should NOT show:
// "PrismaError: Invalid type for field 'title'"

// Should show:
// "Failed to upload song" or similar
```

---

## Cross-Browser Testing

### Browsers to Test

**Desktop:**

- [ ] Chrome (v120+)
- [ ] Firefox (v120+)
- [ ] Edge (v120+)
- [ ] Safari (macOS) (v16+)

**Mobile:**

- [ ] Chrome (Android)
- [ ] Samsung Internet
- [ ] Safari (iOS)

---

### Known Browser Differences

**iOS Safari:**

- [ ] Autoplay restrictions: Requires user interaction to play audio
- [ ] Volume control limitations: Device volume used, programmatic volume changes ignored
- [ ] Date input quirks (use native picker)

**Test:**

```javascript
// On iOS, this will fail without user tap:
audioElement.play();
// Workaround: Play only after user interaction (button click)
```

**Android WebView:**

- [ ] Audio format support (ensure .mp3 compatibility)
- [ ] File upload from camera/gallery works
- [ ] Fullscreen video (if applicable)

**Safari (Desktop):**

- [ ] Flexbox/Grid compatibility (modern Safari is fine, but test)
- [ ] Fetch API with credentials
- [ ] Service Workers (if using)

**Firefox:**

- [ ] CSS custom properties (variables) work
- [ ] Audio playback same as Chrome
- [ ] No layout shifts

---

### Testing Checklist (Per Browser)

- [ ] **Layout:** No broken CSS, grid works
- [ ] **Playback:** Audio plays without errors
- [ ] **Interactivity:** All buttons/links functional
- [ ] **Forms:** Submit works, validation triggers
- [ ] **Console:** No JavaScript errors
- [ ] **Network:** API calls succeed
- [ ] **Responsiveness:** Mobile view works

---

## Accessibility Audit

### Automated Tools

```bash
# Install axe DevTools extension (Chrome/Firefox)
# Or use Lighthouse Accessibility audit
```

**Run:**

- [ ] Lighthouse Accessibility score > 95
- [ ] Fix all critical issues
- [ ] Review warnings

---

### Manual Checks

**Keyboard Navigation:**

- [ ] Tab through all interactive elements
- [ ] Tab order is logical (top→bottom, left→right)
- [ ] Focus indicator visible (outline or custom style)
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals

**Screen Reader:**

```bash
# Windows: NVDA (free)
# macOS: VoiceOver (built-in, Cmd+F5)
# Linux: Orca
```

- [ ] All images have alt text
- [ ] Buttons have descriptive labels (not just icons)
- [ ] Form inputs have labels
- [ ] Page structure makes sense (headings hierarchy)

**ARIA Attributes:**

- [ ] `role="button"` on custom buttons
- [ ] `aria-label` on icon buttons
- [ ] `aria-live="polite"` on player status updates
- [ ] `aria-modal="true"` on dialogs

**Color Contrast:**

```bash
# Use Contrast Checker extension
# Or: https://webaim.org/resources/contrastchecker/
```

- [ ] Text contrast ≥ 4.5:1 (WCAG AA)
- [ ] Large text ≥ 3:1
- [ ] Interactive elements distinguishable (not color-only)

---

## Performance Testing

### Lighthouse Scores

**Target Metrics:**

- [ ] Performance: > 90
- [ ] Accessibility: > 95
- [ ] Best Practices: > 90
- [ ] SEO: > 90

**Run Lighthouse:**

```
Chrome DevTools → Lighthouse → Generate Report
```

**Fix Common Issues:**

- Compress images (WebP format)
- Lazy load below-fold content
- Code splitting (React.lazy if needed)
- Minimize bundle size (check with `npm run build`)

---

### Load Testing

**Tool: Apache Bench (ab)**

```bash
# 100 requests, 10 concurrent
ab -n 100 -c 10 https://your-backend.render.com/api/songs

# Check:
# - Requests per second
# - 95th percentile response time < 500ms
# - 0% failed requests
```

**Tool: k6 (more advanced)**

```javascript
// load-test.js
import http from "k6/http";
import { check } from "k6";

export let options = {
  stages: [
    { duration: "30s", target: 20 }, // Ramp up to 20 users
    { duration: "1m", target: 50 }, // Stay at 50 users
    { duration: "30s", target: 0 }, // Ramp down
  ],
};

export default function () {
  let res = http.get("https://your-backend.render.com/api/songs");
  check(res, { "status is 200": (r) => r.status === 200 });
}
```

Run:

```bash
k6 run load-test.js
```

---

## Regression Testing Checklist

**Before Every Deploy:**

1. **Smoke Tests (5 min):**

   - [ ] Homepage loads
   - [ ] Login works
   - [ ] Play a song
   - [ ] Admin panel accessible

2. **Critical Paths (15 min):**

   - [ ] User signup → login → play song → like → logout
   - [ ] Admin login → upload song (YouTube) → verify in library → delete
   - [ ] Search → results → play

3. **Visual Regression (if automated):**
   - [ ] Screenshot comparison (Percy.io, Chromatic, or Playwright screenshots)

**Weekly/Monthly:**

- [ ] Full test suite (all E2E tests)
- [ ] Performance audit
- [ ] Security scan (OWASP ZAP or similar)
- [ ] Database health check

---

## Documentation

**Maintain Test Results:**

- Create a spreadsheet or use a tool like TestRail
- Track: Test name, Status (Pass/Fail), Date, Tester, Notes
- Log bugs in issue tracker (GitHub Issues, Jira)

**Bug Report Template:**

```markdown
**Title:** [Short description]
**Severity:** Critical / High / Medium / Low
**Component:** Frontend / Backend / Database
**Browser/Device:** Chrome 120 / iPhone 12 iOS 17
**Steps to Reproduce:**

1. Go to /library
2. Click on first song
3. Observe error

**Expected:** Song should play
**Actual:** Error: "Cannot read property 'url' of undefined"
**Screenshot:** [attach]
**Logs:** [console errors]
```

---

**Testing Coordinator:** [Your Name]  
**Last Updated:** 2025-12-12  
**Version:** 1.0
