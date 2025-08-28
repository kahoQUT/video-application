FROM node:20-bookworm-slim

WORKDIR /app

# System ffmpeg (so your spawn('ffmpeg', ...) works) + tini for clean shutdowns
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg ca-certificates tini \
 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

# Ensure runtime dirs exist & are writable
RUN mkdir -p storage/originals storage/outputs db public && chown -R node:node /app

EXPOSE 3000

ENTRYPOINT ["/usr/bin/tini","--"]
CMD ["node", "app.js"]

