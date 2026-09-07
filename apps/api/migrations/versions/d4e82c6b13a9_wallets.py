"""Wallets: an append-only ledger and holds.

No balance column anywhere, deliberately. The balance is the sum of
`wallet_entries`, and `balance_after_minor` records the running total at each
entry so a corrupted sequence is detectable by replay.

Revision ID: d4e82c6b13a9
Revises: c3a71f5e94b2
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "d4e82c6b13a9"
down_revision = "c3a71f5e94b2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "wallets",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_wallets_user"),
    )

    op.create_table(
        "wallet_entries",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("wallet_id", sa.String(length=64), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("amount_minor", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("reference_type", sa.String(length=32), nullable=True),
        sa.Column("reference_id", sa.String(length=64), nullable=True),
        sa.Column("balance_after_minor", sa.Integer(), nullable=False),
        sa.Column("idempotency_key", sa.String(length=128), nullable=True),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.Column("created_by", sa.String(length=64), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        # The database is the arbiter of idempotency. A check-then-insert in
        # Python is a race that two concurrent webhook retries both win.
        sa.UniqueConstraint("idempotency_key", name="uq_wallet_entries_idempotency"),
    )
    op.create_index("idx_wallet_entries_wallet", "wallet_entries", ["wallet_id", "created_at"])

    op.create_table(
        "wallet_holds",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("wallet_id", sa.String(length=64), nullable=False),
        sa.Column("amount_minor", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("state", sa.String(length=16), nullable=False),
        sa.Column("reference_type", sa.String(length=32), nullable=True),
        sa.Column("reference_id", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.Column("resolved_at", sa.String(length=64), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_wallet_holds_wallet_state", "wallet_holds", ["wallet_id", "state"])
    op.create_index(
        "idx_wallet_holds_reference", "wallet_holds", ["reference_type", "reference_id"]
    )


def downgrade() -> None:
    op.drop_index("idx_wallet_holds_reference", table_name="wallet_holds")
    op.drop_index("idx_wallet_holds_wallet_state", table_name="wallet_holds")
    op.drop_table("wallet_holds")
    op.drop_index("idx_wallet_entries_wallet", table_name="wallet_entries")
    op.drop_table("wallet_entries")
    op.drop_table("wallets")
