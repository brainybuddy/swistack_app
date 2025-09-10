# SwiStack Google Cloud Run Deployment (FREE)

Deploy SwiStack serverless to Google Cloud Run with your existing VM database.

## Architecture
- Frontend: Cloud Run (serverless Next.js)
- Backend: Cloud Run (serverless Node.js API)
- Database: Your VM PostgreSQL (e.g., 34.123.59.185:5432)
- Redis: Your VM Redis (e.g., 34.123.59.185:6379)
- Storage: Your VM MinIO (e.g., 34.123.59.185:9000)

## Quick Deploy

Prerequisites
```bash
# Install Google Cloud SDK
brew install google-cloud-sdk   # macOS
# or
curl https://sdk.cloud.google.com | bash  # Linux
```

Deploy
```bash
gcloud auth login
gcloud config set project <PROJECT_ID>
./scripts/deploy-cloudrun.sh
```

## Useful Commands

View services
```bash
gcloud run services list --project <PROJECT_ID>
```

Tail logs
```bash
gcloud run logs tail --service swistack-backend --region us-central1 --project <PROJECT_ID>
gcloud run logs tail --service swistack-frontend --region us-central1 --project <PROJECT_ID>
```

Update env vars
```bash
gcloud run services update swistack-backend \
  --region us-central1 \
  --set-env-vars DATABASE_URL=postgresql://swistack:***@<VM_IP>:5432/swistack
```

Troubleshooting
- Open VM firewall for ports 5432 (Postgres), 6379 (Redis), 9000 (MinIO)
- Verify DATABASE_URL and JWT_SECRET are set
- Rerun migration job if needed

