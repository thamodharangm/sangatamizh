FROM node:18-slim

# Install Python3 (Required for yt-dlp) and ffmpeg
RUN apt-get update && \
    apt-get install -y python3 python3-pip ffmpeg curl && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 3002

# Start command
CMD [ "node", "index.js" ]
