FROM node:20-bullseye-slim
 
RUN apt-get update && apt-get install -y \
    git \
    python3 \
    make \
    g++ \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*
 
WORKDIR /app
 
COPY package*.json ./
 
# Paksa semua git protocol pakai HTTPS
RUN git config --global url."https://".insteadOf ssh://
RUN git config --global url."https://github.com/".insteadOf "git@github.com:"
 
RUN npm install --legacy-peer-deps
 
COPY . .
 
RUN mkdir -p /app/auth_info
 
CMD ["node", "index.js"]
 
