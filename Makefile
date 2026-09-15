.DEFAULT_GOAL := help

help:  ## show available targets
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-14s %s\n", $$1, $$2}'

db-up:  ## start postgresql database in docker
	docker compose up -d nakhatra_postgres

db-down:  ## stop database container
	docker compose stop nakhatra_postgres

install-api:  ## install api backend python dependencies
	cd apps/api && uv sync

install-web:  ## install web frontend node dependencies
	cd apps/web && npm install

install: install-api install-web  ## install all dependencies for api and web

migrate:  ## run database migrations
	cd apps/api && uv run alembic upgrade head

api:  ## run the backend fastapi server (port 8000)
	cd apps/api && uv run uvicorn app.main:app --reload --port 8000

ui:  ## run the frontend next.js server (port 3000)
	cd apps/web && npm run dev

dev: db-up  ## start database and run both api & web concurrently
	@echo "Starting API on :8000 and Web on :3000..."
	@which npx >/dev/null 2>&1 && npx concurrently -n "api,web" -c "blue,green" \
		"cd apps/api && uv run uvicorn app.main:app --reload --port 8000" \
		"cd apps/web && npm run dev" \
		|| (echo "Tip: Install 'concurrently' or run 'make serve-api' & 'make serve-web' in separate terminals."; \
		    cd apps/api && uv run uvicorn app.main:app --reload --port 8000)

test-api:  ## run python pytest suite
	cd apps/api && uv run pytest -q

test-web:  ## run next.js tests
	cd apps/web && npm test

docker-up:  ## start all services with docker compose
	docker compose up -d

docker-down:  ## stop all docker compose services
	docker compose down

.PHONY: help db-up db-down install-api install-web install migrate serve-api serve-web dev test-api test-web docker-up docker-down
