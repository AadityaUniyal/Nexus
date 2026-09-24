# 🚀 FREE Deployment Guide - Make NEXUS Production-Ready

## Prerequisites

1. ✅ Azure for Students account activated
2. ✅ Azure CLI installed: `winget install Microsoft.AzureCLI`
3. ✅ Git installed
4. ✅ Node.js 20+ and Python 3.11+ installed

---

## Step 1: Login to Azure

```bash
# Login to your student account
az login

# Verify your subscription
az account show

# Create resource group (FREE)
az group create \
  --name nexus-student-rg \
  --location eastus
```

---

## Step 2: Deploy Frontend (Azure Static Web Apps - FREE)

### Option A: Using Azure CLI

```bash
# Navigate to your project
cd c:\Users\HP\OneDrive\Desktop\nexus

# Install Azure Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Deploy frontend
cd frontend
npm install
npm run build

# Create Static Web App (first time)
az staticwebapp create \
  --name nexus-app \
  --resource-group nexus-student-rg \
  --source . \
  --location "eastus2" \
  --branch main \
  --app-location "/frontend" \
  --output-location "out" \
  --sku Free

# Deploy
az staticwebapp deploy \
  --name nexus-app \
  --resource-group nexus-student-rg \
  --app-location frontend \
  --output-location .next
```

### Option B: Using GitHub Actions (RECOMMENDED)

1. Push code to GitHub
2. Go to Azure Portal → Static Web Apps → Create
3. Select GitHub repo
4. Configure:
   - App location: `/frontend`
   - Output location: `.next` or `out`
5. Azure auto-creates GitHub Action

Your frontend will be live at: `https://nexus-app.azurestaticapps.net`

---

## Step 3: Set Up FREE Database (Neon - Keep Current)

```bash
# Your current Neon setup is perfect - FREE and serverless!
# Just ensure .env has:
DATABASE_URL=postgresql://...@...neon.tech/nexus_db?sslmode=require

# Run migrations
cd backend
python -m alembic upgrade head
```

**Why Neon over Azure PostgreSQL?**
- ✅ 3 GB free (vs paying with Azure credit)
- ✅ Serverless (auto-pause when idle)
- ✅ Always-on free tier
- ✅ Save Azure credit for other services

---

## Step 4: Set Up Azure Key Vault (FREE)

```bash
# Create Key Vault (10K operations/month FREE)
az keyvault create \
  --name nexus-vault \
  --resource-group nexus-student-rg \
  --location eastus

# Store secrets
az keyvault secret set \
  --vault-name nexus-vault \
  --name "DATABASE-URL" \
  --value "your-neon-connection-string"

az keyvault secret set \
  --vault-name nexus-vault \
  --name "GROQ-API-KEY" \
  --value "your-groq-key"

az keyvault secret set \
  --vault-name nexus-vault \
  --name "CLERK-ISSUER" \
  --value "your-clerk-issuer"

# Grant your app access (we'll do this after deploying backend)
```

---

## Step 5: Deploy Backend

### Option A: Azure App Service (F1 FREE - 60 CPU min/day)

```bash
cd backend

# Create App Service Plan (F1 = FREE)
az appservice plan create \
  --name nexus-backend-plan \
  --resource-group nexus-student-rg \
  --sku F1 \
  --is-linux

# Create Web App
az webapp create \
  --name nexus-backend \
  --resource-group nexus-student-rg \
  --plan nexus-backend-plan \
  --runtime "PYTHON:3.11"

# Configure environment variables
az webapp config appsettings set \
  --name nexus-backend \
  --resource-group nexus-student-rg \
  --settings \
    DATABASE_URL="@Microsoft.KeyVault(VaultName=nexus-vault;SecretName=DATABASE-URL)" \
    GROQ_API_KEY="@Microsoft.KeyVault(VaultName=nexus-vault;SecretName=GROQ-API-KEY)" \
    APP_ENV="production"

# Deploy code
az webapp up \
  --name nexus-backend \
  --resource-group nexus-student-rg \
  --runtime "PYTHON:3.11"
```

**⚠️ F1 Limitations:**
- 60 CPU minutes/day (enough for 100-500 users/day)
- 1 GB RAM
- For higher traffic, upgrade to B1 ($13/month) using Azure credit

### Option B: Railway/Render (RECOMMENDED for FREE)

**Railway FREE Tier:**
- 500 hours/month
- 512 MB RAM
- Better for 24/7 apps

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Render FREE Tier:**
- Unlimited hours (spins down after 15 min idle)
- 512 MB RAM

```bash
# Push to GitHub, then:
# 1. Go to render.com
# 2. New Web Service → Connect GitHub
# 3. Select nexus repo
# 4. Root: /backend
# 5. Build: pip install -r requirements.txt
# 6. Start: uvicorn app.main:app --host 0.0.0.0 --port 10000
```

---

## Step 6: Set Up Azure IoT Hub (F1 FREE)

```bash
# Create IoT Hub (8,000 messages/day FREE)
az iot hub create \
  --name nexus-iot-hub \
  --resource-group nexus-student-rg \
  --sku F1 \
  --partition-count 2

# Get connection string
az iot hub connection-string show \
  --hub-name nexus-iot-hub \
  --output table

# Store in Key Vault
az keyvault secret set \
  --vault-name nexus-vault \
  --name "IOT-HUB-CONNECTION" \
  --value "HostName=nexus-iot-hub.azure-devices.net;..."
```

---

## Step 7: Set Up Application Insights (FREE 5GB/month)

```bash
# Create Application Insights
az monitor app-insights component create \
  --app nexus-insights \
  --location eastus \
  --resource-group nexus-student-rg \
  --application-type web

# Get instrumentation key
az monitor app-insights component show \
  --app nexus-insights \
  --resource-group nexus-student-rg \
  --query "instrumentationKey" -o tsv

# Store in Key Vault
az keyvault secret set \
  --vault-name nexus-vault \
  --name "APPINSIGHTS-KEY" \
  --value "your-instrumentation-key"
```

---

## Step 8: Set Up Azure Storage (5 GB FREE)

```bash
# Create storage account
az storage account create \
  --name nexusstorage \
  --resource-group nexus-student-rg \
  --location eastus \
  --sku Standard_LRS

# Create blob container for uploads
az storage container create \
  --name uploads \
  --account-name nexusstorage \
  --public-access off

# Get connection string
az storage account show-connection-string \
  --name nexusstorage \
  --resource-group nexus-student-rg
```

---

## Step 9: Set Up Redis (FREE with Upstash)

**Why Upstash over Azure Cache for Redis?**
- ✅ Completely FREE (10K commands/day)
- ✅ No Azure credit needed
- ✅ Better free tier

```bash
# Go to https://upstash.com
# 1. Sign up (free)
# 2. Create Redis database
# 3. Copy connection string

# Add to .env:
REDIS_URL=rediss://default:...@...upstash.io:6379
```

---

## Step 10: Configure Environment Variables

### Backend `.env.production`:
```bash
# Database (Neon - FREE)
DATABASE_URL=postgresql+asyncpg://...@...neon.tech/nexus_db?sslmode=require

# Redis (Upstash - FREE)
REDIS_URL=rediss://default:...@...upstash.io:6379

# Azure IoT Hub (FREE F1)
AZURE_IOT_HUB_CONNECTION=HostName=nexus-iot-hub.azure-devices.net;...
AZURE_IOT_HUB_ENABLED=true

# Application Insights (FREE 5GB)
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=...
APPINSIGHTS_INSTRUMENTATION_KEY=...

# Azure Storage (FREE 5GB)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=...

# Existing Services (FREE)
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=...
GEOAPIFY_API_KEY=...
CLERK_ISSUER=...
CLERK_JWKS_URL=...

# App Config
APP_ENV=production
FRONTEND_URL=https://nexus-app.azurestaticapps.net
```

### Frontend `.env.production`:
```bash
NEXT_PUBLIC_API_URL=https://nexus-backend.azurewebsites.net
# or
NEXT_PUBLIC_API_URL=https://nexus-backend.up.railway.app
```

---

## Step 11: Set Up CI/CD (GitHub Actions - FREE)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy NEXUS

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Build Frontend
        run: |
          cd frontend
          npm install
          npm run build
      # Azure Static Web Apps auto-deploys via its own action

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Deploy to Azure App Service
        uses: azure/webapps-deploy@v2
        with:
          app-name: nexus-backend
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
```

---

## 📊 Cost Breakdown (Monthly)

### **100% FREE Setup:**
- ✅ Azure Static Web Apps: **$0**
- ✅ Neon Database (3GB): **$0**
- ✅ Upstash Redis: **$0**
- ✅ Azure IoT Hub F1: **$0**
- ✅ Application Insights (5GB): **$0**
- ✅ Azure Storage (5GB): **$0**
- ✅ Azure Key Vault: **$0**
- ✅ Groq API: **$0** (rate limited)
- ✅ Clerk Auth: **$0** (10K MAU)
- ✅ Geoapify: **$0** (3K requests/day)

**Backend Hosting Options:**
- Azure App Service F1: **$0** (60 CPU min/day)
- Railway: **$0** (500 hrs/month)
- Render: **$0** (spins down when idle)

### **TOTAL: $0/month** for 100-500 daily users! 🎉

---

## 🎯 When to Start Paying (Growth Phase)

### At 1,000 Daily Users:
- Upgrade backend to Azure App Service B1: **$13/month**
- Or keep Railway/Render free

### At 5,000 Daily Users:
- Azure App Service B2: **$55/month**
- Upstash Redis Pro: **$10/month**

### At 10,000+ Daily Users:
- Azure App Service S1: **$70/month**
- Azure Cache for Redis: **$16/month**
- Neon Scale: **$19/month**
- **Total: ~$105/month** (still within $100 Azure student credit!)

---

## 🚀 Ready to Deploy?

Choose your path:
1. **Full Azure** (use student credit for backend hosting)
2. **Hybrid** (Azure Static Web Apps + Railway backend) ← **RECOMMENDED**
3. **Vercel + Railway** (zero Azure dependency)

Would you like me to:
1. ✅ Create the deployment scripts?
2. ✅ Update backend code to use real Azure IoT Hub SDK?
3. ✅ Add Application Insights integration?
4. ✅ Set up automated deployment pipeline?
5. ✅ Create monitoring dashboards?

Let me know which you want first! 🚀
