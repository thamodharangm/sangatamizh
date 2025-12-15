# Vercel Environment Variable Setup

## CRITICAL: Update Both Vercel Deployments

You need to set the `VITE_API_URL` environment variable on BOTH Vercel projects:

### 1. Desktop Frontend (sangatamizh-ra1p.vercel.app)

1. Go to: https://vercel.com/dashboard
2. Select project: `sangatamizh` (or whatever you named the desktop one)
3. Go to: **Settings** → **Environment Variables**
4. Add/Update:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://sangatamizh-production.up.railway.app/api`
   - **Environments**: Check all (Production, Preview, Development)
5. Click **Save**
6. Go to **Deployments** tab → Click "..." on latest → **Redeploy**

### 2. Mobile Frontend (sangatamizh.vercel.app)

1. Go to: https://vercel.com/dashboard
2. Select project: `sangatamizh-mobile` (or your mobile project name)
3. Go to: **Settings** → **Environment Variables**
4. Add/Update:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://sangatamizh-production.up.railway.app/api`
   - **Environments**: Check all (Production, Preview, Development)
5. Click **Save**
6. Go to **Deployments** tab → Click "..." on latest → **Redeploy**

## Important Notes

- The `/api` suffix is REQUIRED
- After setting the variable, you MUST redeploy for it to take effect
- Wait 1-2 minutes for each redeploy to complete

## Verify It Works

After redeploying both:

1. Visit: https://sangatamizh-ra1p.vercel.app/
2. Open browser console (F12)
3. Check Network tab - API calls should go to `sangatamizh-production.up.railway.app`
4. If you see errors, the env var might not be set correctly

## Next: Seed Production Database

After Vercel is configured, run:

```bash
cd backend
railway run node seed_production.js
```

Or manually upload songs via Admin Panel.
