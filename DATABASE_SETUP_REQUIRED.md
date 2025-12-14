# 🔧 BACKEND DATABASE SETUP REQUIRED

## ⚠️ Issue

The backend is running but cannot connect to the database. You're seeing:

- "No songs available" on both desktop and mobile
- Prisma error: `Invalid prisma.song.findMany() invocation`

## ✅ Solution

### **Step 1: Create `.env` file in backend folder**

Create a file: `d:\sangatamizh\backend\.env`

Add this content:

```env
DATABASE_URL="your_database_connection_string_here"
JWT_SECRET="your_jwt_secret_here"
```

### **Step 2: Get Database URL**

You need a PostgreSQL database. Options:

#### **Option A: Supabase** (Recommended - Free)

1. Go to https://supabase.com
2. Create a free account
3. Create a new project
4. Go to Settings → Database
5. Copy the "Connection string" (URI format)
6. Paste it as `DATABASE_URL` in `.env`

#### **Option B: Local PostgreSQL**

```env
DATABASE_URL="postgresql://username:password@localhost:5432/sangatamizh"
```

### **Step 3: Run Prisma Migration**

After creating `.env`:

```bash
cd backend
npx prisma generate
npx prisma db push
```

### **Step 4: Restart Backend**

```bash
npm start
```

---

## 📝 Example `.env` File

```env
# Database (Supabase or PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/database"

# JWT Secret (any random string)
JWT_SECRET="your-super-secret-jwt-key-12345"

# Optional
PORT=3002
```

---

## 🎯 After Setup

Once the database is connected:

1. **Desktop**: http://localhost:5173
2. **Login** as admin
3. Go to **Admin → Upload**
4. Add songs from YouTube or upload files
5. Songs will appear on both desktop and mobile!

---

## 🔍 Verify Database Connection

After setup, test:

```bash
curl http://localhost:3002/api/songs
```

Should return: `[]` (empty array) instead of error

---

## 📊 Current Status

- ✅ Frontend (Desktop): Running on 5173
- ✅ Frontend (Mobile): Running on 5175
- ⚠️ Backend: Running on 3002 but **NO DATABASE**
- ❌ Database: **NOT CONFIGURED**

**Next Step**: Create `.env` file with database connection!

---

**Need help?** Let me know if you need assistance setting up Supabase or local PostgreSQL!
