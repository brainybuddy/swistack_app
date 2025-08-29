FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/shared/package*.json ./packages/shared/

RUN npm ci

COPY packages/backend ./packages/backend
COPY packages/shared ./packages/shared

RUN npm run build:shared
RUN npm run build:backend

EXPOSE 3001

CMD ["npm", "run", "start", "-w", "@swistack/backend"]