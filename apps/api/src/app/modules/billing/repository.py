"""Data access for wallets.

Every read that decides whether money may move goes through `balance_minor`
and `held_minor` here, so there is one definition of each rather than one per
caller.
"""

from __future__ import annotations

from sqlmodel import Session, func, select

from app.modules.billing.models import Wallet, WalletEntry, WalletHold


def wallet_for(session: Session, user_id: str) -> Wallet | None:
    return session.exec(select(Wallet).where(Wallet.user_id == user_id)).first()


def balance_minor(session: Session, wallet_id: str) -> int:
    """The sum of the ledger. The only definition of a balance there is."""
    total = session.exec(
        select(func.coalesce(func.sum(WalletEntry.amount_minor), 0)).where(
            WalletEntry.wallet_id == wallet_id
        )
    ).one()
    return int(total)


def held_minor(session: Session, wallet_id: str) -> int:
    total = session.exec(
        select(func.coalesce(func.sum(WalletHold.amount_minor), 0)).where(
            WalletHold.wallet_id == wallet_id, WalletHold.state == "active"
        )
    ).one()
    return int(total)


def entries(session: Session, wallet_id: str, limit: int = 50) -> list[WalletEntry]:
    return list(
        session.exec(
            select(WalletEntry)
            .where(WalletEntry.wallet_id == wallet_id)
            .order_by(WalletEntry.created_at.desc(), WalletEntry.id.desc())  # type: ignore[attr-defined]
            .limit(limit)
        ).all()
    )


def all_entries(session: Session, wallet_id: str) -> list[WalletEntry]:
    """Oldest first — the order the running balance was built in.

    Used by the audit check, which replays the sequence.
    """
    return list(
        session.exec(
            select(WalletEntry)
            .where(WalletEntry.wallet_id == wallet_id)
            .order_by(WalletEntry.created_at.asc(), WalletEntry.id.asc())  # type: ignore[attr-defined]
        ).all()
    )


def entry_by_key(session: Session, key: str) -> WalletEntry | None:
    return session.exec(select(WalletEntry).where(WalletEntry.idempotency_key == key)).first()


def hold(session: Session, hold_id: str) -> WalletHold | None:
    return session.exec(select(WalletHold).where(WalletHold.id == hold_id)).first()


def active_hold_for(
    session: Session, wallet_id: str, reference_type: str, reference_id: str
) -> WalletHold | None:
    """This wallet's active hold for that reference, if any.

    Scoped by wallet. Without it the lookup crosses accounts: a reference that
    happens to repeat returns somebody else's hold, and the caller then
    captures against a wallet that is not theirs. Consultation ids are unique
    in practice, which is what makes this the kind of bug that survives review
    and surfaces as one person's money moving on another's call.
    """
    return session.exec(
        select(WalletHold).where(
            WalletHold.wallet_id == wallet_id,
            WalletHold.reference_type == reference_type,
            WalletHold.reference_id == reference_id,
            WalletHold.state == "active",
        )
    ).first()
