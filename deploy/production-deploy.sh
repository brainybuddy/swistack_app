#!/bin/bash

# SwiStack Production Deployment Script
set -e

echo "🚀 Starting SwiStack Production Deployment..."

# Configuration
DOMAIN="${DOMAIN:-swistack.dev}"
EMAIL="${EMAIL:-admin@swistack.dev}"
ENV_FILE="${ENV_FILE:-.env.production}"
BACKUP_DIR="${BACKUP_DIR:-./backups/$(date +%Y%m%d_%H%M%S)}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

# Pre-deployment checks
check_requirements() {
    log "🔍 Checking requirements..."
    
    # Check if running as root or with sudo
    if [[ $EUID -eq 0 ]]; then
        warn "Running as root. This is not recommended for production."
    fi
    
    # Check required commands
    for cmd in docker docker-compose git curl; do
        if ! command -v $cmd &> /dev/null; then
            error "$cmd is required but not installed."
        fi
    done
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running or accessible."
    fi
    
    # Check environment file
    if [[ ! -f "$ENV_FILE" ]]; then
        error "Environment file $ENV_FILE not found. Please create it from .env.production.example"
    fi
    
    log "✅ All requirements met"
}

# Setup directories and permissions
setup_directories() {
    log "📁 Setting up directories..."
    
    sudo mkdir -p /etc/nginx/sites-available
    sudo mkdir -p /etc/nginx/sites-enabled
    sudo mkdir -p /var/log/nginx
    sudo mkdir -p /etc/ssl/certs
    sudo mkdir -p /etc/ssl/private
    sudo mkdir -p "$BACKUP_DIR"
    
    # Set correct permissions
    sudo chown -R $USER:$USER ./
    sudo chmod +x deploy/scripts/*.sh
    
    log "✅ Directories setup complete"
}

# Generate SSL certificates using Let's Encrypt
setup_ssl() {
    log "🔒 Setting up SSL certificates..."
    
    if [[ ! -f "/etc/ssl/certs/swistack.pem" ]]; then
        log "Generating SSL certificate for $DOMAIN..."
        
        # Install certbot if not present
        if ! command -v certbot &> /dev/null; then
            log "Installing certbot..."
            sudo apt update
            sudo apt install -y certbot python3-certbot-nginx
        fi
        
        # Stop nginx if running to free port 80
        sudo systemctl stop nginx || true
        
        # Generate certificate
        sudo certbot certonly --standalone \
            --email "$EMAIL" \
            --agree-tos \
            --no-eff-email \
            -d "$DOMAIN" \
            -d "*.$DOMAIN"
        
        # Copy certificates to our directory
        sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" /etc/ssl/certs/swistack.pem
        sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" /etc/ssl/private/swistack.key
        sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" /etc/ssl/certs/swistack-wildcard.pem
        sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" /etc/ssl/private/swistack-wildcard.key
        
        # Set correct permissions
        sudo chmod 600 /etc/ssl/private/*
        sudo chown root:root /etc/ssl/certs/* /etc/ssl/private/*
        
        log "✅ SSL certificates generated"
    else
        log "✅ SSL certificates already exist"
    fi
}

# Backup existing data
backup_data() {
    log "💾 Creating backup..."
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Backup database if running
    if docker ps | grep -q swistack-postgres; then
        log "Backing up database..."
        docker exec swistack-postgres pg_dump -U swistack swistack > "$BACKUP_DIR/database.sql"
    fi
    
    # Backup volumes
    if docker volume ls | grep -q swistack; then
        log "Backing up Docker volumes..."
        docker run --rm -v swistack_postgres-data:/source -v "$PWD/$BACKUP_DIR":/backup alpine tar czf /backup/postgres-data.tar.gz -C /source .
        docker run --rm -v swistack_minio-data:/source -v "$PWD/$BACKUP_DIR":/backup alpine tar czf /backup/minio-data.tar.gz -C /source .
    fi
    
    log "✅ Backup completed: $BACKUP_DIR"
}

# Deploy the application
deploy_application() {
    log "🚢 Deploying application..."
    
    # Pull latest code (if this is a git deployment)
    if [[ -d ".git" ]]; then
        log "Updating code from git..."
        git pull origin main
    fi
    
    # Load environment variables
    export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
    
    # Build and deploy with docker-compose
    log "Building Docker images..."
    docker-compose -f docker-compose.production.yml build --no-cache
    
    log "Starting services..."
    docker-compose -f docker-compose.production.yml up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    timeout=300
    elapsed=0
    
    while [[ $elapsed -lt $timeout ]]; do
        if docker-compose -f docker-compose.production.yml ps | grep -q "Up (healthy)"; then
            break
        fi
        sleep 5
        elapsed=$((elapsed + 5))
        echo -n "."
    done
    echo
    
    if [[ $elapsed -ge $timeout ]]; then
        warn "Services may not be fully healthy yet. Check logs with: docker-compose -f docker-compose.production.yml logs"
    else
        log "✅ Services are healthy"
    fi
}

# Setup monitoring and logging
setup_monitoring() {
    log "📊 Setting up monitoring..."
    
    # Copy monitoring configuration
    cp -r monitoring/ ./
    
    # Setup log rotation
    sudo tee /etc/logrotate.d/swistack > /dev/null <<EOF
/var/log/nginx/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 \$(cat /var/run/nginx.pid)
        fi
    endscript
}
EOF
    
    log "✅ Monitoring setup complete"
}

# Setup automatic updates and maintenance
setup_maintenance() {
    log "🔧 Setting up maintenance scripts..."
    
    # Copy maintenance scripts
    sudo cp deploy/scripts/cleanup-containers.sh /usr/local/bin/swistack-cleanup
    sudo cp deploy/scripts/backup.sh /usr/local/bin/swistack-backup
    sudo cp deploy/scripts/update.sh /usr/local/bin/swistack-update
    sudo chmod +x /usr/local/bin/swistack-*
    
    # Setup cron jobs
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/swistack-cleanup") | crontab -
    (crontab -l 2>/dev/null; echo "0 3 * * 0 /usr/local/bin/swistack-backup") | crontab -
    (crontab -l 2>/dev/null; echo "0 1 * * 1 /usr/local/bin/swistack-update") | crontab -
    
    log "✅ Maintenance scripts setup complete"
}

# Post-deployment verification
verify_deployment() {
    log "🔍 Verifying deployment..."
    
    # Check if main services are running
    services=("nginx" "frontend" "backend" "postgres" "redis" "minio")
    
    for service in "${services[@]}"; do
        if docker-compose -f docker-compose.production.yml ps | grep -q "swistack-$service.*Up"; then
            log "✅ $service is running"
        else
            warn "❌ $service is not running properly"
        fi
    done
    
    # Test HTTP endpoints
    log "Testing HTTP endpoints..."
    
    # Test main application
    if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" | grep -q "200"; then
        log "✅ Main application is accessible"
    else
        warn "❌ Main application is not accessible"
    fi
    
    # Test API health
    if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/health" | grep -q "200"; then
        log "✅ API health check passed"
    else
        warn "❌ API health check failed"
    fi
    
    log "✅ Deployment verification complete"
}

# Cleanup old resources
cleanup() {
    log "🧹 Cleaning up..."
    
    # Remove dangling images
    docker image prune -f
    
    # Remove unused volumes (be careful with this in production)
    # docker volume prune -f
    
    log "✅ Cleanup complete"
}

# Main deployment function
main() {
    log "🌟 SwiStack Production Deployment Starting..."
    log "Domain: $DOMAIN"
    log "Environment: $ENV_FILE"
    
    check_requirements
    setup_directories
    setup_ssl
    backup_data
    deploy_application
    setup_monitoring
    setup_maintenance
    verify_deployment
    cleanup
    
    log "🎉 Deployment completed successfully!"
    log "📊 Access your application at: https://$DOMAIN"
    log "📈 Monitoring dashboard: https://monitoring.$DOMAIN"
    log "📝 View logs: docker-compose -f docker-compose.production.yml logs -f"
    
    echo
    echo "🚀 SwiStack is now running in production!"
    echo "   Main App: https://$DOMAIN"
    echo "   API: https://$DOMAIN/api"
    echo "   Monitoring: https://monitoring.$DOMAIN"
    echo
    echo "📚 Next steps:"
    echo "   1. Configure your DNS to point *.swistack.dev to this server"
    echo "   2. Test project creation and preview functionality"
    echo "   3. Set up monitoring alerts"
    echo "   4. Configure backup retention policies"
    echo
}

# Handle script interruption
trap 'error "Deployment interrupted"' INT TERM

# Run main function
main "$@"