# 🌐 Enterprise Deployment Playbook

NEXUS can be deployed using Vercel, Docker Containers, or cloud providers (AWS / Render / Railway).

---

## 1. Vercel Deployment (Frontend)

1. Connect GitHub repository to Vercel.
2. Set Root Directory to `frontend`.
3. Configure Environment Variables:
   - `NEXT_PUBLIC_API_BASE_URL`: `https://your-backend-domain.com`
4. Deploy.

---

## 2. Docker Container Deployment

```bash
# Build and start all services
docker-compose up -d --build
```

---

## 3. Database Deployment (Neon PostgreSQL)

1. Provision a serverless PostgreSQL instance on [Neon](https://neon.tech).
2. Set `DATABASE_URL` in `backend/.env` and `frontend/.env`.
3. Run Alembic migrations:
   ```bash
   cd backend
   alembic upgrade head
   ```
