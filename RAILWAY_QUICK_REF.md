# 🚀 Quick Railway Deployment Reference

## ⚡ One-Minute Checklist

### Before Deployment

- [ ] Code pushed to GitHub
- [ ] `railway.json` configured in backend
- [ ] `Dockerfile` ready in backend
- [ ] Environment variables documented

### Railway Setup (5 minutes)

1. **Create Project** → railway.app/new
2. **Add PostgreSQL** → + New → Database → PostgreSQL
3. **Add Redis** → + New → Database → Redis
4. **Deploy Backend** → + New → GitHub Repo → Select repo
5. **Configure**:
   - Service Name: `backend`
   - Root Directory: `backend`
   - Add environment variables
   - Generate domain

### Vercel Setup (3 minutes)

1. **Import Repo** → vercel.com/new
2. **Configure**:
   - Framework: Vite
   - Root: `frontend`
   - Build: `npm run build`
   - Output: `dist`
3. **Add Env**: `VITE_API_URL=https://YOUR-BACKEND.up.railway.app/api`
4. **Deploy**

### Final Steps

1. Update backend `FRONTEND_URL` with Vercel URL
2. Test: `curl https://YOUR-BACKEND.up.railway.app/health`
3. Visit frontend URL

---

## 🔑 Required Environment Variables

### Backend (Railway)

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_ACCESS_SECRET=<32+ char random string>
JWT_REFRESH_SECRET=<32+ char random string>
S3_BUCKET=sangatamizh-music
S3_REGION=auto
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
FRONTEND_URL=https://YOUR-FRONTEND.vercel.app
```

### Frontend (Vercel)

```env
VITE_API_URL=https://YOUR-BACKEND.up.railway.app/api
```

---

## 🛠️ Common Commands

### Railway CLI

```bash
# Install
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# View logs
railway logs

# Deploy
railway up

# Run migrations
railway run npx prisma migrate deploy
```

### Generate JWT Secrets (PowerShell)

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

---

## 🔍 Quick Troubleshooting

| Issue              | Solution                                       |
| ------------------ | ---------------------------------------------- |
| Build fails        | Check logs, verify root directory is `backend` |
| Prisma error       | Ensure `prisma/schema.prisma` exists           |
| CORS error         | Update `FRONTEND_URL` in backend               |
| Health check fails | Check if backend is running, view logs         |
| Frontend blank     | Verify `VITE_API_URL` is correct               |

---

## 📊 Configuration Files

### railway.json

- **Builder**: DOCKERFILE
- **Runtime**: V2
- **Watch**: `/backend/**`
- **Replicas**: 1
- **Region**: us-east4

### Dockerfile

- **Base**: node:20-alpine
- **Includes**: FFmpeg
- **Build**: npm ci + prisma generate
- **Health Check**: /health endpoint
- **Port**: 3000

---

## 💡 Pro Tips

1. **Use References** for DATABASE_URL and REDIS_URL (not manual copy)
2. **Generate secure JWT secrets** (32+ characters)
3. **Match URLs exactly** (no trailing slashes)
4. **Check logs first** when debugging
5. **Use Railway CLI** for faster debugging

---

## 📞 Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Project Issues**: [GitHub Issues](https://github.com/thamodharangm/sangatamizh-music/issues)

---

**Total Time**: ~10 minutes  
**Cost**: $0/month (within free tiers)  
**Status**: Production-ready ✅
