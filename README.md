# Sangatamizh Music V3 🎵

The ultimate, Antigravity-style stable music streaming platform.

## 🚀 Getting Started

### 1. Server (Backend)

- **Port**: 3002
- **Command**: `npm run dev` (from `/server`)
- **Stable Streaming**: Supports Range requests (206 Partial Content) for zero-latency seeking.

### 2. Client (Frontend)

- **Port**: 5173
- **Command**: `npm run dev` (from `/client`)
- **Tech**: React + Vite + Framer Motion (Premium UI)

## 📁 New Architecture

- `server/`: Clean Express API with file-based streaming.
- `client/`: Unified React app (Replaced V1/V2).
- `songs.json`: Centralized metadata database.
- `uploads/`: Place your MP3 files here.

## 🛠️ Usage

1. Place an audio file in `server/uploads/demo.mp3`.
2. Update metadata in `songs.json`.
3. Start both services and enjoy the rhythm!
