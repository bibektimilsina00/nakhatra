from datetime import UTC, datetime, timedelta

from sqlmodel import Session, func, select

from app.modules.auth.models import User
from app.modules.consultations.models import Consultation
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
