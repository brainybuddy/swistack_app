FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/shared/package*.json ./packages/shared/

RUN npm ci --ignore-scripts

COPY packages/backend ./packages/backend
COPY packages/shared ./packages/shared

EXPOSE 3001

# Run the server using tsx (already installed as dependency)
WORKDIR /app
CMD ["npx", "tsx", "packages/backend/src/server.ts"]