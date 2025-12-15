# 🚀 QUICK DEPLOYMENT CHECKLIST

## ✅ PRE-DEPLOYMENT (DONE)

- [x] Code is committed and pushed to GitHub
- [x] Build tested locally (successful)
- [x] Error boundary added
- [x] All features working
- [x] QA testing complete

---

## 📋 DEPLOYMENT STEPS

### STEP 1: Deploy Backend to Render

**URL**: https://render.com

1. [ ] Create Render account (sign up with GitHub)
2. [ ] Click "New +" → "Web Service"
3. [ ] Select `sangatamizh` repository
4. [ ] Configure:
   - Name: `sangatamizh-backend`
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npm start`
5. [ ] Add Environment Variables:
   - `DATABASE_URL` (from Supabase)
   - `SUPABASE_URL` (from Supabase)
   - `SUPABASE_KEY` (from Supabase)
   - `PORT=3002`
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://sangatamizh.vercel.app`
6. [ ] Click "Create Web Service"
7. [ ] Wait for deployment (5-10 min)
8. [ ] Save backend URL: `https://sangatamizh-backend.onrender.com`
9. [ ] Test: `curl https://sangatamizh-backend.onrender.com/`

---

### STEP 2: Deploy Frontend to Vercel

**URL**: https://vercel.com

1. [ ] Create Vercel account (sign up with GitHub)
2. [ ] Click "Add New..." → "Project"
3. [ ] Import `sangatamizh` repository
4. [ ] Configure:
   - Framework: Vite
   - Root Directory: `client-v2`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. [ ] Add Environment Variable:
   - `VITE_API_URL=https://sangatamizh-backend.onrender.com/api`
6. [ ] Click "Deploy"
7. [ ] Wait for deployment (2-3 min)
8. [ ] Save frontend URL: `https://sangatamizh.vercel.app`
9. [ ] Test: Open URL in browser

---

### STEP 3: Update Backend CORS

1. [ ] Go to Render Dashboard
2. [ ] Open backend service
3. [ ] Environment → Update `FRONTEND_URL`
4. [ ] Set to: `https://sangatamizh.vercel.app`
5. [ ] Save (auto-redeploys)

---

### STEP 4: Test Production

#### Backend Tests:

- [ ] Health check works
- [ ] `/api/songs` returns data
- [ ] `/api/stream/:id` works
- [ ] No errors in logs

#### Frontend Tests:

- [ ] Page loads
- [ ] Songs display
- [ ] Click song → player appears
- [ ] Audio plays
- [ ] No console errors

#### Mobile Tests:

- [ ] Open on phone
- [ ] Audio plays
- [ ] Lock screen controls work
- [ ] Buffering works

---

### STEP 5: Monitor

- [ ] Check Render metrics (CPU, Memory)
- [ ] Check Vercel analytics
- [ ] Monitor error logs
- [ ] Test from different locations

---

## 🎉 CELEBRATE!

- [ ] Share on social media
- [ ] Tell friends and family
- [ ] Add to portfolio
- [ ] Plan next features

---

## 📞 NEED HELP?

**Full Guide**: `PRODUCTION_DEPLOYMENT.md`

**Common Issues**:

- Backend not responding → Check Render logs
- CORS errors → Update FRONTEND_URL
- Songs not loading → Check database connection
- Audio not playing → Check Supabase Storage

---

**Your app is ready to go live!** 🚀

**Estimated Time**: 30-45 minutes

**Let's do this!** 💪
