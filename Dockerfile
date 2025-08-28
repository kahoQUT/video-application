FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Ensure runtime dirs exist & are writable
RUN mkdir -p storage/originals storage/outputs db public && chown -R node:node /app

EXPOSE 3000

CMD ["node", "app.js"]

