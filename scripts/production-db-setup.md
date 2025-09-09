# Production Database Setup Strategy

## Approach: Use Migrations Instead of Data Copy

### Why This Approach?
1. **Clean Start**: Fresh database with proper schema
2. **Version Control**: All changes tracked via migrations
3. **Reproducible**: Same process works for all environments
4. **Future-Proof**: Easy to update and maintain

## Production Database Setup Process

### 1. Fresh Installation (Recommended)
```bash
# On production server after deployment
cd /opt/swistack

# Start PostgreSQL container
docker-compose -f docker-compose.prod.yml up -d postgres

# Wait for PostgreSQL to be ready
sleep 10

# Run migrations to create schema
docker-compose -f docker-compose.prod.yml exec backend npm run migrate:latest

# Run seeds to populate initial data (templates, etc.)
docker-compose -f docker-compose.prod.yml exec backend npm run seed:run
```

### 2. If You Need Development Data (Optional)
```bash
# Export only your important data from Neon
docker run --rm postgres:17-alpine pg_dump \
  "postgresql://neondb_owner:npg_D8kfl7ARavIi@ep-wild-sunset-abbj7aab-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require" \
  --data-only --table=users --table=projects --table=project_files \
  > production-data.sql

# Import to production
docker-compose -f docker-compose.prod.yml exec -T postgres \
  psql -U swistack -d swistack < production-data.sql
```

## Database Updates Going Forward

### Development → Production Workflow
1. **Create migrations** for schema changes in development
2. **Test migrations** on development database
3. **Deploy to production** - migrations run automatically
4. **No manual data copying** required

### Automatic Updates
Your GitHub Actions deployment already includes:
```yaml
# Run database migrations
docker-compose -f docker-compose.prod.yml exec -T backend npm run migrate:latest
```

This means every deployment automatically updates the database schema!

## Backup Strategy for Production

### Automated Daily Backups
```bash
# Add to production server crontab
0 2 * * * /opt/swistack/scripts/backup.sh

# backup.sh content:
#!/bin/bash
docker-compose -f /opt/swistack/docker-compose.prod.yml exec -T postgres \
  pg_dump -U swistack swistack > \
  /opt/backups/swistack-$(date +%Y%m%d_%H%M%S).sql
```

### Manual Backup
```bash
docker-compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U swistack swistack > backup.sql
```

### Restore from Backup
```bash
docker-compose -f docker-compose.prod.yml exec -T postgres \
  psql -U swistack -d swistack < backup.sql
```

## Benefits of This Approach

1. **No Data Loss Risk**: Development and production remain separate
2. **Version Controlled**: All schema changes tracked in git
3. **Automated Updates**: Deploy code = update database automatically  
4. **Clean Production**: No development test data in production
5. **Rollback Support**: Easy to rollback migrations if needed

## Migration Commands Reference

```bash
# Create new migration
npm run migrate:make migration_name

# Run pending migrations  
npm run migrate:latest

# Rollback last migration
npm run migrate:rollback

# Check migration status
npm run migrate:status

# Run seeds (initial data)
npm run seed:run
```