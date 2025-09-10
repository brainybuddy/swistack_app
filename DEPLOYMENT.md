# SwiStack Deployment Guide

This project deploys to production using Google Cloud Run only.
Previous GitHub Actions–based server deployments have been removed.

For step‑by‑step Cloud Run instructions, see CLOUD-RUN-DEPLOYMENT.md.

## Deployment Architecture

- Frontend: Next.js on Cloud Run (container)
- Backend: Node.js API on Cloud Run (container)
- Database: PostgreSQL 15 (VM or managed DB)
- Cache: Redis 7 (VM or managed)
- Storage: MinIO/S3 (VM or managed)

## Cloud Run Deployment

- Script: `scripts/deploy-cloudrun.sh`
- Prerequisites: Google Cloud SDK authenticated and project set
- Process: builds images with Cloud Build and deploys both services to Cloud Run with HTTPS

Quick start:
```bash
gcloud auth login
gcloud config set project <your-project-id>
./scripts/deploy-cloudrun.sh
```

## Required Configuration

Configure these environment variables as described in CLOUD-RUN-DEPLOYMENT.md:

- `DATABASE_URL` – PostgreSQL connection string
- `REDIS_URL` – Redis endpoint
- `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`
- `JWT_SECRET` – secure, long random value
- `NEXT_PUBLIC_API_URL` – backend URL for the frontend

## Monitoring and Maintenance

- Health: check Cloud Run service URL `/health` (backend) and `/` (frontend)
- Logs: `gcloud run logs tail --service <service-name>`
- Updates: re‑run `./scripts/deploy-cloudrun.sh` to roll forward

## Optional: VM (Self‑Hosted) Alternative

You can still run everything on a VM using Docker Compose for development or self‑hosting:

```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations (backend workspace)
docker-compose -f docker-compose.prod.yml exec backend npm run db:migrate -w @swistack/backend

# Logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

Prefer Cloud Run for production to get HTTPS by default, autoscaling, and reduced ops overhead.

