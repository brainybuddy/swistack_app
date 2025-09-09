#!/bin/bash

# SwiStack Production Backup Script
# Run this on your production server to backup database and files

set -e

# Configuration
BACKUP_DIR="/opt/backups/swistack"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
COMPOSE_FILE="/opt/swistack/docker-compose.prod.yml"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗄️ SwiStack Production Backup${NC}"
echo -e "${BLUE}===============================${NC}\n"

# Create backup directory
mkdir -p "$BACKUP_DIR"
cd /opt/swistack

echo -e "${GREEN}1️⃣ Creating database backup...${NC}"

# Database backup
docker-compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U swistack swistack \
  --verbose \
  --no-owner \
  --no-privileges \
  > "$BACKUP_DIR/database-$TIMESTAMP.sql"

DB_BACKUP_SIZE=$(du -h "$BACKUP_DIR/database-$TIMESTAMP.sql" | cut -f1)
echo -e "${GREEN}✅ Database backup completed: $DB_BACKUP_SIZE${NC}"

echo -e "${GREEN}2️⃣ Creating file storage backup...${NC}"

# MinIO/File storage backup
if [ -d "./minio_prod_data" ]; then
    tar -czf "$BACKUP_DIR/minio-$TIMESTAMP.tar.gz" ./minio_prod_data
    MINIO_BACKUP_SIZE=$(du -h "$BACKUP_DIR/minio-$TIMESTAMP.tar.gz" | cut -f1)
    echo -e "${GREEN}✅ MinIO backup completed: $MINIO_BACKUP_SIZE${NC}"
else
    echo -e "${BLUE}ℹ️ MinIO data directory not found, skipping file backup${NC}"
fi

echo -e "${GREEN}3️⃣ Creating configuration backup...${NC}"

# Configuration backup
tar -czf "$BACKUP_DIR/config-$TIMESTAMP.tar.gz" \
    --exclude="node_modules" \
    --exclude="*.log" \
    --exclude=".git" \
    .

CONFIG_BACKUP_SIZE=$(du -h "$BACKUP_DIR/config-$TIMESTAMP.tar.gz" | cut -f1)
echo -e "${GREEN}✅ Configuration backup completed: $CONFIG_BACKUP_SIZE${NC}"

echo -e "${GREEN}4️⃣ Cleaning up old backups...${NC}"

# Remove backups older than retention period
find "$BACKUP_DIR" -name "database-*.sql" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "minio-*.tar.gz" -mtime +$RETENTION_DAYS -delete  
find "$BACKUP_DIR" -name "config-*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo -e "${GREEN}✅ Old backups cleaned up (older than $RETENTION_DAYS days)${NC}"

echo -e "${GREEN}5️⃣ Backup summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Backup Location: $BACKUP_DIR"
echo "Database: database-$TIMESTAMP.sql ($DB_BACKUP_SIZE)"
if [ -v MINIO_BACKUP_SIZE ]; then
    echo "Files: minio-$TIMESTAMP.tar.gz ($MINIO_BACKUP_SIZE)"
fi
echo "Config: config-$TIMESTAMP.tar.gz ($CONFIG_BACKUP_SIZE)"
echo "Retention: $RETENTION_DAYS days"

# List all current backups
echo -e "\n${BLUE}📋 Current backups:${NC}"
ls -lh "$BACKUP_DIR" | grep -E "(database|minio|config)-[0-9]{8}_[0-9]{6}\.(sql|tar\.gz)$" | tail -10

echo -e "\n${GREEN}🎉 Backup completed successfully!${NC}"

# Optional: Send backup notification (uncomment and configure)
# curl -X POST -H 'Content-type: application/json' \
#   --data "{\"text\":\"SwiStack backup completed: $TIMESTAMP\"}" \
#   $SLACK_WEBHOOK_URL

# Optional: Upload to S3 (uncomment and configure)
# aws s3 cp "$BACKUP_DIR/database-$TIMESTAMP.sql" s3://your-backup-bucket/swistack/