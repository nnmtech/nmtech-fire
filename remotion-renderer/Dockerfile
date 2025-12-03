FROM node:18-slim

# Install Chromium, FFmpeg, and curl for health checks
RUN apt-get update && apt-get install -y \
    chromium \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set environment variable for Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Create output directory
RUN mkdir -p /app/output

EXPOSE 3001

CMD ["node", "server.js"]
