# CLAUDE.md

Working rules for this repo. Read [`docs/architecture.md`](docs/architecture.md)
before making structural changes.

## What this is

AI Vedic astrology platform. Product spec: [`nakhatra.md`](nakhatra.md).
One backend, two clients: `apps/api` (FastAPI + uv + SQLModel), `apps/web`
(Next.js + TS), `apps/mobile` (Flutter + BLoC).

## Hard rules

1. **The AI never calculates astrology.** Positions, dashas, yogas, doshas come
   from `astrology_core` and are handed to the model as structured data. If you
   are about to ask the LLM to compute a degree or a date, stop.

2. **`app/astrology_core/` is pure.** No FastAPI, no SQLModel, no anthropic, no
   redis, no imports from `app.modules` or `app.core`. Enforced by
   `uv run lint-imports` in CI.

3. **`swisseph` is imported in exactly one file:** `astrology_core/ephemeris.py`.

4. **Golden charts are a contract.** A change that alters any fixture in
   `tests/astrology/fixtures/` is breaking: bump `engine_version`, update the
   fixture deliberately, and say in the commit which reference tool confirmed
   the new value.

5. **Store `tz_name` (IANA), never a UTC offset.** Kathmandu ran +5:41:16 (LMT)
   → +5:30 → +5:45 (1986). A stored offset puts a 1975 birth 15 minutes out —
   ~3.75° of ascendant — and silently corrupts the chart. Never assert a
   historical offset from memory; read it from `zoneinfo`.

6. **Server state lives in TanStack Query** (web) **/ a repository** (mobile).
   Zustand and BLoC hold UI state, not a second copy of the server's data.

7. **Never break the API for old mobile builds.** Additive changes only within
   `/v1`: no removed or renamed fields, no newly-required request fields, no
   narrowed types. App Store users stay on old builds for months. Full policy:
   `docs/architecture.md` §7.

8. **`contracts/openapi.json` is generated, committed, and CI-diffed.** Both
   clients generate their types from it. Never hand-edit it, and never
   hand-write a client type that duplicates it.

9. **Birth data is sensitive.** Not in logs, not in error payloads, not in
   analytics events.

10. **Never commit a key.** `.env` is gitignored; `apps/api/.env.example` is the
    template. Don't paste keys into chat, issues, or commit messages — if one
    leaks, rotate it at the router, don't just delete the line.

## Module shape (backend)

`router.py` (thin) → `service.py` (logic) → `repository.py` (queries).
`schemas.py` for pydantic, `models.py` for SQLModel. Routers never touch the
database. Services never import FastAPI. Cross-module calls go service → service.

A module exists when a feature has routes **and** tables. Dasha, transits, and
chart math are calculations — they live in `astrology_core`, not in `modules/`.

## Feature shape (mobile — Flutter)

`domain/` (entities, repository interfaces, use cases) imports nothing — not
Flutter, not dio, not another feature. `data/` implements the domain interfaces
and owns the generated DTOs plus their mappers. `presentation/` (BLoC) talks
only to domain; a BLoC importing a DTO or a datasource is a layer leak.
Features never import each other, and `core/` never imports a feature — the
composition root that does live in `app/`. Enforced by
`dart run tool/check_layers.dart` (and `--self-test`, which proves the guard
can actually fail).

Cubit by default; `Bloc` only where event concurrency is a real decision
(`auth`, `ai_astrologer`). Sealed state classes — never
`isLoading` + `data?` + `error?` in one object. Details: `docs/mobile.md`.

## Feature shape (web — Next.js)

`app/` is routing and layout only; pages compose from `features/`. Each feature
owns its `components/`, `hooks/`, `api.ts`, `schema.ts`, `types.ts`.
A component used by one feature stays in that feature. `components/ui/` is for
things with two or more real consumers.

## LLM

`google/gemini-3.6-flash` served through **OpenRouter**, which serves
Anthropic's wire at `/v1/messages` — so it stays the official `anthropic` SDK
with `base_url=settings.LLM_BASE_URL`. Namespaced model IDs (`vendor/model`).
Pass base URL and key explicitly from typed settings; never rely on the SDK
reading `ANTHROPIC_BASE_URL` from the environment (a missing var silently sends
a router key to api.anthropic.com and 401s like a bad key).

`thinking` and `output_config` are Anthropic's own — a router forwards them
verbatim and a non-Anthropic model 400s, so they are gated behind
`llm.tuning()` rather than passed at each call site. Check
`stop_reason == "refusal"` before reading `content`. Every client construction
lives in `integrations/llm.py`.
Details: [`docs/ai-astrologer.md`](docs/ai-astrologer.md).

Don't break prompt caching: no `datetime.now()`, request ids, or user names in
the system prompt; serialise the chart snapshot with sorted keys.

## Adding dependencies

Check the stdlib first, then what's already installed. `pyswisseph` is the one
place we take a heavy dependency, because ephemeris math is not worth writing.

## Commands

Per app. `apps/web` does not exist yet.

```
# apps/api
make test       # pytest — 187 passing, 1 deliberate Phase 0 gate failure
make serve      # uvicorn on :8000
make lint       # ruff + lint-imports (astrology_core boundary contracts)
make chart      # print a chart for eyeball verification against a reference tool
make contract   # regenerate contracts/openapi.json
make contract-check  # CI: fail if the spec drifted from the code

# apps/web        (Phase 1)  npm test · npm run lint · npm run generate:api
# apps/mobile     flutter test · flutter analyze · dart run tool/check_layers.dart
```

## Before committing

- `astrology_core` changed → run the golden-chart suite, mention the result
- Schema changed → Alembic revision generated **and read**
- New route → `make contract`, commit the spec diff, regenerate **both** clients
- Changed an existing route → check it against the additive-only policy (rule 7)
  before writing the code, not after
