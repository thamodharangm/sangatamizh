# 🗄️ Cloudflare R2 File Storage Setup Guide

Complete guide to configure Cloudflare R2 for your Sangatamizh Music app.

---

## 📋 **PART 1: Cloudflare R2 Setup (15 minutes)**

### **Step 1: Create Cloudflare Account**

1. Go to: **[dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)**
2. Sign up with your email
3. Verify your email
4. Login to dashboard

---

### **Step 2: Enable R2**

1. In Cloudflare dashboard, click **"R2"** in left sidebar
2. If prompted, click **"Purchase R2"** or **"Enable R2"**
3. **Note**: R2 is FREE for first 10GB storage + 10M Class A operations/month

---

### **Step 3: Create R2 Bucket**

1. Click **"Create bucket"**
2. **Bucket name**: `sangatamizh-music` (must be globally unique)
   - If taken, try: `sangatamizh-music-prod` or `sangatamizh-music-[your-name]`
3. **Location**: Leave as "Automatic" (or choose closest region)
4. Click **"Create bucket"**
5. ✅ Bucket created!

---

### **Step 4: Create API Token**

1. In R2 dashboard, click **"Manage R2 API Tokens"** (top right)
2. Click **"Create API token"**
3. Fill in:
   - **Token name**: `sangatamizh-music-token`
   - **Permissions**:
     - ✅ **Object Read & Write**
     - ✅ **Admin Read & Write**
   - **TTL**: Forever (or set expiration date)
   - **Specific bucket** (optional): Select `sangatamizh-music`
4. Click **"Create API Token"**

---

### **Step 5: Save Credentials** ⚠️ IMPORTANT

You'll see a screen with:

```
Access Key ID: abc123...
Secret Access Key: xyz789...
Endpoint for S3 Clients: https://[account-id].r2.cloudflarestorage.com
```

**COPY AND SAVE THESE IMMEDIATELY!** You won't see them again.

Save them in a secure place (password manager, notes app, etc.)

---

### **Step 6: Configure CORS (Optional but Recommended)**

1. Go back to your bucket
2. Click **"Settings"** tab
3. Scroll to **"CORS policy"**
4. Click **"Add CORS policy"**
5. Paste this:

```json
[
  {
    "AllowedOrigins": [
      "https://sangatamizh-music.vercel.app",
      "http://localhost:5173"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

6. Click **"Save"**

---

## 🔧 **PART 2: Configure Backend (Render)**

### **Step 1: Add Environment Variables**

1. Go to: **[dashboard.render.com](https://dashboard.render.com)**
2. Click your **backend service**
3. Click **"Environment"** tab
4. Click **"Add Environment Variable"**

Add these variables (use your actual values from Step 5):

```env
S3_BUCKET=sangatamizh-music
S3_REGION=auto
S3_ENDPOINT=https://[your-account-id].r2.cloudflarestorage.com
S3_ACCESS_KEY=[your-access-key-id]
S3_SECRET_KEY=[your-secret-access-key]
```

**Example:**

```env
S3_BUCKET=sangatamizh-music
S3_REGION=auto
S3_ENDPOINT=https://abc123def456.r2.cloudflarestorage.com
S3_ACCESS_KEY=a1b2c3d4e5f6g7h8i9j0
S3_SECRET_KEY=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1
```

### **Step 2: Save and Redeploy**

1. Click **"Save Changes"**
2. Render will automatically redeploy (2-3 minutes)
3. Wait for deployment to complete

---

## 🧪 **PART 3: Test the Setup**

### **Test 1: Check Backend Logs**

1. In Render, go to **"Logs"** tab
2. Look for: `✓ S3/R2 configured successfully` (or no warnings)
3. Should NOT see: `⚠️ S3/R2 credentials not configured`

---

### **Test 2: Get Presigned URL (curl)**

```bash
# Replace with your actual backend URL and token
curl -X GET "https://sangatamizh-music-backend.onrender.com/api/upload/presign?filename=test.mp3&contentType=audio/mpeg&fileType=audio" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected response:**

```json
{
  "uploadUrl": "https://...r2.cloudflarestorage.com/...",
  "key": "audios/1234567890-test.mp3",
  "expiresIn": 300,
  "message": "Upload URL generated successfully"
}
```

---

### **Test 3: Upload a File**

```bash
# Step 1: Get presigned URL (save the uploadUrl from response)
UPLOAD_URL="[paste uploadUrl from above]"

# Step 2: Upload file
curl -X PUT "$UPLOAD_URL" \
  -H "Content-Type: audio/mpeg" \
  --data-binary "@/path/to/your/test.mp3"
```

**Expected response:** Empty (200 OK)

---

### **Test 4: Complete Upload**

```bash
curl -X POST "https://sangatamizh-music-backend.onrender.com/api/upload/complete" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "audios/1234567890-test.mp3",
    "title": "Test Song",
    "artist": "Test Artist"
  }'
```

**Expected response:**

```json
{
  "message": "Upload completed successfully",
  "song": {
    "id": "...",
    "title": "Test Song",
    "artist": "Test Artist",
    "storageKey": "audios/1234567890-test.mp3"
  }
}
```

---

## 📊 **PART 4: Frontend Integration**

The frontend upload service is already created at:
`frontend/src/services/upload.service.ts`

### **Usage Example:**

```typescript
import { uploadSong } from "../services/upload.service";

// In your component
const handleUpload = async (file: File) => {
  try {
    const result = await uploadSong(
      file,
      {
        title: "My Song",
        artist: "Artist Name",
        album: "Album Name",
        genre: "Pop",
      },
      (progress) => {
        console.log(`Upload progress: ${progress.percentage}%`);
      }
    );

    console.log("Upload complete:", result);
  } catch (error) {
    console.error("Upload failed:", error);
  }
};
```

---

## 🔐 **Security Features**

### **✅ Implemented:**

1. **Presigned URLs** - Direct upload to R2, no file passes through backend
2. **Short TTL** - URLs expire in 5 minutes
3. **File Type Validation** - Only allowed MIME types
4. **File Size Validation** - Max 50MB for audio, 5MB for images
5. **Authentication Required** - Must be logged in to upload
6. **Unique Keys** - Timestamp + sanitized filename prevents conflicts

### **Allowed File Types:**

**Audio:**

- audio/mpeg, audio/mp3
- audio/wav
- audio/ogg
- audio/flac
- audio/aac, audio/m4a

**Images:**

- image/jpeg, image/jpg
- image/png
- image/webp
- image/gif

---

## 📝 **Environment Variables Reference**

### **Backend (.env)**

```env
# Cloudflare R2 Configuration
S3_BUCKET=sangatamizh-music
S3_REGION=auto
S3_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
S3_ACCESS_KEY=[your-access-key]
S3_SECRET_KEY=[your-secret-key]

# Optional: Public URL for CDN
R2_PUBLIC_URL=https://pub-[hash].r2.dev
```

### **Frontend (.env)**

```env
VITE_API_URL=https://sangatamizh-music-backend.onrender.com/api
```

---

## 🚀 **API Endpoints**

### **1. Get Presigned Upload URL**

```
GET /api/upload/presign
```

**Query Parameters:**

- `filename` (required): Original filename
- `contentType` (required): MIME type
- `fileType` (optional): 'audio' or 'image' (default: 'audio')
- `contentLength` (optional): File size in bytes

**Response:**

```json
{
  "uploadUrl": "https://...",
  "key": "audios/1234567890-song.mp3",
  "expiresIn": 300
}
```

---

### **2. Complete Upload**

```
POST /api/upload/complete
```

**Body:**

```json
{
  "key": "audios/1234567890-song.mp3",
  "title": "Song Title",
  "artist": "Artist Name",
  "album": "Album Name",
  "duration": 180,
  "genre": "Pop"
}
```

**Response:**

```json
{
  "message": "Upload completed successfully",
  "song": {
    "id": "...",
    "title": "Song Title",
    "artist": "Artist Name",
    "storageKey": "audios/1234567890-song.mp3"
  }
}
```

---

### **3. Get Stream URL**

```
GET /api/upload/stream/:songId
```

**Response:**

```json
{
  "streamUrl": "https://...presigned-url...",
  "song": {
    "id": "...",
    "title": "Song Title",
    "artist": "Artist Name",
    "duration": 180
  }
}
```

---

### **4. Get Upload Info**

```
GET /api/upload/info
```

**Response:**

```json
{
  "allowedAudioTypes": ["audio/mpeg", "audio/mp3", ...],
  "allowedImageTypes": ["image/jpeg", "image/png", ...],
  "maxAudioSize": 52428800,
  "maxImageSize": 5242880,
  "presignedUrlTTL": 300
}
```

---

## 💰 **Pricing (Cloudflare R2)**

### **Free Tier:**

- ✅ 10 GB storage/month
- ✅ 10 million Class A operations/month (PUT, POST, LIST)
- ✅ 10 million Class B operations/month (GET, HEAD)
- ✅ No egress fees (bandwidth is FREE!)

### **After Free Tier:**

- Storage: $0.015/GB/month
- Class A operations: $4.50/million
- Class B operations: $0.36/million

**For your app:** You'll likely stay within free tier for months!

---

## ✅ **Setup Checklist**

- [ ] Cloudflare account created
- [ ] R2 enabled
- [ ] Bucket created (`sangatamizh-music`)
- [ ] API token created
- [ ] Credentials saved securely
- [ ] CORS policy configured
- [ ] Environment variables added to Render
- [ ] Backend redeployed
- [ ] Tested presigned URL generation
- [ ] Tested file upload
- [ ] Tested upload completion
- [ ] Frontend integration working

---

## 🆘 **Troubleshooting**

### **Error: "S3/R2 credentials not configured"**

**Fix:** Check environment variables in Render are set correctly

---

### **Error: "Invalid file type"**

**Fix:** Make sure `contentType` matches allowed types (e.g., `audio/mpeg` not `audio/mp3`)

---

### **Error: "SignatureDoesNotMatch"**

**Fix:**

- Check `S3_ACCESS_KEY` and `S3_SECRET_KEY` are correct
- Check `S3_ENDPOINT` URL is correct
- Regenerate API token if needed

---

### **Error: "NoSuchBucket"**

**Fix:**

- Check `S3_BUCKET` name matches your actual bucket name
- Check bucket exists in R2 dashboard

---

### **Upload succeeds but file not in bucket**

**Fix:**

- Check CORS policy is configured
- Check presigned URL hasn't expired (5 min TTL)
- Try uploading immediately after getting URL

---

## 📚 **Additional Resources**

- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [AWS SDK v3 for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Presigned URLs Guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)

---

## 🎉 **You're Done!**

Your file storage is now configured! Users can upload songs directly to Cloudflare R2.

**Next steps:**

1. Test upload from frontend
2. Update UploadForm component to use new upload service
3. Test streaming songs
4. Celebrate! 🎊

---

**Need help? Check the troubleshooting section or review Render logs!**
