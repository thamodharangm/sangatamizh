# Database Validation & Performance Queries

This document contains SQL queries to validate data integrity, check performance, and identify issues in the Sangatamizh Music database.

## Connection

```bash
# Connect to PostgreSQL database
psql $DATABASE_URL

# Or using Prisma Studio
npx prisma studio
```

---

## 1. Schema Validation

### View All Tables

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected Tables:**

- User
- Song (mapped as "songs")
- PlayHistory
- LoginLog
- Like
- AppSetting

---

### Check Table Structures

```sql
-- User table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'User'
ORDER BY ordinal_position;

-- Songs table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'songs'
ORDER BY ordinal_position;

-- PlayHistory columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'PlayHistory'
ORDER BY ordinal_position;

-- Like table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Like'
ORDER BY ordinal_position;

-- LoginLog columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'LoginLog'
ORDER BY ordinal_position;
```

---

### Check Indexes

```sql
-- All indexes in database
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Specifically for PlayHistory (should have index on userId)
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'PlayHistory';
```

**Expected Indexes:**

- Primary key indexes on all tables
- Index on `PlayHistory.userId`
- Unique index on `User.email`
- Unique index on `Like(userId, songId)`

---

### Check Foreign Keys

```sql
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON rc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
```

**Expected Foreign Keys:**

- PlayHistory.userId → User.id
- PlayHistory.songId → songs.id (ON DELETE CASCADE)
- Like.userId → User.id
- Like.songId → songs.id (ON DELETE CASCADE)

---

## 2. Data Quality Checks

### Count All Records

```sql
SELECT
  (SELECT COUNT(*) FROM "User") AS total_users,
  (SELECT COUNT(*) FROM songs) AS total_songs,
  (SELECT COUNT(*) FROM "PlayHistory") AS total_plays,
  (SELECT COUNT(*) FROM "Like") AS total_likes,
  (SELECT COUNT(*) FROM "LoginLog") AS total_logins;
```

---

### Check for Duplicate Emails

```sql
SELECT email, COUNT(*) as count
FROM "User"
GROUP BY email
HAVING COUNT(*) > 1;
```

**Expected:** No results (0 rows)

---

### Check for Duplicate Songs

```sql
-- Exact matches (title + artist)
SELECT title, artist, COUNT(*) as count
FROM songs
GROUP BY title, artist
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Show duplicates with IDs
SELECT s1.id, s1.title, s1.artist, s1.created_at
FROM songs s1
INNER JOIN songs s2
  ON s1.title = s2.title
  AND s1.artist = s2.artist
  AND s1.id != s2.id
ORDER BY s1.title;
```

**Action:** Decide if duplicates are intentional (different versions) or need removal

---

### Check for Missing or Invalid Data

```sql
-- Songs with missing metadata
SELECT id, title, artist, cover_url, file_url
FROM songs
WHERE title IS NULL
   OR title = ''
   OR artist IS NULL
   OR artist = ''
   OR cover_url IS NULL
   OR cover_url = ''
   OR file_url IS NULL
   OR file_url = '';

-- Songs with invalid URLs (simple check)
SELECT id, title, cover_url, file_url
FROM songs
WHERE cover_url NOT LIKE 'http%'
   OR file_url NOT LIKE 'http%';

-- Songs with NULL category or emotion
SELECT id, title, category, emotion
FROM songs
WHERE category IS NULL OR emotion IS NULL;
```

**Expected:** No results or minimal (fix any found)

---

### Check for Orphaned Records

```sql
-- PlayHistory referencing deleted users
SELECT ph.id, ph."userId", ph."songId", ph."playedAt"
FROM "PlayHistory" ph
LEFT JOIN "User" u ON ph."userId" = u.id
WHERE u.id IS NULL;

-- PlayHistory referencing deleted songs
SELECT ph.id, ph."userId", ph."songId", ph."playedAt"
FROM "PlayHistory" ph
LEFT JOIN songs s ON ph."songId" = s.id
WHERE s.id IS NULL;

-- Likes referencing deleted users
SELECT l.id, l."userId", l."songId"
FROM "Like" l
LEFT JOIN "User" u ON l."userId" = u.id
WHERE u.id IS NULL;

-- Likes referencing deleted songs
SELECT l.id, l."userId", l."songId"
FROM "Like" l
LEFT JOIN songs s ON l."songId" = s.id
WHERE s.id IS NULL;
```

**Expected:** No results (cascading deletes should handle this)

---

## 3. Referential Integrity Tests

### Test Cascade Delete (Safe Test on Test Data)

```sql
-- Create a test song
INSERT INTO songs (id, title, artist, category, emotion, cover_url, file_url)
VALUES ('test-song-cascade-123', 'Test Song', 'Test Artist', 'General', 'Neutral',
        'https://example.com/cover.jpg', 'https://example.com/song.mp3');

-- Create test user (if needed)
-- INSERT INTO "User" (id, email, password, role) VALUES ...

-- Add a play history record
INSERT INTO "PlayHistory" (id, "userId", "songId", "playedAt")
VALUES ('test-play-123', 'existing-user-id', 'test-song-cascade-123', NOW());

-- Add a like
INSERT INTO "Like" (id, "userId", "songId")
VALUES ('test-like-123', 'existing-user-id', 'test-song-cascade-123');

-- Verify relationships exist
SELECT * FROM "PlayHistory" WHERE "songId" = 'test-song-cascade-123';
SELECT * FROM "Like" WHERE "songId" = 'test-song-cascade-123';

-- Delete the song (should cascade)
DELETE FROM songs WHERE id = 'test-song-cascade-123';

-- Verify cascade worked
SELECT * FROM "PlayHistory" WHERE "songId" = 'test-song-cascade-123';
-- Expected: 0 rows

SELECT * FROM "Like" WHERE "songId" = 'test-song-cascade-123';
-- Expected: 0 rows
```

---

## 4. Performance Queries

### Identify Slow Queries

Enable query timing in PostgreSQL:

```sql
\timing on
```

---

### Most Played Songs (Performance Test)

```sql
EXPLAIN ANALYZE
SELECT
  s.id,
  s.title,
  s.artist,
  COUNT(ph.id) as play_count
FROM songs s
LEFT JOIN "PlayHistory" ph ON s.id = ph."songId"
GROUP BY s.id
ORDER BY play_count DESC
LIMIT 20;
```

**Check:**

- Execution time should be < 500ms
- Should use index scan, not sequential scan
- If slow, add index: `CREATE INDEX idx_playhistory_songid ON "PlayHistory"("songId");`

---

### Recently Played Songs for User (Performance Test)

```sql
EXPLAIN ANALYZE
SELECT
  s.id,
  s.title,
  s.artist,
  s.cover_url,
  ph."playedAt"
FROM songs s
JOIN "PlayHistory" ph ON s.id = ph."songId"
WHERE ph."userId" = 'replace-with-real-user-id'
ORDER BY ph."playedAt" DESC
LIMIT 10;
```

**Check:**

- Should use index on `PlayHistory.userId`
- Execution time < 100ms

---

### Find Large Tables

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

### Index Usage Statistics

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

**Action:** If an index has 0 scans, consider removing it (but be cautious)

---

## 5. Business Logic Validation

### Users with No Activity

```sql
SELECT u.id, u.email, u."createdAt"
FROM "User" u
LEFT JOIN "PlayHistory" ph ON u.id = ph."userId"
LEFT JOIN "Like" l ON u.id = l."userId"
WHERE ph.id IS NULL AND l.id IS NULL;
```

---

### Songs Never Played

```sql
SELECT s.id, s.title, s.artist, s.created_at
FROM songs s
LEFT JOIN "PlayHistory" ph ON s.id = ph."songId"
WHERE ph.id IS NULL
ORDER BY s.created_at DESC;
```

---

### Most Active Users (Last 30 Days)

```sql
SELECT
  u.id,
  u.email,
  COUNT(DISTINCT ph.id) as play_count
FROM "User" u
JOIN "PlayHistory" ph ON u.id = ph."userId"
WHERE ph."playedAt" > NOW() - INTERVAL '30 days'
GROUP BY u.id
ORDER BY play_count DESC
LIMIT 10;
```

---

### Songs by Category Distribution

```sql
SELECT category, COUNT(*) as count
FROM songs
GROUP BY category
ORDER BY count DESC;
```

---

### Songs by Emotion Distribution

```sql
SELECT emotion, COUNT(*) as count
FROM songs
GROUP BY emotion
ORDER BY count DESC;
```

---

### Login Activity (Last 7 Days)

```sql
SELECT
  DATE("createdAt") as login_date,
  COUNT(*) as login_count
FROM "LoginLog"
WHERE "createdAt" > NOW() - INTERVAL '7 days'
GROUP BY DATE("createdAt")
ORDER BY login_date DESC;
```

---

### Average Plays Per Song

```sql
SELECT
  AVG(play_count) as avg_plays_per_song,
  MAX(play_count) as max_plays,
  MIN(play_count) as min_plays
FROM (
  SELECT s.id, COUNT(ph.id) as play_count
  FROM songs s
  LEFT JOIN "PlayHistory" ph ON s.id = ph."songId"
  GROUP BY s.id
) subquery;
```

---

## 6. Data Cleanup Queries

### Delete Old Play History (Optional)

```sql
-- Delete play history older than 1 year
DELETE FROM "PlayHistory"
WHERE "playedAt" < NOW() - INTERVAL '1 year';
```

---

### Remove Songs Without Valid URLs

```sql
-- First, list them to review
SELECT id, title, artist, file_url
FROM songs
WHERE file_url IS NULL OR file_url = '' OR file_url NOT LIKE 'http%';

-- Then delete (BE CAREFUL!)
-- DELETE FROM songs
-- WHERE file_url IS NULL OR file_url = '' OR file_url NOT LIKE 'http%';
```

---

### Remove Duplicate Songs (Keep Oldest)

```sql
-- Find duplicates and keep only the oldest
WITH duplicates AS (
  SELECT
    id,
    title,
    artist,
    ROW_NUMBER() OVER (PARTITION BY title, artist ORDER BY created_at ASC) as rn
  FROM songs
)
SELECT * FROM duplicates WHERE rn > 1;

-- Delete duplicates (CAUTION!)
-- WITH duplicates AS (
--   SELECT id, ROW_NUMBER() OVER (PARTITION BY title, artist ORDER BY created_at ASC) as rn
--   FROM songs
-- )
-- DELETE FROM songs WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);
```

---

## 7. Analytics Queries

### Daily Active Users

```sql
SELECT
  DATE("playedAt") as date,
  COUNT(DISTINCT "userId") as active_users
FROM "PlayHistory"
WHERE "playedAt" > NOW() - INTERVAL '7 days'
GROUP BY DATE("playedAt")
ORDER BY date DESC;
```

---

### Retention Rate (Users who came back)

```sql
WITH first_login AS (
  SELECT "userId", MIN(DATE("createdAt")) as first_date
  FROM "LoginLog"
  GROUP BY "userId"
),
returning_users AS (
  SELECT DISTINCT ll."userId"
  FROM "LoginLog" ll
  JOIN first_login fl ON ll."userId" = fl."userId"
  WHERE DATE(ll."createdAt") > fl.first_date
)
SELECT
  (SELECT COUNT(*) FROM returning_users) as returning_users,
  (SELECT COUNT(*) FROM "User") as total_users,
  ROUND((SELECT COUNT(*) FROM returning_users)::numeric / (SELECT COUNT(*) FROM "User") * 100, 2) as retention_rate_percent;
```

---

### Top 10 Most Liked Songs

```sql
SELECT
  s.id,
  s.title,
  s.artist,
  COUNT(l.id) as like_count
FROM songs s
JOIN "Like" l ON s.id = l."songId"
GROUP BY s.id
ORDER BY like_count DESC
LIMIT 10;
```

---

### User Engagement Score (Plays + Likes)

```sql
SELECT
  u.id,
  u.email,
  COUNT(DISTINCT ph.id) as plays,
  COUNT(DISTINCT l.id) as likes,
  (COUNT(DISTINCT ph.id) + COUNT(DISTINCT l.id) * 2) as engagement_score
FROM "User" u
LEFT JOIN "PlayHistory" ph ON u.id = ph."userId"
LEFT JOIN "Like" l ON u.id = l."userId"
GROUP BY u.id
ORDER BY engagement_score DESC
LIMIT 20;
```

---

## 8. Migration Validation

### After Schema Migration

```sql
-- Check Prisma migration history
SELECT * FROM "_prisma_migrations"
ORDER BY finished_at DESC LIMIT 10;

-- Verify latest migration was successful
SELECT migration_name, finished_at, success
FROM "_prisma_migrations"
ORDER BY finished_at DESC LIMIT 1;
```

---

### Compare Schema with Prisma Schema File

```bash
# Generate a new migration (dry run)
npx prisma migrate dev --create-only

# If no changes, schema matches database
# If changes proposed, review them carefully
```

---

## 9. Backup & Restore Verification

### Create Backup

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

---

### Test Restore (on separate test database)

```bash
psql $TEST_DATABASE_URL < backup_20251212.sql
```

---

### Verify Row Counts Match

```sql
-- On production
SELECT
  (SELECT COUNT(*) FROM "User") AS users,
  (SELECT COUNT(*) FROM songs) AS songs,
  (SELECT COUNT(*) FROM "PlayHistory") AS plays;

-- Run same query on restored database
-- Counts should match
```

---

## 10. Health Check Queries (For Monitoring)

### Quick Health Check

```sql
-- Should return 1 row
SELECT 1 as health_check;
```

---

### Database Connection Count

```sql
SELECT
  count(*) as active_connections,
  max_conn,
  max_conn - count(*) as available_connections
FROM pg_stat_activity
CROSS JOIN (SELECT setting::int as max_conn FROM pg_settings WHERE name = 'max_connections') config
WHERE datname = current_database();
```

---

### Long-Running Queries

```sql
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
  AND state = 'active';
```

**Action:** Investigate queries running > 5 minutes

---

## Performance Monitoring Script

Save as `monitor_db.sql` and run periodically:

```sql
-- Database Health Report
\echo '=== Database Health Report ==='
\echo 'Generated at: '
SELECT NOW();

\echo '\n--- Table Sizes ---'
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

\echo '\n--- Row Counts ---'
SELECT
  (SELECT COUNT(*) FROM "User") AS users,
  (SELECT COUNT(*) FROM songs) AS songs,
  (SELECT COUNT(*) FROM "PlayHistory") AS plays,
  (SELECT COUNT(*) FROM "Like") AS likes,
  (SELECT COUNT(*) FROM "LoginLog") AS logins;

\echo '\n--- Active Connections ---'
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE datname = current_database();

\echo '\n--- Slow Queries (if any) ---'
SELECT pid, now() - query_start AS duration, left(query, 50)
FROM pg_stat_activity
WHERE state = 'active'
  AND (now() - query_start) > interval '1 second'
ORDER BY duration DESC;
```

Run with:

```bash
psql $DATABASE_URL -f monitor_db.sql
```

---

**Last Updated:** 2025-12-12
