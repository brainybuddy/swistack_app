FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./
COPY tsconfig.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies (skip postinstall that tries to build)
RUN npm ci --ignore-scripts

# Copy source code
COPY packages/backend ./packages/backend
COPY packages/shared ./packages/shared

# Now build the packages
RUN npm run build:shared
RUN npm run build:backend

EXPOSE 3001

CMD ["npm", "run", "start", "-w", "@swistack/backend"]