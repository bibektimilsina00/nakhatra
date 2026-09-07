"""Wallet logic. Every rule about money is in this file.

Four invariants, each of which a marketplace fails on eventually:

1. **The balance is the ledger.** Never a column, never cached, never adjusted
   in place. `balance_after_minor` on each entry records the running total, so
   a corrupted sequence can be found by replay rather than discovered by a user.
2. **Nothing spends more than is available.** Available is the balance minus
   active holds, so funds committed to a session in progress cannot be spent
   twice.
3. **Credits are idempotent.** A payment provider will retry a webhook. The
   uniqueness of `idempotency_key` is enforced by the database, because a
   check-then-insert in Python is a race two concurrent retries both win.
4. **A hold is resolved exactly once.** Capturing or releasing twice would
   either double-charge or silently free money that was already taken.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy.exc import IntegrityError
from sqlmodel import Session

from app.core.errors import AppError
from app.modules.billing import repository
from app.modules.billing.models import Wallet, WalletEntry, WalletHold
from app.modules.billing.schemas import EntryOut, LedgerOut, WalletOut


class InsufficientFunds(AppError):
    status_code = 402
    code = "insufficient_funds"


class BillingError(AppError):
    status_code = 400
    code = "billing_invalid"


def _now() -> str:
    return datetime.now(UTC).isoformat()


def _id() -> str:
    return uuid.uuid4().hex


# --- the wallet itself ---


def ensure_wallet(session: Session, user_id: str) -> Wallet:
    """Every account has a wallet the first time one is asked for.

    Created lazily rather than at signup, so the millions of accounts that
    never top up do not each carry a row — and so this stays correct for the
    accounts that already existed before wallets did.
    """
    wallet = repository.wallet_for(session, user_id)
    if wallet is not None:
        return wallet
    wallet = Wallet(id=_id(), user_id=user_id, currency="NPR", created_at=_now())
    session.add(wallet)
    session.commit()
    session.refresh(wallet)
    return wallet


def summary(session: Session, user_id: str) -> WalletOut:
    wallet = ensure_wallet(session, user_id)
    balance = repository.balance_minor(session, wallet.id)
    held = repository.held_minor(session, wallet.id)
    return WalletOut(
        currency=wallet.currency,
        balance_minor=balance,
        held_minor=held,
        available_minor=balance - held,
    )


def ledger(session: Session, user_id: str, limit: int = 50) -> LedgerOut:
    wallet = ensure_wallet(session, user_id)
    rows = repository.entries(session, wallet.id, limit)
    return LedgerOut(
        currency=wallet.currency,
        balance_minor=repository.balance_minor(session, wallet.id),
        entries=[
            EntryOut(
                id=row.id,
                kind=row.kind,  # type: ignore[arg-type]
                amount_minor=row.amount_minor,
                balance_after_minor=row.balance_after_minor,
                reference_type=row.reference_type,
                reference_id=row.reference_id,
                created_at=row.created_at,
            )
            for row in rows
        ],
    )


# --- movements ---


def post(
    session: Session,
    wallet: Wallet,
    *,
    kind: str,
    amount_minor: int,
    reference_type: str | None = None,
    reference_id: str | None = None,
    idempotency_key: str | None = None,
    created_by: str = "system",
) -> WalletEntry:
    """Append one entry. The only way anything reaches the ledger.

    Signed: pass a positive amount to credit, a negative one to debit. A debit
    is checked against *available* funds, not the raw balance, so money already
    held for a session in progress cannot be spent again.
    """
    if amount_minor == 0:
        raise BillingError("A zero-amount entry records nothing.")

    if idempotency_key:
        existing = repository.entry_by_key(session, idempotency_key)
        if existing is not None:
            # Already applied. Returning the original entry rather than raising
            # makes a retried webhook a no-op, which is what idempotent means.
            return existing

    balance = repository.balance_minor(session, wallet.id)
    if amount_minor < 0:
        available = balance - repository.held_minor(session, wallet.id)
        if available + amount_minor < 0:
            raise InsufficientFunds("This wallet does not have the funds for that.")

    entry = WalletEntry(
        id=_id(),
        wallet_id=wallet.id,
        kind=kind,
        amount_minor=amount_minor,
        currency=wallet.currency,
        reference_type=reference_type,
        reference_id=reference_id,
        balance_after_minor=balance + amount_minor,
        idempotency_key=idempotency_key,
        created_at=_now(),
        created_by=created_by,
    )
    session.add(entry)
    try:
        session.commit()
    except IntegrityError:
        # Two retries of the same webhook raced and the other won. The unique
        # constraint is the arbiter; this side returns what it wrote.
        session.rollback()
        existing = repository.entry_by_key(session, idempotency_key) if idempotency_key else None
        if existing is not None:
            return existing
        raise
    session.refresh(entry)
    return entry


def top_up(session: Session, user_id: str, amount_minor: int, reference: str) -> WalletOut:
    """Credit a confirmed payment.

    `reference` is the provider's own id and doubles as the idempotency key —
    the same payment cannot be credited twice however many times its callback
    arrives.
    """
    wallet = ensure_wallet(session, user_id)
    post(
        session,
        wallet,
        kind="topup",
        amount_minor=amount_minor,
        reference_type="payment",
        reference_id=reference,
        idempotency_key=f"topup:{reference}",
        created_by=user_id,
    )
    return summary(session, user_id)


# --- holds ---


def place_hold(
    session: Session,
    user_id: str,
    amount_minor: int,
    *,
    reference_type: str,
    reference_id: str,
) -> WalletHold:
    """Reserve funds for a session about to start.

    Reserving the maximum the balance can buy is what stops two calls started
    at the same moment from both spending it.
    """
    if amount_minor <= 0:
        raise BillingError("A hold must be for a positive amount.")

    wallet = ensure_wallet(session, user_id)
    existing = repository.active_hold_for(session, wallet.id, reference_type, reference_id)
    if existing is not None:
        # One hold per session. A second would reserve the money twice and make
        # the wallet look emptier than it is.
        return existing

    available = repository.balance_minor(session, wallet.id) - repository.held_minor(
        session, wallet.id
    )
    if available < amount_minor:
        raise InsufficientFunds("This wallet does not have the funds for that.")

    hold = WalletHold(
        id=_id(),
        wallet_id=wallet.id,
        amount_minor=amount_minor,
        currency=wallet.currency,
        state="active",
        reference_type=reference_type,
        reference_id=reference_id,
        created_at=_now(),
    )
    session.add(hold)
    session.commit()
    session.refresh(hold)
    return hold


def capture_hold(
    session: Session, hold_id: str, actual_minor: int, *, created_by: str = "system"
) -> WalletEntry:
    """Charge what was actually used and free the rest.

    The captured amount comes from the *server's* measure of the session, and
    may be less than was held — the hold is a ceiling, not a price.
    """
    hold = repository.hold(session, hold_id)
    if hold is None:
        raise BillingError("No such hold.")
    if hold.state != "active":
        # Resolving twice would either double-charge or silently free money
        # that has already been taken.
        raise BillingError("This hold has already been resolved.")
    if actual_minor < 0:
        raise BillingError("A capture cannot be negative.")
    if actual_minor > hold.amount_minor:
        raise BillingError("A capture cannot exceed the amount held.")

    wallet = session.get(Wallet, hold.wallet_id)
    if wallet is None:
        raise BillingError("No such wallet.")

    # Released first, so the debit below is checked against funds that include
    # what this very hold was reserving.
    hold.state = "captured"
    hold.resolved_at = _now()
    session.add(hold)
    session.commit()

    if actual_minor == 0:
        # A session that connected and delivered nothing. The hold is gone and
        # no entry is written, because nothing was bought.
        session.refresh(hold)
        return WalletEntry(
            id=_id(),
            wallet_id=wallet.id,
            kind="consultation",
            amount_minor=0,
            currency=wallet.currency,
            balance_after_minor=repository.balance_minor(session, wallet.id),
            created_at=_now(),
            created_by=created_by,
        )

    return post(
        session,
        wallet,
        kind="consultation",
        amount_minor=-actual_minor,
        reference_type=hold.reference_type,
        reference_id=hold.reference_id,
        # One capture per hold, enforced by the database as well as by the
        # state check above.
        idempotency_key=f"capture:{hold.id}",
        created_by=created_by,
    )


def release_hold(session: Session, hold_id: str) -> None:
    """Free a hold without charging — a call that never connected."""
    hold = repository.hold(session, hold_id)
    if hold is None:
        raise BillingError("No such hold.")
    if hold.state != "active":
        raise BillingError("This hold has already been resolved.")
    hold.state = "released"
    hold.resolved_at = _now()
    session.add(hold)
    session.commit()


# --- audit ---


def audit(session: Session, user_id: str) -> list[str]:
    """Replay the ledger and report anything that does not add up.

    `balance_after_minor` is denormalised precisely so this can exist: a
    sequence that has been tampered with, or written by two racing processes,
    stops matching its own running total and says so here rather than being
    discovered by a customer.
    """
    wallet = repository.wallet_for(session, user_id)
    if wallet is None:
        return []

    problems: list[str] = []
    running = 0
    for entry in repository.all_entries(session, wallet.id):
        running += entry.amount_minor
        if entry.balance_after_minor != running:
            problems.append(
                f"entry {entry.id}: recorded {entry.balance_after_minor}, replay says {running}"
            )
    if running != repository.balance_minor(session, wallet.id):
        problems.append("sum of entries disagrees with the replayed total")
    return problems
