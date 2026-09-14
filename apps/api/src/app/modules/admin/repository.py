from datetime import UTC, datetime, timedelta
from typing import Any

from sqlmodel import Session, func, select

from app.modules.auth.models import User
from app.modules.consultations.models import Consultation
from app.modules.kundali.models import GuestGenerationCount
from app.modules.practitioners.models import PractitionerApplication
from app.modules.vault.models import ChatMessage, ChatSession, SavedKundali


class AdminRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def get_user_counts(self) -> tuple[int, int, int]:
        now = datetime.now(UTC)
        days_7_ago = (now - timedelta(days=7)).isoformat()
        days_30_ago = (now - timedelta(days=30)).isoformat()

        total = self._session.exec(select(func.count(User.id))).one()
        last_7 = self._session.exec(
            select(func.count(User.id)).where(User.created_at >= days_7_ago)
        ).one()
        last_30 = self._session.exec(
            select(func.count(User.id)).where(User.created_at >= days_30_ago)
        ).one()

        return total, last_7, last_30

    def get_vault_counts(self) -> tuple[int, int, int]:
        kundalis = self._session.exec(select(func.count(SavedKundali.id))).one()
        sessions = self._session.exec(select(func.count(ChatSession.id))).one()
        messages = self._session.exec(select(func.count(ChatMessage.id))).one()
        return kundalis, sessions, messages

    def get_practitioner_app_counts(self) -> dict[str, int]:
        statement = select(
            PractitionerApplication.state, func.count(PractitionerApplication.id)
        ).group_by(PractitionerApplication.state)
        results = self._session.exec(statement).all()
        return {state: count for state, count in results}

    def get_consultation_counts(self) -> int:
        return self._session.exec(select(func.count(Consultation.id))).one()

    def get_guest_generation_counts(self) -> tuple[int, int]:
        total = self._session.exec(select(func.sum(GuestGenerationCount.count))).one() or 0
        now = datetime.now(UTC)
        days_7_ago = (now - timedelta(days=7)).strftime("%Y-%m-%d")
        last_7 = (
            self._session.exec(
                select(func.sum(GuestGenerationCount.count)).where(
                    GuestGenerationCount.date >= days_7_ago
                )
            ).one()
            or 0
        )
        return total, last_7

    def get_users_list(
        self, page: int, limit: int, search: str | None = None
    ) -> tuple[list[dict[str, Any]], int]:
        count_stmt = select(func.count(User.id))
        if search:
            count_stmt = count_stmt.where(User.email.contains(search))
        total = self._session.exec(count_stmt).one()

        stmt = (
            select(
                User,
                func.count(func.distinct(SavedKundali.id)).label("kundali_count"),
                func.count(func.distinct(ChatSession.id)).label("chat_session_count"),
            )
            .outerjoin(SavedKundali, SavedKundali.user_id == User.id)
            .outerjoin(ChatSession, ChatSession.user_id == User.id)
            .group_by(User.id)
            .order_by(User.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
        if search:
            stmt = stmt.where(User.email.contains(search))
        
        results = self._session.exec(stmt).all()
        items = []
        for user, kundali_count, chat_session_count in results:
            items.append({
                "id": user.id,
                "email": user.email,
                "role": user.role or "seeker",
                "created_at": user.created_at,
                "kundali_count": kundali_count,
                "chat_session_count": chat_session_count,
            })
        return items, total

    def count_admins(self) -> int:
        return self._session.exec(select(func.count(User.id)).where(User.role == "admin")).one()

    def get_user(self, user_id: str) -> User | None:
        return self._session.get(User, user_id)

    def update_user_role(self, user_id: str, role: str) -> User | None:
        user = self._session.get(User, user_id)
        if not user:
            return None
        user.role = role
        self._session.add(user)
        self._session.commit()
        return user
