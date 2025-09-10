# SwiStack Deployment Guide

This project deploys to production using Google Cloud Run only.
Previous GitHub Actions–based server deployments have been removed.

For step‑by‑step Cloud Run instructions, see CLOUD-RUN-DEPLOYMENT.md.

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

Configure these environment variables via the script or in Cloud Run:
- `DATABASE_URL`, `POSTGRES_*` (host, port, db, user, password)
- `REDIS_URL`
- `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`
- `JWT_SECRET`
- `NEXT_PUBLIC_API_URL` (frontend build arg handled by script)

## Monitoring

- Health: backend `/health` on the service URL
- Logs: `gcloud run logs tail --service <service>`
- Jobs: `gcloud run jobs executions list --job swistack-migrate`

