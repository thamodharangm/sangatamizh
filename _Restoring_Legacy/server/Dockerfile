FROM node:20-bookworm

# Install FFmpeg and Python3 (required for yt-dlp)
RUN apt-get update && apt-get install -y ffmpeg python3 python3-pip

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3000
CMD ["npm", "run", "dev"]
