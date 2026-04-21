FROM node:20-bullseye-slim

RUN apt-get update && apt-get install -y \
    git \
    openssh-client \
    python3 \
    make \
    g++ \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Paksa npm pakai HTTPS bukan SSH untuk github
RUN git config --global url."https://github.com/".insteadOf "ssh://git@github.com/"
RUN git config --global url."https://github.com/".insteadOf "git@github.com:"

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN mkdir -p /app/auth_info

CMD ["node", "index.js"]
