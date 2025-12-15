# 🚀 Complete Production Deployment Guide

## Current Status

- ✅ Code pushed to GitHub: https://github.com/thamodharangpm-commits/sangatamizh.git
- ✅ Backend deployed to Railway (but database connection failing)
- ✅ Frontend deployed to Vercel
- ❌ Database connection not working

## 🎯 Fix: Use Railway PostgreSQL (Recommended)

### Step 1: Add Railway PostgreSQL Database

1. Go to Railway Dashboard: https://railway.app/dashboard
2. Select your project
3. Click **"+ New"** button
4. Select **"Database"** → **"PostgreSQL"**
5. Wait for it to provision (~30 seconds)

### Step 2: Update Backend Build Command

1. In Railway, click on your **backend service**
2. Go to **"Settings"** tab
3. Scroll to **"Build"** section
4. Set **Build Command** to:
   ```
   npx prisma generate && npx prisma db push
   ```
5. Click **"Save"**

### Step 3: Verify Environment Variables

Railway should have automatically created these variables when you added Postgres:

- `DATABASE_URL` (auto-created by Railway Postgres)

You need to manually add these:

1. Go to **"Variables"** tab
2. Add:
   ```
   SUPABASE_URL=https://lemirqphbiyhmulyczzg.supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbWlycXBoYml5aG11bHljenpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTE5MTYyNSwiZXhwIjoyMDgwNzY3NjI1fQ.MNy9qgdjwDUTpZeDE455jSPt_0Joct0L76jOdHz5DKc
   YT_API_KEY=AIzaSyD2UdnHiVDZGEkQZSeKiAzowVJ34BIML7s
   NODE_ENV=production
   ```

### Step 4: Redeploy Backend

1. Go to **"Deployments"** tab
2. Click **"Redeploy"** on the latest deployment
3. Wait 2-3 minutes for build to complete
4. Check logs - you should see "Server running on port 8080" without database errors

### Step 5: Seed the Database

Once backend is running successfully:

**Option A: Using Railway CLI (Recommended)**

```bash
# Install Railway CLI if you haven't
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run seed script
railway run node seed_production.js
```

**Option B: Manual Upload**

1. Go to your live site: https://sangatamizh-ra1p.vercel.app/admin/upload
2. Register an account
3. Go to Railway Dashboard → PostgreSQL → Data → Users table
4. Find your user and change `role` to `admin`
5. Upload songs via Admin Panel

### Step 6: Update Vercel Environment Variables

For **BOTH** Vercel projects (desktop and mobile):

1. Go to Vercel Dashboard
2. Select project
3. Settings → Environment Variables
4. Add/Update:
   ```
   VITE_API_URL=https://sangatamizh-production.up.railway.app/api
   ```
5. Save and **Redeploy**

## 🎉 Verification Checklist

After completing all steps:

- [ ] Railway backend shows "Active" status
- [ ] Railway logs show "Server running on port 8080" (no database errors)
- [ ] Visit https://sangatamizh-production.up.railway.app/ - should show "Sangatamizh Music Backend v2"
- [ ] Visit https://sangatamizh-production.up.railway.app/api/songs - should show `[]` (empty array, not error)
- [ ] Visit https://sangatamizh.vercel.app/ - should load without CORS errors
- [ ] After seeding: Songs appear on both Vercel sites

## 🆘 Troubleshooting

### If backend still shows database error:

- Check Railway Variables tab - ensure `DATABASE_URL` exists (auto-created by Postgres)
- Check Railway Postgres is "Active"
- Redeploy backend

### If Vercel shows CORS error:

- Check backend logs for the actual request
- Verify CORS is set to `origin: true` in `backend/src/app.js`

### If songs don't appear:

- Database is empty - run seed script or upload manually
- Check browser console for API errors
- Verify `VITE_API_URL` is set correctly in Vercel

## 📝 Notes

- Railway Postgres is on the same network as your backend = faster and more reliable
- Supabase is still used for file storage (songs/covers)
- The `DATABASE_URL` from Railway Postgres will be different from Supabase
- You'll need to re-upload songs since it's a new database
