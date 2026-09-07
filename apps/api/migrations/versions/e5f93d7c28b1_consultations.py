"""Consultations, chart grants, and rate cards.

Revision ID: e5f93d7c28b1
Revises: d4e82c6b13a9
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "e5f93d7c28b1"
down_revision = "d4e82c6b13a9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "rate_cards",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("profile_id", sa.String(length=64), nullable=False),
        sa.Column("medium", sa.String(length=16), nullable=False),
        sa.Column("per_minute_minor", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("updated_at", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("profile_id", "medium", name="uq_rate_card_medium"),
    )
    op.create_index("idx_rate_cards_profile", "rate_cards", ["profile_id"])

    op.create_table(
        "consultations",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("seeker_id", sa.String(length=64), nullable=False),
        sa.Column("practitioner_user_id", sa.String(length=64), nullable=False),
        sa.Column("profile_id", sa.String(length=64), nullable=False),
        sa.Column("medium", sa.String(length=16), nullable=False),
        sa.Column("state", sa.String(length=16), nullable=False),
        sa.Column("rate_per_minute_minor", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("hold_id", sa.String(length=64), nullable=True),
        sa.Column("connected_at", sa.String(length=64), nullable=True),
        sa.Column("ended_at", sa.String(length=64), nullable=True),
        sa.Column("billed_seconds", sa.Integer(), nullable=False),
        sa.Column("charged_minor", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.Column("updated_at", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_consultations_seeker", "consultations", ["seeker_id", "created_at"])
    op.create_index(
        "idx_consultations_practitioner", "consultations", ["practitioner_user_id", "state"]
    )

    op.create_table(
        "consultation_events",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("consultation_id", sa.String(length=64), nullable=False),
        sa.Column("state", sa.String(length=16), nullable=False),
        sa.Column("actor", sa.String(length=64), nullable=False),
        sa.Column("detail", sa.String(), nullable=False),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_consultation_events_lookup", "consultation_events", ["consultation_id", "created_at"]
    )

    op.create_table(
        "consultation_messages",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("consultation_id", sa.String(length=64), nullable=False),
        sa.Column("sender_id", sa.String(length=64), nullable=False),
        sa.Column("body", sa.String(), nullable=False),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.Column("read_at", sa.String(length=64), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_consultation_messages_lookup",
        "consultation_messages",
        ["consultation_id", "created_at"],
    )

    op.create_table(
        "chart_grants",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("seeker_id", sa.String(length=64), nullable=False),
        sa.Column("practitioner_user_id", sa.String(length=64), nullable=False),
        sa.Column("kundali_id", sa.String(length=64), nullable=False),
        sa.Column("consultation_id", sa.String(length=64), nullable=True),
        sa.Column("granted_at", sa.String(), nullable=False),
        sa.Column("revoked_at", sa.String(length=64), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_chart_grants_practitioner", "chart_grants", ["practitioner_user_id", "revoked_at"]
    )
    op.create_index("idx_chart_grants_seeker", "chart_grants", ["seeker_id"])

    op.create_table(
        "grant_access_log",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("grant_id", sa.String(length=64), nullable=False),
        sa.Column("accessed_by", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_grant_access_grant", "grant_access_log", ["grant_id", "created_at"])


def downgrade() -> None:
    op.drop_index("idx_grant_access_grant", table_name="grant_access_log")
    op.drop_table("grant_access_log")
    op.drop_index("idx_chart_grants_seeker", table_name="chart_grants")
    op.drop_index("idx_chart_grants_practitioner", table_name="chart_grants")
    op.drop_table("chart_grants")
    op.drop_index("idx_consultation_messages_lookup", table_name="consultation_messages")
    op.drop_table("consultation_messages")
    op.drop_index("idx_consultation_events_lookup", table_name="consultation_events")
    op.drop_table("consultation_events")
    op.drop_index("idx_consultations_practitioner", table_name="consultations")
    op.drop_index("idx_consultations_seeker", table_name="consultations")
    op.drop_table("consultations")
    op.drop_index("idx_rate_cards_profile", table_name="rate_cards")
    op.drop_table("rate_cards")
