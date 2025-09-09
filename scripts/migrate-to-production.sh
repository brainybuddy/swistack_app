#!/bin/bash

# SwiStack Database Migration Script
# Migrates data from Neon (development) to local PostgreSQL (production)

set -e

echo "🗄️ SwiStack Database Migration Script"
echo "=====================================\n"

# Configuration
NEON_URL="postgresql://neondb_owner:npg_D8kfl7ARavIi@ep-wild-sunset-abbj7aab-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
PROD_URL="postgresql://swistack:${POSTGRES_PASSWORD:-swistack}@localhost:5432/swistack"
BACKUP_DIR="$HOME/swistack-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "1️⃣ Creating backup from Neon database..."

# Create backup using Docker
docker run --rm postgres:17-alpine pg_dump \
  "$NEON_URL" \
  --no-owner --no-privileges --clean --if-exists \
  --verbose \
  > "$BACKUP_DIR/neon-backup-$TIMESTAMP.sql"

echo "✅ Backup created: $BACKUP_DIR/neon-backup-$TIMESTAMP.sql"

# Check backup file size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/neon-backup-$TIMESTAMP.sql" | cut -f1)
echo "📊 Backup size: $BACKUP_SIZE"

if [ "$BACKUP_SIZE" = "0B" ]; then
    echo "❌ Backup failed - file is empty"
    exit 1
fi

echo "\n2️⃣ Backup completed successfully!"
echo "Next steps:"
echo "- Transfer this backup to your production server"
echo "- Run the restore script on production server"
echo "- Backup location: $BACKUP_DIR/neon-backup-$TIMESTAMP.sql"
echo "\nRestore command for production:"
echo "docker-compose -f docker-compose.prod.yml exec -T postgres psql -U swistack -d swistack < neon-backup-$TIMESTAMP.sql"