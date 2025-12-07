# 🚀 DEPLOY YOUR APP NOW - Step-by-Step Guide

**Generated**: December 7, 2025, 22:34 IST  
**Estimated Time**: 15 minutes  
**Cost**: $0/month (free tier)

---

## ✅ Pre-Deployment Checklist

- [x] Code is on GitHub: `thamodharangm/sangatamizh-music`
- [x] Railway.json configured (V2 runtime)
- [x] Dockerfile optimized
- [x] JWT secrets generated
- [ ] Railway account (create at railway.app)
- [ ] Vercel account (create at vercel.com)

---

## 🎯 PART 1: Deploy Backend to Railway (8 minutes)

### Step 1.1: Create Railway Account & Project

1. **Open**: [https://railway.app/new](https://railway.app/new)
2. **Click**: "Start a New Project"
3. **Sign in** with your GitHub account
4. **Authorize** Railway to access your repositories

✅ **You should now see an empty project dashboard**

---

### Step 1.2: Add PostgreSQL Database

1. **Click**: "+ New" button (top right)
2. **Select**: "Database"
3. **Choose**: "Add PostgreSQL"
4. **Wait** 10-20 seconds for provisioning

✅ **PostgreSQL service created!**

---

### Step 1.3: Add Redis Cache

1. **Click**: "+ New" button again
2. **Select**: "Database"
3. **Choose**: "Add Redis"
4. **Wait** 10-20 seconds for provisioning

✅ **Redis service created!**

---

### Step 1.4: Deploy Backend from GitHub

1. **Click**: "+ New" button
2. **Select**: "GitHub Repo"
3. **Search for**: `sangatamizh-music`
4. **Click**: "Deploy" on `thamodharangm/sangatamizh-music`

Railway will start building your backend...

---

### Step 1.5: Configure Backend Service

1. **Click** on the backend service (the one that's building)
2. **Go to**: "Settings" tab (left sidebar)
3. **Scroll down** to "Service Settings"
4. **Set Service Name**: `backend`
5. **Set Root Directory**: `backend`
6. **Click**: "Save Changes"

⚠️ **Important**: The service will rebuild after this change

---

### Step 1.6: Add Environment Variables

1. **Click**: "Variables" tab (left sidebar)
2. **Click**: "+ New Variable" button
3. **Add each variable below**:

#### **Method 1: Add References (Recommended for DB URLs)**

For `DATABASE_URL`:

- Click "+ New Variable"
- Click "Add Reference"
- Select "Postgres" service
- Select "DATABASE_URL"
- Click "Add"

For `REDIS_URL`:

- Click "+ New Variable"
- Click "Add Reference"
- Select "Redis" service
- Select "REDIS_URL"
- Click "Add"

#### **Method 2: Add Raw Variables**

Click "Raw Editor" and paste these:

```env
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

⚠️ **Note**: We'll update `FRONTEND_URL` after deploying frontend!

**Click**: "Save"

---

### Step 1.7: Generate Public Domain

1. **Go to**: "Settings" tab
2. **Scroll to**: "Networking" section
3. **Click**: "Generate Domain"
4. **Copy** the generated URL (looks like: `https://backend-production-abc123.up.railway.app`)

📋 **SAVE THIS URL** - You'll need it for the frontend!

Example: `https://backend-production-abc123.up.railway.app`

---

### Step 1.8: Wait for Deployment

1. **Go to**: "Deployments" tab
2. **Watch** the build logs
3. **Wait** for "Success" status (2-3 minutes)

✅ **Backend deployed!**

---

### Step 1.9: Test Backend

Open this URL in your browser (replace with your domain):

```
https://YOUR-BACKEND-URL.up.railway.app/health
```

**Expected Response**:

```json
{
  "status": "ok",
  "timestamp": "2025-12-07T..."
}
```

✅ **If you see this, backend is working!**

---

## 🎨 PART 2: Deploy Frontend to Vercel (5 minutes)

### Step 2.1: Create Vercel Account & Import Project

1. **Open**: [https://vercel.com/new](https://vercel.com/new)
2. **Sign in** with your GitHub account
3. **Click**: "Import Git Repository"
4. **Search for**: `sangatamizh-music`
5. **Click**: "Import" on your repository

---

### Step 2.2: Configure Project

On the configuration page, set:

**Framework Preset**: `Vite`

**Root Directory**:

- Click "Edit"
- Enter: `frontend`
- Click "Continue"

**Build Settings**:

- Build Command: `npm run build` (auto-detected)
- Output Directory: `dist` (auto-detected)
- Install Command: `npm install` (auto-detected)

---

### Step 2.3: Add Environment Variable

1. **Click**: "Environment Variables" section
2. **Add variable**:

   - **Name**: `VITE_API_URL`
   - **Value**: `https://YOUR-BACKEND-URL.up.railway.app/api`

   ⚠️ **Replace** `YOUR-BACKEND-URL` with your Railway backend URL from Step 1.7!

   Example: `https://backend-production-abc123.up.railway.app/api`

3. **Click**: "Add"

---

### Step 2.4: Deploy

1. **Click**: "Deploy" button
2. **Wait** 2-3 minutes for build and deployment
3. **Watch** the build logs

✅ **Frontend deployed!**

---

### Step 2.5: Get Your Frontend URL

After deployment completes:

1. **Click**: "Visit" button (or copy the URL shown)
2. **Your frontend URL** will look like: `https://sangatamizh-music.vercel.app`

📋 **SAVE THIS URL** - You'll need it for the next step!

---

## 🔗 PART 3: Connect Frontend & Backend (2 minutes)

### Step 3.1: Update Backend FRONTEND_URL

1. **Go back to**: [Railway Dashboard](https://railway.app)
2. **Click**: Your project
3. **Click**: Backend service
4. **Go to**: "Variables" tab
5. **Find**: `FRONTEND_URL` variable
6. **Update** its value to your Vercel URL (from Step 2.5)

   Example: `https://sangatamizh-music.vercel.app`

7. **Click**: "Save"

⚠️ **Backend will automatically redeploy** (takes 1-2 minutes)

---

### Step 3.2: Wait for Backend Redeploy

1. **Go to**: "Deployments" tab
2. **Wait** for the new deployment to complete
3. **Status** should show "Success"

✅ **Backend updated with correct CORS settings!**

---

## 🎉 PART 4: Test Your Live App!

### Test 1: Backend Health Check

Visit: `https://YOUR-BACKEND-URL.up.railway.app/health`

**Expected**:

```json
{ "status": "ok", "timestamp": "..." }
```

---

### Test 2: Frontend Loads

Visit: `https://YOUR-FRONTEND-URL.vercel.app`

**Expected**:

- ✅ Page loads without errors
- ✅ You see the login/signup page
- ✅ No CORS errors in browser console (F12)

---

### Test 3: Create Account

1. **Click**: "Sign Up"
2. **Enter**: Email and password
3. **Click**: "Create Account"

**Expected**:

- ✅ Account created successfully
- ✅ Redirected to dashboard

---

### Test 4: Login

1. **Enter**: Your email and password
2. **Click**: "Login"

**Expected**:

- ✅ Login successful
- ✅ Dashboard loads

---

## ✅ Success Checklist

- [ ] Backend health check returns `{"status": "ok"}`
- [ ] Frontend loads without errors
- [ ] No CORS errors in browser console
- [ ] Can create an account
- [ ] Can login
- [ ] Dashboard/upload page appears

---

## 🔧 Troubleshooting

### Problem: Backend health check fails

**Solution**:

1. Go to Railway → Backend service → Deployments
2. Check the logs for errors
3. Verify all environment variables are set
4. Ensure `DATABASE_URL` and `REDIS_URL` are linked correctly

---

### Problem: Frontend shows blank page

**Solution**:

1. Open browser console (F12)
2. Check for errors
3. Verify `VITE_API_URL` is set correctly in Vercel
4. Make sure it ends with `/api`
5. Redeploy frontend if needed

---

### Problem: CORS errors

**Solution**:

1. Verify `FRONTEND_URL` in Railway backend matches your Vercel URL exactly
2. No trailing slash in the URL
3. Must start with `https://`
4. Redeploy backend after updating

---

### Problem: Can't create account

**Solution**:

1. Check backend logs in Railway
2. Verify database migrations ran successfully
3. Check if PostgreSQL is running
4. Look for errors in browser console

---

## 📊 Your Live URLs

After completing all steps, save these:

**Frontend**: `https://sangatamizh-music.vercel.app`  
**Backend**: `https://backend-production-xyz.up.railway.app`  
**API Health**: `https://backend-production-xyz.up.railway.app/health`

---

## 💰 Monthly Cost

- **Railway**: $0 (within $5 free credit)
- **Vercel**: $0 (free tier)
- **Total**: **$0/month** ✅

---

## 🎯 What's Next?

After successful deployment:

1. **Share your app** with friends!
2. **Upload some songs** to test the full functionality
3. **Monitor** Railway logs for any issues
4. **Set up** production S3 storage (optional)
5. **Add** custom domain (optional)

---

## 📚 Additional Resources

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Detailed Guide**: `RAILWAY_DEPLOY_V2.md`
- **Quick Reference**: `RAILWAY_QUICK_REF.md`

---

## 🆘 Need Help?

If you encounter any issues:

1. **Check the logs** in Railway and Vercel dashboards
2. **Read** the troubleshooting section above
3. **Review** `TROUBLESHOOTING.md` in the project
4. **Create an issue** on GitHub

---

**🚀 Ready to deploy? Start with Part 1, Step 1.1!**

**Good luck! Your app will be live in ~15 minutes!** 🎉
