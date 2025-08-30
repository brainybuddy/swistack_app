FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./
COPY tsconfig.json ./
COPY packages/frontend/package*.json ./packages/frontend/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies (skip postinstall that tries to build)
RUN npm ci --ignore-scripts

# Copy source code
COPY packages/frontend ./packages/frontend
COPY packages/shared ./packages/shared

# Build shared package first
RUN npm run build:shared

EXPOSE 3000

# Use development mode for hot reloading
CMD ["npm", "run", "dev", "-w", "@swistack/frontend"]