FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY packages/frontend/package*.json ./packages/frontend/
COPY packages/shared/package*.json ./packages/shared/

RUN npm ci

COPY packages/frontend ./packages/frontend
COPY packages/shared ./packages/shared

RUN npm run build:shared

EXPOSE 3000

# Use development mode for hot reloading
CMD ["npm", "run", "dev", "-w", "@swistack/frontend"]