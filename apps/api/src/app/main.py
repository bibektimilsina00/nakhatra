"""App factory. Routers are mounted here and nowhere else."""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlmodel import Session, select

from app.core.config import get_settings
from app.core.db import get_engine
from app.core.errors import install_error_handlers
from app.modules.auth.router import router as auth_router
from app.modules.billing.router import router as billing_router
from app.modules.chat.router import router as chat_router
from app.modules.consultations.router import router as consultations_router
from app.modules.kundali.router import router as kundali_router
from app.modules.milan.router import router as milan_router
from app.modules.patro.router import router as patro_router
from app.modules.rasifal.router import router as rasifal_router
from app.modules.places.router import router as places_router
from app.modules.practitioners.router import router as practitioners_router
from app.modules.report.router import router as report_router
from app.modules.vault.router import router as vault_router
from app.modules.voice.router import router as voice_router

logger = logging.getLogger(__name__)

API_DESCRIPTION = """
One backend, two clients (web and Flutter).

**Compatibility:** additive changes only within `/v1` — no removed or renamed
fields, no newly-required request fields, no narrowed types. App Store users
stay on old builds for months. Clients must treat unknown enum values as
"other". See docs/architecture.md §7.

**Errors** are always `{"error": {"code", "message", "details"}}`. Switch on
`code`; never parse `message`.
"""


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Nakhatra API",
        version="0.1.0",
        description=API_DESCRIPTION,
        debug=settings.DEBUG,
        # Both clients generate their types from `components.schemas.ChartOut`.
        # A model used as both a request field and a response body otherwise
        # splits into `ChartOut-Input` / `ChartOut-Output`, which renames the
        # schema out from under them — a breaking contract change (rule 8) for
        # a distinction neither client makes.
        separate_input_output_schemas=False,
    )

    # Local dev only: Flutter web and a Next.js dev server are served from
    # ports that change, and a CORS failure in a browser looks like a network
    # error with no useful message. Native clients (macOS, iOS, Android) do not
    # use CORS at all, so this affects browser testing only.
    if settings.ENV != "local" and not settings.CORS_ORIGINS:
        # Without this the middleware is simply not added and every browser
        # request fails as an opaque CORS error, while native clients keep
        # working — so it presents as "the website is broken but the app is
        # fine", which is a long way from the actual cause.
        raise RuntimeError(
            f"CORS_ORIGINS must be set when ENV={settings.ENV}. "
            "Browser clients cannot reach the API without it."
        )

    origins = settings.CORS_ORIGINS or (["*"] if settings.ENV == "local" else [])
    if origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=False,  # incompatible with allow_origins=['*']
            allow_methods=["*"],
            allow_headers=["*"],
        )

    install_error_handlers(app)
    app.include_router(auth_router)
    app.include_router(vault_router)
    app.include_router(milan_router)
    app.include_router(rasifal_router)
    app.include_router(patro_router)
    app.include_router(kundali_router)
    app.include_router(billing_router)
    app.include_router(chat_router)
    app.include_router(consultations_router)
    app.include_router(report_router)
    app.include_router(voice_router)
    app.include_router(places_router)
    app.include_router(practitioners_router)

    @app.get("/health", tags=["meta"], summary="Liveness probe")
    async def health() -> dict[str, str]:
        # Actually touch the database. Returning "ok" unconditionally means an
        # orchestrator keeps routing traffic to an instance whose connection
        # died — the one failure a health check exists to catch.
        try:
            with Session(get_engine()) as session:
                session.exec(select(1)).first()
        except Exception:
            logger.exception("health check: database unreachable")
            return JSONResponse(
                status_code=503, content={"status": "degraded", "database": "unreachable"}
            )
        return {"status": "ok"}

    return app


app = create_app()
