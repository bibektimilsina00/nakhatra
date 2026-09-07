"""Store generated readings so a refresh does not re-bill the model.

A reading is deterministic for a given chart and language, so it belongs in a
table rather than being regenerated on every page load. The unique constraint is
the whole point of the table: one row per (user, chart, language), which is what
makes the lookup a hit instead of a scan and stops two tabs writing duplicates.

Revision ID: b2f4c19a7d30
Revises: 847eb7a13dc1
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "b2f4c19a7d30"
down_revision = "847eb7a13dc1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "reports",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("chart_key", sa.String(length=64), nullable=False),
        sa.Column("language", sa.String(length=8), nullable=False),
        sa.Column("engine_version", sa.String(length=32), nullable=False),
        sa.Column("model", sa.String(length=128), nullable=False),
        sa.Column("sections", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "chart_key", "language", name="uq_reports_lookup"),
    )
    op.create_index("idx_reports_lookup", "reports", ["user_id", "chart_key", "language"])


def downgrade() -> None:
    op.drop_index("idx_reports_lookup", table_name="reports")
    op.drop_table("reports")
