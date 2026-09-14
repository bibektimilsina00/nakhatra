from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.db import get_session
from app.modules.auth.roles import ADMIN, require_role

from .schemas import AdminStatsOverview
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
