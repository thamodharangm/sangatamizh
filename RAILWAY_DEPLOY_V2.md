# 🚀 Railway Deployment Guide - Updated Configuration

This guide uses the **new Railway V2 runtime** with **Dockerfile-based deployment** for better control and performance.

---

## 🎯 What's New in This Configuration

✅ **Dockerfile Builder** - More control over the build process  
✅ **Railway V2 Runtime** - Latest runtime with better performance  
✅ **Auto-deploy Watch Patterns** - Automatically redeploy when backend changes  
✅ **Multi-region Support** - Deploy to specific regions for lower latency  
✅ **Health Checks** - Built-in health monitoring  
✅ **Production-optimized** - Uses `npm ci` and production-only dependencies

---

## 📋 Prerequisites

Before you start:

- [ ] GitHub repository: `thamodharangm/sangatamizh-music`
- [ ] Railway account (sign up at [railway.app](https://railway.app))
- [ ] Backend code with `railway.json` and `Dockerfile` configured

---

## 🚂 Step-by-Step Deployment

### **Step 1: Create Railway Project**

1. Go to **[railway.app/new](https://railway.app/new)**
2. Click **"New Project"**
3. Sign in with **GitHub**

---

### **Step 2: Add PostgreSQL Database**

1. In your new project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will provision it automatically
4. ✅ PostgreSQL created!

---

### **Step 3: Add Redis Cache**

1. Click **"+ New"** again
2. Select **"Database"** → **"Add Redis"**
3. Railway will provision it automatically
4. ✅ Redis created!

---

### **Step 4: Deploy Backend Service**

#### **A. Add Backend from GitHub**

1. Click **"+ New"**
2. Select **"GitHub Repo"**
3. Choose: `thamodharangm/sangatamizh-music`
4. Railway will detect the `railway.json` configuration

#### **B. Configure Service Settings**

1. Click on the backend service
2. Go to **"Settings"** tab
3. Set **"Service Name"**: `backend`
4. Set **"Root Directory"**: `backend`
5. Click **"Save Changes"**

> **Note**: Railway will automatically use the `railway.json` configuration for build and deploy commands!

#### **C. Add Environment Variables**

Go to **"Variables"** tab and add:

**Using References (Recommended)**:

1. Click **"+ New Variable"** → **"Add Reference"**
2. Select **Postgres** → **DATABASE_URL**
3. Click **"+ New Variable"** → **"Add Reference"**
4. Select **Redis** → **REDIS_URL**

**Manual Variables**:

```env
NODE_ENV=production
PORT=3000
JWT_ACCESS_SECRET=CHANGE_THIS_TO_RANDOM_32_CHAR_STRING_abc123xyz789
JWT_REFRESH_SECRET=CHANGE_THIS_TO_ANOTHER_RANDOM_32_CHAR_STRING_def456
S3_BUCKET=sangatamizh-music
S3_REGION=auto
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
FRONTEND_URL=https://YOUR-FRONTEND-URL.vercel.app
```

> **Important**: Generate secure random strings for JWT secrets:
>
> ```bash
> # On Windows PowerShell
> -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
> ```

#### **D. Generate Public Domain**

1. Go to **"Settings"** tab
2. Scroll to **"Networking"**
3. Click **"Generate Domain"**
4. Copy your backend URL (e.g., `https://backend-production-abc123.up.railway.app`)
5. ✅ Save this URL!

---

### **Step 5: Deploy Frontend to Vercel**

1. Go to **[vercel.com/new](https://vercel.com/new)**
2. Import your GitHub repository: `thamodharangm/sangatamizh-music`
3. Configure:
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```
4. Add Environment Variable:
   ```
   VITE_API_URL=https://YOUR-BACKEND-URL.up.railway.app/api
   ```
   (Use the Railway backend URL from Step 4D)
5. Click **"Deploy"**
6. ✅ Frontend deployed!

---

### **Step 6: Update Backend CORS**

Now that you have the frontend URL:

1. Go back to Railway backend service
2. Go to **"Variables"** tab
3. Update `FRONTEND_URL` to your Vercel URL
4. Click **"Save"**
5. Backend will automatically redeploy

---

## ✅ Verify Deployment

### **Test Backend Health**

```bash
curl https://YOUR-BACKEND-URL.up.railway.app/health
```

**Expected Response**:

```json
{
  "status": "ok",
  "timestamp": "2025-12-07T..."
}
```

### **Test Frontend**

Visit: `https://YOUR-FRONTEND-URL.vercel.app`

You should see the music app UI!

---

## 🔧 Configuration Files Explained

### **railway.json**

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE", // Use Dockerfile for builds
    "buildCommand": "npm install && npx prisma generate && npm run build",
    "watchPatterns": ["/backend/**"], // Auto-deploy on backend changes
    "dockerfilePath": "backend/Dockerfile"
  },
  "deploy": {
    "runtime": "V2", // Use Railway V2 runtime
    "numReplicas": 1, // Number of instances
    "startCommand": "npx prisma migrate deploy && npm start",
    "sleepApplication": false, // Keep app always running
    "useLegacyStacker": false,
    "multiRegionConfig": {
      "us-east4-eqdc4a": {
        // Deploy to US East region
        "numReplicas": 1
      }
    },
    "restartPolicyType": "ON_FAILURE", // Auto-restart on crashes
    "restartPolicyMaxRetries": 10
  }
}
```

### **Dockerfile**

The production Dockerfile:

- Uses Alpine Linux for smaller image size
- Installs FFmpeg for audio processing
- Uses `npm ci` for faster, reproducible builds
- Includes health check endpoint
- Optimized for production

---

## 📊 Your Architecture

```
┌─────────────────────────────────────────┐
│         Railway Project                 │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │  PostgreSQL  │  │    Redis     │   │
│  │  (Database)  │  │   (Cache)    │   │
│  └──────────────┘  └──────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │      Backend Service            │   │
│  │  - Node.js + Express            │   │
│  │  - Prisma ORM                   │   │
│  │  - JWT Auth                     │   │
│  │  - FFmpeg Processing            │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
                  ↕
┌─────────────────────────────────────────┐
│            Vercel                       │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │      Frontend Service           │   │
│  │  - React + Vite                 │   │
│  │  - TypeScript                   │   │
│  │  - Responsive UI                │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 🛠️ Troubleshooting

### **Build Fails with Prisma Error**

**Error**: `Cannot find Prisma schema`

**Fix**:

1. Ensure `prisma/schema.prisma` exists in backend directory
2. Check that `dockerfilePath` in `railway.json` is correct
3. Verify root directory is set to `backend`

### **Deployment Crashes Immediately**

**Check**:

1. View logs in Railway dashboard
2. Ensure all environment variables are set
3. Verify `DATABASE_URL` is linked correctly

**Common Issues**:

- Missing `NODE_ENV=production`
- Invalid `DATABASE_URL` format
- Missing JWT secrets

### **CORS Errors in Frontend**

**Fix**:

1. Verify `FRONTEND_URL` in backend matches your Vercel URL exactly
2. Ensure it includes `https://` and no trailing slash
3. Redeploy backend after updating

### **Health Check Fails**

**Test manually**:

```bash
curl https://YOUR-BACKEND-URL.up.railway.app/health
```

**If it fails**:

1. Check if backend is running in Railway dashboard
2. View deployment logs
3. Ensure port 3000 is exposed in Dockerfile

---

## 🚀 Advanced: Using Railway CLI

### **Install CLI**

```bash
npm install -g @railway/cli
```

### **Login**

```bash
railway login
```

### **Link to Project**

```bash
cd d:\ai\sangtamizh-music\backend
railway link
```

### **View Logs**

```bash
railway logs
```

### **Deploy Manually**

```bash
railway up
```

### **Run Migrations**

```bash
railway run npx prisma migrate deploy
```

---

## 💰 Cost Estimate

Railway provides **$5 free credit/month**:

| Service    | Estimated Cost  |
| ---------- | --------------- |
| PostgreSQL | $1-2/month      |
| Redis      | $0.50/month     |
| Backend    | $1-2/month      |
| **Total**  | **~$3-4/month** |

✅ **Within free tier!**

Vercel is completely **FREE** for personal projects.

---

## 📝 Environment Variables Checklist

### **Backend (Railway)**

- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `DATABASE_URL` (linked from PostgreSQL)
- [ ] `REDIS_URL` (linked from Redis)
- [ ] `JWT_ACCESS_SECRET` (32+ characters)
- [ ] `JWT_REFRESH_SECRET` (32+ characters)
- [ ] `S3_BUCKET`
- [ ] `S3_REGION`
- [ ] `S3_ENDPOINT`
- [ ] `S3_ACCESS_KEY`
- [ ] `S3_SECRET_KEY`
- [ ] `FRONTEND_URL` (Vercel URL)

### **Frontend (Vercel)**

- [ ] `VITE_API_URL` (Railway backend URL + `/api`)

---

## 🎉 Success!

Your app should now be live at:

- **Frontend**: `https://sangatamizh-music.vercel.app`
- **Backend**: `https://backend-production-xyz.up.railway.app`
- **API Health**: `https://backend-production-xyz.up.railway.app/health`

---

## 📚 Next Steps

1. **Set up CI/CD**: Configure GitHub Actions for automated testing
2. **Add Monitoring**: Set up error tracking (e.g., Sentry)
3. **Configure S3**: Replace MinIO with production S3 (AWS, Cloudflare R2)
4. **Add Analytics**: Track user behavior
5. **Set up Backups**: Configure database backups in Railway

---

**Need help? Check Railway logs or create an issue on GitHub!** 🚂
