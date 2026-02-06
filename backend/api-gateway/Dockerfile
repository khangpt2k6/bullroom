FROM node:20-alpine

WORKDIR /app

# Copy shared dependencies first
COPY ../shared ./shared
COPY package*.json ./
COPY api-gateway/package*.json ./api-gateway/

# Install dependencies
RUN cd api-gateway && npm install
RUN npm install

# Copy source code
COPY api-gateway ./api-gateway
COPY tsconfig.json ./

# Build TypeScript
RUN cd api-gateway && npm run build

EXPOSE 3000

CMD ["node", "api-gateway/dist/api-gateway/server.js"]
