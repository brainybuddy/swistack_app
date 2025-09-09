#!/bin/bash

# SwiStack Production Restore Script
# Restore from backup files

set -e

# Configuration
BACKUP_DIR="/opt/backups/swistack"
COMPOSE_FILE="/opt/swistack/docker-compose.prod.yml"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔄 SwiStack Production Restore${NC}"
echo -e "${BLUE}===============================${NC}\n"

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}❌ Backup directory not found: $BACKUP_DIR${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Available database backups:${NC}"
ls -lht "$BACKUP_DIR"/database-*.sql | head -10

echo -e "\n${YELLOW}⚠️ WARNING: This will replace your current database!${NC}"
echo -e "${YELLOW}Make sure you have a recent backup before proceeding.${NC}"

read -p "Enter the backup filename (e.g., database-20231209_143022.sql): " BACKUP_FILE

if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Backup file not found: $BACKUP_DIR/$BACKUP_FILE${NC}"
    exit 1
fi

read -p "Are you sure you want to restore from $BACKUP_FILE? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${BLUE}ℹ️ Restore cancelled${NC}"
    exit 0
fi

echo -e "${GREEN}1️⃣ Stopping application...${NC}"
cd /opt/swistack
docker-compose -f "$COMPOSE_FILE" stop backend frontend

echo -e "${GREEN}2️⃣ Creating pre-restore backup...${NC}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker-compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U swistack swistack > "$BACKUP_DIR/pre-restore-$TIMESTAMP.sql"

echo -e "${GREEN}3️⃣ Restoring database...${NC}"
docker-compose -f "$COMPOSE_FILE" exec -T postgres \
  psql -U swistack -d swistack < "$BACKUP_DIR/$BACKUP_FILE"

echo -e "${GREEN}4️⃣ Starting application...${NC}"
docker-compose -f "$COMPOSE_FILE" up -d

echo -e "${GREEN}5️⃣ Running health checks...${NC}"
sleep 10

# Health check
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
fi

echo -e "\n${GREEN}🎉 Restore completed!${NC}"
echo "Restored from: $BACKUP_FILE"
echo "Pre-restore backup saved as: pre-restore-$TIMESTAMP.sql"