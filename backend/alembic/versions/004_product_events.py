"""product analytics events table

Revision ID: 004_product_events
Revises: b7e891c34f12
Create Date: 2026-10-03 18:30:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004_product_events"
down_revision: Union[str, None] = "b7e891c34f12"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "product_events",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("name", sa.String(64), nullable=False),
        sa.Column("workspace_id", sa.String(64), nullable=True),
        sa.Column("user_id", sa.String(128), nullable=True),
        sa.Column("anonymous_id", sa.String(64), nullable=True),
        sa.Column("session_id", sa.String(64), nullable=True),
        sa.Column("path", sa.String(255), nullable=True),
        sa.Column("referrer", sa.String(255), nullable=True),
        sa.Column("device", sa.String(16), nullable=True),
        sa.Column("properties", sa.JSON(), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("received_at", sa.DateTime(timezone=True), nullable=False),
        if_not_exists=True,
    )
    op.create_index("ix_product_events_session_id", "product_events", ["session_id"], if_not_exists=True)
    op.create_index("ix_product_events_name_time", "product_events", ["name", "occurred_at"], if_not_exists=True)
    op.create_index("ix_product_events_ws_time", "product_events", ["workspace_id", "occurred_at"], if_not_exists=True)


def downgrade() -> None:
    op.drop_index("ix_product_events_ws_time", table_name="product_events")
    op.drop_index("ix_product_events_name_time", table_name="product_events")
    op.drop_index("ix_product_events_session_id", table_name="product_events")
    op.drop_table("product_events")
