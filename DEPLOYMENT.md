# 🚀 Free Deployment Guide for Students (Sangatamizh Music)

Since you are a student looking for a **100% Free** solution, here is the best "Forever Free" stack for your application:

| Component    | Service      | Why?                                                                     | cost |
| :----------- | :----------- | :----------------------------------------------------------------------- | :--- |
| **Frontend** | **Vercel**   | Best for React/Vite. Fast, simple, forever free.                         | $0   |
| **Backend**  | **Render**   | Supports Node.js/Express. Has a free tier (spins down after inactivity). | $0   |
| **Database** | **Supabase** | You are already using this! Excellent free Postgres DB (500MB).          | $0   |
| **Media**    | **Supabase** | File storage for songs/images.                                           | $0   |

---

## 🛑 Prerequisite: Git

Make sure your project is pushed to **GitHub**. You will deploy directly from your GitHub repository.

1. Create a repo on GitHub (e.g., `sangatamizh-music`).
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/sangatamizh-music.git
   git push -u origin main
   ```

---

## Part 1: Database (Supabase)

_You likely already have this set up._

1. Log in to [Supabase](https://supabase.com/).
2. Go to **Project Settings** -> **Database**.
3. Copy the **Connection String** (URI Mode). It looks like:
   `postgres://postgres.xxxx:password@aws-0-region.pooler.supabase.com:6543/postgres`
   _You will need this for the Backend deployment._

---

## Part 2: Backend Deployment (Render)

1. **Sign Up**: Go to [Render](https://render.com/) and sign up with GitHub.
2. **New Web Service**:
   - Click "New +" -> **"Web Service"**.
   - Select your `sangatamizh-music` repository.
3. **Configure**:
   - **Name**: `sangatamizh-backend`
   - **Region**: Closest to you (e.g., Singapore/Frankfurt).
   - **Root Directory**: `backend` (Important! Your backend code is in this folder).
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`
   - **Instance Type**: Select **Free**.
4. **Environment Variables**:
   Scroll down to "Environment Variables" and add these (copy from your local `.env`):
   - `DATABASE_URL`: (Your Supabase connection string from Part 1)
   - `SUPABASE_URL`: (Your Supabase Project URL)
   - `SUPABASE_KEY`: (Your Supabase Anon Key)
   - `YT_API_KEY`: (Your YouTube API Key)
   - `PORT`: `10000` (Render creates this automatically, but good to be safe)
5. **Deploy**: Click "Create Web Service".
   - _Wait ~5 minutes._ Once it says "Live", copy the **Service URL** (e.g., `https://sangatamizh-backend.onrender.com`).

---

## Part 3: Frontend Deployment (Vercel)

1. **Sign Up**: Go to [Vercel](https://vercel.com/) and sign up with GitHub.
2. **Add New**: Click "Add New..." -> **"Project"**.
3. **Import**: Find `sangatamizh-music` and click **Import**.
4. **Configure**:
   - **Framework Preset**: Vite (Automatic).
   - **Root Directory**: Click "Edit" and select `client`.
5. **Environment Variables**:
   - `VITE_API_URL`: Paste your **Render Backend URL** here (e.g., `https://sangatamizh-backend.onrender.com`).
   - `VITE_FIREBASE_API_KEY`: (Copy from local .env)
   - `VITE_FIREBASE_AUTH_DOMAIN`: (Copy from local .env)
   - `VITE_FIREBASE_PROJECT_ID`: (Copy from local .env)
   - ... (Add all other Firebase config variables)
6. **Deploy**: Click "Deploy".

---

## 🎉 Done!

Your app will be live at a URL like `https://sangatamizh-music.vercel.app`.

### ⚠️ Important Note on "Free" Backend

The **Render Free Tier** backend goes to "sleep" after 15 minutes of inactivity.

- The **first time** you visit your site after a break, it might take **30-50 seconds** to load data.
- This is normal for free hosting. Once awake, it runs fast!
