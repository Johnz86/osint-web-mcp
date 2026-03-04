# OSINT Web MCP Dockerfile
FROM node:22-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

FROM mcr.microsoft.com/playwright:v1.50.1-noble AS release

WORKDIR /app

# Copy dependencies and source
COPY --from=builder /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./

# Install only Chromium for space efficiency
RUN npx playwright install chromium

# Standard MCP environment variables
ENV HEADLESS=true
ENV NODE_ENV=production

ENTRYPOINT ["node", "src/server.js"]
