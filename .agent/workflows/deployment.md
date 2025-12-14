---
description: Deployment Guide for Sangatamizh Music
---

# Deploy Live 🚀 (Dual Frontend Strategy)

You have two separate frontends: **Desktop** (`client`) and **Mobile** (`client-v2`). The professional way to deploy this is using **Subdomains** (like `facebook.com` vs `m.facebook.com`).

## 1. Backend (Railway)

_This is the shared brain for both apps._

1. Deploy `backend` to Railway (as per previous instructions).
2. Copy your **Railway App URL** (e.g., `https://api.sangatamizh.com`).

---

## 2. Desktop Deployment (Vercel)

_This will be your main site (e.g., `sangatamizh.com`)._

1. Go to Vercel -> **Add New Project**.
2. Select Repo: `thamodharangm/sangatamizh-music`.
3. **Root Directory**: `client` (Select the Desktop folder).
4. **Environment Variables**:
   - `VITE_API_URL`: Your Railway URL + `/api`.
5. **Deploy**.
6. **Domain**: Connect your main domain (e.g., `sangatamizh.com`).

---

## 3. Mobile Deployment (Vercel)

_This will be your mobile site (e.g., `m.sangatamizh.com`)._

1. Go to Vercel -> **Add New Project** (Again).
2. Select SAME Repo: `thamodharangm/sangatamizh-music`.
3. **Project Name**: `sangatamizh-mobile` (to distinguish it).
4. **Root Directory**: `client-v2` (**Crucial**: Select the Mobile folder).
5. **Environment Variables**:
   - `VITE_API_URL`: Your Railway URL + `/api`.
6. **Deploy**.
7. **Domain**: Connect a subdomain (e.g., `m.sangatamizh.com`).

---

## 4. The "Magic" Redirect 🪄

To make users go to the right place automatically, add this script to your **Desktop** code.

**Step 1:** Open `client/index.html` (Desktop).
**Step 2:** Paste this script inside the `<head>` tag:

```html
<script>
  // Mobile Detection Redirect
  if (
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  ) {
    // Replace with your actual Vercel Mobile URL
    window.location.href = "https://m.your-domain.com";
  }
</script>
```

Now:

- **PC Users** -> Go to `sangatamizh.com` -> Stay there.
- **Mobile Users** -> Go to `sangatamizh.com` -> Auto-redirected to `m.sangatamizh.com`.
