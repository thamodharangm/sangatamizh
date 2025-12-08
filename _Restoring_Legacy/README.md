# Sangtamizh Music Platform

A full-stack music streaming and upload web application.

## Technologies

- **Frontend**: React (Vite)
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Transcoding**: FFmpeg
- **YouTube Integration**: yt-dlp

## Project Structure

- `client/`: React Frontend
- `server/`: Node.js API Server
- `docker-compose.yml`: Local development orchestration

## Getting Started (Docker)

The easiest way to run the application is using Docker Compose.

1. **Stop any running servers** (like existing `npm run dev`).
2. **Build and Start**:
   ```bash
   docker-compose up --build
   ```
3. **Access the App**:
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - API: [http://localhost:3000](http://localhost:3000)

## Getting Started (Manual)

### Prerequisites

- Node.js
- MongoDB running locally
- FFmpeg installed and in PATH (for transcoding)

### Server

```bash
cd server
npm install
# Set up .env if needed (default uses local mongo)
npm run dev
```

### Client

```bash
cd client
npm install
npm run dev
```

## Features

- **User Auth**: Register/Login.
- **Admin Upload**: Upload audio files or Import/Search from YouTube.
- **Transcoding**: Automatically generates 128kbps, 64kbps, and 30s previews.
- **Library**: Browse and stream songs.
