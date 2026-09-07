# syntax=docker/dockerfile:1

# Dependencies come from uv.lock, not from a hand-written pip line.
#
# The previous version listed packages by hand and copied `pyproject.toml`
# without ever reading it, so every dependency added since it was written was
# simply absent from the image: sqlmodel, pyjwt, argon2-cffi, alembic,
# anthropic, httpx, email-validator. The container crash-looped on
# `ModuleNotFoundError` while the deploy reported success, because nothing
# checked that the thing it started actually came up.
#
# Installing from the lock also makes the image reproducible — the same commit
# builds the same dependency tree a year from now.

FROM python:3.12-slim AS builder

# uv resolves and installs from the committed lock. Copied from its own image
# rather than curl|sh so the version is pinned by digest like any other base.
COPY --from=ghcr.io/astral-sh/uv:0.5.11 /uv /usr/local/bin/uv

# build-essential and libpq-dev are needed to compile psycopg2 and argon2-cffi;
# they stay in this stage and never reach the runtime image.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/opt/venv

# Dependencies first, in their own layer: application code changes on every
# commit, the lock does not, so this layer stays cached.
COPY apps/api/pyproject.toml apps/api/uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev

COPY apps/api/ ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev


FROM python:3.12-slim AS runtime

# libpq5 is the runtime half of libpq-dev; the compilers are not carried over.
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /app /app

ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONPATH=/app/src \
    PYTHONUNBUFFERED=1

# Not root. A compromised dependency should not own the filesystem as well.
RUN useradd --system --create-home --uid 10001 nakhatra \
    && chown -R nakhatra:nakhatra /app
USER nakhatra

EXPOSE 8000

# Compose and the deploy both read this, so a container that cannot answer
# /health is visibly unhealthy rather than quietly restarting forever.
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
    CMD curl -fsS http://127.0.0.1:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
