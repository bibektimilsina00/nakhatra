"""Wallet tables.

The balance is **not** a column. It is the sum of an append-only ledger, and
`WalletEntry.balance_after_minor` records what the running total was when each
entry was written — redundant on purpose, so a corrupted sequence is detectable
rather than silently wrong.

Amounts are integer **minor units** (paisa for NPR). Money in a float is a bug
with a delay on it.
"""

from __future__ import annotations

from sqlalchemy import Index, UniqueConstraint
from sqlmodel import Field, SQLModel


class Wallet(SQLModel, table=True):
    __tablename__ = "wallets"
    __table_args__ = (UniqueConstraint("user_id", name="uq_wallets_user"),)

    id: str = Field(primary_key=True, max_length=64)
    user_id: str = Field(max_length=64)
    #: One unit of account. The plan holds every wallet in NPR and converts at
    #: top-up, once, rather than carrying multi-currency balances.
    currency: str = Field(default="NPR", max_length=3)
    created_at: str


class WalletEntry(SQLModel, table=True):
    """One movement. Never updated, never deleted.

    `amount_minor` is signed: credits positive, debits negative. A single
    signed column means the balance is `SUM(amount_minor)` — with separate
    credit and debit columns it is a subtraction someone eventually writes
    backwards.
    """

    __tablename__ = "wallet_entries"
    __table_args__ = (
        Index("idx_wallet_entries_wallet", "wallet_id", "created_at"),
        # Idempotency enforced by the database rather than by a check-then-act
        # in Python that two concurrent requests can both pass.
        UniqueConstraint("idempotency_key", name="uq_wallet_entries_idempotency"),
    )

    id: str = Field(primary_key=True, max_length=64)
    wallet_id: str = Field(max_length=64)
    #: `topup` | `consultation` | `refund` | `payout` | `commission` | `adjustment`
    kind: str = Field(max_length=32)
    amount_minor: int
    currency: str = Field(default="NPR", max_length=3)

    reference_type: str | None = Field(default=None, max_length=32)
    reference_id: str | None = Field(default=None, max_length=64)

    #: The running balance immediately after this entry.
    balance_after_minor: int

    #: NULL for entries with no natural key. Unique when present, so a retried
    #: webhook cannot credit the same payment twice.
    idempotency_key: str | None = Field(default=None, max_length=128)

    created_at: str
    #: The user id that caused it, or `system`.
    created_by: str = Field(default="system", max_length=64)


class WalletHold(SQLModel, table=True):
    """Funds reserved for a session in progress.

    Without a hold, two calls started at the same moment both check the same
    balance and both proceed — and the second is spending money the first has
    already committed.
    """

    __tablename__ = "wallet_holds"
    __table_args__ = (
        Index("idx_wallet_holds_wallet_state", "wallet_id", "state"),
        Index("idx_wallet_holds_reference", "reference_type", "reference_id"),
    )

    id: str = Field(primary_key=True, max_length=64)
    wallet_id: str = Field(max_length=64)
    amount_minor: int
    currency: str = Field(default="NPR", max_length=3)
    #: `active` | `captured` | `released`
    state: str = Field(default="active", max_length=16)
    reference_type: str | None = Field(default=None, max_length=32)
    reference_id: str | None = Field(default=None, max_length=64)
    created_at: str
    resolved_at: str | None = Field(default=None, max_length=64)
