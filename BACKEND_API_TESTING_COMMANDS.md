# Backend API Testing - Executable Commands

**Backend URL:** Replace `https://your-backend.render.com` with your actual backend

---

## Quick Setup

```bash
# Set environment variable
export API_BASE="https://your-backend.render.com"
export TEST_TOKEN="your-jwt-token-here"
export ADMIN_TOKEN="admin-jwt-token-here"
```

---

## 1. Health & Connectivity

### Health Check

```bash
curl -i $API_BASE/

# Expected: 200 OK
# Body: "Sangatamizh Music Backend v2"
```

### Supabase Connection Test

```bash
curl -i $API_BASE/api/test/supabase

# Expected: 200 OK
```

### Prisma/Postgres Connection Test

```bash
curl -i $API_BASE/api/test/prisma

# Expected: 200 OK
```

---

## 2. Authentication Tests

### Login (Valid Credentials)

```bash
curl -X POST $API_BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPassword123!"
  }'

# Expected: 200 OK
# Response: {"token": "eyJhbGc...", "user": {...}}
# SAVE TOKEN for subsequent requests
```

### Login (Invalid Credentials)

```bash
curl -X POST $API_BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "wrong@example.com",
    "password": "wrongpass"
  }'

# Expected: 401 Unauthorized
# Response: {"error": "Invalid credentials"}
```

### Token Expiry Test

```bash
# Use expired/invalid token
curl -X GET $API_BASE/api/songs \
  -H "Authorization: Bearer invalid_token_12345"

# Expected: 401 Unauthorized
```

---

## 3. Songs API

### Get All Songs

```bash
curl -i $API_BASE/api/songs

# Expected: 200 OK
# Response: [{id, title, artist, cover_url, file_url, ...}, ...]
```

### Get Home Sections

```bash
curl -i "$API_BASE/api/home-sections?userId=test-user-id"

# Expected: 200 OK
# Response: {
#   "trending": [...],
#   "tamil": [...],
#   "malayalam": [...],
#   "recentlyPlayed": [...]
# }
```

### Get Song Stream (Range Request)

```bash
# Test HTTP Range support (206 Partial Content)
curl -I -H "Range: bytes=0-1023" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  "$API_BASE/api/songs/[SONG_ID]/stream"

# Expected: 206 Partial Content
# Headers:
#   Content-Range: bytes 0-1023/[total_size]
#   Content-Length: 1024
#   Accept-Ranges: bytes
```

### Full Stream Request

```bash
curl -i -H "Authorization: Bearer $TEST_TOKEN" \
  "$API_BASE/api/songs/[SONG_ID]/stream"

# Expected: 200 OK
# Content-Type: audio/mpeg
```

---

## 4. YouTube Metadata & Upload

### Get YouTube Metadata

```bash
curl -X POST $API_BASE/api/yt-metadata \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }'

# Expected: 200 OK
# Response: {
#   "title": "Rick Astley - Never Gonna Give You Up",
#   "artist": "Rick Astley",
#   "thumbnail": "https://...",
#   "views": 1000000000
# }
```

### Invalid YouTube URL

```bash
curl -X POST $API_BASE/api/yt-metadata \
  -H "Content-Type: application/json" \
  -d '{"url": "https://notayoutubelink.com"}'

# Expected: 400 Bad Request OR 500 Internal Server Error
# Response: {"error": "Invalid YouTube URL"}
```

### Upload from YouTube

```bash
curl -X POST $API_BASE/api/upload-from-yt \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "Never Gonna Give You Up",
    "artist": "Rick Astley",
    "category": "English",
    "emotion": "Happy",
    "thumbnail": "https://i.ytimg.com/..."
  }'

# Expected: 201 Created
# Response: {
#   "message": "Song uploaded successfully",
#   "song": {id, title, artist, file_url, ...}
# }
```

---

## 5. File Upload (Multipart)

### Upload Audio & Cover

```bash
curl -X POST $API_BASE/api/upload-file \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "audio=@/path/to/song.mp3" \
  -F "cover=@/path/to/cover.jpg" \
  -F "title=Test Song" \
  -F "artist=Test Artist" \
  -F "category=Tamil" \
  -F "emotion=Neutral"

# Expected: 201 Created
# Response: {
#   "message": "File uploaded successfully",
#   "song": {...}
# }
```

### Invalid File Type

```bash
curl -X POST $API_BASE/api/upload-file \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "audio=@/path/to/document.pdf" \
  -F "title=Test" \
  -F "artist=Test"

# Expected: 400 Bad Request
# Response: {"error": "Invalid file type"}
```

### Oversize File (if enforced server-side)

```bash
# Upload file > 50MB
curl -X POST $API_BASE/api/upload-file \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "audio=@/path/to/large.mp3" \
  -F "title=Large Song" \
  -F "artist=Test"

# Expected: 413 Payload Too Large OR 400 Bad Request
# Response: {"error": "File size exceeds limit (50MB)"}
```

---

## 6. Song Management (Admin)

### Delete Song

```bash
curl -X DELETE $API_BASE/api/songs/[SONG_ID] \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 200 OK
# Response: {"message": "Song deleted successfully"}
```

### Delete Non-Existent Song

```bash
curl -X DELETE $API_BASE/api/songs/invalid-uuid-12345 \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 404 Not Found OR 500 Internal Server Error
```

---

## 7. Likes API

### Toggle Like

```bash
curl -X POST $API_BASE/api/likes/toggle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{
    "userId": "user-uuid",
    "songId": "song-uuid"
  }'

# Expected: 200 OK
# Response: {"liked": true}

# Call again:
# Response: {"liked": false}
```

### Get Liked Song IDs

```bash
curl -i "$API_BASE/api/likes/ids?userId=user-uuid" \
  -H "Authorization: Bearer $TEST_TOKEN"

# Expected: 200 OK
# Response: ["song-id-1", "song-id-2", ...]
```

### Get Liked Songs (Full Objects)

```bash
curl -i "$API_BASE/api/likes/list?userId=user-uuid" \
  -H "Authorization: Bearer $TEST_TOKEN"

# Expected: 200 OK
# Response: [{id, title, artist, ...}, ...]
```

---

## 8. Play History

### Log Play Event

```bash
curl -X POST $API_BASE/api/log-play \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{
    "userId": "user-uuid",
    "songId": "song-uuid"
  }'

# Expected: 200 OK
```

---

## 9. Analytics API (Admin)

### Log Login Event

```bash
curl -X POST $API_BASE/api/analytics/login \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "email": "testuser@example.com"
  }'

# Expected: 200 OK
```

### Get Analytics Stats

```bash
curl -i $API_BASE/api/analytics/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 200 OK
# Response: {
#   "totalSongs": 150,
#   "totalLogins": 1000,
#   "activeUsers24h": 50,
#   "loginTrends": [
#     {"date": "2025-12-06", "count": 10},
#     {"date": "2025-12-07", "count": 15}
#   ]
# }
```

---

## 10. Search & Pagination

### Search Songs

```bash
curl -i "$API_BASE/api/search?q=love&page=1&limit=20" \
  -H "Authorization: Bearer $TEST_TOKEN"

# Expected: 200 OK
# Response: {
#   "results": [...],
#   "pagination": {
#     "page": 1,
#     "limit": 20,
#     "total": 150,
#     "totalPages": 8
#   }
# }
```

### Search Page 2

```bash
curl -i "$API_BASE/api/search?q=love&page=2&limit=20"

# Expected: 200 OK
# Verify pagination metadata consistent with page 1
```

---

## 11. Error & Edge Cases

### Missing Required Fields

```bash
curl -X POST $API_BASE/api/upload-from-yt \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"url": "https://youtube.com/watch?v=abc"}'

# Expected: 400 Bad Request
# Response: {"error": "Missing required fields: title, artist"}
```

### Invalid JSON

```bash
curl -X POST $API_BASE/api/yt-metadata \
  -H "Content-Type: application/json" \
  -d '{invalid json'

# Expected: 400 Bad Request
# Response: {"error": "Invalid JSON"}
```

### Large Payload

```bash
# Send extremely large JSON (>10MB if you have limit)
curl -X POST $API_BASE/api/upload-from-yt \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "$(printf '{"title":"%10000000s"}' '')"

# Expected: 413 Payload Too Large OR timeout
```

---

## 12. Security Tests

### SQL Injection Attempt

```bash
curl -X POST $API_BASE/api/log-play \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "' OR '\''1'\''='\''1",
    "songId": "'; DROP TABLE songs; --"
  }'

# Expected: 400 Bad Request OR handled gracefully
# MUST NOT: Execute SQL or expose error
# Prisma ORM should prevent this automatically
```

### XSS in Upload

```bash
curl -X POST $API_BASE/api/upload-from-yt \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "url": "https://youtube.com/watch?v=abc",
    "title": "<script>alert(\"XSS\")</script>",
    "artist": "<img src=x onerror=alert(1)>",
    "category": "Tamil",
    "emotion": "Neutral"
  }'

# Expected: 201 Created (accepts input)
# BUT: Frontend MUST escape output
# Verify in browser: script tags render as text, not executed
```

### Path Traversal (File Upload)

```bash
curl -X POST $API_BASE/api/upload-file \
  -F "audio=@../../etc/passwd" \
  -F "title=Hack" \
  -F "artist=Hacker"

# Expected: 400 Bad Request (invalid file type)
# Backend MUST sanitize filenames before storage
```

---

## 13. Rate Limiting (if implemented)

### Rapid Requests

```bash
# Send 100 requests in quick succession
for i in {1..100}; do
  curl -s $API_BASE/api/songs > /dev/null &
done
wait

# Expected (if rate limit exists):
# Some requests return 429 Too Many Requests
# Response: {"error": "Rate limit exceeded"}
```

---

## 14. CORS Testing

### From Unauthorized Origin

```bash
# Simulate request from evil.com
curl -X GET $API_BASE/api/songs \
  -H "Origin: https://evil.com" \
  -i

# Expected: 200 OK (GET allowed)
# BUT: Check Access-Control-Allow-Origin header
# Should NOT be: Access-Control-Allow-Origin: *
# Should be: Access-Control-Allow-Origin: https://sangatamizh-music-premium.vercel.app
```

### Preflight Request

```bash
curl -X OPTIONS $API_BASE/api/upload-from-yt \
  -H "Origin: https://sangatamizh-music-premium.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -i

# Expected: 200 OK or 204 No Content
# Headers:
#   Access-Control-Allow-Origin: https://sangatamizh-music-premium.vercel.app
#   Access-Control-Allow-Methods: GET,POST,DELETE
#   Access-Control-Allow-Headers: Content-Type,Authorization
```

---

## 15. Performance Testing

### Load Test with Apache Bench

```bash
# 100 requests, 10 concurrent
ab -n 100 -c 10 $API_BASE/api/songs

# Check metrics:
# - Requests per second: > 50 (target)
# - Time per request: < 200ms (mean)
# - Failed requests: 0
```

### Load Test with k6 (install: https://k6.io)

```javascript
// save as load-test.js
import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
  stages: [
    { duration: "30s", target: 20 }, // Ramp to 20 users
    { duration: "1m", target: 50 }, // Hold 50 users
    { duration: "30s", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% requests < 500ms
  },
};

export default function () {
  let response = http.get("https://your-backend.render.com/api/songs");
  check(response, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

Run:

```bash
k6 run load-test.js
```

---

## 16. Streaming Performance

### Simulate Concurrent Streaming

```bash
# Stream 10 songs simultaneously
for i in {1..10}; do
  curl -H "Range: bytes=0-1000000" \
    -H "Authorization: Bearer $TEST_TOKEN" \
    "$API_BASE/api/songs/song-$i/stream" \
    -o /dev/null &
done
wait

# Monitor server:
# - CPU usage < 80%
# - Memory stable
# - No crashed processes
# - Response time consistent
```

---

## Test Execution Log

```bash
# Date: ____________
# Tester: ____________
# Backend: ____________

# Results:
✓ Health check: PASS
✓ Auth valid: PASS
✗ Auth invalid: Expected 401, got 200 (BUG #123)
✓ Get songs: PASS
✓ Stream range: PASS
...
```

---

## Quick Shell Script for Smoke Tests

Save as `api-smoke-test.sh`:

```bash
#!/bin/bash
API_BASE="https://your-backend.render.com"

echo "=== API Smoke Tests ==="

# Health
echo -n "Health check: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_BASE/)
[ "$STATUS" = "200" ] && echo "✓ PASS" || echo "✗ FAIL ($STATUS)"

# Get songs
echo -n "Get songs: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_BASE/api/songs)
[ "$STATUS" = "200" ] && echo "✓ PASS" || echo "✗ FAIL ($STATUS)"

# Supabase test
echo -n "Supabase connection: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_BASE/api/test/supabase)
[ "$STATUS" = "200" ] && echo "✓ PASS" || echo "✗ FAIL ($STATUS)"

# Prisma test
echo -n "Prisma connection: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_BASE/api/test/prisma)
[ "$STATUS" = "200" ] && echo "✓ PASS" || echo "✗ FAIL ($STATUS)"

echo "=== Tests Complete ==="
```

Run:

```bash
chmod +x api-smoke-test.sh
./api-smoke-test.sh
```

---

**Last Updated:** 2025-12-12
