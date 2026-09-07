"""Practitioners: the human half of the marketplace.

Three tables and one column. The column — `users.role` — is nullable with a
default so every existing row and every deployed mobile build is unaffected;
`roles.role_of()` reads NULL as `seeker`, so no backfill is needed for the
permission checks to be correct.

Revision ID: c3a71f5e94b2
Revises: b2f4c19a7d30
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "c3a71f5e94b2"
down_revision = "b2f4c19a7d30"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("role", sa.String(length=32), nullable=True, server_default="seeker"),
    )

    op.create_table(
        "practitioner_profiles",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("practice_type", sa.String(length=32), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("headline", sa.String(length=255), nullable=False),
        sa.Column("bio", sa.String(), nullable=False),
        sa.Column("photo_url", sa.String(length=512), nullable=True),
        sa.Column("intro_video_url", sa.String(length=512), nullable=True),
        sa.Column("city", sa.String(length=255), nullable=False),
        sa.Column("country", sa.String(length=2), nullable=False),
        sa.Column("years_experience", sa.Integer(), nullable=False),
        sa.Column("verification_state", sa.String(length=32), nullable=False),
        sa.Column("is_listed", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.Column("updated_at", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_practitioner_profiles_user"),
    )
    op.create_index("idx_practitioner_profiles_user_id", "practitioner_profiles", ["user_id"])
    op.create_index(
        "idx_practitioner_profiles_directory",
        "practitioner_profiles",
        ["verification_state", "is_listed"],
    )

    op.create_table(
        "practitioner_attributes",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("profile_id", sa.String(length=64), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("value", sa.String(length=64), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("profile_id", "kind", "value", name="uq_practitioner_attribute"),
    )
    op.create_index(
        "idx_practitioner_attributes_lookup", "practitioner_attributes", ["kind", "value"]
    )
    op.create_index(
        "idx_practitioner_attributes_profile", "practitioner_attributes", ["profile_id"]
    )

    op.create_table(
        "practitioner_applications",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("practice_type", sa.String(length=32), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=64), nullable=False),
        sa.Column("city", sa.String(length=255), nullable=False),
        sa.Column("country", sa.String(length=2), nullable=False),
        sa.Column("years_experience", sa.Integer(), nullable=False),
        sa.Column("credentials", sa.String(), nullable=False),
        sa.Column("sample_reading", sa.String(), nullable=False),
        sa.Column("languages", sa.String(), nullable=False),
        sa.Column("traditions", sa.String(), nullable=False),
        sa.Column("state", sa.String(length=32), nullable=False),
        sa.Column("reviewer_note", sa.String(), nullable=False),
        sa.Column("decision_note", sa.String(), nullable=False),
        sa.Column("reviewed_by", sa.String(length=64), nullable=True),
        sa.Column("reviewed_at", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.Column("updated_at", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_practitioner_applications_user", "practitioner_applications", ["user_id"])
    op.create_index("idx_practitioner_applications_state", "practitioner_applications", ["state"])


def downgrade() -> None:
    op.drop_index("idx_practitioner_applications_state", table_name="practitioner_applications")
    op.drop_index("idx_practitioner_applications_user", table_name="practitioner_applications")
    op.drop_table("practitioner_applications")
    op.drop_index("idx_practitioner_attributes_profile", table_name="practitioner_attributes")
    op.drop_index("idx_practitioner_attributes_lookup", table_name="practitioner_attributes")
    op.drop_table("practitioner_attributes")
    op.drop_index("idx_practitioner_profiles_directory", table_name="practitioner_profiles")
    op.drop_index("idx_practitioner_profiles_user_id", table_name="practitioner_profiles")
    op.drop_table("practitioner_profiles")
    op.drop_column("users", "role")
