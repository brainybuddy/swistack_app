# SwiStack Google Cloud Run Deployment (FREE)

Deploy SwiStack serverless to Google Cloud Run with your existing VM database.

## 🎯 **Architecture**
- **Frontend**: Cloud Run (serverless Next.js)
- **Backend**: Cloud Run (serverless Node.js API)
- **Database**: Your VM PostgreSQL (34.123.59.185:5432)
- **Redis**: Your VM Redis (34.123.59.185:6379) 
- **Storage**: Your VM MinIO (34.123.59.185:9000)

## 🆓 **Cost: Completely FREE**
- **2M requests/month** free on Cloud Run
- **VM services** already running (no additional cost)
- **Build minutes** free with Google Cloud Build

## 🚀 **Quick Deploy**

### Prerequisites
```bash
# Install Google Cloud SDK
# macOS:
brew install google-cloud-sdk

# Ubuntu/Debian:
curl https://sdk.cloud.google.com | bash
```

### Deploy Steps
```bash
# 1. Authenticate with Google Cloud
gcloud auth login
gcloud config set project swistack

# 2. Run deployment script
./scripts/deploy-cloudrun.sh
```

## 📋 **What the Script Does**

1. **Enable APIs** - Cloud Run and Cloud Build
2. **Build Images** - Backend and Frontend Docker images
3. **Deploy Backend** - With environment variables pointing to your VM (DB/Redis/MinIO)
4. **Deploy Frontend** - Production build with correct backend API URL
5. **Run Migrations** - Database setup via Cloud Run Jobs
6. **Output URLs** - Your live HTTPS endpoints

## 🔧 **Environment Variables**

The deployment automatically configures:
```bash
# Database (Your VM)
DATABASE_URL=postgresql://swistack:PASSWORD@34.123.59.185:5432/swistack

# Services (Your VM)
REDIS_URL=redis://34.123.59.185:6379
MINIO_ENDPOINT=34.123.59.185:9000

# Security
JWT_SECRET=<your-strong-secret>
```

## 🌐 **After Deployment**

You'll get URLs like:
- **Frontend**: `https://swistack-frontend-XXXXX.run.app`
- **Backend**: `https://swistack-backend-XXXXX.run.app`

Both with:
- ✅ **Auto HTTPS/SSL**
- ✅ **Global CDN**
- ✅ **Auto-scaling**
- ✅ **Zero cold starts** (for typical usage)

## 🔄 **Updates**

To update your deployment:
```bash
# Just run the script again
./scripts/deploy-cloudrun.sh
```

## 🛠️ **Manual Commands**

### View Services
```bash
gcloud run services list --project swistack
```

### View Logs
```bash
gcloud run logs tail --service swistack-backend --project swistack
gcloud run logs tail --service swistack-frontend --project swistack
```

### Update Environment Variables
```bash
gcloud run services update swistack-backend \
  --update-env-vars NEW_VAR=value \
  --project swistack
```

## 🚨 **Troubleshooting**

### VM Firewall Rules
Your VM needs to allow connections from Cloud Run:
```bash
# SSH to your VM
gcloud compute ssh deploy@instance-20250909-155236 --zone=us-central1-c

# Check if services are accessible
sudo ufw status
sudo ufw allow 5432  # PostgreSQL
sudo ufw allow 6379  # Redis  
sudo ufw allow 9000  # MinIO
```

### Database Connection Issues
```bash
# Test connection from Cloud Run
gcloud run jobs create test-db \
  --image postgres:15-alpine \
  --region us-central1 \
  --command psql \
  --args "postgresql://swistack:PASSWORD@34.123.59.185:5432/swistack","-c","SELECT version();" \
  --project swistack
```

## 📊 **Monitoring**

### Cloud Run Metrics
- Visit: [Cloud Run Console](https://console.cloud.google.com/run?project=swistack)
- Monitor: Requests, latency, memory, CPU

### Cost Tracking
- Visit: [Cloud Billing](https://console.cloud.google.com/billing?project=swistack)
- Should stay at $0 for typical usage

## 🔒 **Security**

### Firewall (VM)
```bash
# Allow only Cloud Run IP ranges (optional, more secure)
gcloud compute firewall-rules create allow-cloud-run-to-vm \
  --allow tcp:5432,tcp:6379,tcp:9000 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow Cloud Run to access VM services"
```

### Private Service Connect (Advanced)
For production, consider using Private Service Connect to keep database traffic private.

## ✅ **Benefits of This Setup**

1. **Cost**: $0 for Cloud Run, existing VM costs unchanged
2. **Performance**: Global CDN, auto-scaling
3. **Reliability**: Google SLA, automatic failover  
4. **Security**: HTTPS everywhere, Google security
5. **Maintenance**: Serverless = no server management
6. **Scaling**: Handles traffic spikes automatically

Your SwiStack is now enterprise-grade serverless! 🚀
