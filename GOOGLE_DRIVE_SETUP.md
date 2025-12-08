# 📁 Google Drive Storage Setup Guide

Complete guide to use Google Drive as file storage for Sangatamizh Music.

---

## 🎯 **Why Google Drive?**

- ✅ **15GB FREE** storage
- ✅ **No credit card** required
- ✅ **You already have** Google account
- ✅ **Reliable** Google infrastructure
- ✅ **Easy sharing** and streaming
- ✅ **$0/month** forever

---

## 📋 **PART 1: Google Cloud Console Setup (10 minutes)**

### **Step 1: Create Google Cloud Project**

1. Go to: **[console.cloud.google.com](https://console.cloud.google.com)**
2. Click **"Select a project"** (top bar)
3. Click **"New Project"**
4. Fill in:
   - **Project name**: `Sangatamizh Music`
   - **Organization**: Leave as is
5. Click **"Create"**
6. Wait 30 seconds for project creation

---

### **Step 2: Enable Google Drive API**

1. In your new project, click **"APIs & Services"** → **"Library"** (left sidebar)
2. Search for: `Google Drive API`
3. Click **"Google Drive API"**
4. Click **"Enable"**
5. Wait for API to enable

---

### **Step 3: Create Service Account**

1. Click **"APIs & Services"** → **"Credentials"** (left sidebar)
2. Click **"Create Credentials"** → **"Service Account"**
3. Fill in:
   - **Service account name**: `sangatamizh-storage`
   - **Service account ID**: (auto-filled)
   - **Description**: `Storage service for music files`
4. Click **"Create and Continue"**
5. **Role**: Select **"Editor"** (or "Storage Admin")
6. Click **"Continue"**
7. Click **"Done"**

---

### **Step 4: Create Service Account Key**

1. Click on the service account you just created
2. Go to **"Keys"** tab
3. Click **"Add Key"** → **"Create new key"**
4. Select **"JSON"**
5. Click **"Create"**
6. **IMPORTANT**: A JSON file will download - **SAVE IT SECURELY!**
7. This file contains your credentials

---

### **Step 5: Get Service Account Email**

1. Open the downloaded JSON file
2. Find the line: `"client_email": "sangatamizh-storage@..."`
3. **Copy this email** - you'll need it in next step

---

## 📁 **PART 2: Google Drive Setup (5 minutes)**

### **Step 1: Create Upload Folder**

1. Go to: **[drive.google.com](https://drive.google.com)**
2. Click **"New"** → **"Folder"**
3. Name it: `Sangatamizh Music`
4. Click **"Create"**

---

### **Step 2: Share Folder with Service Account**

1. **Right-click** the folder you just created
2. Click **"Share"**
3. In "Add people" field, **paste the service account email** from Step 5 above
4. Set permission to: **"Editor"**
5. **Uncheck** "Notify people"
6. Click **"Share"**
7. Click **"Share anyway"** if warned

---

### **Step 3: Get Folder ID**

1. **Open** the folder you created
2. Look at the URL in browser:
   ```
   https://drive.google.com/drive/folders/FOLDER_ID_HERE
   ```
3. **Copy the FOLDER_ID** (the long string after `/folders/`)
4. Example: `1a2b3c4d5e6f7g8h9i0j`

---

## 🔧 **PART 3: Configure Backend (Render)**

### **Step 1: Prepare Service Account JSON**

1. Open the JSON file you downloaded
2. Copy **ALL** the content
3. **Minify it** (remove line breaks) - use: [jsonformatter.org/json-minify](https://jsonformatter.org/json-minify)
4. You should have one long line of JSON

---

### **Step 2: Add Environment Variables to Render**

1. Go to: **[dashboard.render.com](https://dashboard.render.com)**
2. Click your **backend service**
3. Click **"Environment"** tab
4. Add these variables:

```env
# Google Drive Configuration
GOOGLE_DRIVE_FOLDER_ID=your-folder-id-from-step-3
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
```

**Example:**

```env
GOOGLE_DRIVE_FOLDER_ID=1a2b3c4d5e6f7g8h9i0j
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"sangatamizh-music-123456","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIE...","client_email":"sangatamizh-storage@sangatamizh-music-123456.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/sangatamizh-storage%40sangatamizh-music-123456.iam.gserviceaccount.com"}
```

**IMPORTANT**:

- `GOOGLE_SERVICE_ACCOUNT_JSON` should be the **entire minified JSON** on one line
- Make sure there are no line breaks

---

### **Step 3: Save and Redeploy**

1. Click **"Save Changes"**
2. Render will automatically redeploy (2-3 minutes)
3. Wait for deployment to complete

---

## 🧪 **PART 4: Test the Setup**

### **Test 1: Check Backend Logs**

1. In Render, go to **"Logs"** tab
2. Look for: `✓ Google Drive configured successfully`
3. Should NOT see: `⚠️ Google Drive not configured`

---

### **Test 2: Upload Test File**

```bash
# Get presigned upload URL
curl "https://sangatamizh-music-backend.onrender.com/api/upload/presign?filename=test.mp3&contentType=audio/mpeg" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: Should return upload URL and key

---

### **Test 3: Check Google Drive**

1. Go to your Google Drive folder
2. After uploading, you should see the file appear
3. File should be named with timestamp: `1234567890-test.mp3`

---

## 📊 **How It Works**

### **Upload Flow:**

1. **Frontend** requests upload URL from backend
2. **Backend** creates file metadata in Google Drive
3. **Backend** returns upload URL
4. **Frontend** uploads file to Google Drive
5. **Backend** makes file publicly accessible
6. **Frontend** completes upload

### **Streaming Flow:**

1. **Frontend** requests stream URL for song
2. **Backend** generates public Google Drive link
3. **Frontend** plays audio from Google Drive

---

## 🔐 **Security**

- ✅ **Service Account** - Isolated access
- ✅ **Folder-specific** - Only access to one folder
- ✅ **Public links** - Only for uploaded files
- ✅ **Authentication required** - Must be logged in to upload

---

## 💰 **Cost: $0/month**

Google Drive Free Tier:

- ✅ **15GB storage**
- ✅ **Unlimited downloads**
- ✅ **No bandwidth charges**
- ✅ **No API charges** (within limits)

**You can store 300-750 songs for FREE!**

---

## 📝 **Environment Variables**

### **Backend (.env)**

```env
# Google Drive Configuration
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

---

## ✅ **Setup Checklist**

- [ ] Google Cloud project created
- [ ] Google Drive API enabled
- [ ] Service account created
- [ ] Service account key (JSON) downloaded
- [ ] Service account email copied
- [ ] Google Drive folder created
- [ ] Folder shared with service account
- [ ] Folder ID copied
- [ ] JSON minified (one line)
- [ ] Environment variables added to Render
- [ ] Backend redeployed
- [ ] Tested upload
- [ ] File appears in Google Drive

---

## 🆘 **Troubleshooting**

### **Error: "Invalid credentials"**

**Fix:**

- Check `GOOGLE_SERVICE_ACCOUNT_JSON` is valid JSON
- Make sure it's on ONE line (minified)
- Check for any escaped quotes or special characters

---

### **Error: "Folder not found"**

**Fix:**

- Check `GOOGLE_DRIVE_FOLDER_ID` is correct
- Make sure folder is shared with service account email
- Check service account has "Editor" permission

---

### **Error: "Permission denied"**

**Fix:**

- Make sure folder is shared with service account
- Check permission is "Editor" not "Viewer"
- Try removing and re-sharing the folder

---

### **File uploads but doesn't appear in Drive**

**Fix:**

- Check you're looking in the correct folder
- Refresh Google Drive
- Check service account email in folder sharing settings

---

## 📚 **Additional Resources**

- [Google Drive API Docs](https://developers.google.com/drive/api/guides/about-sdk)
- [Service Accounts Guide](https://cloud.google.com/iam/docs/service-accounts)
- [Google Drive Quotas](https://developers.google.com/drive/api/guides/limits)

---

## 🎉 **You're Done!**

Your Google Drive storage is now configured!

**Benefits:**

- ✅ 15GB free storage
- ✅ No credit card needed
- ✅ Reliable Google infrastructure
- ✅ Easy file management
- ✅ Public streaming links

**Next steps:**

1. Test upload from frontend
2. Verify files appear in Google Drive
3. Test streaming
4. Celebrate! 🎊

---

**Need help? Check the troubleshooting section or review Render logs!**
