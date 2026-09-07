"""Wire contract for wallets.

Amounts cross the wire as integer minor units, the same as they are stored.
Formatting a rupee figure is the client's job, and doing it here would mean a
float in the JSON — which is the one representation money must never take.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

EntryKind = Literal["topup", "consultation", "refund", "payout", "commission", "adjustment"]


class WalletOut(BaseModel):
    currency: str
    #: Everything the ledger says is there.
    balance_minor: int
    #: What is reserved by sessions in progress.
    held_minor: int
    #: `balance_minor - held_minor`. What may actually be spent now.
    available_minor: int


class EntryOut(BaseModel):
    id: str
    kind: EntryKind
    #: Signed: credits positive, debits negative.
    amount_minor: int
    balance_after_minor: int
    reference_type: str | None
    reference_id: str | None
    created_at: str


class LedgerOut(BaseModel):
    currency: str
    entries: list[EntryOut]
    balance_minor: int


class TopUpIn(BaseModel):
    amount_minor: int = Field(gt=0, le=100_000_00, description="Minor units, e.g. paisa")
    #: The provider's reference. Doubles as the idempotency key, so a retried
    #: callback cannot credit the same payment twice.
    reference: str = Field(min_length=1, max_length=128)
