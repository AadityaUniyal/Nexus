import asyncio
import logging
from sqlalchemy import text
from app.db.session import engine
from app.db.base import Base
import app.models  # ensure models are registered
from app.db.seed import seed_database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nexus.migrate")

ALTER_STATEMENTS = [
    # Workspaces & Users Organization relations
    "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS organization_id VARCHAR(64);",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id VARCHAR(64);",
    
    # Incidents geospatial & operational enhancements
    "ALTER TABLE incidents ADD COLUMN IF NOT EXISTS lat FLOAT;",
    "ALTER TABLE incidents ADD COLUMN IF NOT EXISTS lng FLOAT;",
    "ALTER TABLE incidents ADD COLUMN IF NOT EXISTS category VARCHAR(64) DEFAULT 'WEATHER';",
    "ALTER TABLE incidents ADD COLUMN IF NOT EXISTS orders_affected INTEGER DEFAULT 0;",
    "ALTER TABLE incidents ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 75;",
    "ALTER TABLE incidents ADD COLUMN IF NOT EXISTS evidence_json JSON DEFAULT '{}';",

    # Vehicles & Orders connections
    "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_type_id VARCHAR(64);",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id VARCHAR(64);",
    
    # Workspace settings and user avatar
    "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS settings JSON DEFAULT '{}';",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512);",
]

async def apply_saas_migrations():
    logger.info("Applying SaaS column additions to PostgreSQL...")
    async with engine.begin() as conn:
        for stmt in ALTER_STATEMENTS:
            try:
                await conn.execute(text(stmt))
            except Exception as e:
                logger.warning("Migration statement warning (%s): %s", stmt, e)

        logger.info("Creating all new SaaS entity tables...")
        await conn.run_sync(Base.metadata.create_all)

    logger.info("Running database seed with SaaS tenant data...")
    await seed_database()
    logger.info("SaaS Database Migration and Seeding Complete!")

if __name__ == "__main__":
    asyncio.run(apply_saas_migrations())
