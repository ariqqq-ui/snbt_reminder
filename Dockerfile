FROM node:20-slim
 
WORKDIR /app
 
COPY package*.json ./
RUN npm install
 
COPY . .
 
RUN mkdir -p /app/auth_info
 
CMD ["node", "index.js"]
 
