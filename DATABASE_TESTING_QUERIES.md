# Database Testing - SQL Queries & Validation

Execute these queries to validate database integrity, performance, and data quality.

---

## Connection Setup

```bash
# Export your DATABASE_URL
export DATABASE_URL="postgresql://user:password@host:5432/database"

# Connect via psql
psql $DATABASE_URL

# Or use Prisma Studio (GUI)
cd backend
npx prisma studio
```

---

## 1. Quick Health Checks

### Test Connection

```sql
SELECT 1 AS health_check;
-- Expected: Returns 1 row
```

### Record Counts

```sql
SELECT
  (SELECT COUNT(*) FROM "User") AS total_users,
  (SELECT COUNT(*) FROM songs) AS total_songs,
  (SELECT COUNT(*) FROM "PlayHistory") AS total_plays,
  (SELECT COUNT(*) FROM "Like") AS total_likes,
  (SELECT COUNT(*) FROM "LoginLog") AS total_logins,
  (SELECT COUNT(*) FROM "AppSetting") AS app_settings;

-- Expected: Positive numbers for all
-- Verify counts match expected production data
```

---

## 2. Data Quality Validation

### Check for Duplicate Emails

```sql
SELECT email, COUNT(*) AS count
FROM "User"
GROUP BY email
HAVING COUNT(*) > 1;

-- Expected: 0 rows (no duplicates)
-- If results found: CRITICAL BUG - unique constraint violated
```

### Check for Duplicate Songs (Title + Artist)

```sql
SELECT
  title,
  artist,
  COUNT(*) AS count,
  STRING_AGG(id::text, ', ') AS song_ids
FROM songs
GROUP BY title, artist
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Expected: Review results
-- Action: Decide if intentional (different versions) or duplicates to remove
```

### Songs with Missing Metadata

```sql
SELECT
  id,
  title,
  artist,
  cover_url,
  file_url,
  category,
  emotion
FROM songs
WHERE
  title IS NULL OR title = '' OR
  artist IS NULL OR artist = '' OR
  cover_url IS NULL OR cover_url = '' OR
  file_url IS NULL OR file_url = '' OR
  category IS NULL OR
  emotion IS NULL;

-- Expected: 0 rows
-- If results: Fix missing data or delete incomplete records
```

### Invalid URLs

```sql
SELECT id, title, cover_url, file_url
FROM songs
WHERE
  cover_url NOT LIKE 'http%' OR
  file_url NOT LIKE 'http%';

-- Expected: 0 rows
-- Action: Fix URLs or delete invalid records
```

---

## 3. Referential Integrity

### Orphaned PlayHistory (No Valid User)

```sql
SELECT
  ph.id,
  ph."userId",
  ph."songId",
  ph."playedAt"
FROM "PlayHistory" ph
LEFT JOIN "User" u ON ph."userId" = u.id
WHERE u.id IS NULL;

-- Expected: 0 rows
-- Action: DELETE orphaned records
```

### Orphaned PlayHistory (No Valid Song)

```sql
SELECT
  ph.id,
  ph."userId",
  ph."songId",
  ph."playedAt"
FROM "PlayHistory" ph
LEFT JOIN songs s ON ph."songId" = s.id
WHERE s.id IS NULL;

-- Expected: 0 rows (CASCADE DELETE should handle this)
-- Action: If found, DELETE manually
```

### Orphaned Likes (No Valid User)

```sql
SELECT l.id, l."userId", l."songId"
FROM "Like" l
LEFT JOIN "User" u ON l."userId" = u.id
WHERE u.id IS NULL;

-- Expected: 0 rows
```

### Orphaned Likes (No Valid Song)

```sql
SELECT l.id, l."userId", l."songId"
FROM "Like" l
LEFT JOIN songs s ON l."songId" = s.id
WHERE s.id IS NULL;

-- Expected: 0 rows (CASCADE DELETE should handle)
```

---

## 4. Test Cascade Deletes (SAFE TEST ON DEV ONLY)

```sql
-- WARNING: Run ONLY on test/dev database, NOT production!

-- 1. Create test song
INSERT INTO songs (id, title, artist, category, emotion, cover_url, file_url)
VALUES ('test-cascade-999', 'Test Delete Song', 'Test Artist', 'General',
        'Neutral', 'https://example.com/cover.jpg', 'https://example.com/song.mp3');

-- 2. Create test play history (replace user-id with real one)
INSERT INTO "PlayHistory" (id, "userId", "songId", "playedAt")
VALUES ('test-play-999', 'existing-user-uuid', 'test-cascade-999', NOW());

-- 3. Create test like
INSERT INTO "Like" (id, "userId", "songId")
VALUES ('test-like-999', 'existing-user-uuid', 'test-cascade-999');

-- 4. Verify relationships exist
SELECT * FROM "PlayHistory" WHERE "songId" = 'test-cascade-999';
SELECT * FROM "Like" WHERE "songId" = 'test-cascade-999';
-- Expected: 1 row each

-- 5. Delete the song (should CASCADE)
DELETE FROM songs WHERE id = 'test-cascade-999';

-- 6. Verify cascade worked
SELECT * FROM "PlayHistory" WHERE "songId" = 'test-cascade-999';
SELECT * FROM "Like" WHERE "songId" = 'test-cascade-999';
-- Expected: 0 rows (cascade delete worked) ✓
```

---

## 5. Performance Queries

### Most Played Songs

```sql
EXPLAIN ANALYZE
SELECT
  s.id,
  s.title,
  s.artist,
  s.cover_url,
  COUNT(ph.id) AS play_count
FROM songs s
LEFT JOIN "PlayHistory" ph ON s.id = ph."songId"
GROUP BY s.id
ORDER BY play_count DESC
LIMIT 20;

-- Check EXPLAIN output:
-- ✓ Should use index scan (NOT seq scan)
-- ✓ Execution time < 500ms
-- If slow: CREATE INDEX idx_playhistory_songid ON "PlayHistory"("songId");
```

### Recently Played for User

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

-- Check:
-- ✓ Uses index on "userId"
-- ✓ Execution time < 100ms
```

### Slow Query Identification (PostgreSQL)

```sql
-- Enable query stats (if not already)
-- Add to postgresql.conf: shared_preload_libraries = 'pg_stat_statements'

SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Action: Optimize queries with mean_exec_time > 500ms
```

---

## 6. Index Verification

### List All Indexes

```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Verify these exist:
-- ✓ User_pkey (id)
-- ✓ User_email_key (email UNIQUE)
-- ✓ songs_pkey (id)
-- ✓ PlayHistory_pkey (id)
-- ✓ PlayHistory_userId_idx (index on userId)
-- ✓ Like_pkey (id)
-- ✓ Like_userId_songId_key (UNIQUE constraint)
```

### Index Usage Statistics

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Action: If idx_scan = 0, consider dropping unused index
-- BUT: Be cautious, some indexes used rarely but critical
```

---

## 7. Business Analytics Queries

### User Engagement Score (Plays + Likes)

```sql
SELECT
  u.id,
  u.email,
  COUNT(DISTINCT ph.id) AS total_plays,
  COUNT(DISTINCT l.id) AS total_likes,
  (COUNT(DISTINCT ph.id) + COUNT(DISTINCT l.id) * 2) AS engagement_score
FROM "User" u
LEFT JOIN "PlayHistory" ph ON u.id = ph."userId"
LEFT JOIN "Like" l ON u.id = l."userId"
GROUP BY u.id
ORDER BY engagement_score DESC
LIMIT 20;

-- Use to identify most active users
```

### Top 10 Most Liked Songs

```sql
SELECT
  s.id,
  s.title,
  s.artist,
  COUNT(l.id) AS like_count
FROM songs s
JOIN "Like" l ON s.id = l."songId"
GROUP BY s.id
ORDER BY like_count DESC
LIMIT 10;
```

### Top 10 Most Played Songs

```sql
SELECT
  s.id,
  s.title,
  s.artist,
  s.category,
  COUNT(ph.id) AS play_count
FROM songs s
JOIN "PlayHistory" ph ON s.id = ph."songId"
GROUP BY s.id
ORDER BY play_count DESC
LIMIT 10;
```

### Songs Never Played

```sql
SELECT
  s.id,
  s.title,
  s.artist,
  s.created_at
FROM songs s
LEFT JOIN "PlayHistory" ph ON s.id = ph."songId"
WHERE ph.id IS NULL
ORDER BY s.created_at DESC;

-- Use to identify unpopular songs or newly uploaded
```

### Users with No Activity

```sql
SELECT
  u.id,
  u.email,
  u."createdAt"
FROM "User" u
LEFT JOIN "PlayHistory" ph ON u.id = ph."userId"
LEFT JOIN "Like" l ON u.id = l."userId"
WHERE ph.id IS NULL AND l.id IS NULL;

-- Inactive users (never played or liked anything)
```

### Average Plays Per Song

```sql
SELECT
  AVG(play_count) AS avg_plays_per_song,
  MAX(play_count) AS max_plays,
  MIN(play_count) AS min_plays,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY play_count) AS median_plays
FROM (
  SELECT s.id, COUNT(ph.id) AS play_count
  FROM songs s
  LEFT JOIN "PlayHistory" ph ON s.id = ph."songId"
  GROUP BY s.id
) song_plays;
```

### Song Distribution by Category

```sql
SELECT
  category,
  COUNT(*) AS song_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
FROM songs
GROUP BY category
ORDER BY song_count DESC;

-- Expected: Tamil, Malayalam, Telugu, English, Hindi
```

### Login Activity (Last 7 Days)

```sql
SELECT
  DATE("createdAt") AS login_date,
  COUNT(*) AS login_count,
  COUNT(DISTINCT "userId") AS unique_users
FROM "LoginLog"
WHERE "createdAt" > NOW() - INTERVAL '7 days'
GROUP BY DATE("createdAt")
ORDER BY login_date DESC;

-- Verify matches analytics dashboard
```

### Daily Active Users (Last 30 Days)

```sql
SELECT
  DATE("playedAt") AS date,
  COUNT(DISTINCT "userId") AS active_users
FROM "PlayHistory"
WHERE "playedAt" > NOW() - INTERVAL '30 days'
GROUP BY DATE("playedAt")
ORDER BY date DESC;
```

---

## 8. Data Cleanup (USE WITH CAUTION)

### Delete Old Play History (Optional)

```sql
-- Review before delete
SELECT COUNT(*)
FROM "PlayHistory"
WHERE "playedAt" < NOW() - INTERVAL '1 year';

-- Execute delete (BACKUP FIRST!)
-- DELETE FROM "PlayHistory"
-- WHERE "playedAt" < NOW() - INTERVAL '1 year';
```

### Remove Duplicate Songs (Keep Oldest)

```sql
-- Find duplicates
WITH duplicates AS (
  SELECT
    id,
    title,
    artist,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY title, artist ORDER BY created_at ASC) AS rn
  FROM songs
)
SELECT * FROM duplicates WHERE rn > 1;

-- Delete duplicates (CAUTION!)
-- WITH duplicates AS (
--   SELECT id, ROW_NUMBER() OVER (PARTITION BY title, artist ORDER BY created_at ASC) AS rn
--   FROM songs
-- )
-- DELETE FROM songs WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);
```

### Delete Songs with Invalid URLs

```sql
-- Review first
SELECT id, title, file_url
FROM songs
WHERE file_url IS NULL OR file_url = '' OR file_url NOT LIKE 'http%';

-- Delete (BACKUP FIRST!)
-- DELETE FROM songs
-- WHERE file_url IS NULL OR file_url = '' OR file_url NOT LIKE 'http%';
```

---

## 9. Schema Validation

### Verify Prisma Migrations Applied

```sql
SELECT
  migration_name,
  finished_at,
  applied_steps_count
FROM "_prisma_migrations"
ORDER BY finished_at DESC
LIMIT 10;

-- Verify latest migration is applied
```

### Check for Missing Columns (Compare with Prisma Schema)

```sql
-- User table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'User'
ORDER BY ordinal_position;

-- Expected: id, email, password, role, createdAt

-- Songs table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'songs'
ORDER BY ordinal_position;

-- Expected: id, title, artist, category, emotion, cover_url, file_url,
--           source_url, created_at, youtube_views
```

### Verify Foreign Key Constraints

```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON rc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- Verify:
-- ✓ PlayHistory.userId → User.id (CASCADE on delete)
-- ✓ PlayHistory.songId → songs.id (CASCADE on delete)
-- ✓ Like.userId → User.id
-- ✓ Like.songId → songs.id (CASCADE on delete)
```

---

## 10. Table Sizes & Disk Usage

### Table Sizes

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Monitor growth over time
-- Alert if sudden spike in size
```

### Database Size

```sql
SELECT
  pg_database.datname,
  pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = current_database();
```

---

## 11. Connection & Activity Monitoring

### Active Connections

```sql
SELECT
  count(*) AS active_connections,
  max_conn,
  max_conn - count(*) AS available_connections
FROM pg_stat_activity
CROSS JOIN (SELECT setting::int AS max_conn FROM pg_settings WHERE name = 'max_connections') config
WHERE datname = current_database();

-- Monitor: If available_connections < 10, investigate
```

### Long-Running Queries

```sql
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  state,
  query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
  AND state = 'active'
  AND pid != pg_backend_pid();

-- Action: Investigate queries running > 5 minutes
-- Terminate if needed: SELECT pg_terminate_backend(pid);
```

### Blocked Queries

```sql
SELECT
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement,
  blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks
  ON blocking_locks.locktype = blocked_locks.locktype
  AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
  AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
  AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
  AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
  AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
  AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
  AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
  AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
  AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
  AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- Action: Identify and resolve blocking queries
```

---

## 12. Backup & Restore Validation

### Create Backup

```bash
# In terminal (not SQL)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Test (on separate test database)

```bash
psql $TEST_DATABASE_URL < backup_20251212_210000.sql
```

### Verify Backup Integrity

```sql
-- After restore, compare counts:
SELECT
  (SELECT COUNT(*) FROM "User") AS users,
  (SELECT COUNT(*) FROM songs) AS songs,
  (SELECT COUNT(*) FROM "PlayHistory") AS plays,
  (SELECT COUNT(*) FROM "Like") AS likes;

-- Counts should match production backup
```

---

## Automated Health Check Script

Save as `db-health-check.sql`:

```sql
\echo '=== Database Health Check ==='
\echo 'Generated at:'
SELECT NOW();

\echo '\n=== Record Counts ==='
SELECT
  (SELECT COUNT(*) FROM "User") AS users,
  (SELECT COUNT(*) FROM songs) AS songs,
  (SELECT COUNT(*) FROM "PlayHistory") AS plays,
  (SELECT COUNT(*) FROM "Like") AS likes,
  (SELECT COUNT(*) FROM "LoginLog") AS logins;

\echo '\n=== Orphaned Records ==='
SELECT COUNT(*) AS orphaned_plays
FROM "PlayHistory" ph
LEFT JOIN songs s ON ph."songId" = s.id
WHERE s.id IS NULL;

\echo '\n=== Duplicate Emails ==='
SELECT COUNT(*) AS duplicate_emails
FROM (
  SELECT email FROM "User" GROUP BY email HAVING COUNT(*) > 1
) dupes;

\echo '\n=== Missing Metadata ==='
SELECT COUNT(*) AS songs_missing_data
FROM songs
WHERE title IS NULL OR artist IS NULL OR file_url IS NULL;

\echo '\n=== Active Connections ==='
SELECT count(*) AS active_connections
FROM pg_stat_activity
WHERE datname = current_database();

\echo '\n=== Health Check Complete ==='
```

Run:

```bash
psql $DATABASE_URL -f db-health-check.sql
```

---

**Last Updated:** 2025-12-12  
**Run Frequency:** Weekly (manual), Daily (automated in CI)
