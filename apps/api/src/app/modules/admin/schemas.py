from typing import Literal

from pydantic import BaseModel, ConfigDict


class PractitionerApplicationStats(BaseModel):
    model_config = ConfigDict(frozen=True)
    pending: int
    approved: int
    rejected: int


class AdminStatsOverview(BaseModel):
    model_config = ConfigDict(frozen=True)

    total_users: int
    users_last_7_days: int
    users_last_30_days: int

    total_saved_kundalis: int
    total_chat_sessions: int
    total_chat_messages: int
    total_guest_kundalis_all_time: int
    total_guest_kundalis_last_7_days: int

    practitioner_applications: PractitionerApplicationStats
    total_consultations: int


class AdminUserItem(BaseModel):
    id: str
    email: str
    role: str
    created_at: str
    kundali_count: int
    chat_session_count: int


class UserListResponse(BaseModel):
    items: list[AdminUserItem]
    total: int
    page: int
    limit: int


class UpdateRoleRequest(BaseModel):
    role: Literal["seeker", "practitioner", "admin"]
