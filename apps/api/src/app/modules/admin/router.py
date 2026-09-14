from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.core.db import get_session
from app.modules.auth.roles import ADMIN, require_role

from .schemas import (
    AdminStatsOverview,
    UpdateRoleRequest,
    UserListResponse,
)
from .service import AdminService

router = APIRouter(
    prefix="/v1/admin",
    tags=["admin"],
    dependencies=[Depends(require_role(ADMIN))],
)


@router.get("/stats", summary="Get admin dashboard stats")
def get_stats(
    session: Annotated[Session, Depends(get_session)],
) -> AdminStatsOverview:
    """Returns aggregate system statistics for the admin dashboard.
    
    Never exposes PII. Used for high-level health monitoring.
    """
    service = AdminService(session)
    return service.get_stats_overview()


@router.get("/users", summary="List users")
def list_users(
    session: Annotated[Session, Depends(get_session)],
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    search: Annotated[str | None, Query(description="Search by email substring")] = None,
) -> UserListResponse:
    service = AdminService(session)
    return service.list_users(page, limit, search)


@router.patch("/users/{user_id}/role", summary="Update user role")
def update_user_role(
    user_id: str,
    request: UpdateRoleRequest,
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, str]:
    service = AdminService(session)
    service.update_role(user_id, request.role)
    return {"status": "success"}
