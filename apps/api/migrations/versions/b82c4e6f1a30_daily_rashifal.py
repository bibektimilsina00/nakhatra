"""The rashifal becomes a daily publication.

It was written on demand and cached on the disk of whichever process happened
to serve the request — so two containers wrote it twice, a restart lost it, and
nobody could see what the writer had been told. It is a table now: one row per
Nepal date per language, unique on the pair so a re-run cannot publish twice,
carrying the findings it was written from alongside the model and prompt
version that wrote it.

Revision ID: b82c4e6f1a30
Revises: a71b3f9d5c48
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "b82c4e6f1a30"
down_revision = "a71b3f9d5c48"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "daily_rashifal",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("on_date", sa.String(length=16), nullable=False),
        sa.Column("language", sa.String(length=8), nullable=False),
        sa.Column("content_json", sa.Text(), nullable=False),
        sa.Column("astrology_data_json", sa.Text(), nullable=False),
        sa.Column("model", sa.String(length=128), nullable=False, server_default=""),
        sa.Column("prompt_version", sa.String(length=32), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("on_date", "language", name="uq_daily_rashifal_date_language"),
    )
    op.create_index("idx_daily_rashifal_on_date", "daily_rashifal", ["on_date"])


def downgrade() -> None:
    op.drop_index("idx_daily_rashifal_on_date", table_name="daily_rashifal")
    op.drop_table("daily_rashifal")
