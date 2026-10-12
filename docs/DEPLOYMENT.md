# 🌐 Enterprise Deployment Playbook

NEXUS is engineered for seamless cloud deployment across Vercel (Frontend Next.js 15), Azure App Service / Docker / Linux (FastAPI Backend), and Serverless PostgreSQL (Neon / Azure Flexible Server).

---

## 🚀 Live Production Deployments

- **Production Web Application**: [https://nexus-logistics-os.vercel.app](https://nexus-logistics-os.vercel.app)
- **Deployment Build Target**: [https://nexus-logistics-pftnvtaid-aaditya-uniyals-projects.vercel.app](https://nexus-logistics-pftnvtaid-aaditya-uniyals-projects.vercel.app)
- **FastAPI Backend Documentation**: [https://nexus-api-prod-adfjh5fvabd6cpgv.austriaeast-01.azurewebsites.net/docs](https://nexus-api-prod-adfjh5fvabd6cpgv.austriaeast-01.azurewebsites.net/docs)

---

## 1. Vercel Production Deployment (Frontend)

The frontend is an optimized Next.js 15 App Router application with zero-runtime CSS, Server Components, and Leaflet GIS client islands.

1. **GitHub Connection**:
   - Link the `Nexus` GitHub repository directly in the Vercel dashboard.
2. **Build Configuration**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
3. **Environment Variables**:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://nexus-api-prod-adfjh5fvabd6cpgv.austriaeast-01.azurewebsites.net
   NEXT_PUBLIC_APP_ENV=production
   NEXT_PUBLIC_WS_BASE_URL=wss://nexus-api-prod-adfjh5fvabd6cpgv.austriaeast-01.azurewebsites.net/ws
   ```
4. **Deploy**:
   - Push to `origin/main` automatically triggers production builds and atomic deployments.

---

## 2. Azure App Service / Linux Deployment (Backend)

The backend runs as a high-concurrency ASGI Python 3.11 service via Uvicorn.

### 2.1 Configuration
```bash
az webapp config set \
  --resource-group rg-nexus-prod \
  --name nexus-api-prod \
  --startup-file "gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind=0.0.0.0:8000"
```

### 2.2 Key Backend Environment Variables
```env
ENVIRONMENT=production
PROJECT_NAME="NEXUS Autonomous Logistics"
DATABASE_URL=postgresql+asyncpg://<user>:<password>@<host>/nexus_db?ssl=require
SECRET_KEY=<enterprise-256-bit-secret>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ALLOWED_ORIGINS=["https://nexus-logistics-os.vercel.app","http://localhost:3000"]
AZURE_LOCATION=austriaeast
```

---

## 3. Docker Container Deployment

For self-hosted Kubernetes clusters, AWS ECS, or local validation:

```bash
# 1. Clone repository
git clone https://github.com/AadityaUniyal/Nexus.git
cd Nexus

# 2. Build and launch multi-container topology
docker-compose up -d --build

# 3. Verify health
docker-compose ps
curl http://localhost:8000/api/v1/health/liveness
curl http://localhost:8000/api/v1/health/sla
```

---

## 4. Database Initialization & Migrations (PostgreSQL)

NEXUS enforces multi-tenant row-level security and schema migrations via Alembic:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run migrations to latest head revision
alembic upgrade head
```

---

## 5. Automated CI/CD & Security Verification

All commits to `main` must pass the test suites:
- **Backend Test Suite**: `pytest backend/tests` (77 passing tests)
- **Frontend Type & Build Check**: `npm run build` in `frontend` (66 static pages compiled with 0 errors)
- **Security Headers**: HSTS, CSP with CartoDB Leaflet map sources, X-Frame-Options DENY, and X-Content-Type-Options nosniff.
