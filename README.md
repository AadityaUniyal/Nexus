# 🌐 NEXUS — Autonomous Logistics & Spatial Intelligence Platform

<div align="center">

## *Enterprise What‑If Simulation Platform · Real‑Time Telemetry · Free‑Tier Azure Stack*

[![Live Vercel App](https://img.shields.io/badge/Vercel-Live%20Production-black?style=for-the-badge&logo=vercel&logoColor=white)](https://frontend-brown-seven-19.vercel.app)
[![Azure Backend API](https://img.shields.io/badge/Azure-App%20Service%20Online-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)](https://nexus-api-prod-adfjh5fvabd6cpgv.austriaeast-01.azurewebsites.net/api/v1/health)
[![Backend Tests](https://img.shields.io/badge/pytest-35%2F35%20passed-success.svg?style=for-the-badge&logo=python&logoColor=white)](backend/tests)
[![Next.js 15](https://img.shields.io/badge/next.js-v15.5%20(61%20pages)-000000.svg?style=for-the-badge&logo=nextdotjs&logoColor=white)](frontend)
[![FastAPI](https://img.shields.io/badge/fastapi-v0.115%2B-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white)](backend)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE)

### 🚀 **Live Production Deployment**
**Frontend (Vercel):** [https://frontend-brown-seven-19.vercel.app](https://frontend-brown-seven-19.vercel.app)  
**Backend API (Azure App Service):** [https://nexus-api-prod-adfjh5fvabd6cpgv.austriaeast-01.azurewebsites.net](https://nexus-api-prod-adfjh5fvabd6cpgv.austriaeast-01.azurewebsites.net)  
**Interactive API Docs (Swagger):** [https://nexus-api-prod-adfjh5fvabd6cpgv.austriaeast-01.azurewebsites.net/docs](https://nexus-api-prod-adfjh5fvabd6cpgv.austriaeast-01.azurewebsites.net/docs)

</div>

---

## 📑 Table of Contents
- [🚀 Live Production Deployment](#-live-production-deployment)
- [🏛️ System Architecture](#-system-architecture)
- [🧮 Core Capabilities & Feature Highlights](#-core-capabilities--feature-highlights)
- [📊 Azure Free‑Tier Quota Table](#-azure-free‑tier-quota-table)
- [🚀 Quickstart & Local Development](#-quickstart--local-development)
- [🛠️ CI/CD Pipeline](#-cicd-pipeline)
- [🔐 Security & Governance](#-security--governance)

---

## 🏛️ System Architecture

```mermaid
graph TD
    FE[Next.js (Vercel) – UI] -->|REST| BE[FastAPI (Azure App Service)]
    BE -->|Azure AD| AD[Azure Active Directory]
    AD -->|Managed Identity| KV[Azure Key Vault]
    BE -->|SQL| Neon[Neon PostgreSQL (Primary DB)]
    BE -->|SQL| AZDB[Azure PostgreSQL Flexible Server]
    BE -->|Blob SDK| Blob[Azure Blob Storage]
    BE -->|Event Hub SDK| EH[Azure Event Hubs]
    EH -->|Stream| Kusto[Azure Data Explorer (Kusto)]
    Blob -->|Batch| Synapse[Azure Synapse Analytics]
    Blob -->|Indexing| Search[Azure Cognitive Search]
    FE -->|WebSocket| Chat[Co‑pilot Chat UI]
    Chat -->|REST| LLM[Azure OpenAI / Groq (Free API keys)]
    LLM -->|Responses| FE
    BE -->|Metrics| AppInsights[Application Insights]
    Kusto -->|Realtime Queries| Dash[Analytics Dashboard (Recharts)]
    Synapse -->|Scheduled Queries| Dash
    FE -->|Leaflet (OSM)| Map[OpenStreetMap 2‑D Tile Map]
    Functions[Azure Functions] -->|Webhook| BE
    Functions -->|Email| Mail[SendGrid (Free tier)]
``` 

The diagram above visualises the full production‑ready stack, with **no hard‑coded secrets** – everything is pulled from environment variables or Azure Key Vault.

---

## 🧮 Core Capabilities & Feature Highlights
1. **Dynamic 2‑D Map** – Leaflet + OpenStreetMap tiles (free, no 3‑D).  
2. **Co‑pilot AI Chat** – Proxy endpoint `/api/v1/ai/chat` reads Azure OpenAI key from Key Vault (see `backend/app/api/v1/endpoints/ai_chat.py`).  
3. **Live Telemetry Dashboard** – Real‑time analytics via Azure Synapse & Kusto.  
4. **Admin Dashboard** – System health, pipeline status, storage usage (see `frontend/app/(app)/admin/dashboard`).  
5. **CI/CD** – GitHub Actions builds Docker image, pushes to Azure Container Registry, deploys to Azure App Service, and creates Vercel preview builds.  
6. **Free‑Tier Guardrails** – Runtime checks (future module) keep usage within Azure student limits.

---

## 📊 Azure Free‑Tier Quota Table
| Service | Free‑Tier Limit (Student) | Usage Guard (planned) |
|---------|---------------------------|-----------------------|
| Azure App Service | 1 GB storage, 60 min CPU daily | Disable non‑essential background jobs after 50 min |
| Azure Functions | 1 M executions/month | Throttle webhook triggers beyond 900 k |
| Azure Blob Storage | 5 GB, 20 k reads/month | Evict stale cache files after 24 h |
| Azure Event Hubs | 1 M events/month | Batch events in groups of ≤10 k |
| Azure Data Explorer | 1 GB data, 1 M query units | Reject analytics queries > 5 s |
| Azure Synapse (Trial) | 1 TB Spark, 2 TB DW | Schedule nightly jobs only |
| Azure Cognitive Search | 3 indexes, 10 k docs | Limit indexing to < 5 k docs/day |
| Azure OpenAI (Trial) | $18 credit ≈ 100 k tokens | Switch to Groq fallback after 80 k tokens |
| Azure Key Vault | 10 secrets (free) | Rotate secret every 30 d |

---

## 🚀 Quickstart & Local Development
```bash
# Clone repo
git clone https://github.com/AadityaUniyal/Nexus.git && cd Nexus

# Frontend
npm ci --prefix frontend
npm run dev --prefix frontend   # http://localhost:3000

# Backend (Python 3.11+)
python -m venv venv && source venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --reload --port 8000   # http://localhost:8000
```
Ensure the following environment variables are present (or use `.env`):
- `NEXT_PUBLIC_BACKEND_URL`
- `AZURE_KEYVAULT_URL`
- `AZURE_OPENAI_SECRET_NAME` (defaults to `AZURE_OPENAI_API_KEY`)
- All other service keys as described in `backend/app/core/config.py`.

---

## 🛠️ CI/CD Pipeline
The GitHub Actions workflow (`.github/workflows/ci.yml`) now:
- Lints and tests both backend and frontend.
- Builds a Docker image for the FastAPI backend and pushes to Azure Container Registry.
- Deploys the image to Azure App Service.
- Creates Vercel preview deployments for pull‑requests.
See the workflow file for the full job matrix.

---

## 🔐 Security & Governance
- **Rate Limiting**: Sliding‑window per‑route limits (`app/core/rate_limit.py`).
- **JWT RBAC**: Roles `ADMINISTRATOR`, `OPERATIONS_MANAGER`, `OPERATOR`, `VIEWER`.
- **Headers**: Strict‑Transport‑Security, CSP, X‑Content‑Type‑Options.
- **Secret Management**: All secrets stored in Azure Key Vault; never checked into repo.

---

## 📄 License
Distributed under the MIT License. See [LICENSE](LICENSE).
