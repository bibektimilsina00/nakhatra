"""Wallet endpoints. Routes only.

There is deliberately no route that credits a wallet from an arbitrary amount.
`/topup` exists for the payment provider's confirmed callback and for local
development; when the real rails land it moves behind a signature check in
`modules/payments/`. A client that can name its own credit is a client that
prints money.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.core.config import get_settings
from app.core.db import SessionDep
from app.core.errors import AppError
from app.modules.auth.router_deps import get_current_user
from app.modules.billing import service
from app.modules.billing.schemas import LedgerOut, TopUpIn, WalletOut

router = APIRouter(prefix="/v1/wallet", tags=["wallet"])


class TopUpUnavailable(AppError):
    status_code = 404
    code = "not_found"


@router.get("", response_model=WalletOut, summary="Balance, held and available")
def wallet(session: SessionDep, user_id: str = Depends(get_current_user)) -> WalletOut:
    return service.summary(session, user_id)


@router.get(
    "/ledger",
    response_model=LedgerOut,
    summary="Every movement, newest first",
    description=(
        "The wallet's whole history. `amount_minor` is signed — credits "
        "positive, debits negative — and `balance_after_minor` is what the "
        "running total was immediately after each entry."
    ),
)
def ledger(
    session: SessionDep,
    limit: int = Query(50, ge=1, le=200),
    user_id: str = Depends(get_current_user),
) -> LedgerOut:
    return service.ledger(session, user_id, limit)


@router.post(
    "/topup",
    response_model=WalletOut,
    summary="Credit a confirmed payment (development only)",
    description=(
        "Idempotent on `reference`: the same payment cannot be credited twice "
        "however many times its callback arrives. Disabled outside local "
        "development until the provider adapters and signature verification "
        "exist — see docs/astrologer-marketplace.md §6."
    ),
)
def top_up(
    body: TopUpIn, session: SessionDep, user_id: str = Depends(get_current_user)
) -> WalletOut:
    if get_settings().ENV != "local":
        # Answers 404 rather than 403: an endpoint that says "forbidden"
        # confirms it exists, and this one should not be discoverable at all
        # in a deployed environment.
        raise TopUpUnavailable("Not found.")
    return service.top_up(session, user_id, body.amount_minor, body.reference)
