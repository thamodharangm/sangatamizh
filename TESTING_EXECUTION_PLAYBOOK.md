# Testing Execution Playbook - START HERE

**Sangatamizh Music Premium** - Complete step-by-step testing guide

---

## 📋 Documentation Overview

You now have **4 core testing documents** + this playbook:

| Document                            | Purpose                           | When to Use          |
| ----------------------------------- | --------------------------------- | -------------------- |
| **FRONTEND_TESTING_CHECKLIST.md**   | Manual UI testing all viewports   | Before every release |
| **BACKEND_API_TESTING_COMMANDS.md** | Executable curl commands for APIs | Weekly + CI/CD       |
| **DATABASE_TESTING_QUERIES.md**     | SQL validation queries            | Weekly health check  |
| **BUG_REPORT_TEMPLATE.md**          | Standardized bug reporting        | When issues found    |
| **THIS FILE**                       | Execution workflow                | How to run tests     |

---

## 🚀 Quick Start (5-Minute Smoke Test)

Run this before every deployment:

### 1. Frontend Smoke Test (2 min)

```
✓ Open: https://sangatamizh-music-premium.vercel.app
✓ Homepage loads with trending songs
✓ Click Login → Enter credentials → Home page
✓ Click first song → Player appears → Audio plays
✓ Open DevTools → No console errors
```

### 2. Backend Smoke Test (2 min)

```bash
# Set your backend URL
export API_BASE="https://your-backend.render.com"

# Health check
curl -i $API_BASE/
# Expected: 200 OK, "Sangatamizh Music Backend v2"

# Get songs
curl -i $API_BASE/api/songs
# Expected: 200 OK, JSON array of songs

# Supabase test
curl -i $API_BASE/api/test/supabase
# Expected: 200 OK
```

### 3. Database Smoke Test (1 min)

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM songs;"
# Expected: Returns count > 0
```

**If all pass:** ✅ Safe to deploy  
**If any fail:** ❌ Investigate before deploying

---

## 📅 Testing Schedule

### Daily (Automated in CI/CD)

- [ ] Run E2E smoke tests (Playwright)
- [ ] API health checks (curl script)
- [ ] Backend unit tests

### Weekly (Manual - 1 hour)

- [ ] Frontend responsive test (3 viewports minimum)
- [ ] Full API test suite (Postman collection)
- [ ] Database health queries
- [ ] Cross-browser spot check (Chrome + Safari/Firefox)

### Monthly (Comprehensive - 4 hours)

- [ ] Full frontend checklist (all 6 viewports)
- [ ] Complete API test collection
- [ ] Performance testing (Lighthouse + load tests)
- [ ] Security audit
- [ ] Accessibility audit
- [ ] Database cleanup & optimization

---

## 🎯 Test Execution Workflows

### Workflow 1: Pre-Release Testing (30 min)

**Goal:** Verify build is production-ready

#### Step 1: Build & Deploy Preview

```bash
cd client
npm run build
# Check build output for errors
# Deploy to Vercel preview: git push
```

#### Step 2: Frontend Testing (15 min)

**Open:** `FRONTEND_TESTING_CHECKLIST.md`

Test 3 viewports only:

1. **Desktop (1440×900):**

   - [ ] Homepage layout correct
   - [ ] Player controls work
   - [ ] Search functional

2. **Tablet (768×1024):**

   - [ ] Responsive grid (3 columns)
   - [ ] Touch targets adequate

3. **Mobile (375×812):**
   - [ ] 2-column grid
   - [ ] Bottom nav visible
   - [ ] Player controls tappable

#### Step 3: Critical User Flows (10 min)

- [ ] **Flow 1:** Signup → Login → Play song → Like → Logout
- [ ] **Flow 2 (Admin):** Login → Upload (YouTube) → Delete song

####Step 4: API Quick Test (5 min)

```bash
# Run smoke test script (see BACKEND_API_TESTING_COMMANDS.md)
./api-smoke-test.sh
```

**Sign-off:** If all pass, approve deployment ✅

---

### Workflow 2: Full Regression Testing (2 hours)

**Goal:** Comprehensive validation before major release

#### Phase 1: Frontend (60 min)

**Document:** `FRONTEND_TESTING_CHECKLIST.md`

1. **All Viewports (30 min):**

   - Test all 6 viewports: 1440×900, 1366×768, 1024×768, 768×1024, 375×812, 360×800
   - Complete layout & responsiveness section
   - Test player controls on each

2. **Functional Modules (20 min):**

   - Streaming (play/pause/seek)
   - Upload (admin)
   - Search & filter
   - Playlists
   - Favorites

3. **Network States (10 min):**
   - Test offline mode
   - Slow 3G simulation (Chrome DevTools)

#### Phase 2: Backend (30 min)

**Document:** `BACKEND_API_TESTING_COMMANDS.md`

Run all curl commands:

```bash
# Copy all commands from document
# Execute each endpoint test
# Log results in spreadsheet
```

#### Phase 3: Database (20 min)

**Document:** `DATABASE_TESTING_QUERIES.md`

```bash
psql $DATABASE_URL
```

Run queries:

- [ ] Record counts
- [ ] Check for duplicates
- [ ] Orphaned records
- [ ] Performance queries (EXPLAIN ANALYZE)

#### Phase 4: Security (10 min)

Test:

- [ ] SQL injection attempt (see BACKEND doc, section 12)
- [ ] XSS in upload fields
- [ ] File upload validation

**Output:** Testing report with pass/fail for each section

---

### Workflow 3: Performance Testing (1 hour)

**Goal:** Ensure app meets performance benchmarks

#### Frontend Performance (30 min)

**Lighthouse Audit:**

```
1. Open Chrome DevTools
2. Lighthouse tab → Mobile
3. Run audit on:
   - Homepage
   - Library
   - Admin dashboard
```

**Target Scores:**

- [ ] Performance: > 90
- [ ] Accessibility: > 95
- [ ] Best Practices: > 90
- [ ] SEO: > 90

**Key Metrics:**

- [ ] FCP (First Contentful Paint): < 1.5s
- [ ] LCP (Largest Contentful Paint): < 2.5s
- [ ] TTI (Time to Interactive): < 3.5s
- [ ] TBT (Total Blocking Time): < 300ms
- [ ] CLS (Cumulative Layout Shift): < 0.1

#### Backend Performance (30 min)

**Load Test:**

```bash
# Install Apache Bench (if not installed)
# brew install ab (macOS) or apt install apache2-utils (Linux)

# Test: 100 requests, 10 concurrent
ab -n 100 -c 10 https://your-backend.render.com/api/songs

# Targets:
# - Requests per second: > 50
# - Mean time per request: < 200ms
# - Failed requests: 0
```

**Streaming Test:**

```bash
# Concurrent streaming (10 simultaneous)
for i in {1..10}; do
  curl -H "Range: bytes=0-1000000" \
    "$API_BASE/api/songs/[SONG_ID]/stream" \
    -o /dev/null &
done
wait

# Check server metrics (Render dashboard):
# - CPU < 80%
# - Memory stable
# - Response time consistent
```

**Database Performance:**

```sql
-- Run slow query detection (see DATABASE_TESTING_QUERIES.md, section 5)
EXPLAIN ANALYZE SELECT * FROM songs WHERE LOWER(title) LIKE '%love%';
-- Execution time should be < 500ms
```

---

### Workflow 4: Security Audit (1 hour)

**Document:** `BACKEND_API_TESTING_COMMANDS.md` (Section 12)

#### Input Validation (20 min)

- [ ] SQL injection tests on all inputs
- [ ] XSS tests in upload metadata
- [ ] Path traversal in file uploads

#### Authentication & Authorization (20 min)

- [ ] Token expiry handling
- [ ] Invalid token rejection
- [ ] Role-based access (admin vs user)

#### CORS & Headers (10 min)

```bash
# Test CORS
curl -H "Origin: https://evil.com" -i $API_BASE/api/songs
# Should NOT allow evil.com

# Check CSP headers
curl -I https://sangatamizh-music-premium.vercel.app
# Look for Content-Security-Policy header
```

#### Secrets Management (10 min)

```bash
# Verify no .env in Git
git log --all --full-history -- "**/.env"
# Expected: Empty

# Check bundled frontend for secrets
cat client/dist/assets/*.js | grep -i "API_KEY"
# Expected: No sensitive keys exposed
```

---

## 🐛 Bug Reporting Workflow

### When You Find a Bug

1. **Reproduce:** Verify bug is consistent (not one-time glitch)
2. **Document:** Use `BUG_REPORT_TEMPLATE.md`
3. **Severity:** Assign P0/P1/P2/P3 (see template)
4. **Create Issue:** Add to GitHub Issues with labels
5. **Notify:** Alert team if P0/P1

### Bug Priority Response Times

| Priority          | Response      | Fix Timeline |
| ----------------- | ------------- | ------------ |
| **P0** (Critical) | Immediate     | 1-4 hours    |
| **P1** (High)     | Same day      | 24-48 hours  |
| **P2** (Medium)   | 3 days        | 1 week       |
| **P3** (Low)      | When possible | 1 month      |

---

## 📊 Test Result Tracking

### Create Test Log (Spreadsheet or Markdown)

```markdown
## Test Execution Log

**Date:** 2025-12-12  
**Tester:** Your Name  
**Build:** v1.2.3 (commit: abc123)  
**Environment:** Production / Staging

### Frontend Tests

| Test Case       | Desktop | Tablet | Mobile | Status          |
| --------------- | ------- | ------ | ------ | --------------- |
| Homepage layout | ✅      | ✅     | ✅     | PASS            |
| Player controls | ✅      | ✅     | ❌     | FAIL - Bug #156 |
| Search          | ✅      | ✅     | ✅     | PASS            |
| Auth flows      | ✅      | ✅     | ✅     | PASS            |

**Bugs Found:** 1 (P2 - Seek bar on mobile)

### Backend Tests

| Endpoint                 | Status  | Response Time |
| ------------------------ | ------- | ------------- |
| GET /api/songs           | ✅ PASS | 150ms         |
| POST /api/upload-from-yt | ✅ PASS | 2.3s          |
| DELETE /api/songs/:id    | ✅ PASS | 80ms          |

### Database Tests

| Check            | Result                  |
| ---------------- | ----------------------- |
| Record counts    | ✅ All tables populated |
| Duplicates       | ✅ None found           |
| Orphaned records | ✅ None found           |
| Performance      | ✅ All queries < 500ms  |

### Performance

| Metric                 | Target | Actual | Status  |
| ---------------------- | ------ | ------ | ------- |
| Lighthouse Performance | >90    | 92     | ✅ PASS |
| Load Test RPS          | >50    | 68     | ✅ PASS |
| FCP                    | <1.5s  | 1.2s   | ✅ PASS |

### Summary

- **Total Tests:** 45
- **Passed:** 44
- **Failed:** 1
- **Blocked:** 0
- **Critical Issues:** 0
- **High Issues:** 0
- **Medium Issues:** 1

**Recommendation:** ✅ Approve for deployment (non-critical bug logged for next sprint)

**Sign-off:** [Your Name] - 2025-12-12 21:30 IST
```

---

## 🛠️ Testing Tools Setup

### One-Time Setup (30 min)

#### 1. Install Playwright (E2E)

```bash
cd client
npm install -D @playwright/test
npx playwright install
```

#### 2. Install Postman (API)

- Download: https://www.postman.com/downloads/
- Import API tests from `BACKEND_API_TESTING_COMMANDS.md`

#### 3. Set Up Database Access

```bash
# Add to ~/.bashrc or ~/.zshrc
export DATABASE_URL="postgresql://user:pass@host:5432/db"
```

#### 4. Browser Extensions

- [axe DevTools](https://www.deque.com/axe/devtools/) - Accessibility testing
- [Lighthouse](https://chrome.google.com/webstore/detail/lighthouse/) - Performance
- [React DevTools](https://react.dev/learn/react-developer-tools) - Debugging

---

## ✅ Pre-Deployment Checklist

Before pushing to production, verify:

### Code Quality

- [ ] `npm run lint` passes (no errors)
- [ ] `npm run build` succeeds
- [ ] No console.error in production build

### Testing

- [ ] Smoke tests pass (all 3: frontend, backend, database)
- [ ] Critical user flows work
- [ ] No P0/P1 bugs in backlog

### Performance

- [ ] Lighthouse score > 90
- [ ] Load test passes (>50 RPS)

### Security

- [ ] No secrets in code
- [ ] HTTPS enforced
- [ ] CORS configured

### Documentation

- [ ] Changelog updated
- [ ] Breaking changes documented

### Deployment

- [ ] Environment variables set (Vercel, Render)
- [ ] Database migrations applied
- [ ] Backup created

**Final Sign-off:** [Name] - [Date]

---

## 🆘 Troubleshooting

### "Tests are failing, what do I do?"

1. **Identify severity:** Use Bug Report Template
2. **If P0/P1:** Stop deployment, fix immediately
3. **If P2/P3:** Log bug, deploy if non-critical

### "I don't have time for full testing"

**Minimum acceptable:**

- 5-min smoke test (frontend + backend + database)
- Critical user flow (login → play song)
- No console errors

**Full testing when:**

- Major release
- New feature launch
- After significant refactor

### "Where do I report bugs?"

1. Create GitHub Issue using `BUG_REPORT_TEMPLATE.md`
2. Tag with severity labels: `P0`, `P1`, `P2`, `P3`
3. Notify team in chat if P0/P1

---

## 📞 Contacts

- **QA Lead:** [Name]
- **Backend Dev:** [Name]
- **Frontend Dev:** [Name]
- **DevOps:** [Name]

---

**Created:** 2025-12-12  
**Last Updated:** 2025-12-12  
**Version:** 1.0  
**Owner:** Sangatamizh Music Team
