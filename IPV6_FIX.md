# 🔧 IPv6/IPv4 CONNECTION FIX - RESOLVED!

## ✅ ISSUE FIXED

**Problem**: `Error: connect ECONNREFUSED ::1:3002`

**Root Cause**: Windows was trying to use IPv6 (`::1`) instead of IPv4 (`127.0.0.1`)

**Solution**: Changed Vite proxy to explicitly use `127.0.0.1` instead of `localhost`

---

## 🚀 WHAT I FIXED

### File Modified: `client-v2/vite.config.js`

**Changed**:

```javascript
// BEFORE (caused IPv6 issue)
target: "http://localhost:3002";

// AFTER (fixed - uses IPv4)
target: "http://127.0.0.1:3002";
```

**Also Added**:

- Proxy error logging
- Request logging for debugging

---

## 📋 RESTART INSTRUCTIONS

### Step 1: Stop Frontend

**In your `client-v2` terminal** (the one showing the errors):

- Press `Ctrl + C`

### Step 2: Restart Frontend

```powershell
npm run dev
```

### Step 3: Verify

- Should start on port **5174** (not 5175)
- No more `ECONNREFUSED` errors
- Open: http://localhost:5174

---

## ✅ EXPECTED OUTPUT

After restart, you should see:

```
  ➜  Local:   http://localhost:5174/
  ➜  Network: http://192.168.31.231:5174/

[Proxy Request] GET /api/songs
[Proxy Request] GET /api/home-sections
```

**No errors!** ✅

---

## 🧪 VERIFICATION CHECKLIST

- [ ] Frontend starts on port 5174
- [ ] No `ECONNREFUSED` errors
- [ ] Browser shows songs loading
- [ ] Console shows `[Proxy Request]` logs
- [ ] Music player works

---

## 🔍 WHY THIS HAPPENED

**Windows IPv6 Behavior**:

- `localhost` can resolve to either `127.0.0.1` (IPv4) or `::1` (IPv6)
- Windows sometimes prefers IPv6
- Node.js backend was listening on IPv4
- Vite proxy tried IPv6 → Connection refused

**The Fix**:

- Explicitly use `127.0.0.1` (IPv4)
- Ensures consistent connection
- Works on all Windows systems

---

## 📝 ADDITIONAL IMPROVEMENTS

I also added **debug logging** to help troubleshoot future issues:

```javascript
configure: (proxy, _options) => {
  proxy.on("error", (err, _req, _res) => {
    console.log("[Proxy Error]", err);
  });
  proxy.on("proxyReq", (proxyReq, req, _res) => {
    console.log("[Proxy Request]", req.method, req.url);
  });
};
```

Now you'll see all proxy requests in the console!

---

## 🚀 QUICK RESTART

```powershell
# In client-v2 terminal
Ctrl + C
npm run dev

# Wait for:
# ➜  Local:   http://localhost:5174/

# Open browser:
# http://localhost:5174
```

---

## ✅ STATUS

**Fix Applied**: ✅ Complete  
**File Modified**: `client-v2/vite.config.js`  
**Action Required**: Restart frontend (`Ctrl+C`, then `npm run dev`)  
**Expected Time**: 30 seconds

---

**The fix is ready! Just restart the frontend and you're good to go!** 🎉
