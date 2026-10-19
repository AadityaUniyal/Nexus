# Database operations

PostgreSQL is the system of record. SQLAlchemy models in `backend/app/models/` and Alembic revisions in `backend/alembic/` are the canonical schema and migration path.

## Migrations

Run migrations from the backend environment:

```bash
cd backend
alembic upgrade head
```

Review generated migrations before applying them. Production migrations must use the deployment's approved migration job and a verified backup/recovery plan. Do not use Prisma `db push` to change a deployed schema.

## Legacy Prisma demo fixture

`prisma/schema.prisma` and `prisma/seed.ts` are deprecated compatibility artifacts. The seed deletes and recreates operational rows, so it is not included in package scripts, deployment, or migration workflows. It refuses to run unless all of the following hold:

- `APP_ENV=development`
- `NEXUS_ENABLE_LOCAL_DEMO_SEED=1`
- `DATABASE_URL` uses a loopback host (`localhost`, `127.0.0.1`, or `::1`)
- the database name is exactly `nexus_demo`
- PostgreSQL itself reports a loopback server address and the same database name

Use a disposable local database only. Do not point this fixture at production, staging, a shared development database, or a customer's data. Each fixture account receives a random unusable password hash; the seed does not provide demo login credentials.

The backend's `backend/app/db/seed.py` entry point creates schema only; it does not insert demo records. Real workspaces and operational records should be created through authenticated product flows or controlled test fixtures.
