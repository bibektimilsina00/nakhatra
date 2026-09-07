"""Applications carry a photo, a headline, and more than one practice.

The application was an essay — where you trained, and a written sample reading.
Both stay, neither is required, and these three take their place: what you
practise (often both astrologer and pandit), one line about yourself, and a
photograph.

Revision ID: f6a1c8d40e77
Revises: e5f93d7c28b1
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "f6a1c8d40e77"
down_revision = "e5f93d7c28b1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "practitioner_applications",
        sa.Column("practices", sa.String(), nullable=False, server_default="astrologer"),
    )
    op.add_column(
        "practitioner_applications",
        sa.Column("headline", sa.String(length=160), nullable=False, server_default=""),
    )
    op.add_column(
        "practitioner_applications",
        sa.Column("photo_url", sa.String(length=512), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("practitioner_applications", "photo_url")
    op.drop_column("practitioner_applications", "headline")
    op.drop_column("practitioner_applications", "practices")
