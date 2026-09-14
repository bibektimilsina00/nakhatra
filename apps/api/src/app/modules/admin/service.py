from sqlmodel import Session

from app.core.errors import AppError

from .repository import AdminRepository
from .schemas import (
    AdminStatsOverview,
    AdminUserItem,
    PractitionerApplicationStats,
    UserListResponse,
)


class LastAdminError(AppError):
    status_code = 400
    code = "last_admin"

    def __init__(self) -> None:
        super().__init__("Cannot demote the last remaining admin.")


class UserNotFoundError(AppError):
    status_code = 404
    code = "not_found"

    def __init__(self) -> None:
        super().__init__("User not found.")


class AdminService:
    def __init__(self, session: Session) -> None:
        self._repo = AdminRepository(session)

    def get_stats_overview(self) -> AdminStatsOverview:
        total_users, users_7d, users_30d = self._repo.get_user_counts()
        kundalis, sessions, messages = self._repo.get_vault_counts()
        guest_total, guest_7d = self._repo.get_guest_generation_counts()
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
            total_guest_kundalis_all_time=guest_total,
            total_guest_kundalis_last_7_days=guest_7d,
            practitioner_applications=PractitionerApplicationStats(
                pending=pending,
                approved=approved,
                rejected=rejected,
            ),
            total_consultations=total_consultations,
        )

    def list_users(self, page: int, limit: int, search: str | None = None) -> UserListResponse:
        items, total = self._repo.get_users_list(page, limit, search)
        admin_items = [AdminUserItem(**item) for item in items]
        return UserListResponse(
            items=admin_items,
            total=total,
            page=page,
            limit=limit,
        )

    def update_role(self, user_id: str, new_role: str) -> None:
        if new_role != "admin":
            user = self._repo.get_user(user_id)
            if user and (user.role or "seeker") == "admin" and self._repo.count_admins() <= 1:
                raise LastAdminError()

        user = self._repo.update_user_role(user_id, new_role)
        if not user:
            raise UserNotFoundError()

