# UI/UX overhaul — design spec

## Problem

`docs/design.md` is a real, WCAG-AA-measured design system (warm saffron/cream,
one palette). The code never followed it. `apps/web/src/app/globals.css`
carries three competing token systems instead: a navy/gold "night sky" dark
theme, a separate "janma patrika" light theme, and a third fixed marketing
palette — plus comments admitting past patches ("names the kundali chart page
always used; they were never defined, so those classes silently did
nothing"). There is no shared `Button`/`Card`/`Input`/`Tabs` primitive in
`components/ui/` — every feature hand-rolls styling, which is why the drift
happened: nothing shared to fix once. Running `apps/web`'s own
`scripts/design-audit.sh` today fails across effectively every feature folder
(hardcoded hex, off-scale radii, arbitrary font sizes).

## Decision

`docs/design.md` is the single source of truth. Dark mode, the navy/gold
system, and the separate marketing palette are retired — one theme
everywhere. Scope is `apps/web` only; `apps/mobile`'s Flutter theme mirror is
a separate follow-up, not blocked by this work.

No new dependencies. No `cva`/`clsx`/`tailwind-merge` in the repo today;
plain template-string conditionals are enough for five small primitives.

## Phases

All four phases execute back-to-back in this pass — not gated as separate
future asks. Phase 0 must land first because Phases 1–3 consume its
primitives; 1–3 are independent of each other and run in parallel.

### Phase 0 — Foundation (Claude, direct — judgement-heavy, everything depends on it)

- Rewrite `globals.css`: delete the three token systems, replace with
  `docs/design.md` §10's literal token set. Single theme, no `[data-theme]`
  runtime switch.
- Fonts: Poppins (display) + Inter (body) via `next/font/google`, replacing
  Sora/Cinzel/JetBrains.
- Delete `components/ui/theme-toggle.tsx` and its call sites.
- Build the missing primitives in `components/ui/`, tokens only, per
  `docs/design.md` §5: `button.tsx`, `card.tsx`, `input.tsx`, `tabs.tsx`,
  `pill.tsx`.
- Gate: `npm run design && npm run lint && npm run typecheck` clean on every
  file this phase touches.

### Phase 1 — Core app screens (delegate to Antigravity, one task per feature folder)

`dashboard`, `kundali`, `chat` (reading), `milan`, `consultations`,
`practitioners`, `account`/`profile`/`settings`, `notifications`, `auth`
(login). Each delegation: replace hardcoded hex / `rounded-[…]` / `text-[…]`
/ old token classes (`bg-acc`, `text-fg`, `bg-panel`, `border-brd`, …) with
the Phase 0 primitives and new tokens, page by page, following
`docs/design.md`. Mechanical, well-scoped, independent per folder — exactly
the bulk work Antigravity is for.

### Phase 2 — Marketing site (delegate to Antigravity)

`(marketing)`: home, rasifal, rasifal/[sign], patro, privacy, terms, plus
`components/layout/main-navbar.tsx` / `main-footer.tsx` and
`features/marketing`.

### Phase 3 — Admin/studio (delegate to Antigravity)

`admin`, `admin/practitioners`, `admin/studio`, `studio/rasifal`,
`features/studio`, `features/admin`. Internal-only, lowest priority, last.

## Gate (every phase, before marking it done)

`npm run design && npm run lint && npm run typecheck`, then Claude drives the
running dev server (`npm run dev`, port 3000) and looks at the actual
representative pages for that phase. Antigravity's self-reported "done" is
never trusted as the gate — Claude re-runs it.

## Risk

Phase 0 changes what the old token names resolve to (or removes them).
Pages not yet migrated will look broken between Phase 0 landing and their own
phase finishing — acceptable because all phases run in this same pass with
no idle gap in between, not because it's cosmetic.

## Out of scope

`apps/mobile` Flutter theme. Any backend/API/schema change. New UI
dependencies.
