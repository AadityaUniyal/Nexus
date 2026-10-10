"""0001_baseline

Revision ID: 0001_baseline
Revises: 
Create Date: 2026-10-10 22:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0001_baseline'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. workspaces
    op.create_table(
        'workspaces',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('country', sa.String(length=2), nullable=False),
        sa.Column('timezone', sa.String(length=64), nullable=False),
        sa.Column('locale', sa.String(length=16), nullable=False, server_default='en-US'),
        sa.Column('distance_unit', sa.String(length=8), nullable=False, server_default='km'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # 2. workspace_members
    op.create_table(
        'workspace_members',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('workspace_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=128), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=32), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_workspace_members_user_workspace', 'workspace_members', ['user_id', 'workspace_id'], unique=True)
    op.create_index('ix_workspace_members_user_id', 'workspace_members', ['user_id'])

    # 3. workspace_invites
    op.create_table(
        'workspace_invites',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('workspace_id', sa.String(length=36), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('role', sa.String(length=32), nullable=False, server_default='dispatcher'),
        sa.Column('created_by_user_id', sa.String(length=128), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_workspace_invites_token_hash', 'workspace_invites', ['token_hash'], unique=True)

    # 4. drivers
    op.create_table(
        'drivers',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('workspace_id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('phone', sa.String(length=32), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='off_duty'),
        sa.Column('current_lat', sa.Float(), nullable=True),
        sa.Column('current_lon', sa.Float(), nullable=True),
        sa.Column('current_heading', sa.Float(), nullable=True),
        sa.Column('last_ping_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_drivers_workspace_id', 'drivers', ['workspace_id'])

    # 5. driver_links
    op.create_table(
        'driver_links',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('driver_id', sa.String(length=36), nullable=False),
        sa.Column('workspace_id', sa.String(length=36), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('redeemed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['driver_id'], ['drivers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_driver_links_token_hash', 'driver_links', ['token_hash'], unique=True)
    op.create_index('ix_driver_links_driver_id', 'driver_links', ['driver_id'])
    op.create_index('ix_driver_links_workspace_id', 'driver_links', ['workspace_id'])

    # 6. driver_sessions
    op.create_table(
        'driver_sessions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('driver_id', sa.String(length=36), nullable=False),
        sa.Column('workspace_id', sa.String(length=36), nullable=False),
        sa.Column('session_token_hash', sa.String(length=64), nullable=False),
        sa.Column('device_info', sa.String(length=255), nullable=True),
        sa.Column('consent_version', sa.String(length=32), nullable=False, server_default='1.0'),
        sa.Column('consented_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['driver_id'], ['drivers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_driver_sessions_session_token_hash', 'driver_sessions', ['session_token_hash'], unique=True)
    op.create_index('ix_driver_sessions_driver_id', 'driver_sessions', ['driver_id'])
    op.create_index('ix_driver_sessions_workspace_id', 'driver_sessions', ['workspace_id'])

    # 7. location_pings
    op.create_table(
        'location_pings',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('driver_id', sa.String(length=36), nullable=False),
        sa.Column('workspace_id', sa.String(length=36), nullable=False),
        sa.Column('client_ping_id', sa.String(length=64), nullable=False),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lon', sa.Float(), nullable=False),
        sa.Column('heading', sa.Float(), nullable=True),
        sa.Column('speed_mps', sa.Float(), nullable=True),
        sa.Column('accuracy_m', sa.Float(), nullable=False),
        sa.Column('recorded_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['driver_id'], ['drivers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_pings_driver_client_ping', 'location_pings', ['driver_id', 'client_ping_id'], unique=True)
    op.create_index('ix_pings_workspace_recorded', 'location_pings', ['workspace_id', 'recorded_at'])
    op.create_index('ix_location_pings_driver_id', 'location_pings', ['driver_id'])
    op.create_index('ix_location_pings_workspace_id', 'location_pings', ['workspace_id'])
    op.create_index('ix_location_pings_client_ping_id', 'location_pings', ['client_ping_id'])
    op.create_index('ix_location_pings_recorded_at', 'location_pings', ['recorded_at'])

    # 8. jobs
    op.create_table(
        'jobs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('workspace_id', sa.String(length=36), nullable=False),
        sa.Column('driver_id', sa.String(length=36), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='unassigned'),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['driver_id'], ['drivers.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_jobs_workspace_id', 'jobs', ['workspace_id'])
    op.create_index('ix_jobs_driver_id', 'jobs', ['driver_id'])

    # 9. job_stops
    op.create_table(
        'job_stops',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('job_id', sa.String(length=36), nullable=False),
        sa.Column('workspace_id', sa.String(length=36), nullable=False),
        sa.Column('sequence', sa.Integer(), nullable=False),
        sa.Column('stop_type', sa.String(length=32), nullable=False),
        sa.Column('address', sa.String(length=512), nullable=False),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lon', sa.Float(), nullable=False),
        sa.Column('tz', sa.String(length=64), nullable=False),
        sa.Column('window_start', sa.DateTime(timezone=True), nullable=False),
        sa.Column('window_end', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='pending'),
        sa.Column('actual_arrival_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('arrival_distance_m', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_job_stops_job_id', 'job_stops', ['job_id'])
    op.create_index('ix_job_stops_workspace_id', 'job_stops', ['workspace_id'])

    # 10. job_events
    op.create_table(
        'job_events',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('job_id', sa.String(length=36), nullable=False),
        sa.Column('workspace_id', sa.String(length=36), nullable=False),
        sa.Column('actor_type', sa.String(length=32), nullable=False),
        sa.Column('actor_id', sa.String(length=128), nullable=False),
        sa.Column('event_type', sa.String(length=64), nullable=False),
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_job_events_job_id', 'job_events', ['job_id'])
    op.create_index('ix_job_events_workspace_id', 'job_events', ['workspace_id'])

    # 11. predictions
    op.create_table(
        'predictions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('job_id', sa.String(length=36), nullable=False),
        sa.Column('stop_id', sa.String(length=36), nullable=False),
        sa.Column('workspace_id', sa.String(length=36), nullable=False),
        sa.Column('driver_id', sa.String(length=36), nullable=True),
        sa.Column('ping_id', sa.String(length=36), nullable=True),
        sa.Column('origin_lat', sa.Float(), nullable=False),
        sa.Column('origin_lon', sa.Float(), nullable=False),
        sa.Column('eta_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('travel_time_seconds', sa.Integer(), nullable=True),
        sa.Column('traffic_delay_seconds', sa.Integer(), nullable=True),
        sa.Column('uncertainty_margin_seconds', sa.Integer(), nullable=False, server_default='300'),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('reason', sa.String(length=512), nullable=False),
        sa.Column('cache_hit', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('provider_version', sa.String(length=64), nullable=False, server_default='azure-maps-gen2'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['driver_id'], ['drivers.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['ping_id'], ['location_pings.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['stop_id'], ['job_stops.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_predictions_job_id', 'predictions', ['job_id'])
    op.create_index('ix_predictions_stop_id', 'predictions', ['stop_id'])
    op.create_index('ix_predictions_workspace_id', 'predictions', ['workspace_id'])

    # 12. recommendations
    op.create_table(
        'recommendations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('job_id', sa.String(length=36), nullable=False),
        sa.Column('stop_id', sa.String(length=36), nullable=False),
        sa.Column('workspace_id', sa.String(length=36), nullable=False),
        sa.Column('action_type', sa.String(length=64), nullable=False),
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('projected_eta_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='proposed'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['stop_id'], ['job_stops.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_recommendations_job_id', 'recommendations', ['job_id'])
    op.create_index('ix_recommendations_stop_id', 'recommendations', ['stop_id'])
    op.create_index('ix_recommendations_workspace_id', 'recommendations', ['workspace_id'])

    # 13. audit_log
    op.create_table(
        'audit_log',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('workspace_id', sa.String(length=36), nullable=False),
        sa.Column('seq', sa.Integer(), nullable=False),
        sa.Column('actor_id', sa.String(length=128), nullable=False),
        sa.Column('action', sa.String(length=64), nullable=False),
        sa.Column('entity_type', sa.String(length=64), nullable=False),
        sa.Column('entity_id', sa.String(length=64), nullable=False),
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('prev_hash', sa.String(length=64), nullable=False),
        sa.Column('hash', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_audit_workspace_seq', 'audit_log', ['workspace_id', 'seq'], unique=True)
    op.create_index('ix_audit_log_workspace_id', 'audit_log', ['workspace_id'])

    # 14. daily_usage
    op.create_table(
        'daily_usage',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('workspace_id', sa.String(length=36), nullable=False),
        sa.Column('usage_date', sa.String(length=10), nullable=False),
        sa.Column('azure_maps_calls', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_usage_workspace_date', 'daily_usage', ['workspace_id', 'usage_date'], unique=True)
    op.create_index('ix_daily_usage_workspace_id', 'daily_usage', ['workspace_id'])

    # Immutability trigger for audit_log in PostgreSQL
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        op.execute("""
            CREATE OR REPLACE FUNCTION reject_audit_log_mutation()
            RETURNS TRIGGER AS $$
            BEGIN
                RAISE EXCEPTION 'audit_log is append-only: updates and deletes are forbidden';
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER trg_audit_log_immutable
            BEFORE UPDATE OR DELETE ON audit_log
            FOR EACH ROW
            EXECUTE FUNCTION reject_audit_log_mutation();
        """)


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        op.execute("DROP TRIGGER IF EXISTS trg_audit_log_immutable ON audit_log;")
        op.execute("DROP FUNCTION IF EXISTS reject_audit_log_mutation();")

    op.drop_table('daily_usage')
    op.drop_table('audit_log')
    op.drop_table('recommendations')
    op.drop_table('predictions')
    op.drop_table('job_events')
    op.drop_table('job_stops')
    op.drop_table('jobs')
    op.drop_table('location_pings')
    op.drop_table('driver_sessions')
    op.drop_table('driver_links')
    op.drop_table('drivers')
    op.drop_table('workspace_invites')
    op.drop_table('workspace_members')
    op.drop_table('workspaces')
