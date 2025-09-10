#!/bin/bash

# SwiStack Google Cloud Run Deployment (FREE)
# Serverless deployment with generous free tier
# Uses existing VM PostgreSQL database

set -e

# Configuration
GCP_PROJECT_ID=${GCP_PROJECT_ID:-swistack}
GCP_REGION=${GCP_REGION:-us-central1}
VM_EXTERNAL_IP=${VM_EXTERNAL_IP:-34.123.59.185}
VM_INSTANCE=${VM_INSTANCE:-instance-20250909-155236}
VM_ZONE=${VM_ZONE:-us-central1-c}

echo "🚀 Deploying SwiStack to Google Cloud Run (FREE)"
echo "================================================"

# Step 1: Enable required APIs
echo "1️⃣ Enabling required Google Cloud APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com --project $GCP_PROJECT_ID

# Step 2: Build and push to Google Container Registry
echo "2️⃣ Building and pushing Docker images..."

# Backend - Build using a temporary Cloud Build config (avoids Dockerfile path mount issues)
cat > cloudbuild-backend-inline.yaml << EOF
steps:
- name: 'gcr.io/cloud-builders/docker'
  args: ['build', '-f', 'packages/backend/Dockerfile', '-t', 'gcr.io/$GCP_PROJECT_ID/swistack-backend', '.']

images:
- 'gcr.io/$GCP_PROJECT_ID/swistack-backend'
EOF

gcloud builds submit . \
  --config cloudbuild-backend-inline.yaml \
  --project $GCP_PROJECT_ID

rm -f cloudbuild-backend-inline.yaml

# Frontend - Initial build (optional). We rely on the rebuild below to inject API URL.
# You can skip this first build if desired.
gcloud builds submit . \
  --file packages/frontend/Dockerfile.prod \
  --tag gcr.io/$GCP_PROJECT_ID/swistack-frontend:latest \
  --project $GCP_PROJECT_ID || true

echo "3️⃣ Deploying backend to Cloud Run..."

# Deploy backend with environment variables
gcloud run deploy swistack-backend \
  --image gcr.io/$GCP_PROJECT_ID/swistack-backend \
  --platform managed \
  --region $GCP_REGION \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --port 3001 \
  --max-instances 10 \
  --set-env-vars \
NODE_ENV=production,\
DATABASE_URL=${DATABASE_URL:-postgresql://swistack:password@$VM_EXTERNAL_IP:5432/swistack},\
POSTGRES_HOST=${POSTGRES_HOST:-$VM_EXTERNAL_IP},\
POSTGRES_PORT=${POSTGRES_PORT:-5432},\
POSTGRES_DB=${POSTGRES_DB:-swistack},\
POSTGRES_USER=${POSTGRES_USER:-swistack},\
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-password},\
JWT_SECRET=${JWT_SECRET:-change-me},\
REDIS_URL=${REDIS_URL:-redis://$VM_EXTERNAL_IP:6379},\
MINIO_ENDPOINT=${MINIO_ENDPOINT:-$VM_EXTERNAL_IP:9000},\
MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY:-minioadmin},\
MINIO_SECRET_KEY=${MINIO_SECRET_KEY:-minioadmin},\
MINIO_BUCKET=${MINIO_BUCKET:-swistack-storage} \
  --project $GCP_PROJECT_ID

# Get backend URL
BACKEND_URL=$(gcloud run services describe swistack-backend --region=$GCP_REGION --project=$GCP_PROJECT_ID --format='value(status.url)')
echo "Backend deployed at: $BACKEND_URL"

echo "4️⃣ Rebuilding frontend with correct API URL..."

# Create temporary frontend build config with API URL
cat > cloudbuild-frontend-rebuild.yaml << EOF
steps:
- name: 'gcr.io/cloud-builders/docker'
  args: ['build', '-f', 'packages/frontend/Dockerfile.prod', '--build-arg', 'NEXT_PUBLIC_API_URL=$BACKEND_URL', '-t', 'gcr.io/$GCP_PROJECT_ID/swistack-frontend:latest', '.']
- name: 'gcr.io/cloud-builders/docker'
  args: ['push', 'gcr.io/$GCP_PROJECT_ID/swistack-frontend:latest']

images:
- 'gcr.io/$GCP_PROJECT_ID/swistack-frontend:latest'
EOF

# Rebuild frontend with correct backend URL using Cloud Build
gcloud builds submit . \
  --config cloudbuild-frontend-rebuild.yaml \
  --project $GCP_PROJECT_ID

# Clean up temporary config
rm -f cloudbuild-frontend-rebuild.yaml

echo "5️⃣ Deploying frontend to Cloud Run..."

# Deploy frontend
gcloud run deploy swistack-frontend \
  --image gcr.io/$GCP_PROJECT_ID/swistack-frontend:latest \
  --platform managed \
  --region $GCP_REGION \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 0.5 \
  --port 3000 \
  --max-instances 5 \
  --project $GCP_PROJECT_ID

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe swistack-frontend --region=$GCP_REGION --project=$GCP_PROJECT_ID --format='value(status.url)')

echo "6️⃣ Running database migrations..."

# Ensure idempotent job creation (delete if exists, ignore errors)
gcloud run jobs delete swistack-migrate --region $GCP_REGION --project $GCP_PROJECT_ID --quiet >/dev/null 2>&1 || true

# Run migrations via gcloud run jobs (one-time)
gcloud run jobs create swistack-migrate \
  --image gcr.io/$GCP_PROJECT_ID/swistack-backend \
  --region $GCP_REGION \
  --memory 1Gi \
  --cpu 1 \
  --set-env-vars \
NODE_ENV=production,\
DATABASE_URL=${DATABASE_URL:-postgresql://swistack:password@$VM_EXTERNAL_IP:5432/swistack} \
  --command npm \
  --args run,db:migrate,-w,@swistack/backend \
  --project $GCP_PROJECT_ID

# Execute migration
gcloud run jobs execute swistack-migrate --region=$GCP_REGION --project=$GCP_PROJECT_ID --wait

echo ""
echo "🎉 Cloud Run Deployment Completed!"
echo "=================================="
echo "✅ Backend URL:  $BACKEND_URL"
echo "✅ Frontend URL: $FRONTEND_URL"  
echo "✅ Database:     $VM_EXTERNAL_IP:5432 (PostgreSQL)"
echo "✅ Redis:        $VM_EXTERNAL_IP:6379"
echo "✅ MinIO:        $VM_EXTERNAL_IP:9000"
echo ""
echo "🔧 Your SwiStack is now running serverless on Google Cloud Run!"
echo "🆓 Completely FREE for typical usage (2M requests/month)"
