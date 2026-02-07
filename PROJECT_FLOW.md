# Sangatamizh Music - Project Flow Documentation

## 1. Overview

Sangatamizh Music is a production-grade streaming platform designed to provide a seamless audio experience across desktop and mobile devices.

## 2. Desktop Version (`/client`)

- **UI Architecture**: Standard Sidebar + Main Content layout.
- **Key Features**:
  - Dynamic Home Screen with category filtering.
  - Full Admin Dashboard (`/admin`).
  - Emotion-based song management.
  - Real-time playback analytics.

## 3. Mobile Version (`/client-v2`)

- **UI Architecture**: Bottom Tab Navigation + Floating MiniPlayer.
- **Key Features**:
  - Touch-optimized gesture controls.
  - Expandable full-screen player.
  - Lightweight "Mobile-V3" components for fast loading.

## 4. Backend Engine (`/backend`)

- **Streaming Strategy**: "Identity-Synced" Raw Pipes.
  - Bypasses YouTube IP-signing by matching request protocols (IPv4/IPv6).
  - Streams raw M4A for native browser compatibility and seeking support.
- **Metadata**: Uses `yt-dlp` for lightning-fast scraping.
- **Database**: Prisma handles relationships between Users, Songs, Likes, and History.

## 5. Development Setup

- **Ports**: Backend (3002), Desktop (5173), Mobile (5174).
- **Environment**: Managed via `.env` files in respective directories.
- **Auth**: Firebase Authentication cross-compatible between both clients.
