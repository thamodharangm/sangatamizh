---
description: Sangatamizh Home Component & Analytics Workflow
---

# Sangatamizh Home Workflow

This document outlines the interaction between the Home components (v1/v2) and the Backend for a consistent, data-driven music experience.

## 1. Backend: Intelligent Sections

The backend (`music.controller.js`) handles the `getHomeSections` logic:

- **Trending**: Calculated using `analytics.json` by sorting songs with the most play logs.
- **Hits**: Filtered by category (`Hits` or `Melody`).
- **Recent**: Filtered by `userId` to show the most recent unique play logs in reverse chronological order.

## 2. Frontend: V1 (Desktop) UI Flow

- **Hero Section**: A high-impact banner with a linear gradient and 3D tactile buttons.
- **Horizontal Scroll**:
  - Uses a `SongSection` helper.
  - Features absolute-positioned SVG arrows for precise desktop navigation.
  - Implements `smooth` scrolling via JS `scrollBy`.
- **States**:
  - **Loading**: Pulse animation.
  - **Empty**: A dashed "empty-card" with a CTA to the Admin panel.

## 3. Frontend: V2 (Mobile) UI Flow

- **Hero Banner**: Compact, touch-first card with a "Start Listening" primary action.
- **Scrolling**:
  - Uses CSS `scroll-snap-type: x mandatory` for a native mobile feel.
  - CSS `no-scrollbar` class applied to hide visual clutter while keeping functionality.
  - `scroll-snap-align: start` on individual cards for precise alignment.

## 4. Play Logging Workflow (The "JS Workflow")

Whenever a song is played from Home:

1. `playSong(song, playlist)` is called from `MusicContext`.
2. A background `POST` request is sent to `/api/log-play`:

```javascript
const userId = getIdentity(); // Fetch Firebase UID or persistent Guest ID
if (userId) {
  api.post("/log-play", { userId, songId: song.id });
}
```

3. This ensures that the next time the user visits Home, their **Recently Played** section is instantly updated.
