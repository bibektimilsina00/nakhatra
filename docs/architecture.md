# Architecture

**Status:** decided, pre-code. Change it here first, then in code.
**Product spec:** [`../nakhatra.md`](../nakhatra.md) — this doc does not restate it.

---

## 1. The one rule

```
Deterministic astrology   ─→   structured data   ─→   AI interpretation   ─→   user
      (astrology_core)              (JSON)              (ai_astrologer)
```

The AI never computes a planetary position, a dasha date, a yoga, or a dosha.
It receives them as verified structured input and turns them into language.

Everything else in this document exists to make that boundary impossible to
accidentally cross.

---

## 2. Repository layout

```
kundali/
├── apps/
│   ├── api/                    # FastAPI + uv + SQLModel   — one backend
│   ├── web/                    # Next.js + TS              — client 1
│   └── mobile/                 # Flutter + BLoC            — client 2
├── contracts/
│   └── openapi.json            # committed API contract. See §7.
├── docs/
├── infra/
│   ├── docker/
│   └── compose.yml
├── Makefile
└── README.md
```

That is the whole tree. Notably absent, and deliberately:

| Not created | Why | Create when |
|---|---|---|
| `packages/api-client` | The generator writes into `apps/web/src/lib/api/generated/`. The Flutter app is a **Dart** consumer, so it does not fire this trigger — the two clients share a *spec*, not a package. A TS workspace package still buys nothing with one TS consumer. | A second **TypeScript** consumer exists (admin app, a second web surface). |
| `packages/ui`, `packages/types`, `packages/config` | Four workspace packages for one frontend is packaging overhead, not architecture. Flutter cannot consume them either. | Same trigger. |
| `packages-python/astrology-core` | Same boundary is enforced by a lint rule at zero cost (§4). Publishing it as a distribution is packaging, not isolation. | A second Python consumer exists, or you open-source the engine. |
| `apps/api/.../modules/{astrology,dasha,transits}` | Dasha and transits are *calculations*, not features. They have no routes, no tables, no repository. Giving them module folders creates three empty shells. | Never — they live in `astrology_core`. |
| `docs/api/` | FastAPI serves OpenAPI at `/docs`. A hand-written API doc drifts within a week. | Never. |
| `docs/product/vision.md` | `nakhatra.md` is the product spec. A second copy diverges. | Never. |

---

## 3. Backend

```
apps/api/
├── pyproject.toml            # uv
├── alembic.ini
├── alembic/versions/
├── src/app/
│   ├── main.py               # app factory, router mounting, lifespan
│   ├── core/
│   │   ├── config.py         # pydantic-settings, typed, fail-fast
│   │   ├── db.py             # engine + get_session dependency
│   │   ├── security.py       # JWT issue/verify, password hashing
│   │   ├── errors.py         # AppError base + exception handlers
│   │   └── deps.py           # current_user, pagination, rate-limit
│   │
│   ├── astrology_core/       # ← PURE. See §4.
│   │   ├── ephemeris.py      # the ONLY pyswisseph import in the repo
│   │   ├── models.py         # frozen dataclasses: Chart, Planet, House, ...
│   │   ├── constants.py      # signs, nakshatras, lords, dasha years
│   │   ├── chart.py          # lagna, cusps, planetary longitudes
│   │   ├── nakshatra.py      # nakshatra + pada + lord
│   │   ├── dasha.py          # vimshottari, 3 levels
│   │   ├── yoga.py           # detectors, one function per yoga
│   │   ├── dosha.py          # detectors
│   │   └── transit.py        # gochar from Moon sign
│   │
│   ├── modules/              # feature = routes + tables + service
│   │   ├── auth/
│   │   ├── users/
│   │   ├── kundali/          # birth data, chart persistence, chart reads
│   │   ├── horoscope/        # daily reading, cached per user per day
│   │   ├── conversations/    # threads + messages (persistence only)
│   │   ├── ai_astrologer/    # the AI. See docs/ai-astrologer.md
│   │   └── voice/            # STT + TTS
│   │
│   ├── integrations/         # one file per vendor, behind a Protocol
│   │   ├── llm.py
│   │   ├── stt.py
│   │   ├── tts.py
│   │   └── storage.py
│   │
│   └── shared/
│       ├── enums.py
│       └── schemas.py        # Page[T], ErrorBody
└── tests/
    ├── astrology/            # golden-chart regression. The important ones.
    ├── modules/
    └── conftest.py
```

### Module shape

Every module is the same five files. If a module doesn't need one, it doesn't have it.

```
modules/kundali/
├── router.py      # HTTP only: parse, call service, return schema. Thin.
├── schemas.py     # pydantic request/response. Never leaks SQLModel.
├── models.py      # SQLModel tables owned by this feature
├── repository.py  # every query against those tables
├── service.py     # business logic. No FastAPI imports, no raw SQL.
└── tests/
```

`ai_astrologer` is the one module that goes deeper, because it genuinely has
more moving parts:

```
modules/ai_astrologer/
├── router.py
├── service.py
├── prompts/        # system.py, safety.py, formatting.py
├── context.py      # builds the chart snapshot handed to the model
├── tools.py        # tool definitions + dispatch into astrology_core
└── tests/
```

### Dependency direction

```
router → service → repository → db
                 → astrology_core
                 → integrations (via Protocol)
```

- `astrology_core` imports **nothing** from the rest of the app.
- `integrations` is imported by services through a `Protocol`, never concretely.
- Cross-module calls go **service → service**, never repository → repository.
  If two modules need each other's tables, the boundary is wrong.

---

## 4. Enforcing the astrology boundary

One config block, checked in CI. This is the cheap version of a separate package.

```toml
# apps/api/pyproject.toml
[tool.importlinter]
root_package = "app"

[[tool.importlinter.contracts]]
name = "astrology_core is pure"
type = "forbidden"
source_modules = ["app.astrology_core"]
forbidden_modules = ["fastapi", "sqlmodel", "sqlalchemy", "anthropic", "redis", "app.modules", "app.core"]

[[tool.importlinter.contracts]]
name = "swisseph is used in exactly one place"
type = "forbidden"
source_modules = ["app.modules", "app.core", "app.integrations"]
forbidden_modules = ["swisseph"]
```

`uv run lint-imports` in CI. If someone imports SQLModel into a dasha
calculator, the build fails. That is the entire benefit the separate
package would have bought.

---

## 5. Data model

Only the decisions worth writing down. Column-level detail lives in the
SQLModel classes.

| Table | Owner | Notes |
|---|---|---|
| `user` | users | auth identity, language, tz, notification prefs |
| `birth_profile` | kundali | date, **time**, `time_accuracy` enum, lat, lon, `tz_name` (IANA), place label. One per user for MVP; the table allows more (family charts later). |
| `chart` | kundali | **Cached computation.** Full structured chart as JSONB + `engine_version`. Recomputable from `birth_profile` at any time. |
| `horoscope` | horoscope | `(user_id, date)` unique. Text + `audio_url`. Generated lazily (§6). |
| `conversation` | conversations | title, timestamps |
| `message` | conversations | role, content, `chart_factors` JSONB (what the AI cited — powers the "Why?" button) |
| `saved_insight` | conversations | FK to message + category |

Rules:

- **`chart` is a cache, not a source of truth.** `birth_profile` is. Store
  `engine_version` on every chart row; when the engine changes, invalidate and
  recompute rather than migrate JSON.
- **Store `tz_name`, never a UTC offset.** Kathmandu ran +5:41:16 (LMT), then
  +5:30, then +5:45 (1986). A stored `+05:45` puts a 1975 birth 15 minutes out
  and silently corrupts the chart.
  See [`astrology-methodology.md`](astrology-methodology.md#time-zones).
- **Birth data is sensitive.** Encrypt `birth_profile` at rest; exclude it from
  logs; make the delete path actually delete (spec §39).

---

## 6. Two flows worth spelling out

### Kundali creation

```
POST /v1/kundali  {name, date, time, time_accuracy, place}
  → resolve place → lat/lon/tz_name           (geocoder, cached)
  → persist birth_profile
  → astrology_core.build_chart(...)           # pure, ~50ms, no I/O
  → persist chart (JSONB + engine_version)
  → return chart summary
```

Synchronous. The whole computation is local arithmetic against an ephemeris
file — there is no job queue in this path and there does not need to be one.

### Daily horoscope — lazy, not scheduled

```
GET /v1/horoscope/today
  → row for (user, today)? → return it
  → else: chart + today's transits + current dasha → LLM → persist → return
```

**No cron, no worker, no fan-out.** The obvious design (generate for every user
at 4am) does more work, needs infrastructure that doesn't otherwise exist, and
produces horoscopes for users who never open the app. Generating on first read
costs one ~3s wait for that user, once per day, and is strictly less machinery.

Add a pre-warm job only when a real requirement forces it: a push notification
that must contain the horoscope text, or a p95 that users complain about.

> **The mobile app moves that trigger much closer.** A 6am "your horoscope is
> ready" push (spec §46) is the retention loop, and it cannot contain text that
> does not exist yet. Two options when you build it, in order of laziness:
> generate inside the push-send worker (the fan-out already exists there, so no
> new infrastructure), or add a scheduled pre-warm. Do neither until push is
> actually being built — see [`mobile.md`](mobile.md) §8.

---

## 7. Serving two clients

One API, two independently-released clients. This is the change that costs
something, and it is not the folder layout — it is that **you can no longer
change the API and the client in the same commit**.

A web deploy updates every user at once. A mobile release does not: App Store
review takes days, and a meaningful share of users will be on a build from
months ago, forever. The backend is therefore permanently talking to old
clients.

### The spec is a committed artifact

`contracts/openapi.json` is generated from FastAPI, committed, and diffed in
CI. It is the single source both clients generate from:

```
apps/api  ──generate──▶  contracts/openapi.json  ──┬──▶  apps/web/src/lib/api/generated/   (TS)
                                                   └──▶  apps/mobile/lib/api/generated/    (Dart)
```

```make
contract:        ## regenerate the committed OpenAPI spec
	uv run python -c "import json,sys; from app.main import app; \
	  json.dump(app.openapi(), sys.stdout, indent=2, sort_keys=True)" \
	  > ../../contracts/openapi.json
```

`make contract-check` does exactly that — regenerate, then
`git diff --exit-code`. A route change that forgets to regenerate fails the
build, so the spec cannot drift from the code. Wire it into CI when there is a
CI to wire it into; the target exists and runs today.

The dump is sorted-key and fixed-indent because an unstable spec would fail the
check at random and train everyone to ignore it.

### Compatibility policy

Within `/v1`, these are **breaking** and are not allowed:

- removing or renaming a field, endpoint, or enum value
- making an optional request field required
- narrowing a type (`string` → `enum`, widening a validator)
- changing the meaning of a value while keeping its name

These are always fine: adding an optional request field, adding a response
field, adding an endpoint, adding an enum value **if clients treat unknown
values as "other"** — which both generated clients must be configured to do,
or every new dosha type crashes an old build.

To retire a field: stop writing it in new clients, keep serving it, and delete
it only when telemetry shows no build still reading it is in use. Bump to `/v2`
only for a change that cannot be made additively — it means running two
versions, so treat it as expensive.

### What is shared, and what is not

| | Shared | Client-specific |
|---|---|---|
| Endpoints, payloads, error codes | ✅ one spec | |
| Auth flow (bearer + refresh) | ✅ same endpoints | token **storage**: httpOnly cookie on web, `flutter_secure_storage` on mobile |
| AI streaming | ✅ same SSE frames | web has `EventSource`; Dart does not — see [`mobile.md`](mobile.md) §8 |
| Chart rendering | | independent implementations; the *data* is shared, the drawing is not |
| Push notifications | | mobile only (FCM/APNs) |
| Offline cache | | mobile only (drift) |

Error bodies are `{error: {code, message, details}}` for both. **`code` is for
the client, `message` is for a human** — clients switch on `code` and never
parse `message`, or a copy edit becomes a breaking change.

---

## 8. Web frontend

One of two clients (§7). It shares the API and the generated types with
mobile; it shares no UI code, and should not try to.

```
apps/web/src/
├── app/                      # routing + layout ONLY. Pages compose features.
│   ├── (auth)/login|register
│   ├── (onboarding)/birth-details
│   └── (app)/
│       ├── page.tsx          # home
│       ├── ask/              # AI chat
│       ├── kundali/
│       ├── timeline/         # dasha
│       └── me/
│
├── features/                 # where the app actually lives
│   ├── auth/
│   ├── onboarding/
│   ├── kundali/
│   ├── horoscope/
│   ├── ai-astrologer/
│   └── voice/
│
├── components/ui/            # Button, Dialog, Card... only if 2+ features use it
├── lib/
│   ├── api/                  # client.ts + generated/ (from OpenAPI)
│   └── query.ts              # TanStack QueryClient
└── providers/
```

Each feature:

```
features/kundali/
├── components/
├── hooks/use-kundali.ts      # TanStack Query lives here
├── api.ts                    # typed calls
├── schema.ts                 # zod — validates FORMS and AI stream frames
└── types.ts
```

### State: the only rule that matters

| Kind | Tool |
|---|---|
| Anything that came from the API | **TanStack Query** |
| Anything that never leaves the browser | **Zustand** |

Zustand holds: chat composer draft, voice recording state, audio player
position, selected chart style (North/South), sidebar, onboarding step.

Zustand does **not** hold: user, chart, horoscope, messages. Copying server
data into Zustand means writing cache invalidation by hand, and you will get
it wrong.

Streamed AI tokens are the one grey area: accumulate into local component
state during the stream, then `queryClient.setQueryData` on completion so the
finished message joins the normal cache.

### Zod
Use it at the two real trust boundaries: form input, and parsing AI stream
frames. Don't re-validate generated API response types — they're already typed
and the server is the schema owner.

---

## 9. Mobile app (Flutter)

Clean architecture with BLoC. Full layer contract, folder anatomy, streaming
implementation, and the Cubit-vs-Bloc rule: **[`mobile.md`](mobile.md)**.

The one-paragraph version: `domain/` (entities + repository interfaces + use
cases) depends on nothing; `data/` implements those interfaces and owns the
generated DTOs and their mappers; `presentation/` (BLoC) talks only to domain.
Features never import each other. Enforced by `import_lint`, mirroring the
backend's import-linter contracts (§4) — same principle, same reason.

---

## 10. Stack

| | | Why not the alternative |
|---|---|---|
| Python | 3.12 + uv | — |
| API | FastAPI + SQLModel + Alembic | — |
| Ephemeris | **pyswisseph** | Do not write ephemeris math. Note the AGPL/commercial license — decide before launch. |
| DB | Postgres 16 | JSONB for charts |
| Cache | Redis | Sessions, geocoder cache, rate limits |
| Queue | **none yet** | See §6. Add `arq` (not Celery) when a real background job exists. |
| LLM | Gemini 3.6 Flash (`google/gemini-3.6-flash`) **via OpenRouter** | OpenRouter serves Anthropic's wire at `/v1/messages`: official `anthropic` SDK + `base_url` override, namespaced model IDs. Changing model or provider is a `.env` change. See [`ai-astrologer.md`](ai-astrologer.md) |
| Web | Next.js App Router, TanStack Query, Zustand, Tailwind, shadcn/ui | — |
| Mobile | Flutter, `flutter_bloc`, `get_it`, `dio`, `go_router`, `drift`, `flutter_secure_storage` | Clean architecture; see [`mobile.md`](mobile.md). No `freezed`/`injectable`/`dartz` — reasons in §11 there. |
| Contract | OpenAPI, committed to `contracts/` | Both clients generate from it (§7) |

---

## 11. Conventions

- API is versioned: `/v1/...`. Routers mounted in `main.py`, nowhere else.
  Additive changes only within a version — old mobile builds never go away (§7).
- Errors: one `AppError` hierarchy, one handler, one JSON body shape
  `{error: {code, message, details}}`. Never leak tracebacks.
- Config: `pydantic-settings`, typed, validated at startup. No `os.getenv` in
  business code. No secrets in the repo.
- Migrations: always Alembic. `alembic revision --autogenerate`, then **read
  the generated file** before committing.
- Tests: golden-chart regression for `astrology_core` is the one suite that
  must not be skipped. See [`astrology-methodology.md`](astrology-methodology.md#testing).
