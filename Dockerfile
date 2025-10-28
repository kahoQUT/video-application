FROM node:20-bookworm-slim
WORKDIR /app
# System ffmpeg (so your spawn('ffmpeg', ...) works) + tini for clean shutdowns
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg ca-certificates tini \
 && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["node", "app.js"]

