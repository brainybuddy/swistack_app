#!/bin/bash

# SwiStack GCP Deployment Script
# Standalone alternative without GitHub Actions

set -e

# Configuration
GCP_ZONE="us-central1-c"
GCP_INSTANCE="instance-20250909-155236"
GCP_PROJECT_ID="your-project-id"
DEPLOY_USER="deploy"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 SwiStack GCP Deployment${NC}"
echo -e "${BLUE}=========================${NC}\n"

# Step 1: Build locally and push to Google Container Registry
echo -e "${GREEN}1️⃣ Building Docker images...${NC}"

# Build images
docker build -t gcr.io/$GCP_PROJECT_ID/swistack-backend:latest -f packages/backend/Dockerfile .
docker build -t gcr.io/$GCP_PROJECT_ID/swistack-frontend:latest -f packages/frontend/Dockerfile.prod .

echo -e "${GREEN}2️⃣ Pushing to Google Container Registry...${NC}"

# Push to GCR (free for small usage)
docker push gcr.io/$GCP_PROJECT_ID/swistack-backend:latest
docker push gcr.io/$GCP_PROJECT_ID/swistack-frontend:latest

echo -e "${GREEN}3️⃣ Deploying to GCP instance...${NC}"

# Deploy to GCP instance
gcloud compute ssh $DEPLOY_USER@$GCP_INSTANCE --zone=$GCP_ZONE --command="
    set -e
    cd /opt/swistack
    
    # Pull latest images
    docker pull gcr.io/$GCP_PROJECT_ID/swistack-backend:latest
    docker pull gcr.io/$GCP_PROJECT_ID/swistack-frontend:latest
    
    # Update docker-compose to use new images
    export BACKEND_IMAGE=gcr.io/$GCP_PROJECT_ID/swistack-backend:latest
    export FRONTEND_IMAGE=gcr.io/$GCP_PROJECT_ID/swistack-frontend:latest
    
    # Deploy
    docker-compose -f docker-compose.prod.yml up -d --remove-orphans
    
    # Run migrations
    sleep 10
    docker-compose -f docker-compose.prod.yml exec -T backend npm run migrate:latest
    
    echo '✅ Deployment completed!'
"

echo -e "${GREEN}4️⃣ Running health checks...${NC}"

# Health check
gcloud compute ssh $DEPLOY_USER@$GCP_INSTANCE --zone=$GCP_ZONE --command="
    curl -f http://localhost:3001/health && echo '✅ Backend healthy'
    curl -f http://localhost:3000 && echo '✅ Frontend healthy'
"

echo -e "\n${GREEN}🎉 Deployment successful!${NC}"
echo "Frontend: http://34.123.59.185:3000"
echo "Backend: http://34.123.59.185:3001"
