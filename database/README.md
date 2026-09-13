# 🐘 NEXUS Database Architecture

Neon Cloud PostgreSQL Database schema, Prisma schema definitions, Alembic migrations, and seed scripts.

---

## 🏛️ Database Features

- **26 Relational Tables**: Full FK constraints, cascading delete rules, and spatial coordinate indexing.
- **Optimistic Concurrency Control**: Entity update locks via `version: int` columns.
- **Transaction Outbox Pattern**: Guaranteed event delivery via `event_outbox` table.

---

## 🚀 Migrations & Seeding

```bash
# Apply migrations via Alembic (in backend/)
alembic upgrade head

# Seed database via Prisma (in database/)
npx prisma db seed
```
