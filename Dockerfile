FROM node:20-bullseye-slim

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev --ignore-scripts --legacy-peer-deps && \
    npm rebuild --legacy-peer-deps

COPY . .

RUN mkdir -p /app/auth_info

CMD ["node", "index.js"]
