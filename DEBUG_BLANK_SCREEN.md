# 🔍 BLANK SCREEN DEBUGGING GUIDE

## Issue: Still Getting Blank Screen

Since the browser subagent isn't working, here's how to debug manually:

---

## 🧪 STEP 1: Check Browser Console

1. **Open your browser** to http://localhost:5174
2. **Press F12** to open Developer Tools
3. **Click on "Console" tab**
4. **Look for errors** (red text)

### Common Errors to Look For:

**Error Type 1: React Error**

```
Uncaught Error: Minified React error #...
```

**Solution**: There's a React component error

**Error Type 2: Module Error**

```
Failed to resolve module specifier
```

**Solution**: Import path issue

**Error Type 3: Undefined Function**

```
... is not a function
```

**Solution**: Function not exported or imported correctly

---

## 🧪 STEP 2: Check Network Tab

1. **Click on "Network" tab** in Developer Tools
2. **Refresh the page** (Ctrl+R)
3. **Look for failed requests** (red status codes)

### What to Check:

- Is `main.jsx` loading? (should be 200 OK)
- Are there any 404 errors?
- Are there any CORS errors?

---

## 🧪 STEP 3: Force Reload Vite

The issue might be that Vite hasn't picked up the changes.

### Option 1: Hard Refresh

```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### Option 2: Clear Cache and Reload

1. Open DevTools (F12)
2. **Right-click** on the refresh button
3. Select **"Empty Cache and Hard Reload"**

### Option 3: Restart Vite Dev Server

```powershell
# In the client-v2 terminal
Ctrl + C  # Stop the server
npm run dev  # Start again
```

---

## 🧪 STEP 4: Check for Syntax Errors

Run ESLint to check for syntax errors:

```powershell
cd d:\sangatamizh\client-v2
npm run lint
```

---

## 🧪 STEP 5: Test with Simple Component

Create a test to see if React is working at all:

**File**: `client-v2/src/pages/Test.jsx`

```javascript
export default function Test() {
  return (
    <div style={{ color: "white", padding: "20px" }}>
      <h1>Test Page Works!</h1>
      <p>If you see this, React is working</p>
    </div>
  );
}
```

**Add route** in `App.jsx`:

```javascript
import Test from "./pages/Test";

// In Routes:
<Route path="/test" element={<Test />} />;
```

**Visit**: http://localhost:5174/test

---

## 🧪 STEP 6: Check MusicContext

Add console.log to see if MusicContext is loading:

**File**: `client-v2/src/context/MusicContext.jsx`

Add at the top of the component:

```javascript
export const MusicProvider = ({ children }) => {
  console.log('[MusicContext] Provider rendering');  // ADD THIS
  const { user, updateStats } = useAuth();
  // ... rest of code
```

**Check console** - you should see:

```
[MusicContext] Provider rendering
```

---

## 🧪 STEP 7: Check AuthContext

The issue might be in AuthContext:

**File**: `client-v2/src/context/AuthContext.jsx`

Check if there are any errors in this file.

---

## 🔍 MOST LIKELY CAUSES

Based on the symptoms, here are the most likely issues:

### 1. **Vite Not Reloading** (80% likely)

**Solution**: Hard refresh or restart Vite

### 2. **React Error in MusicContext** (15% likely)

**Solution**: Check console for React errors

### 3. **Import/Export Mismatch** (5% likely)

**Solution**: Check all imports are correct

---

## 📋 QUICK CHECKLIST

- [ ] Opened http://localhost:5174 in browser
- [ ] Pressed F12 to open DevTools
- [ ] Checked Console tab for errors
- [ ] Tried hard refresh (Ctrl+Shift+R)
- [ ] Restarted Vite dev server
- [ ] Checked Network tab for failed requests
- [ ] Added console.log to MusicContext
- [ ] Checked if test page works

---

## 🆘 IF STILL NOT WORKING

### Share These Details:

1. **Console Errors**: Copy any red errors from console
2. **Network Errors**: Any failed requests?
3. **Vite Output**: What does the terminal show?
4. **Test Page**: Does `/test` route work?

---

## 🎯 EXPECTED BEHAVIOR

When working correctly:

1. **Browser loads** http://localhost:5174
2. **Console shows**:
   ```
   [MusicContext] Provider rendering
   [iOS] Audio unlocked successfully
   ```
3. **Page displays** songs in a grid
4. **Clicking song** shows music player
5. **Audio plays**

---

## 🔧 EMERGENCY FIX

If nothing works, try this nuclear option:

```powershell
# Stop all Node processes
Get-Process node | Stop-Process -Force

# Clear node_modules and reinstall
cd d:\sangatamizh\client-v2
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install

# Restart
npm run dev
```

---

**Follow these steps and let me know what errors you see in the console!** 🔍
