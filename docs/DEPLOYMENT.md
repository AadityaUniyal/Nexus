# NEXUS Deployment & Operations Runbook

This document details the production deployment, infrastructure provisioning, secrets management, and operational procedures for NEXUS.

---

## 1. Prerequisites

- **Azure CLI (`az`)** v2.50+ authenticated to your Azure for Students subscription (`az login`).
- **GitHub CLI (`gh`)** or web access for GitHub Container Registry (GHCR) and Actions.
- **Node.js 20+ & Python 3.11+** installed locally.
- **Clerk Account** (Development instance with Publishable Key & Secret Key).
- **Neon Postgres Database** (Serverless Postgres connection string with SSL).

---

## 2. Azure Infrastructure Provisioning (Task 1 / CP-1)

NEXUS infrastructure is defined declaratively using Azure Bicep under `infra/main.bicep`.

### Step 2.1: Pre-flight Verification (What-If)
Run a what-if validation to ensure zero unexpected billable resources:

```bash
az deployment sub what-if \
  --location southeastasia \
  --template-file infra/main.bicep \
  --parameters resourceGroupName=rg-nexus-real location=southeastasia
```

### Step 2.2: Execute Deployment
Deploy the 13 compliant, student-tier-safe resources:

```bash
az deployment sub create \
  --location southeastasia \
  --template-file infra/main.bicep \
  --parameters resourceGroupName=rg-nexus-real location=southeastasia
```

### Deployed Resources Summary:
1. `Microsoft.Maps/accounts` (Gen2 pricing tier, consumption-based, Entra ID authenticated).
2. `Microsoft.KeyVault/vaults` (Standard, RBAC-enabled, TLS 1.3).
3. `Microsoft.Storage/storageAccounts` (Standard_LRS, TLS 1.2 minimum, Blob storage for daily Parquet lakehouse exports).
4. `Microsoft.OperationalInsights/workspaces` (PerGB2018 free allowance, 30 days retention).
5. `Microsoft.Insights/components` (Application Insights backed by Log Analytics).
6. `Microsoft.ManagedIdentity/userAssignedIdentities` (Used by App Service to access Azure Maps and Key Vault without secret keys).
7. `Microsoft.Authorization/roleAssignments` (Maps Data Reader, Key Vault Secrets User, Storage Blob Data Contributor).
8. `Microsoft.Consumption/budgets` ($50 and $80 automated consumption email alert thresholds).

---

## 3. Secret Management & Key Vault Configuration

All application secrets are stored in Azure Key Vault. The backend retrieves configuration via User-Assigned Managed Identity at startup, with local fallback to environment variables in development.

### Secrets in Azure Key Vault:
- `DATABASE-URL`: Neon Serverless Postgres URI (`postgresql+asyncpg://...`)
- `CLERK-SECRET-KEY`: Clerk Backend Secret Key (`sk_test_...`)
- `CLERK-JWKS-URL`: Clerk JWKS endpoint (`https://<app>.clerk.accounts.dev/.well-known/jwks.json`)
- `AZURE-MAPS-CLIENT-ID`: Azure Maps Gen2 Account Client ID (`GUID`)

### Key Vault Population Command:
```bash
az keyvault secret set --vault-name kv-nexus-real --name "DATABASE-URL" --value "<YOUR_NEON_URL>"
az keyvault secret set --vault-name kv-nexus-real --name "CLERK-SECRET-KEY" --value "<YOUR_CLERK_SECRET>"
az keyvault secret set --vault-name kv-nexus-real --name "CLERK-JWKS-URL" --value "<YOUR_JWKS_URL>"
az keyvault secret set --vault-name kv-nexus-real --name "AZURE-MAPS-CLIENT-ID" --value "<YOUR_MAPS_CLIENT_ID>"
```

---

## 4. Backend Deployment (Azure App Service / GHCR)

The backend is packaged as a minimal Linux container published to GitHub Container Registry (GHCR) to avoid Azure Container Registry Basic monthly storage charges.

### Build and Push Container:
```bash
docker build -t ghcr.io/<org>/nexus-backend:latest -f backend/Dockerfile .
docker push ghcr.io/<org>/nexus-backend:latest
```

### App Service Configuration:
- **SKU**: B1 / F1 Free Linux Tier.
- **Port**: 8000 (`WEBSITES_PORT=8000`).
- **Identity**: User-Assigned Managed Identity attached to App Service.
- **Environment Settings**:
  - `AZURE_KEY_VAULT_NAME=kv-nexus-real`
  - `AZURE_MAPS_CLIENT_ID=<GUID>`
  - `APPLICATIONINSIGHTS_CONNECTION_STRING=<InstrumentationKey>`

---

## 5. Frontend Deployment (Vercel)

The Next.js 14 frontend deploys to Vercel (Edge network).

### Environment Variables on Vercel:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: `pk_test_...`
- `CLERK_SECRET_KEY`: `sk_test_...`
- `NEXT_PUBLIC_API_URL`: Backend URL (e.g., `https://app-nexus-backend.azurewebsites.net`)

### Deployment:
```bash
vercel --prod
```

---

## 6. Daily Parquet Lakehouse Telemetry Export

The backend runs a scheduled daily telemetry exporter (`app/services/parquet_export.py`) writing to Azure Blob Storage:
- **Container**: `telemetry`
- **Partitioning**: `telemetry/year=YYYY/month=MM/day=DD/pings.parquet` and `predictions.parquet`.
- **Retention**: Lifecycle rule moves telemetry older than 90 days to Cool/Archive storage.

---

## 7. Operational Monitoring & Diagnostics

- **Health Checks**:
  - `/health/live`: Returns `200 OK` (liveness probe).
  - `/health/ready`: Checks database connection and Azure Maps reachability (readiness probe).
- **Application Insights**: OpenTelemetry spans export traces, latency histograms, and rate-limiting metrics.
- **Budget Tracking**: Monitored via Azure Cost Management alerts at $50 (50%) and $80 (80%).
