# 🚂 Complete Railway Deployment Guide

Deploy both frontend and backend on Railway (all-in-one platform).

---

## 🎯 **Why Railway for Everything?**

- ✅ Single platform for frontend + backend
- ✅ Automatic HTTPS
- ✅ Built-in PostgreSQL & Redis
- ✅ Free $5 credit/month
- ✅ Auto-deploy from GitHub

---

## 📋 **Step-by-Step Deployment**

### **Step 1: Create Railway Account**

1. Go to **[railway.app](https://railway.app)**
2. Click **"Start a New Project"**
3. Sign in with **GitHub**
4. Authorize Railway to access your repos

---

### **Step 2: Create New Project**

1. Click **"New Project"**
2. You'll see an empty project dashboard

---

### **Step 3: Add PostgreSQL Database**

1. Click **"+ New"**
2. Select **"Database"**
3. Choose **"Add PostgreSQL"**
4. Railway will provision it automatically
5. ✅ PostgreSQL service created!

---

### **Step 4: Add Redis**

1. Click **"+ New"** again
2. Select **"Database"**
3. Choose **"Add Redis"**
4. Railway will provision it automatically
5. ✅ Redis service created!

---

### **Step 5: Deploy Backend**

#### **A. Add Backend Service**

1. Click **"+ New"**
2. Select **"GitHub Repo"**
3. Choose: `thamodharangm/sangatamizh-music`
4. Railway will start deploying

#### **B. Configure Backend**

1. Click on the newly created service
2. Go to **"Settings"** tab
3. Set **"Service Name"**: `backend`
4. Set **"Root Directory"**: `backend`
5. Click **"Save Changes"**

#### **C. Set Build & Start Commands**

Still in **"Settings"** tab:

1. **Build Command**:

   ```
   npm install && npx prisma generate && npm run build
   ```

2. **Start Command**:

   ```
   npx prisma migrate deploy && npm start
   ```

3. Click **"Save"**

#### **D. Add Environment Variables**

1. Go to **"Variables"** tab
2. Click **"+ New Variable"**
3. Add these variables:

**Method 1: Add References (Recommended)**

For `DATABASE_URL` and `REDIS_URL`:

- Click **"+ New Variable"** → **"Add Reference"**
- Select **Postgres** → **DATABASE_URL**
- Repeat for **Redis** → **REDIS_URL**

**Method 2: Manual Entry**

Add these as **Raw Editor**:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_ACCESS_SECRET=change-this-to-random-32-char-string-abc123xyz
JWT_REFRESH_SECRET=another-random-32-char-string-def456uvw
S3_BUCKET=sangatamizh-music
S3_REGION=auto
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
FRONTEND_URL=https://YOUR-FRONTEND-DOMAIN.up.railway.app
```

**Important**: We'll update `FRONTEND_URL` after deploying frontend!

#### **E. Generate Backend Domain**

1. Go to **"Settings"** tab
2. Scroll to **"Networking"**
3. Click **"Generate Domain"**
4. **Copy the URL** (e.g., `https://backend-production-abc123.up.railway.app`)
5. ✅ Backend URL saved!

---

### **Step 6: Deploy Frontend**

#### **A. Add Frontend Service**

1. Click **"+ New"**
2. Select **"GitHub Repo"**
3. Choose: `thamodharangm/sangatamizh-music` (same repo)
4. Railway will start deploying

#### **B. Configure Frontend**

1. Click on the newly created service
2. Go to **"Settings"** tab
3. Set **"Service Name"**: `frontend`
4. Set **"Root Directory"**: `frontend`
5. Click **"Save Changes"**

#### **C. Set Build & Start Commands**

Still in **"Settings"** tab:

1. **Build Command**:

   ```
   npm install && npm run build
   ```

2. **Start Command**:

   ```
   npx vite preview --host 0.0.0.0 --port $PORT
   ```

3. Click **"Save"**

#### **D. Add Frontend Environment Variables**

1. Go to **"Variables"** tab
2. Click **"+ New Variable"**
3. Add:

```env
VITE_API_URL=https://YOUR-BACKEND-URL.up.railway.app/api
```

Replace `YOUR-BACKEND-URL` with the backend domain from Step 5E!

#### **E. Generate Frontend Domain**

1. Go to **"Settings"** tab
2. Scroll to **"Networking"**
3. Click **"Generate Domain"**
4. **Copy the URL** (e.g., `https://frontend-production-xyz789.up.railway.app`)
5. ✅ Frontend URL saved!

---

### **Step 7: Update Backend FRONTEND_URL**

Now that you have the frontend URL:

1. Go back to **backend service**
2. Go to **"Variables"** tab
3. Update `FRONTEND_URL` to your frontend Railway URL
4. Click **"Save"**
5. Backend will redeploy automatically

---

### **Step 8: Verify Deployment**

#### **Check Backend**

Visit: `https://YOUR-BACKEND-URL.up.railway.app/health`

**Expected response**:

```json
{
  "status": "ok",
  "timestamp": "2025-12-07T..."
}
```

#### **Check Frontend**

Visit: `https://YOUR-FRONTEND-URL.up.railway.app`

**Expected**: You should see the upload form and UI

---

## 📊 **Your Final Setup**

Your Railway project should have **4 services**:

```
Sangatamizh Music Project
├── PostgreSQL          (Database)
├── Redis              (Cache)
├── backend            (API Server)
└── frontend           (React App)
```

---

## 🎯 **Your Live URLs**

After completing all steps:

- **Frontend**: `https://frontend-production-xyz.up.railway.app`
- **Backend**: `https://backend-production-abc.up.railway.app`
- **API Health**: `https://backend-production-abc.up.railway.app/health`

---

## 🔧 **Troubleshooting**

### **Backend Crashes**

**Check logs**:

1. Click backend service
2. Go to **"Deployments"** tab
3. Click latest deployment
4. Read the logs

**Common fixes**:

- Ensure `DATABASE_URL` is linked correctly
- Verify root directory is `backend`
- Check all environment variables are set

### **Frontend Shows Blank Page**

**Check**:

1. Is `VITE_API_URL` set correctly?
2. Does it end with `/api`?
3. Is the backend URL correct?

**Fix**:

- Update `VITE_API_URL` in frontend variables
- Redeploy frontend

### **CORS Errors**

**Fix**: Update backend CORS settings

1. Make sure `FRONTEND_URL` in backend matches your frontend Railway URL
2. Redeploy backend

---

## 💰 **Cost**

Railway gives you **$5 free credit per month**:

- PostgreSQL: ~$1-2/month
- Redis: ~$0.50/month
- Backend: ~$1/month
- Frontend: ~$0.50/month

**Total**: ~$3-4/month (within free tier!)

---

## 🚀 **Quick Deploy Script**

If you need to redeploy everything:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Deploy backend
railway up --service backend

# Deploy frontend
railway up --service frontend
```

---

## ✅ **Deployment Checklist**

- [ ] PostgreSQL service created
- [ ] Redis service created
- [ ] Backend service deployed
- [ ] Backend root directory set to `backend`
- [ ] Backend environment variables configured
- [ ] Backend domain generated
- [ ] Frontend service deployed
- [ ] Frontend root directory set to `frontend`
- [ ] Frontend `VITE_API_URL` set
- [ ] Frontend domain generated
- [ ] Backend `FRONTEND_URL` updated
- [ ] Both services running
- [ ] Health endpoint responding
- [ ] Frontend loads successfully

---

## 📝 **Environment Variables Reference**

### **Backend Variables**

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_ACCESS_SECRET=your-random-secret-min-32-chars
JWT_REFRESH_SECRET=your-random-secret-min-32-chars
S3_BUCKET=sangatamizh-music
S3_REGION=auto
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
FRONTEND_URL=https://YOUR-FRONTEND.up.railway.app
```

### **Frontend Variables**

```env
VITE_API_URL=https://YOUR-BACKEND.up.railway.app/api
```

---

## 🎊 **You're Done!**

Your complete music streaming app is now live on Railway!

**Test it**:

1. Visit your frontend URL
2. Try to sign up
3. Upload a song
4. Everything should work!

---

**Need help? Check the logs in Railway dashboard!** 🚂
