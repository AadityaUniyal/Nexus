"""detention demurrage invoices table

Revision ID: 005_detention_invoices
Revises: 004_product_events
Create Date: 2026-10-27 21:40:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005_detention_invoices"
down_revision: Union[str, None] = "004_product_events"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "detention_invoices",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("invoice_number", sa.String(64), unique=True, nullable=False),
        sa.Column("workspace_id", sa.String(64), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("trip_id", sa.String(64), nullable=True),
        sa.Column("vehicle_id", sa.String(64), nullable=False),
        sa.Column("vehicle_code", sa.String(64), nullable=False),
        sa.Column("driver_name", sa.String(128), server_default="Fleet Driver"),
        sa.Column("facility_id", sa.String(64), nullable=False),
        sa.Column("facility_name", sa.String(255), nullable=False),
        sa.Column("facility_city", sa.String(128), nullable=False),
        sa.Column("arrival_time_iso", sa.String(64), nullable=False),
        sa.Column("departure_time_iso", sa.String(64), nullable=False),
        sa.Column("dwell_duration_minutes", sa.Integer(), nullable=False),
        sa.Column("free_window_minutes", sa.Integer(), server_default="120"),
        sa.Column("excess_minutes", sa.Integer(), nullable=False),
        sa.Column("billable_hours", sa.Float(), nullable=False),
        sa.Column("hourly_rate_usd", sa.Float(), server_default="75.0"),
        sa.Column("subtotal_usd", sa.Float(), nullable=False),
        sa.Column("tax_usd", sa.Float(), server_default="0.0"),
        sa.Column("total_amount_usd", sa.Float(), nullable=False),
        sa.Column("currency", sa.String(10), server_default="USD"),
        sa.Column("status", sa.String(32), server_default="ISSUED"),
        sa.Column("sha256_audit_hash", sa.String(64), nullable=False),
        sa.Column("gps_coordinates", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        if_not_exists=True,
    )
    op.create_index("ix_detention_invoices_workspace_id", "detention_invoices", ["workspace_id"], if_not_exists=True)
    op.create_index("ix_detention_invoices_invoice_number", "detention_invoices", ["invoice_number"], if_not_exists=True)
    op.create_index("ix_detention_invoices_vehicle_id", "detention_invoices", ["vehicle_id"], if_not_exists=True)


def downgrade() -> None:
    op.drop_index("ix_detention_invoices_vehicle_id", table_name="detention_invoices")
    op.drop_index("ix_detention_invoices_invoice_number", table_name="detention_invoices")
    op.drop_index("ix_detention_invoices_workspace_id", table_name="detention_invoices")
    op.drop_table("detention_invoices")
