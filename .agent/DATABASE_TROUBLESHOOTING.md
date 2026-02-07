# 🔧 DATABASE CONNECTION TROUBLESHOOTING GUIDE

## ⚠️ Current Issue

Your Supabase database at `db.lemirqphbiyhmulyczzg.supabase.co` is **not accepting connections**.

**Error**: `Can't reach database server at db.lemirqphbiyhmulyczzg.supabase.co:5432`

---

## 🔍 POSSIBLE CAUSES

### 1. **Supabase Project Paused** (Most Likely)

- Free tier projects pause after 7 days of inactivity
- Solution: Wake up the project in Supabase Dashboard

### 2. **Network/Firewall Issue**

- Your ISP or firewall blocking port 5432
- Solution: Try different network or disable firewall temporarily

### 3. **Wrong Password**

- URL-encoded password might be incorrect
- Solution: Reset database password in Supabase

### 4. **Database Deleted**

- Project might have been deleted
- Solution: Create new Supabase project

---

## ✅ SOLUTION 1: Wake Up Supabase Project (5 minutes)

### Step 1: Check Project Status

```
1. Go to: https://app.supabase.com/projects
2. Find project: lemirqphbiyhmulyczzg
3. Check if it shows "Paused" or "Inactive"
```

### Step 2: Wake Up Project

```
1. Click on the project
2. Click "Restore project" or "Resume"
3. Wait 2-3 minutes for database to start
```

### Step 3: Test Connection

```bash
cd d:\sangatamizh\backend
node test_database.js
```

### Step 4: If Working, Push Schema

```bash
npx prisma db push
npm start
```

---

## ✅ SOLUTION 2: Create New Supabase Project (10 minutes)

### Step 1: Create Project

```
1. Go to: https://app.supabase.com/
2. Click "New Project"
3. Name: sangatamizh-music
4. Database Password: Create strong password (save it!)
5. Region: Choose closest to you
6. Click "Create new project"
7. Wait 2-3 minutes
```

### Step 2: Get Connection String

```
1. Go to: Settings > Database
2. Copy "Connection String" under "Connection string"
3. Replace [YOUR-PASSWORD] with your actual password
```

### Step 3: Update .env

```bash
# In d:\sangatamizh\backend\.env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres"
```

### Step 4: Push Schema

```bash
cd d:\sangatamizh\backend
npx prisma generate
npx prisma db push
npm start
```

---

## ✅ SOLUTION 3: Use Railway PostgreSQL (15 minutes) - RECOMMENDED

Railway is more reliable for development and has better free tier.

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login and Create Project

```bash
railway login
cd d:\sangatamizh\backend
railway init
```

### Step 3: Add PostgreSQL

```bash
railway add
# Select: PostgreSQL
```

### Step 4: Get DATABASE_URL

```bash
railway variables
# Copy the DATABASE_URL value
```

### Step 5: Update .env

```bash
# Paste the Railway DATABASE_URL in d:\sangatamizh\backend\.env
DATABASE_URL="postgresql://postgres:xxx@containers-us-west-xxx.railway.app:5432/railway"
```

### Step 6: Push Schema

```bash
npx prisma db push
npm start
```

---

## ✅ SOLUTION 4: Use Neon PostgreSQL (10 minutes)

Neon is a serverless PostgreSQL with generous free tier.

### Step 1: Create Account

```
1. Go to: https://neon.tech/
2. Sign up with GitHub
3. Create new project: sangatamizh-music
```

### Step 2: Get Connection String

```
1. Dashboard will show connection string
2. Copy the "Connection string" (starts with postgresql://)
```

### Step 3: Update .env

```bash
# In d:\sangatamizh\backend\.env
DATABASE_URL="postgresql://xxx:xxx@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### Step 4: Push Schema

```bash
cd d:\sangatamizh\backend
npx prisma db push
npm start
```

---

## ✅ SOLUTION 5: Local PostgreSQL (30 minutes)

Use local PostgreSQL for development.

### Step 1: Install PostgreSQL

```
Download: https://www.postgresql.org/download/windows/
Version: 16.x
During install:
- Set password: postgres
- Port: 5432
- Remember the password!
```

### Step 2: Create Database

```bash
# Open Command Prompt as Administrator
cd "C:\Program Files\PostgreSQL\16\bin"
psql -U postgres

# In psql:
CREATE DATABASE sangatamizh;
\q
```

### Step 3: Update .env

```bash
# In d:\sangatamizh\backend\.env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sangatamizh"
```

### Step 4: Push Schema

```bash
cd d:\sangatamizh\backend
npx prisma db push
npm start
```

---

## 🧪 QUICK TEST COMMANDS

### Test 1: Check if Supabase is reachable

```bash
Test-NetConnection -ComputerName db.lemirqphbiyhmulyczzg.supabase.co -Port 5432
```

### Test 2: Test database connection

```bash
cd d:\sangatamizh\backend
node test_database.js
```

### Test 3: Verify Prisma can connect

```bash
npx prisma db pull
```

---

## 📊 COMPARISON OF OPTIONS

| Option                 | Setup Time | Reliability | Free Tier | Best For    |
| ---------------------- | ---------- | ----------- | --------- | ----------- |
| **Supabase** (wake up) | 5 min      | Good        | 500MB     | Quick fix   |
| **Railway**            | 15 min     | Excellent   | 500MB     | Development |
| **Neon**               | 10 min     | Excellent   | 3GB       | Production  |
| **Local PostgreSQL**   | 30 min     | Perfect     | Unlimited | Testing     |

---

## 🎯 RECOMMENDED ACTION

**I recommend using Railway (Solution 3)** because:

- ✅ More reliable than Supabase free tier
- ✅ Doesn't pause after inactivity
- ✅ Easy CLI setup
- ✅ Good for both development and production
- ✅ Free tier is generous

---

## 🚨 EMERGENCY WORKAROUND

If you need to test the app RIGHT NOW without database:

### Use Mock Data (5 minutes)

1. Create `backend/src/config/mockData.js`:

```javascript
const mockSongs = [
  {
    id: "1",
    title: "Why This Kolaveri Di",
    artist: "Dhanush",
    cover_url: "https://i.ytimg.com/vi/YR12Z8f1Dh8/maxresdefault.jpg",
    file_url: "https://www.youtube.com/watch?v=YR12Z8f1Dh8",
    emotion: "Feel Good",
    category: "Tamil",
    youtube_views: "500000000",
  },
  // Add more songs...
];

module.exports = { mockSongs };
```

2. Update `songController.js`:

```javascript
const { mockSongs } = require("../config/mockData");

exports.getAllSongs = async (req, res) => {
  res.json(mockSongs);
};
```

3. Restart backend and test

---

## 📞 NEXT STEPS

**Choose ONE solution above and follow the steps.**

**My recommendation:**

1. Try Solution 1 first (wake up Supabase) - 5 minutes
2. If that fails, use Solution 3 (Railway) - 15 minutes
3. Solution 3 will give you a reliable database for development

**After database is working:**

```bash
cd d:\sangatamizh\backend
npm start

# In another terminal:
cd d:\sangatamizh\client-v2
npm run dev

# Open: http://localhost:5174/
```

---

## ✅ VERIFICATION

Once database is connected, you should see:

- ✅ Backend starts without errors
- ✅ Mobile app loads songs
- ✅ Admin panel can upload songs
- ✅ Playlists work
- ✅ Search works

---

**Choose a solution and let me know which one you want to use!**
