---
name: azure-ops
description: >-
  Manage Azure free tier services for the Nexus logistics platform.
  Use when deploying, monitoring, troubleshooting, or configuring Azure resources
  including App Service, IoT Hub, Application Insights, Blob Storage, Key Vault,
  and Azure Functions. Knows free tier limits and cost optimization strategies.
---

# Azure Operations Skill for NEXUS

This skill provides operational guidance for managing Azure free tier services
integrated with the NEXUS Autonomous Logistics & Spatial Intelligence platform.

---

## Architecture Overview

NEXUS uses the following Azure free tier services:

| Service | SKU | Free Limits | Purpose |
|---------|-----|-------------|---------|
| **App Service** | F1 | 60 CPU min/day, 1 GB RAM | Backend API hosting |
| **Static Web Apps** | Free | 100 GB bandwidth/month | Next.js frontend hosting |
| **IoT Hub** | F1 | 8,000 messages/day | Vehicle telemetry ingestion |
| **Application Insights** | Free | 5 GB ingestion/month | Monitoring & analytics |
| **Blob Storage** | Standard_LRS | 5 GB (12-month free) | Telemetry archive, file uploads |
| **Key Vault** | Standard | ~10K ops/month | Secrets management |
| **Azure Functions** | Consumption | 1M executions/month | Background jobs |
| **Azure SQL Database** | Free | 100K vCore sec/month, 32 GB | Optional managed database |

---

## Deployment Commands

### Deploy All Free Tier Resources
```powershell
# Run from project root
.\infra\scripts\deploy-free-tier.ps1 -Location "eastus"
```

### Deploy Frontend Only
```bash
cd frontend
az staticwebapp create --name nexus-app --resource-group nexus-free-rg --sku Free
```

### Deploy Backend Only
```bash
cd backend
az webapp up --name nexus-api --resource-group nexus-free-rg --runtime "PYTHON:3.11" --sku F1
```

### Populate Key Vault Secrets
```powershell
.\infra\scripts\setup-keyvault-secrets.ps1 -VaultName "nexus-kv"
```

---

## Key Configuration Files

| File | Purpose |
|------|---------|
| `backend/app/core/config.py` | All Azure config settings |
| `backend/app/integrations/azure_monitor.py` | Application Insights integration |
| `backend/app/integrations/azure_blob_storage.py` | Blob Storage integration |
| `backend/app/integrations/azure_iot.py` | IoT Hub gateway |
| `backend/app/integrations/azure_keyvault.py` | Key Vault secrets |
| `backend/app/integrations/azure_functions_tasks.py` | Scheduled background tasks |
| `infra/bicep/main.bicep` | Infrastructure-as-Code template |
| `infra/scripts/deploy-free-tier.ps1` | Deployment automation |
| `.env.example` | All environment variables |

---

## Environment Variables

### Required for Azure Integration
```
AZURE_TENANT_ID                         # Azure AD tenant
AZURE_CLIENT_ID                         # Service principal app ID
AZURE_CLIENT_SECRET                     # Service principal secret
APPLICATIONINSIGHTS_CONNECTION_STRING   # App Insights connection
AZURE_STORAGE_CONNECTION_STRING         # Blob storage connection
AZURE_KEYVAULT_URL                      # Key Vault URI
AZURE_IOT_HUB_CONNECTION_STRING         # IoT Hub connection
```

### Feature Flags
```
AZURE_MONITOR_ENABLED=true              # Enable/disable App Insights
AZURE_STORAGE_ENABLED=true              # Enable/disable Blob Storage
AZURE_IOT_HUB_ENABLED=true             # Enable/disable IoT Hub
AZURE_FUNCTIONS_ENABLED=true            # Enable/disable Functions
FABRIC_ONELAKE_ENABLED=true             # Enable/disable Fabric
```

---

## Monitoring & Analytics

### View Application Insights Dashboard
```bash
az monitor app-insights component show --app nexus-insights --resource-group nexus-free-rg
```

### Query Logs (KQL)
```bash
az monitor app-insights query --app nexus-insights --analytics-query "
  requests
  | where timestamp > ago(24h)
  | summarize count() by bin(timestamp, 1h), resultCode
  | order by timestamp desc
"
```

### Check Free Tier Usage
```bash
# Check App Insights ingestion (stay under 5 GB/month)
az monitor app-insights component show --app nexus-insights -g nexus-free-rg --query "ingestionMode"

# Check Storage usage (stay under 5 GB)
az storage account show --name nexusstorage -g nexus-free-rg --query "primaryEndpoints"

# Check IoT Hub message count (stay under 8K/day)
az iot hub show --name nexus-iot -g nexus-free-rg --query "properties.features"
```

---

## Cost Optimization Rules

1. **ALWAYS set budget alerts**: Create $1 and $5 alerts in Cost Management
2. **Use daily volume caps**: Set App Insights daily cap to prevent overages
3. **Keep Neon for database**: Save Azure credit for IoT Hub & monitoring
4. **Archive old telemetry**: Move to Blob Storage Cool tier after 30 days
5. **Monitor IoT Hub messages**: 8K/day = ~5 vehicles at 2-minute intervals
6. **Use Azure Functions wisely**: 1M executions/month is generous but track usage
7. **Tag all resources**: Use tags like `Project: Nexus`, `Environment: dev`

---

## Troubleshooting

### App Service F1 throttled (60 CPU min exceeded)
- Check CPU usage: `az webapp show --name nexus-api -g nexus-free-rg`
- Optimize: Enable caching, reduce computation in request handlers
- Upgrade: B1 ($13/month) if needed, covered by student credit

### Application Insights exceeding 5 GB
- Set daily cap: Portal > App Insights > Usage and estimated costs > Daily Cap
- Reduce sampling: Set sampling rate in OpenTelemetry config
- Filter noise: Exclude health check endpoints from telemetry

### IoT Hub message limit reached
- Reduce telemetry frequency (from 10s to 120s intervals)
- Batch messages (combine 10 readings into 1 message)
- Use device twins for state instead of frequent messages

---

## Antigravity Integration

This project includes an Antigravity workspace skill (this file) that:
- Provides Azure operations context to the AI assistant
- Enables quick lookups of deployment commands and config
- Documents free tier limits and cost optimization
- Integrates with the project's existing CI/CD pipeline

To use: Ask Antigravity about Azure deployment, monitoring, or configuration
and it will use this skill's knowledge automatically.
