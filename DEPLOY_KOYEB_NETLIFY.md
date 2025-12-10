# 🚀 Deployment Guide: Koyeb (Backend) + Netlify (Frontend)

This is a high-performance, forever-free stack. Koyeb keeps your backend awake, and Netlify serves your frontend via a global CDN.

---

## 🛑 Phase 0: GitHub Setup (Required)

You must push your code to GitHub first.

1.  **Create a Repository** on GitHub (e.g., `sangatamizh-music`).
2.  **Push your Code**:
    Open your terminal in `d:\sangatamizh` and run:

    ```powershell
    git init
    # Create a .gitignore file if you don't have one to ignore node_modules
    echo "node_modules/" >> .gitignore
    echo ".env" >> .gitignore

    git add .
    git commit -m "Ready for deploy"
    git branch -M main
    git remote add origin https://github.com/YOUR_GITHUB_USERNAME/sangatamizh-music.git
    git push -u origin main
    ```

---

## ⚡ Phase 1: Deploy Backend (Koyeb)

1.  **Sign Up**: Go to [koyeb.com](https://www.koyeb.com/) and login with GitHub.
2.  **Create App**:
    - Click **"Create App"**.
    - Select **"GitHub"** as the source.
    - Choose your `sangatamizh-music` repository.
3.  **Configure Service**:
    - **Builder**: `Node.js`
    - **Root Directory**: `backend` (⚠️ Important: Type `backend` here so it finds your package.json).
    - **Build Command**: `npm install && npx prisma generate`
    - **Run Command**: `npm start`
4.  **Environment Variables**:
    Click "Add Variable" and add these (copy exact values from your local `.env`):
    - `DATABASE_URL`
    - `SUPABASE_URL`
    - `SUPABASE_KEY`
    - `YT_API_KEY`
    - `PORT`: `8000` (Koyeb usually listens on 8000 by default, or sets `PORT` automatically. Setting this ensures alignment).
5.  **Deploy**:
    - Click **"Deploy"**.
    - Wait a few minutes.
    - Once "Healthy", copy the **Public URL** (e.g., `https://funny-name-koyeb.app`).
    - _Save this URL!_

---

## 🌐 Phase 2: Deploy Frontend (Netlify)

1.  **Sign Up**: Go to [netlify.com](https://www.netlify.com/) and login with GitHub.
2.  **New Site**:
    - Click **"Add new site"** -> **"Import an existing project"**.
    - Select **GitHub**.
    - Pick your `sangatamizh-music` repo.
3.  **Configure Build**:
    - **Base directory**: `client`
    - **Build command**: `npm run build`
    - **Publish directory**: `dist` (Vite creates a 'dist' folder).
4.  **Environment Variables**:

    - Click **"Add environment variable"**.
    - **Key**: `VITE_API_URL`
    - **Value**: (Paste your **Koyeb Backend URL** here, e.g., `https://funny-name-koyeb.app`).

    _Add your Firebase config variables too:_

    - `VITE_FIREBASE_API_KEY`
    - `VITE_FIREBASE_AUTH_DOMAIN`
    - `VITE_FIREBASE_PROJECT_ID`
    - ... (add the rest from your local client `.env`)

5.  **Deploy**:
    - Click **"Deploy"**.
    - Use the generated URL (e.g., `https://sangatamizh.netlify.app`) to visit your site.

---

## 🔄 Final Step: Update Cors (Optional)

If your backend rejects the Netlify request:

1.  Go to your backend code (`server.js` or `app.js`).
2.  Update the CORS origin to include your new Netlify URL.
3.  Git add, commit, and push. Koyeb will auto-redeploy!
