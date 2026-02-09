# Use Node.js Base Image
FROM node:20-slim

# Install system dependencies: Python3, FFmpeg for yt-dlp
RUN apt-get update && apt-get install -y \
    python3 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set Working Directory
WORKDIR /app

# Install App Dependencies
COPY package*.json ./
RUN npm install

# Copy App Source
COPY . .

# Expose Port (Render uses 10000 by default)
EXPOSE 10000

# Environment Variables setup (handled by Render UI usually)
ENV NODE_ENV=production
ENV PORT=10000

# Start Command
CMD [ "npm", "start" ]
