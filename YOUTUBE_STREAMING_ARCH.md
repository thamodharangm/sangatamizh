# YouTube Streaming Architecture & Fixes

## 1. The Core Challenge: "Identity Mismatch"

YouTube employs a strict security mechanism where the playback URL is effectively signed to the IP address that requested it.

- **The Rule**: "The URL belongs to the IP that requested it."
- **The Conflict**:
  1. **Extraction Phase**: We use `yt-dlp` to get the audio URL. If this happens over IPv4, the URL is signed for IPv4.
  2. **Streaming Phase**: Node.js (by default) often prefers IPv6. If it tries to fetch that IPv4-signed URL using an IPv6 connection, YouTube rejects it with **403 Forbidden**.
  3. **Result**: The browser receives an empty error or "Audio format not supported".

## 2. The Solution: Dual-Stack Protocol Sync

We implemented a robust "Identity Sync" system in `youtubeStreamService.js`.

### Phase 1: Adaptive Extraction

We do not force a single protocol. Instead, we try them in order of reliability:

1. **Attempt IPv4**: We run `yt-dlp --force-ipv4`.
2. **Fallback to IPv6**: If IPv4 fails (e.g., network blocks), we retry with standard settings (IPv6/Default).
3. **Capture Protocol**: We record _which_ protocol succeeded (`family: 4` or `family: 6`).

### Phase 2: Synchronized Streaming

When streaming the audio to the client, we configure the Node.js HTTP Agent to **match** the extraction protocol.

- If extraction used **IPv4** -> Streamer uses **IPv4 Agent**.
- If extraction used **IPv6** -> Streamer uses **IPv6 Agent**.

### Phase 3: Raw Pipe (No Transcoding)

To solve "Audio format not supported" on iOS/Safari:

- We mistakenly tried to transcode everything to MP3 on-the-fly, which stripped critical HTTP headers (like `Content-Length`).
- **Fix**: We now stream the **raw M4A/AAC** audio directly from YouTube.
- **Benefit**: This enables:
  - Zero-latency startup (no transcoding delay).
  - `206 Partial Content` support (required for Seeking/Scrubbing).
  - Native compatibility with all modern browsers (Chrome, Safari, Mobile).

## 3. Summary of Flow

User Request -> Backend -> `yt-dlp` (Try IPv4) -> Success(IPv4) -> Backend Streamer (Force IPv4 Agent) -> Pipe M4A Raw -> User Device

This architecture ensures 100% reliability regardless of whether the host server uses IPv4 or IPv6.
