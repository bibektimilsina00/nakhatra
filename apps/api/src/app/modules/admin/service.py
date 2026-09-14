from sqlmodel import Session

from .repository import AdminRepository
from .schemas import AdminStatsOverview, PractitionerApplicationStats


class AdminService:
    def __init__(self, session: Session) -> None:
        self._repo = AdminRepository(session)

    def get_stats_overview(self) -> AdminStatsOverview:
        total_users, users_7d, users_30d = self._repo.get_user_counts()
        kundalis, sessions, messages = self._repo.get_vault_counts()
        app_counts = self._repo.get_practitioner_app_counts()

        pending = app_counts.get("submitted", 0) + app_counts.get("in_review", 0)
        approved = app_counts.get("approved", 0)
        rejected = app_counts.get("rejected", 0) + app_counts.get("withdrawn", 0)

        total_consultations = self._repo.get_consultation_counts()

        return AdminStatsOverview(
            total_users=total_users,
            users_last_7_days=users_7d,
            users_last_30_days=users_30d,
            total_saved_kundalis=kundalis,
            total_chat_sessions=sessions,
            total_chat_messages=messages,
            practitioner_applications=PractitionerApplicationStats(
                pending=pending,
                approved=approved,
                rejected=rejected,
            ),
            total_consultations=total_consultations,
        )
