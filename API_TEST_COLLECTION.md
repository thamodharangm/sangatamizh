# API Test Collection for Postman/Newman

## Environment Variables

```json
{
  "baseUrl": "https://your-backend.render.com",
  "localUrl": "http://localhost:3000",
  "testUserId": "test-user-uuid",
  "testSongId": "test-song-uuid"
}
```

## Test Collection

### 1. Health Check

```http
GET {{baseUrl}}/
```

**Expected Response:**

```
Status: 200 OK
Body: "Sangatamizh Music Backend v2"
```

**Tests:**

```javascript
pm.test("Status code is 200", () => {
  pm.response.to.have.status(200);
});
```

---

### 2. Get All Songs

```http
GET {{baseUrl}}/api/songs
```

**Expected Response:**

```json
[
  {
    "id": "uuid",
    "title": "string",
    "artist": "string",
    "category": "string",
    "emotion": "string",
    "cover_url": "string",
    "file_url": "string",
    "source_url": "string | null",
    "created_at": "datetime",
    "youtube_views": "number | null"
  }
]
```

**Tests:**

```javascript
pm.test("Status code is 200", () => {
  pm.response.to.have.status(200);
});

pm.test("Response is an array", () => {
  pm.expect(pm.response.json()).to.be.an("array");
});

pm.test("Songs have required fields", () => {
  const songs = pm.response.json();
  if (songs.length > 0) {
    const song = songs[0];
    pm.expect(song).to.have.property("id");
    pm.expect(song).to.have.property("title");
    pm.expect(song).to.have.property("artist");
    pm.expect(song).to.have.property("file_url");
  }
});

// Save first song ID for later tests
const songs = pm.response.json();
if (songs.length > 0) {
  pm.environment.set("testSongId", songs[0].id);
}
```

---

### 3. Get Home Sections

```http
GET {{baseUrl}}/api/home-sections?userId={{testUserId}}
```

**Expected Response:**

```json
{
  "trending": [],
  "tamil": [],
  "malayalam": [],
  "recentlyPlayed": []
}
```

**Tests:**

```javascript
pm.test("Status code is 200", () => {
  pm.response.to.have.status(200);
});

pm.test("Response has all sections", () => {
  const response = pm.response.json();
  pm.expect(response).to.have.property("trending");
  pm.expect(response).to.have.property("tamil");
  pm.expect(response).to.have.property("malayalam");
  pm.expect(response).to.have.property("recentlyPlayed");
});

pm.test("All sections are arrays", () => {
  const response = pm.response.json();
  pm.expect(response.trending).to.be.an("array");
  pm.expect(response.tamil).to.be.an("array");
  pm.expect(response.malayalam).to.be.an("array");
  pm.expect(response.recentlyPlayed).to.be.an("array");
});
```

---

### 4. Get YouTube Metadata

```http
POST {{baseUrl}}/api/yt-metadata
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Expected Response:**

```json
{
  "title": "Rick Astley - Never Gonna Give You Up",
  "artist": "Rick Astley",
  "thumbnail": "https://...",
  "views": 1000000000
}
```

**Tests:**

```javascript
pm.test("Status code is 200", () => {
  pm.response.to.have.status(200);
});

pm.test("Metadata has required fields", () => {
  const metadata = pm.response.json();
  pm.expect(metadata).to.have.property("title");
  pm.expect(metadata).to.have.property("artist");
  pm.expect(metadata).to.have.property("thumbnail");
});

pm.test("Title is non-empty", () => {
  const metadata = pm.response.json();
  pm.expect(metadata.title).to.be.a("string").and.not.empty;
});
```

---

### 5. Log Play Event

```http
POST {{baseUrl}}/api/log-play
Content-Type: application/json

{
  "userId": "{{testUserId}}",
  "songId": "{{testSongId}}"
}
```

**Expected Response:**

```
Status: 200 OK
```

**Tests:**

```javascript
pm.test("Status code is 200", () => {
  pm.response.to.have.status(200);
});
```

---

### 6. Toggle Like

```http
POST {{baseUrl}}/api/likes/toggle
Content-Type: application/json

{
  "userId": "{{testUserId}}",
  "songId": "{{testSongId}}"
}
```

**Expected Response:**

```json
{
  "liked": true
}
```

**Tests:**

```javascript
pm.test("Status code is 200", () => {
  pm.response.to.have.status(200);
});

pm.test("Response has liked status", () => {
  const response = pm.response.json();
  pm.expect(response).to.have.property("liked");
  pm.expect(response.liked).to.be.a("boolean");
});
```

---

### 7. Get Liked Song IDs

```http
GET {{baseUrl}}/api/likes/ids?userId={{testUserId}}
```

**Expected Response:**

```json
["songId1", "songId2", "songId3"]
```

**Tests:**

```javascript
pm.test("Status code is 200", () => {
  pm.response.to.have.status(200);
});

pm.test("Response is an array", () => {
  pm.expect(pm.response.json()).to.be.an("array");
});

pm.test("Array contains UUIDs", () => {
  const ids = pm.response.json();
  if (ids.length > 0) {
    pm.expect(ids[0]).to.be.a("string");
  }
});
```

---

### 8. Get Liked Songs (Full Objects)

```http
GET {{baseUrl}}/api/likes/list?userId={{testUserId}}
```

**Expected Response:**

```json
[
  {
    "id": "uuid",
    "title": "string",
    "artist": "string",
    ...
  }
]
```

**Tests:**

```javascript
pm.test("Status code is 200", () => {
  pm.response.to.have.status(200);
});

pm.test("Response is an array of songs", () => {
  const songs = pm.response.json();
  pm.expect(songs).to.be.an("array");
  if (songs.length > 0) {
    pm.expect(songs[0]).to.have.property("title");
  }
});
```

---

### 9. Log Login Event

```http
POST {{baseUrl}}/api/analytics/login
Content-Type: application/json

{
  "userId": "{{testUserId}}",
  "email": "test@example.com"
}
```

**Expected Response:**

```
Status: 200 OK
```

**Tests:**

```javascript
pm.test("Status code is 200", () => {
  pm.response.to.have.status(200);
});
```

---

### 10. Get Analytics Stats

```http
GET {{baseUrl}}/api/analytics/stats
```

**Expected Response:**

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

**Tests:**

```javascript
pm.test("Status code is 200", () => {
  pm.response.to.have.status(200);
});

pm.test("Response has all metrics", () => {
  const stats = pm.response.json();
  pm.expect(stats).to.have.property("totalSongs");
  pm.expect(stats).to.have.property("totalLogins");
  pm.expect(stats).to.have.property("activeUsers24h");
  pm.expect(stats).to.have.property("loginTrends");
});

pm.test("Metrics are numbers", () => {
  const stats = pm.response.json();
  pm.expect(stats.totalSongs).to.be.a("number");
  pm.expect(stats.totalLogins).to.be.a("number");
  pm.expect(stats.activeUsers24h).to.be.a("number");
});

pm.test("Login trends is an array", () => {
  const stats = pm.response.json();
  pm.expect(stats.loginTrends).to.be.an("array");
});
```

---

### 11. Test Supabase Connection

```http
GET {{baseUrl}}/api/test/supabase
```

**Expected Response:**

```
Status: 200 OK
```

**Tests:**

```javascript
pm.test("Supabase connection works", () => {
  pm.response.to.have.status(200);
});
```

---

### 12. Test Prisma Connection

```http
GET {{baseUrl}}/api/test/prisma
```

**Expected Response:**

```
Status: 200 OK
```

**Tests:**

```javascript
pm.test("Prisma connection works", () => {
  pm.response.to.have.status(200);
});
```

---

### 13. Delete Song (Admin Only)

```http
DELETE {{baseUrl}}/api/songs/{{testSongId}}
```

**Expected Response:**

```json
{
  "message": "Song deleted successfully"
}
```

**Tests:**

```javascript
pm.test("Status code is 200", () => {
  pm.response.to.have.status(200);
});

pm.test("Deletion confirmed", () => {
  const response = pm.response.json();
  pm.expect(response.message).to.include("deleted");
});
```

---

## Performance Tests

### Load Test Configuration (Artillery)

```yaml
# artillery-load-test.yml
config:
  target: "https://your-backend.render.com"
  phases:
    - duration: 60
      arrivalRate: 10 # 10 users per second
      name: "Warm up"
    - duration: 120
      arrivalRate: 50 # 50 users per second
      name: "Sustained load"

scenarios:
  - name: "Get songs and play"
    flow:
      - get:
          url: "/api/songs"
          capture:
            - json: "$[0].id"
              as: "songId"
      - post:
          url: "/api/log-play"
          json:
            userId: "test-user-123"
            songId: "{{ songId }}"
```

**Run with:**

```bash
artillery run artillery-load-test.yml
```

---

## Error Case Tests

### Invalid YouTube URL

```http
POST {{baseUrl}}/api/yt-metadata
Content-Type: application/json

{
  "url": "invalid-url"
}
```

**Expected:** `400 Bad Request` or `500 Internal Server Error`

---

### Nonexistent Song Delete

```http
DELETE {{baseUrl}}/api/songs/nonexistent-uuid-12345
```

**Expected:** `404 Not Found` or `500 Internal Server Error`

---

### Missing Required Fields (Upload)

```http
POST {{baseUrl}}/api/upload-from-yt
Content-Type: application/json

{
  "url": "https://youtube.com/watch?v=abc123"
}
```

**Expected:** `400 Bad Request` (missing title, artist, etc.)

---

## Rate Limiting Tests (If Implemented)

Send 100 rapid requests to same endpoint:

```javascript
// Postman Collection Runner or code
for (let i = 0; i < 100; i++) {
  pm.sendRequest(pm.environment.get("baseUrl") + "/api/songs");
}
```

**Expected:** Some requests receive `429 Too Many Requests` after threshold

---

## Security Tests

### SQL Injection Attempts

```http
POST {{baseUrl}}/api/log-play
Content-Type: application/json

{
  "userId": "' OR '1'='1",
  "songId": "'; DROP TABLE songs; --"
}
```

**Expected:** Request safely handled, no SQL execution

### XSS in Metadata

```http
POST {{baseUrl}}/api/upload-from-yt
Content-Type: application/json

{
  "title": "<script>alert('XSS')</script>",
  "artist": "<img src=x onerror=alert(1)>",
  ...
}
```

**Expected:** Data sanitized, script not executed when displayed

---

## CI/CD Integration

### Newman Command (for GitHub Actions)

```bash
newman run API_TEST_COLLECTION.json -e production.json --reporters cli,json
```

### GitHub Actions Workflow

```yaml
name: API Tests
on: [push, pull_request]
jobs:
  api-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Newman
        run: npm install -g newman
      - name: Run API Tests
        run: newman run API_TEST_COLLECTION.json -e production.json
```

---

**Last Updated:** 2025-12-12
