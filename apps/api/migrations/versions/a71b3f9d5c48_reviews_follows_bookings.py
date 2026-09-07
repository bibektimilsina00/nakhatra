"""Reviews, follows, and a scheduled time on a consultation.

A rating is keyed on the consultation and unique on it, so it is always
something that was paid for and happened. Ratings anyone can write are worth
nothing, and a directory built on them is worth less.

A booking is not a new kind of thing: it is a consultation with a
`scheduled_at`, running the same lifecycle as one started now.

Revision ID: a71b3f9d5c48
Revises: f6a1c8d40e77
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "a71b3f9d5c48"
down_revision = "f6a1c8d40e77"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("consultations", sa.Column("scheduled_at", sa.String(length=64), nullable=True))

    op.create_table(
        "reviews",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("consultation_id", sa.String(length=64), nullable=False),
        sa.Column("practitioner_user_id", sa.String(length=64), nullable=False),
        sa.Column("seeker_id", sa.String(length=64), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("body", sa.String(), nullable=False),
        sa.Column("reply", sa.String(), nullable=False),
        sa.Column("replied_at", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        # One review per consultation, enforced here rather than by a check the
        # service could forget to make.
        sa.UniqueConstraint("consultation_id", name="uq_reviews_consultation"),
    )
    op.create_index("idx_reviews_practitioner", "reviews", ["practitioner_user_id", "created_at"])

    op.create_table(
        "follows",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("follower_id", sa.String(length=64), nullable=False),
        sa.Column("practitioner_user_id", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("follower_id", "practitioner_user_id", name="uq_follow"),
    )
    op.create_index("idx_follows_practitioner", "follows", ["practitioner_user_id"])
    op.create_index("idx_follows_follower", "follows", ["follower_id"])


def downgrade() -> None:
    op.drop_index("idx_follows_follower", table_name="follows")
    op.drop_index("idx_follows_practitioner", table_name="follows")
    op.drop_table("follows")
    op.drop_index("idx_reviews_practitioner", table_name="reviews")
    op.drop_table("reviews")
    op.drop_column("consultations", "scheduled_at")
