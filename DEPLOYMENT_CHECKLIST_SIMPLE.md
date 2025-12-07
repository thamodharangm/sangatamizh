# ✅ Deployment Checklist - Print This!

## 🎯 Quick Overview

- **Time**: 15 minutes
- **Cost**: $0/month
- **Difficulty**: Easy

---

## 📋 PART 1: Railway Backend (8 min)

### Setup (3 min)

- [ ] Go to [railway.app/new](https://railway.app/new)
- [ ] Sign in with GitHub
- [ ] Click "+ New" → Database → PostgreSQL
- [ ] Click "+ New" → Database → Redis
- [ ] Click "+ New" → GitHub Repo → Select `sangatamizh-music`

### Configure (3 min)

- [ ] Click backend service → Settings
- [ ] Set Service Name: `backend`
- [ ] Set Root Directory: `backend`
- [ ] Save changes

### Environment Variables (2 min)

- [ ] Go to Variables tab
- [ ] Add Reference: Postgres → DATABASE_URL
- [ ] Add Reference: Redis → REDIS_URL
- [ ] Click Raw Editor and paste:

```
NODE_ENV=production
PORT=3000
JWT_ACCESS_SECRET=PSNOhIrwz0q3qPLgnaQrs2xHb1vKZ0hoEk
JWT_REFRESH_SECRET=luBR7dp9T3qPLgnaQrs2xHb1vKZ0hoEk
S3_BUCKET=sangatamizh-music
S3_REGION=auto
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
FRONTEND_URL=https://YOUR-FRONTEND.vercel.app
```

- [ ] Save

### Get Backend URL

- [ ] Settings → Networking → Generate Domain
- [ ] **Copy URL**: `_________________________________`

### Test

- [ ] Visit: `https://YOUR-BACKEND-URL/health`
- [ ] Should see: `{"status": "ok"}`

---

## 📋 PART 2: Vercel Frontend (5 min)

### Setup (2 min)

- [ ] Go to [vercel.com/new](https://vercel.com/new)
- [ ] Sign in with GitHub
- [ ] Import `sangatamizh-music` repo

### Configure (2 min)

- [ ] Framework: Vite
- [ ] Root Directory: `frontend`
- [ ] Build Command: `npm run build`
- [ ] Output: `dist`

### Environment Variable (1 min)

- [ ] Add variable:
  - Name: `VITE_API_URL`
  - Value: `https://YOUR-BACKEND-URL/api`
- [ ] Click Deploy

### Get Frontend URL

- [ ] **Copy URL**: `_________________________________`

---

## 📋 PART 3: Connect (2 min)

### Update Backend

- [ ] Go back to Railway
- [ ] Backend → Variables
- [ ] Update `FRONTEND_URL` to your Vercel URL
- [ ] Save (will auto-redeploy)

### Wait

- [ ] Wait 1-2 minutes for redeploy

---

## 📋 PART 4: Test (2 min)

- [ ] Visit frontend URL
- [ ] Page loads ✅
- [ ] No errors in console (F12) ✅
- [ ] Click Sign Up
- [ ] Create account ✅
- [ ] Login works ✅

---

## 🎉 SUCCESS!

**Your URLs**:

- Frontend: `_________________________________`
- Backend: `_________________________________`

**Share with friends!** 🚀

---

## ⚠️ If Something Breaks

### Backend health check fails

→ Check Railway logs → Deployments tab

### Frontend blank page

→ Check browser console (F12) → Verify VITE_API_URL

### CORS errors

→ Verify FRONTEND_URL in Railway matches Vercel URL exactly

### Can't create account

→ Check Railway logs → Verify DATABASE_URL is linked

---

**Total Time**: ~15 minutes  
**Status**: Ready to deploy! ✅
