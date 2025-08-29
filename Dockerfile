FROM node:18-alpine AS base

# Install dependencies for all packages
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/backend/package*.json ./packages/backend/
COPY packages/frontend/package*.json ./packages/frontend/

RUN npm ci

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend
COPY packages/frontend ./packages/frontend

# Build shared package first
RUN npm run build:shared

# Development stage
FROM base AS development
WORKDIR /app
EXPOSE 3000 3001
CMD ["npm", "run", "dev"]

# Production build stage
FROM base AS build
WORKDIR /app
RUN npm run build:backend
RUN npm run build:frontend

# Production runtime
FROM node:18-alpine AS production
WORKDIR /app

# Copy built applications
COPY --from=build /app/packages/backend/dist ./backend
COPY --from=build /app/packages/frontend/.next ./frontend/.next
COPY --from=build /app/packages/frontend/public ./frontend/public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/*/package*.json ./packages/*/
COPY --from=build /app/package*.json ./

ENV NODE_ENV=production
EXPOSE 3000 3001

# Use a process manager to run both services
RUN npm install -g pm2
COPY ecosystem.config.js ./
CMD ["pm2-runtime", "ecosystem.config.js"]