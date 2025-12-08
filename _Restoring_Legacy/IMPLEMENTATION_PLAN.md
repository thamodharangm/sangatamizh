# Sangtamizh Music - Implementation Plan

## Objective

Build a full-stack music streaming and upload web application with user auth, searchable library, streaming, upload/transcode pipeline, and admin panel.

## Architecture

- **Frontend**: React (Vite) - _Current Root_
- **Backend**: Node.js (Express) - _New `server` directory_
- **Database**: MongoDB (via Docker)
- **Transcoding**: FFmpeg (via Backend Docker container)
- **Deployment**: Docker / Cloud Run

## Features & Implementation Steps

### 1. Project Restructure

- [ ] Move current frontend files to `client/` directory.
- [ ] Initialize `server/` directory for backend.
- [ ] Create `docker-compose.yml` for local development (Backend + MongoDB).

### 2. Backend Setup (Node/Express)

- [ ] Initialize `package.json` in `server/`.
- [ ] Install dependencies: `express`, `mongoose`, `multer`, `fluent-ffmpeg`, `jsonwebtoken`, `bcrypt`, `cors`, `dotenv`.
- [ ] Create entry point `index.js`.
- [ ] configure MongoDB connection.

### 3. User Authentication

- [ ] Create `User` model.
- [ ] Implement Register/Login endpoints (JWT).
- [ ] Create Auth middleware.

### 4. Upload & Transcoding Pipeline

- [ ] Create `Song` model.
- [ ] Implement `/api/upload` endpoint using `multer`.
- [ ] Integrate `fluent-ffmpeg` to:
  - Convert to 128kbps (Full Stream)
  - Convert to 64kbps (Mobile/Low Bandwidth)
  - Generate 30s preview clip.
- [ ] Store file paths in DB.

### 5. Frontend Integration

- [ ] Update Vite config to proxy API requests or use CORS.
- [ ] Create API service client.
- [ ] Implement Login/Register Pages.
- [ ] Implement Admin Upload Page.
- [ ] Implement Music Player (streaming from backend).

### 6. YouTube Integration

- [ ] Implement `yt-dlp` or `ytdl-core` wrapper in backend.
- [ ] Endpoint to fetch metadata and download audio from YouTube URL.

## Next Steps

1.  Restructure project folders.
2.  Set up Docker Environment.
