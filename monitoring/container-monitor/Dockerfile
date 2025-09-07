FROM node:18-alpine

WORKDIR /app

# Install Docker CLI for container management
RUN apk add --no-cache docker-cli curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S monitor && \
    adduser -S monitor -u 1001

# Change ownership
RUN chown -R monitor:monitor /app
USER monitor

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

EXPOSE 3002

CMD ["node", "monitor.js"]