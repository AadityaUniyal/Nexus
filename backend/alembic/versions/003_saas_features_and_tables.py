"""saas_features_and_tables

Revision ID: b7e891c34f12
Revises: aad5e71dd967
Create Date: 2026-09-28 21:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from app.db.base import Base
import app.models

# revision identifiers, used by Alembic.
revision: str = 'b7e891c34f12'
down_revision: Union[str, None] = 'aad5e71dd967'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Alter statements for existing tables
    alter_statements = [
        "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS organization_id VARCHAR(64);",
        "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS settings JSON DEFAULT '{}';",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id VARCHAR(64);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512);",
        "ALTER TABLE incidents ADD COLUMN IF NOT EXISTS lat FLOAT;",
        "ALTER TABLE incidents ADD COLUMN IF NOT EXISTS lng FLOAT;",
        "ALTER TABLE incidents ADD COLUMN IF NOT EXISTS category VARCHAR(64) DEFAULT 'WEATHER';",
        "ALTER TABLE incidents ADD COLUMN IF NOT EXISTS orders_affected INTEGER DEFAULT 0;",
        "ALTER TABLE incidents ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 75;",
        "ALTER TABLE incidents ADD COLUMN IF NOT EXISTS evidence_json JSON DEFAULT '{}';",
        "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_type_id VARCHAR(64);",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id VARCHAR(64);",
    ]
    for stmt in alter_statements:
        try:
            op.execute(stmt)
        except Exception:
            pass

    # 2. Ensure all metadata tables exist
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)

def downgrade() -> None:
    pass
