# SwiStack Deployment Guide

This guide covers deploying SwiStack to production using GitHub Actions and Docker.

## Prerequisites

- GitHub repository with Actions enabled
- Production server with Docker and Docker Compose
- Domain name and SSL certificates (recommended)
- Container registry access (GitHub Container Registry is used by default)

## Deployment Architecture

- **Frontend**: Next.js application served via Docker container
- **Backend**: Node.js Express API with WebSocket support
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Storage**: MinIO (S3-compatible object storage)

## GitHub Actions Workflows

### 1. Production Deployment (`.github/workflows/deploy-production.yml`)
- Triggers on pushes to `main` branch
- Runs tests, builds Docker images, and deploys to production
- Uses GitHub Container Registry for image storage

### 2. Staging Deployment (`.github/workflows/deploy-staging.yml`)
- Triggers on pushes to `develop/staging` branches
- Deploys to staging environment for testing

## Required GitHub Secrets

### Production Environment
```
# Server Configuration
PRODUCTION_HOST=your-production-server.com
PRODUCTION_USER=deploy-user
PRODUCTION_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...
PRODUCTION_PORT=22
PRODUCTION_URL=https://your-production-domain.com
DEPLOYMENT_PATH=/opt/swistack

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/swistack
POSTGRES_DB=swistack
POSTGRES_USER=swistack
POSTGRES_PASSWORD=secure_production_password

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Authentication Secrets
JWT_SECRET=your-super-secure-jwt-secret-256-bits-long
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret

# MinIO/S3 Configuration
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=your-minio-access-key
MINIO_SECRET_KEY=your-minio-secret-key
MINIO_BUCKET=swistack-storage

# API Configuration
NEXT_PUBLIC_API_URL=https://your-production-domain.com

# AI Integration (Optional)
CLAUDE_API_KEY=your-claude-api-key
OPENAI_API_KEY=your-openai-api-key
```

### Staging Environment (Optional)
Replace `PRODUCTION_` prefix with `STAGING_` for all staging secrets.

## Server Setup

### 1. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

### 2. Create Deployment Directory
```bash
sudo mkdir -p /opt/swistack
sudo chown $USER:$USER /opt/swistack
cd /opt/swistack

# Copy docker-compose files
# These will be updated by the GitHub Action
```

### 3. Setup SSL (Recommended)
```bash
# Install Certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d your-production-domain.com

# Create nginx config for SSL termination (optional)
```

## Manual Deployment

If you need to deploy manually:

```bash
# Clone repository
git clone https://github.com/your-username/swistack.git
cd swistack

# Create production environment file
cp .env.example .env.production
# Edit .env.production with your values

# Build and deploy
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migrate:latest

# Check health
curl http://localhost:3001/health
curl http://localhost:3000
```

## Monitoring and Maintenance

### Health Checks
- Backend: `https://your-domain.com/health`
- Frontend: `https://your-domain.com`

### Log Management
```bash
# View container logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f postgres
docker-compose -f docker-compose.prod.yml logs -f redis
docker-compose -f docker-compose.prod.yml logs -f minio
```

### Database Backups
```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U swistack swistack > backup-$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U swistack swistack < backup.sql
```

### Updates and Rollbacks
```bash
# Update to latest
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Rollback (specify image tags)
export BACKEND_IMAGE=ghcr.io/your-username/swistack-backend:previous-tag
export FRONTEND_IMAGE=ghcr.io/your-username/swistack-frontend:previous-tag
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Common Issues

1. **Container won't start**: Check logs and environment variables
2. **Database connection failed**: Verify DATABASE_URL and PostgreSQL container
3. **OAuth not working**: Check client IDs and redirect URIs
4. **File uploads failing**: Verify MinIO configuration and bucket access

### Debug Commands
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check resource usage
docker stats

# Access container shell
docker-compose -f docker-compose.prod.yml exec backend /bin/sh
docker-compose -f docker-compose.prod.yml exec frontend /bin/sh

# Check network connectivity
docker-compose -f docker-compose.prod.yml exec backend ping postgres
docker-compose -f docker-compose.prod.yml exec backend ping redis
```

## Security Considerations

1. **Use strong passwords** for all database and service accounts
2. **Enable SSL/TLS** for all external connections
3. **Regularly update** Docker images and dependencies
4. **Monitor logs** for suspicious activity
5. **Backup data** regularly
6. **Use secrets management** for sensitive configuration
7. **Restrict SSH access** to deployment servers
8. **Enable firewall** and close unnecessary ports

## Performance Optimization

1. **Use a CDN** for static assets
2. **Enable Redis caching** for API responses
3. **Configure PostgreSQL** connection pooling
4. **Monitor resource usage** and scale as needed
5. **Use horizontal scaling** with multiple backend instances
6. **Optimize Docker images** for faster deployments

## Environment-specific Configuration

### Production
- Use production-grade database settings
- Enable SSL/TLS
- Configure monitoring and alerting
- Set up automated backups
- Use load balancing if needed

### Staging
- Mirror production setup but with smaller resources
- Use test data
- Enable debug logging
- Allow easier access for testing

## Support

For deployment issues:
1. Check the logs first
2. Verify all secrets are configured
3. Test network connectivity
4. Review GitHub Actions workflow runs
5. Check server resources (CPU, memory, disk)

## Updates

This deployment setup supports:
- Zero-downtime deployments
- Automatic rollbacks on failure
- Blue-green deployment strategies
- Database migration handling
- Health checks and monitoring