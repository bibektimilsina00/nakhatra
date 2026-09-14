# UI/UX Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `apps/web`'s three competing, drifted token systems with the
one palette `docs/design.md` specifies, build the shared primitives the repo
never had, then re-skin every route to use them — foundation done directly,
the mechanical re-skinning delegated to Antigravity.

**Architecture:** Phase 0 rewrites `globals.css` to the single
`docs/design.md` token set and ships five primitives
(`Button`/`Card`/`Input`/`Tabs`/`Pill`) in `components/ui/`. Phases 1–3 are
independent Antigravity delegations — one per feature folder or route group —
that replace hardcoded/legacy-token classes with the new primitives. Every
phase is gated by the repo's own `design-audit.sh` plus lint/typecheck plus a
manual look at the running dev server; Antigravity's self-report is never the
gate.

**Tech Stack:** Next.js 16 (App Router), Tailwind v4 (CSS-first `@theme`,
no `tailwind.config.*`), TypeScript, Vitest (node environment, no DOM —
existing tests are pure-logic, not component-render).

**Spec:** `docs/superpowers/specs/2026-09-12-ui-ux-overhaul-design.md`

## Global Constraints

- Single theme only — no dark mode, no `[data-theme]` runtime switch (spec decision).
- Tokens exactly as `docs/design.md` §2–§4, §10 define them; semantic names, never literal (`ink` never holds white, etc.).
- No new npm dependencies — no `clsx`/`cva`/`tailwind-merge` (none installed today; plain template strings suffice for 5 small primitives).
- Every button/input ≥44×44 touch target (design.md §5, §9.4).
- Never colour alone — dignity/retrograde/active-nav always paired with a label or glyph (design.md §9.2).
- Visible focus ring on every interactive element: 2px `saffron-600` (`#C97A12`), 2px offset (design.md §9.3).
- `prefers-reduced-motion: reduce` collapses all motion to 0.01ms (design.md §8, §9.7) — already present in `globals.css`, must survive the rewrite.
- Gate for every task that touches `apps/web`: `npm run design && npm run lint && npm run typecheck` clean, plus `npm test` if the task added a test file.
- `apps/mobile` Flutter theme and any backend/API change are out of scope (spec).

---

## Phase 0 — Foundation (Claude, direct)

### Task 1: Rewrite the token layer in `globals.css`

**Files:**
- Modify: `apps/web/src/app/globals.css:1-103` (the `@theme` block and the `:root`/`[data-theme]` blocks)
- Modify: `apps/web/src/app/globals.css:150-199` (`.theme-dark` override island, `.solid-card`, `.solid-btn-gold`)

**Interfaces:**
- Produces: Tailwind utility classes `bg-cream`, `bg-surface`, `border-line`, `border-line-strong`, `text-ink`, `text-muted`, `text-dim`, `bg-accent`, `bg-accent-strong`, `text-accent-strong`, `bg-accent-wash`, `bg-accent-tint`, `bg-success`, `bg-success-tint`, `text-success`, `bg-danger`, `bg-danger-tint`, `text-danger`, `text-star`, `border-ring`/`ring-ring`, `text-benefic`, `text-malefic`, `text-neutral-dignity`, `text-retrograde`, `text-combust` — every later task (primitives, Phase 1–3 delegations) consumes only these names.

- [ ] **Step 1: Replace the `@theme` block**

Replace lines 1–78 of `apps/web/src/app/globals.css` (everything from `@import "tailwindcss";` through the end of the `@theme { ... }` block) with:

```css
@import "tailwindcss";

@theme {
  --color-cream: #fffbf6;
  --color-surface: #ffffff;
  --color-line: #f0eae1;
  --color-line-strong: #e3dacd;

  --color-ink: #1f1d1b;
  --color-muted: #6e6862;
  --color-dim: #7a736c;

  --color-accent: #e8931f;        /* saffron-500 — fill, dark text on top */
  --color-accent-strong: #a66916; /* saffron-700 — button fill, white text */
  --color-accent-wash: #fdf4e7;   /* saffron-50 */
  --color-accent-tint: #fae6c9;   /* saffron-100 */
  --color-ring: #c97a12;          /* saffron-600 — focus ring only */

  --color-success: #3a863d;
  --color-success-tint: #eaf4ea;
  --color-danger: #dc382d;
  --color-danger-tint: #fdedec;
  --color-star: #f5a623;

  --color-benefic: #2f7d4f;
  --color-malefic: #b4342a;
  --color-neutral-dignity: #6e6862;
  --color-retrograde: #8a5406;
  --color-combust: #7a736c;

  --radius-sm: 2px;
  --radius-md: 3px;
  --radius-lg: 4px;
  --radius-xl: 6px;

  /* Poppins for display, Inter for body — next/font/google, wired in
     layout.tsx. font-serif and font-logo are gone with the marketing
     Cinzel wordmark island; see Task 2. */
  --font-display: var(--font-poppins), ui-sans-serif, system-ui, sans-serif;
  --font-body: var(--font-inter), ui-sans-serif, system-ui, -apple-system,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

  --text-2xs: 0.6875rem; /* 11px */
}
```

- [ ] **Step 2: Delete the dead theme blocks**

Delete the following blocks entirely (they are the light/dark `:root`
overrides, the `.theme-dark` hero island, and the two utility classes the
new `Card`/`Button` primitives replace):
- The `:root, html[data-theme="dark"] { ... }` block
- The `html[data-theme="light"] { ... }` block
- The `.theme-dark { ... }` block
- The `.solid-card { ... }` and `.solid-btn-gold`/`.solid-btn-gold:hover { ... }` blocks

- [ ] **Step 3: Fix the generic `html`/`body` rules and the global focus ring**

Replace the `html { color-scheme: dark; background-color: #090A10; }` and
`body { background-color: #090A10; color: #E2E8F0; ... }` rules with:

```css
html {
  color-scheme: light;
  background-color: #fffbf6;
}

body {
  background-color: var(--color-cream);
  color: var(--color-ink);
  font-family: var(--font-body);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

Replace the hardcoded-gold focus rule:

```css
:focus-visible { outline:2px solid rgba(229,169,60,.75); outline-offset:2px; border-radius:4px }
```

with the token-based one design.md §9.3 specifies:

```css
:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; border-radius: var(--radius-md); }
```

Leave `:focus:not(:focus-visible) { outline:none }` and the
`input:focus-visible, textarea:focus-visible, select:focus-visible { outline:none }`
rule as-is — inputs draw their own focus border (Task 6).

- [ ] **Step 4: Leave motion/animation keyframes untouched**

`@keyframes drawStroke/pulseGlow/pulseRadar/rotateSlow/equalizerWave`, the
`.animate-*` classes, `.login-trace`, and the final
`@media (prefers-reduced-motion: reduce)` block have no hardcoded theme
colours that changed — do not touch them in this task. The marketing-only
block (`.reveal`, `.grain`, `.glass`, `.navpanel`, `.cell`/`.cellt`,
`details.faq`, the hero's hardcoded `#E5A93C`/`#F3C766`/`#F8FAFC`) is Phase 2
scope (Task 11) — do not touch it here either.

- [ ] **Step 5: Verify the build still compiles**

Run: `npm run typecheck`
Expected: passes (this task only changes CSS custom properties, no `.ts`/`.tsx`).

Run: `npm run dev` (if not already running) and load `http://localhost:3000/`
in a browser or with `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/`.
Expected: `200`. The page will look wrong until Tasks 2–8 land and Phase 1–3
migrate their call sites — that is expected mid-plan, not a regression to fix
here.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "style(web): replace the three token systems with docs/design.md's single palette"
```

---

### Task 2: Swap fonts to Poppins + Inter, delete the dead font/theme wiring in `layout.tsx`

**Files:**
- Modify: `apps/web/src/app/layout.tsx`
- Delete: `apps/web/src/providers/theme-provider.tsx`

**Interfaces:**
- Consumes: `--font-poppins`, `--font-inter` CSS variable names (must match what Task 1's `@theme` block references).
- Produces: `html` no longer carries a `dark` class or `data-theme`; nothing later depends on either.

- [ ] **Step 1: Replace the font imports and `<html>`/`<head>` wiring**

In `apps/web/src/app/layout.tsx`, replace:

```tsx
import { Cinzel, JetBrains_Mono, Sora } from "next/font/google";
...
import { THEME_INIT_SCRIPT, ThemeProvider } from "@/providers/theme-provider";
...
const sora = Sora({ ... });
const jetbrains = JetBrains_Mono({ ... });
const cinzel = Cinzel({ ... });
```

with:

```tsx
import { Inter, Poppins } from "next/font/google";
```

(remove the `THEME_INIT_SCRIPT`/`ThemeProvider` import entirely) and:

```tsx
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});
```

- [ ] **Step 2: Update the `<html>` and `<body>` tags**

Replace:

```tsx
    <html
      lang="en"
      suppressHydrationWarning
      className={`${cinzel.variable} ${sora.variable} ${jetbrains.variable} dark`}
    >
      <head>
        {/* Before paint, so the patro theme never flashes dark first. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-body antialiased bg-app text-mut min-h-dvh">
        <ThemeProvider>
        <LanguageProvider>
          <QueryProvider>
            <SessionSync />
            {children}
          </QueryProvider>
        </LanguageProvider>
        </ThemeProvider>
```

with:

```tsx
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-body antialiased bg-cream text-ink min-h-dvh">
        <LanguageProvider>
          <QueryProvider>
            <SessionSync />
            {children}
          </QueryProvider>
        </LanguageProvider>
```

`suppressHydrationWarning` is no longer needed — nothing sets an attribute on
`<html>` after the server render now that theme switching is gone.

- [ ] **Step 2: Delete the theme provider file**

```bash
rm apps/web/src/providers/theme-provider.tsx
```

- [ ] **Step 3: Verify no other file imports it**

Run: `grep -rn "providers/theme-provider\|useTheme\b" apps/web/src`
Expected: no output. (Task 3 removes the two `ThemeToggle` call sites that
would otherwise still reference `useTheme`.)

- [ ] **Step 4: Typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/layout.tsx
git rm apps/web/src/providers/theme-provider.tsx
git commit -m "style(web): switch to Poppins/Inter, drop dark-mode font and theme wiring"
```

---

### Task 3: Delete `ThemeToggle` and its call sites

**Files:**
- Delete: `apps/web/src/components/ui/theme-toggle.tsx`
- Modify: `apps/web/src/features/dashboard/components/app-nav.tsx`
- Modify: `apps/web/src/features/marketing/components/site-header.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: neither nav renders a theme switch; both compile without the import.

- [ ] **Step 1: Find both call sites precisely**

Run: `grep -n "ThemeToggle" apps/web/src/features/dashboard/components/app-nav.tsx apps/web/src/features/marketing/components/site-header.tsx`

Expected: one import line and one JSX usage `<ThemeToggle />` (or similar) in
each file — read the exact surrounding lines before editing so the removal
doesn't leave a dangling wrapper `<div>` or broken flex layout; if
`<ThemeToggle />` sat alone inside a flex container with siblings, only
remove the `ThemeToggle` line and its import, not the container.

- [ ] **Step 2: Remove the import and JSX in both files**

Remove the `import { ThemeToggle } from "@/components/ui/theme-toggle";` line
and the `<ThemeToggle />` (or equivalent) JSX element from both
`app-nav.tsx` and `site-header.tsx`.

- [ ] **Step 3: Delete the component file**

```bash
rm apps/web/src/components/ui/theme-toggle.tsx
```

- [ ] **Step 4: Verify**

Run: `grep -rn "ThemeToggle\|theme-toggle" apps/web/src`
Expected: no output.

Run: `cd apps/web && npm run typecheck`
Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add -A apps/web/src/components/ui/theme-toggle.tsx apps/web/src/features/dashboard/components/app-nav.tsx apps/web/src/features/marketing/components/site-header.tsx
git commit -m "style(web): remove the theme toggle — single theme now"
```

---

### Task 4: `Button` primitive

**Files:**
- Create: `apps/web/src/components/ui/button.tsx`
- Test: `apps/web/src/components/ui/button.test.ts`

**Interfaces:**
- Produces: `buttonClasses(variant: ButtonVariant, opts?: { size?: "sm" | "md"; className?: string }): string` (pure function, exported for the test and reused by the `Button` component below) and `Button` — a `React.forwardRef` wrapping a `<button>`, props `variant?: ButtonVariant` (default `"primary"`), `size?: "sm" | "md"` (default `"md"`), plus all native `ButtonHTMLAttributes<HTMLButtonElement>`.
- `ButtonVariant = "primary" | "secondary" | "ghost" | "danger"` (design.md §5 Buttons table).

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/components/ui/button.test.ts
import { describe, expect, it } from "vitest";
import { buttonClasses } from "./button";

describe("buttonClasses", () => {
  it("fills primary with the button-safe accent step and white text", () => {
    expect(buttonClasses("primary")).toContain("bg-accent-strong");
    expect(buttonClasses("primary")).toContain("text-white");
  });

  it("never pairs the brand accent fill with white text", () => {
    // saffron-500 (bg-accent) fails AA with white text — only saffron-700
    // (bg-accent-strong) is allowed to carry it (design.md §2.2).
    expect(buttonClasses("primary")).not.toContain("bg-accent ");
  });

  it("gives every variant a 44px minimum touch target", () => {
    for (const v of ["primary", "secondary", "ghost", "danger"] as const) {
      expect(buttonClasses(v)).toMatch(/min-h-11|h-11/); // 44px = h-11 in Tailwind's 4px scale
    }
  });

  it("disabled state removes pointer events, not just opacity", () => {
    expect(buttonClasses("primary")).toContain("disabled:pointer-events-none");
    expect(buttonClasses("primary")).toContain("disabled:opacity-40");
  });

  it("appends a caller className without dropping the base classes", () => {
    const classes = buttonClasses("secondary", { className: "w-full" });
    expect(classes).toContain("w-full");
    expect(classes).toContain("border-line-strong");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/web && npx vitest run src/components/ui/button.test.ts`
Expected: FAIL — `./button` has no exported member `buttonClasses` (module doesn't exist yet).

- [ ] **Step 3: Implement**

```tsx
// apps/web/src/components/ui/button.tsx
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md h-11 px-4 " +
  "text-sm font-medium transition-colors " +
  "disabled:pointer-events-none disabled:opacity-40";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-accent-strong text-white hover:opacity-90",
  secondary: "bg-surface border border-line-strong text-ink hover:bg-cream",
  ghost: "bg-transparent text-accent-strong hover:bg-accent-wash",
  danger: "bg-danger text-white hover:opacity-90",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  opts: { size?: "sm" | "md"; className?: string } = {},
): string {
  const size = opts.size === "sm" ? "h-9 px-3 text-sm" : "";
  return [BASE, VARIANT[variant], size, opts.className].filter(Boolean).join(" ");
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size, className, ...rest }, ref) => (
    <button ref={ref} className={buttonClasses(variant, { size, className })} {...rest} />
  ),
);
Button.displayName = "Button";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/components/ui/button.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Design-audit and typecheck**

Run: `cd apps/web && ./scripts/design-audit.sh && npm run typecheck`
Expected: both clean for this file (no hex, no arbitrary radii/sizes).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/ui/button.tsx apps/web/src/components/ui/button.test.ts
git commit -m "feat(web): add the Button primitive per docs/design.md §5"
```

---

### Task 5: `Card` primitive

**Files:**
- Create: `apps/web/src/components/ui/card.tsx`
- Test: `apps/web/src/components/ui/card.test.ts`

**Interfaces:**
- Produces: `cardClasses(opts?: { tinted?: boolean; className?: string }): string` and `Card` — a `React.forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { tinted?: boolean }>`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/components/ui/card.test.ts
import { describe, expect, it } from "vitest";
import { cardClasses } from "./card";

describe("cardClasses", () => {
  it("defaults to a flat surface card with a hairline border, no shadow", () => {
    const c = cardClasses();
    expect(c).toContain("bg-surface");
    expect(c).toContain("border-line-strong");
    expect(c).not.toMatch(/shadow-/);
  });

  it("uses radius-lg (rounded-lg) per the design system, never an arbitrary radius", () => {
    expect(cardClasses()).toContain("rounded-lg");
  });

  it("a tinted category card uses the accent tint fill with ink text, not the brand fill", () => {
    const c = cardClasses({ tinted: true });
    expect(c).toContain("bg-accent-tint");
    expect(c).toContain("text-ink");
  });

  it("appends a caller className without dropping the base classes", () => {
    const c = cardClasses({ className: "p-6" });
    expect(c).toContain("p-6");
    expect(c).toContain("bg-surface");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/web && npx vitest run src/components/ui/card.test.ts`
Expected: FAIL — module `./card` not found.

- [ ] **Step 3: Implement**

```tsx
// apps/web/src/components/ui/card.tsx
import { forwardRef } from "react";
import type { HTMLAttributes } from "react";

export function cardClasses(
  opts: { tinted?: boolean; className?: string } = {},
): string {
  const base = "rounded-lg border p-4";
  const fill = opts.tinted
    ? "bg-accent-tint text-ink border-line-strong"
    : "bg-surface text-ink border-line-strong";
  return [base, fill, opts.className].filter(Boolean).join(" ");
}

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tinted?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ tinted, className, ...rest }, ref) => (
    <div ref={ref} className={cardClasses({ tinted, className })} {...rest} />
  ),
);
Card.displayName = "Card";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/components/ui/card.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Design-audit and typecheck**

Run: `cd apps/web && ./scripts/design-audit.sh && npm run typecheck`

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/ui/card.tsx apps/web/src/components/ui/card.test.ts
git commit -m "feat(web): add the Card primitive per docs/design.md §5"
```

---

### Task 6: `Input` primitive

**Files:**
- Create: `apps/web/src/components/ui/input.tsx`
- Test: `apps/web/src/components/ui/input.test.ts`

**Interfaces:**
- Produces: `inputClasses(opts?: { invalid?: boolean; className?: string }): string` and `Input` — `React.forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>` — and `FieldError`, a small `<p>` wrapper for the below-field error text design.md §5 Inputs requires.

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/components/ui/input.test.ts
import { describe, expect, it } from "vitest";
import { inputClasses } from "./input";

describe("inputClasses", () => {
  it("has a 44px minimum height", () => {
    expect(inputClasses()).toMatch(/min-h-11|h-11/);
  });

  it("uses the line-strong border by default, danger border when invalid", () => {
    expect(inputClasses()).toContain("border-line-strong");
    expect(inputClasses({ invalid: true })).toContain("border-danger");
  });

  it("never uses placeholder as the only label styling hook", () => {
    // regression guard: no placeholder:text-ink / placeholder-only styling
    expect(inputClasses()).not.toMatch(/placeholder:font-|placeholder-bold/);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/web && npx vitest run src/components/ui/input.test.ts`
Expected: FAIL — module `./input` not found.

- [ ] **Step 3: Implement**

```tsx
// apps/web/src/components/ui/input.tsx
import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

export function inputClasses(
  opts: { invalid?: boolean; className?: string } = {},
): string {
  const base =
    "h-11 w-full rounded-md border bg-surface px-3 text-base text-ink " +
    "placeholder:text-dim focus-visible:outline-none";
  const border = opts.invalid ? "border-danger" : "border-line-strong";
  return [base, border, opts.className].filter(Boolean).join(" ");
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ invalid, className, ...rest }, ref) => (
    <input ref={ref} className={inputClasses({ invalid, className })} {...rest} />
  ),
);
Input.displayName = "Input";

/** Sits directly below the field it belongs to — design.md §5 Inputs: never collected at the top. */
export function FieldError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-danger">{children}</p>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/components/ui/input.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Design-audit and typecheck**

Run: `cd apps/web && ./scripts/design-audit.sh && npm run typecheck`

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/ui/input.tsx apps/web/src/components/ui/input.test.ts
git commit -m "feat(web): add the Input primitive and FieldError per docs/design.md §5"
```

---

### Task 7: `Tabs` primitive

**Files:**
- Create: `apps/web/src/components/ui/tabs.tsx`
- Test: `apps/web/src/components/ui/tabs.test.ts`

**Interfaces:**
- Produces: `tabClasses(active: boolean): string` (pure) and `Tabs` — a small controlled component: `Tabs({ items, value, onChange }: { items: { value: string; label: string }[]; value: string; onChange: (v: string) => void })`, rendering an underline tab bar per design.md §5 Tabs.

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/components/ui/tabs.test.ts
import { describe, expect, it } from "vitest";
import { tabClasses } from "./tabs";

describe("tabClasses", () => {
  it("active tab is ink/500 with a 2px saffron-500 underline", () => {
    const c = tabClasses(true);
    expect(c).toContain("text-ink");
    expect(c).toContain("border-accent");
  });

  it("inactive tab is muted with a transparent underline, never colour-only difference", () => {
    const c = tabClasses(false);
    expect(c).toContain("text-muted");
    expect(c).toContain("border-transparent");
  });

  it("both states share the same underline thickness and transition timing", () => {
    expect(tabClasses(true)).toMatch(/border-b-2/);
    expect(tabClasses(false)).toMatch(/border-b-2/);
    expect(tabClasses(true)).toContain("transition-colors");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/web && npx vitest run src/components/ui/tabs.test.ts`
Expected: FAIL — module `./tabs` not found.

- [ ] **Step 3: Implement**

```tsx
// apps/web/src/components/ui/tabs.tsx
export function tabClasses(active: boolean): string {
  return [
    "border-b-2 px-1 pb-2 text-sm transition-colors duration-200",
    active ? "border-accent text-ink font-medium" : "border-transparent text-muted",
  ].join(" ");
}

export interface TabItem {
  value: string;
  label: string;
}

export function Tabs({
  items,
  value,
  onChange,
}: {
  items: TabItem[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div role="tablist" className="flex gap-6 border-b border-line">
      {items.map((item) => (
        <button
          key={item.value}
          role="tab"
          type="button"
          aria-selected={item.value === value}
          className={tabClasses(item.value === value)}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/components/ui/tabs.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Design-audit and typecheck**

Run: `cd apps/web && ./scripts/design-audit.sh && npm run typecheck`

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/ui/tabs.tsx apps/web/src/components/ui/tabs.test.ts
git commit -m "feat(web): add the Tabs primitive per docs/design.md §5"
```

---

### Task 8: `Pill` primitive (rating / badge)

**Files:**
- Create: `apps/web/src/components/ui/pill.tsx`
- Test: `apps/web/src/components/ui/pill.test.ts`

**Interfaces:**
- Produces: `pillClasses(tone: PillTone): string` and `Pill({ tone, children }: { tone: PillTone; children: React.ReactNode })`. `PillTone = "success" | "neutral"`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/components/ui/pill.test.ts
import { describe, expect, it } from "vitest";
import { pillClasses } from "./pill";

describe("pillClasses", () => {
  it("success tone is the success fill with white text, fully rounded", () => {
    const c = pillClasses("success");
    expect(c).toContain("bg-success");
    expect(c).toContain("text-white");
    expect(c).toContain("rounded-full");
  });

  it("neutral tone uses the tinted surface, not the brand accent", () => {
    const c = pillClasses("neutral");
    expect(c).toContain("bg-accent-tint");
    expect(c).toContain("text-ink");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/web && npx vitest run src/components/ui/pill.test.ts`
Expected: FAIL — module `./pill` not found.

- [ ] **Step 3: Implement**

```tsx
// apps/web/src/components/ui/pill.tsx
export type PillTone = "success" | "neutral";

const TONE: Record<PillTone, string> = {
  success: "bg-success text-white",
  neutral: "bg-accent-tint text-ink",
};

export function pillClasses(tone: PillTone): string {
  return `inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE[tone]}`;
}

export function Pill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  return <span className={pillClasses(tone)}>{children}</span>;
}
```

Rating pills always render the star glyph and the number as `children` — the
component never carries meaning through colour alone (design.md §5 Rating
pill), so it takes no `icon` prop of its own; callers pass
`<Pill tone="success"><Star className="size-3" />4.8</Pill>`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/components/ui/pill.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Design-audit and typecheck**

Run: `cd apps/web && ./scripts/design-audit.sh && npm run typecheck`

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/ui/pill.tsx apps/web/src/components/ui/pill.test.ts
git commit -m "feat(web): add the Pill primitive per docs/design.md §5"
```

---

### Task 9: Phase 0 gate — full check + visual pass

**Files:** none (verification only).

- [ ] **Step 1: Full automated gate**

Run: `cd apps/web && npm run design && npm run lint && npm run typecheck && npm test`

Expected: `npm run design` still reports FAILs — Phase 0 doesn't touch the ~15
feature folders yet, that's Phase 1–3. Confirm the FAILs it reports are all
*outside* `components/ui/` and `app/layout.tsx`/`app/globals.css` (the files
this phase owns). Confirm `lint`, `typecheck`, and `test` are clean.

- [ ] **Step 2: Visual pass on the running dev server**

If not already running: `cd apps/web && npm run dev`. Then load
`http://localhost:3000/` and one app route (`http://localhost:3000/kundali`
or whichever renders without auth) and look at the actual page. Expected:
cream/white background, no navy — the still-unmigrated pages will show
mixed/broken styling (old hardcoded hex literals next to the new cream
background) and that is the expected, temporary state until Phase 1–3 land.
Confirm nothing 500s and no page is a blank white screen (that would mean a
missing token broke a render, not just a colour clash) — if one appears,
grep `apps/web/src/app/globals.css`'s removed variable names
(`--t-app`, `--m-glass`, etc.) across `src/` for a component that reads a
CSS variable directly (not through Tailwind) rather than a utility class.

- [ ] **Step 3: Report**

State which routes were checked and their status before moving to Phase 1.

---

## Phase 1 — Core app screens (delegate to Antigravity, parallel)

Each task below is one self-contained Antigravity delegation. Dispatch all
of Tasks 10a–10i in parallel (independent feature folders, no shared
files) via the `antigravity-delegate` subagent (Agent tool,
`subagent_type: "antigravity:antigravity-delegate"`), each with the prompt
template below filled in for its folder. After every delegation returns,
Claude — never Antigravity's own report — runs the verification steps.

**Shared delegation prompt template** (fill `<FOLDER>` and `<ROUTES>`):

> Re-skin `apps/web/src/features/<FOLDER>/**` and its route(s) at `<ROUTES>`
> to use the design system in `docs/design.md` and the primitives in
> `apps/web/src/components/ui/{button,card,input,tabs,pill}.tsx`. Replace:
> hardcoded hex colours, `rounded-[…]` arbitrary radii, `text-[…]` arbitrary
> font sizes, and legacy token classes (`bg-acc`, `bg-acc2`, `text-fg`,
> `text-mid`, `text-mut`, `text-dim`, `bg-panel`, `bg-inset`, `bg-app`,
> `border-brd`, `border-brd2`, `text-onacc`, `text-ink`/`text-ink2` on the
> old dark palette, any Tailwind built-in colour like `red-500`/`green-500`)
> with the new tokens (`cream`/`surface`/`line`/`line-strong`/`ink`/`muted`/
> `dim`/`accent`/`accent-strong`/`success`/`danger`/`star`) and the shared
> primitives wherever a plain `<button>`/card `<div>`/`<input>`/tab bar/
> rating badge is hand-rolled. Do not change any behavior, API calls, or
> component props consumed from outside this folder — this is a re-skin,
> not a refactor. When done, run
> `cd apps/web && ./scripts/design-audit.sh 2>&1 | grep -A2 "<FOLDER or file path>"`
> yourself and fix anything it still flags in files you touched before
> reporting done.

### Task 10a: Dashboard

**Files:** `apps/web/src/features/dashboard/**`, route `apps/web/src/app/(app)/dashboard/page.tsx`.

- [ ] **Step 1:** Dispatch the delegation (template above, `<FOLDER>=dashboard`, `<ROUTES>=app/(app)/dashboard/page.tsx`).
- [ ] **Step 2:** On return, run `cd apps/web && ./scripts/design-audit.sh 2>&1 | grep -B1 -A2 "features/dashboard\|app/(app)/dashboard"`. Expected: no hits.
- [ ] **Step 3:** Run `npm run lint && npm run typecheck`. Expected: clean.
- [ ] **Step 4:** Load `http://localhost:3000/dashboard` (auth as needed) and look at it. Expected: cream/white surfaces, saffron primary button, no leftover navy.
- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/dashboard apps/web/src/app/\(app\)/dashboard
git commit -m "style(web): re-skin dashboard to docs/design.md"
```

### Task 10b: Kundali (chart)

**Files:** `apps/web/src/features/kundali/**`, route `apps/web/src/app/(app)/kundali/page.tsx`.

- [ ] **Step 1:** Dispatch the delegation. In addition to the shared template, add: "This is the chart page — design.md §7 applies: tables scroll horizontally inside their own `overflow-x-auto`, never the page; header row `text-2xs` uppercase `dim` letter-spaced; row separators `border-line`, no zebra striping; row hover `bg-accent-wash`; degrees stay `D°MM'SS\"` with `tabular-nums`; dignity colour (`benefic`/`malefic`/`neutral-dignity`) is always paired with the dignity word, retrograde with the `℞` glyph, combust with a `C` badge — never colour alone."
- [ ] **Step 2:** On return, run `./scripts/design-audit.sh 2>&1 | grep -B1 -A2 "features/kundali\|app/(app)/kundali"`. Expected: no hits.
- [ ] **Step 3:** `npm run lint && npm run typecheck`.
- [ ] **Step 4:** Load `http://localhost:3000/kundali`, cast a chart, confirm the chart table scrolls horizontally inside its own container (not the page) and dignity/retrograde/combust still show their word/glyph/badge, not colour alone.
- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/kundali apps/web/src/app/\(app\)/kundali
git commit -m "style(web): re-skin kundali chart to docs/design.md"
```

### Task 10c: Reading / chat

**Files:** `apps/web/src/features/chat/**`, `apps/web/src/features/report/**`, routes `apps/web/src/app/(app)/reading/**`.

- [ ] **Step 1:** Dispatch the delegation for both `chat` and `report` folders together (they share the reading flow).
- [ ] **Step 2:** `./scripts/design-audit.sh 2>&1 | grep -B1 -A2 "features/chat\|features/report\|app/(app)/reading"`. Expected: no hits.
- [ ] **Step 3:** `npm run lint && npm run typecheck`.
- [ ] **Step 4:** Load `http://localhost:3000/reading`, send a message, confirm streamed markdown renders on the new cream surface with legible contrast.
- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/chat apps/web/src/features/report apps/web/src/app/\(app\)/reading
git commit -m "style(web): re-skin reading/chat to docs/design.md"
```

### Task 10d: Milan (compatibility)

**Files:** `apps/web/src/features/milan/**`, route `apps/web/src/app/(app)/milan/page.tsx`.

- [ ] **Step 1:** Dispatch the delegation — this folder had the heaviest arbitrary-radius/hex drift in the audit; call that out explicitly in the prompt so it isn't skimmed.
- [ ] **Step 2:** `./scripts/design-audit.sh 2>&1 | grep -B1 -A2 "features/milan\|app/(app)/milan"`. Expected: no hits.
- [ ] **Step 3:** `npm run lint && npm run typecheck`.
- [ ] **Step 4:** Load `http://localhost:3000/milan`, run a match, confirm charts/pickers render on the new tokens.
- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/milan apps/web/src/app/\(app\)/milan
git commit -m "style(web): re-skin milan to docs/design.md"
```

### Task 10e: Consultations

**Files:** `apps/web/src/features/consultations/**`, routes `apps/web/src/app/(app)/consultations/**`.

- [ ] **Step 1:** Dispatch the delegation.
- [ ] **Step 2:** `./scripts/design-audit.sh 2>&1 | grep -B1 -A2 "features/consultations\|app/(app)/consultations"`. Expected: no hits.
- [ ] **Step 3:** `npm run lint && npm run typecheck`.
- [ ] **Step 4:** Load `http://localhost:3000/consultations` and a `/consultations/[id]` detail page.
- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/consultations apps/web/src/app/\(app\)/consultations
git commit -m "style(web): re-skin consultations to docs/design.md"
```

### Task 10f: Practitioners

**Files:** `apps/web/src/features/practitioners/**`, routes `apps/web/src/app/(app)/practitioners/**`.

- [ ] **Step 1:** Dispatch the delegation. Add: list rows follow design.md §5 List rows spec exactly — 64×64 thumbnail radius `md`, name `lg`/600, discipline `sm`/`muted`, metadata `xs`/`dim`, rating `Pill`, price amount in `ink`/600 with unit in `muted`.
- [ ] **Step 2:** `./scripts/design-audit.sh 2>&1 | grep -B1 -A2 "features/practitioners\|app/(app)/practitioners"`. Expected: no hits.
- [ ] **Step 3:** `npm run lint && npm run typecheck`.
- [ ] **Step 4:** Load `http://localhost:3000/practitioners/<id>` and the apply/me routes.
- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/practitioners apps/web/src/app/\(app\)/practitioners
git commit -m "style(web): re-skin practitioners to docs/design.md"
```

### Task 10g: Account, settings, notifications, profile

**Files:** `apps/web/src/features/account/**`, routes `apps/web/src/app/(app)/{profile,settings,notifications}/page.tsx`.

- [ ] **Step 1:** Dispatch the delegation covering all three routes together (they share `features/account`).
- [ ] **Step 2:** `./scripts/design-audit.sh 2>&1 | grep -B1 -A2 "features/account\|app/(app)/profile\|app/(app)/settings\|app/(app)/notifications"`. Expected: no hits.
- [ ] **Step 3:** `npm run lint && npm run typecheck`.
- [ ] **Step 4:** Load each of the three routes.
- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/account apps/web/src/app/\(app\)/profile apps/web/src/app/\(app\)/settings apps/web/src/app/\(app\)/notifications
git commit -m "style(web): re-skin account/settings/notifications to docs/design.md"
```

### Task 10h: Auth (login) and voice

**Files:** `apps/web/src/features/auth/components/**` (styling only, not the store/hooks), `apps/web/src/features/voice/**`, route `apps/web/src/app/(app)/login/page.tsx`.

- [ ] **Step 1:** Dispatch the delegation. The login page's audit hits were the worst in the repo (`bg-[#181B27]`, `bg-[#111420]`, arbitrary `rounded-[14px]`) — call that out. For `voice`, keep the existing `animate-pulse-glow`/`animate-rotate-slow`/`animate-equalizer-*` keyframes (Task 1 left them in `globals.css`); only replace colour/radius/size literals, not the animation classes.
- [ ] **Step 2:** `./scripts/design-audit.sh 2>&1 | grep -B1 -A2 "features/auth\|features/voice\|app/(app)/login"`. Expected: no hits.
- [ ] **Step 3:** `npm run lint && npm run typecheck`.
- [ ] **Step 4:** Load `http://localhost:3000/login`, confirm the Google button and form render on the new tokens; open the voice workspace and confirm the orb still animates.
- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/auth/components apps/web/src/features/voice apps/web/src/app/\(app\)/login
git commit -m "style(web): re-skin login and voice workspace to docs/design.md"
```

### Task 10i: Vault and studio-viewer components used inside the app shell

**Files:** `apps/web/src/features/vault/**`.

- [ ] **Step 1:** Dispatch the delegation.
- [ ] **Step 2:** `./scripts/design-audit.sh 2>&1 | grep -B1 -A2 "features/vault"`. Expected: no hits.
- [ ] **Step 3:** `npm run lint && npm run typecheck`.
- [ ] **Step 4:** Load whichever route renders the vault feature (check `grep -rn "vault" apps/web/src/app` if not obvious) and look at it.
- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/vault
git commit -m "style(web): re-skin vault to docs/design.md"
```

---

## Phase 2 — Marketing site (delegate to Antigravity)

### Task 11: Marketing routes, nav/footer, and the marketing-only CSS block

**Files:** `apps/web/src/app/(marketing)/**`, `apps/web/src/features/marketing/**`, `apps/web/src/components/layout/main-navbar.tsx`, `apps/web/src/components/layout/main-footer.tsx`, `apps/web/src/components/ui/site-header.tsx`, the marketing block at the bottom of `apps/web/src/app/globals.css` (`.reveal`, `.grain`, `.glass`, `.navpanel`, `.cell`/`.cellt`, `details.faq`).

- [ ] **Step 1:** Dispatch one delegation covering all of the above together (they share the hero and header). Prompt: re-skin to `docs/design.md`, replace the hardcoded hex in the `globals.css` marketing block (`#E5A93C`, `#F3C766`, `#F8FAFC`, the `--m-glass` reference) with the new tokens, replace hand-rolled buttons/cards with the shared primitives, keep the hero's SVG chart and reveal/parallax motion (design.md §8 — motion explains, doesn't decorate, so keep timing but recolor). Do not change routing, copy, or SEO metadata.
- [ ] **Step 2:** Run `cd apps/web && ./scripts/design-audit.sh 2>&1 | grep -B1 -A2 "app/(marketing)\|features/marketing\|main-navbar\|main-footer\|site-header"`. Expected: no hits.
- [ ] **Step 3:** `npm run lint && npm run typecheck`.
- [ ] **Step 4:** Load `http://localhost:3000/`, `/rasifal`, `/rasifal/<a sign>`, `/patro`, `/privacy`, `/terms` and look at each.
- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\(marketing\) apps/web/src/features/marketing apps/web/src/components/layout apps/web/src/components/ui/site-header.tsx apps/web/src/app/globals.css
git commit -m "style(web): re-skin marketing site to docs/design.md"
```

---

## Phase 3 — Admin/studio (delegate to Antigravity)

### Task 12: Admin and studio surfaces

**Files:** `apps/web/src/app/(app)/admin/**`, `apps/web/src/app/studio/rasifal/page.tsx`, `apps/web/src/features/studio/**`, `apps/web/src/features/admin/**`.

- [ ] **Step 1:** Dispatch one delegation covering all of the above (internal-only, lowest priority — a straightforward token/primitive swap, no UX redesign needed here).
- [ ] **Step 2:** `./scripts/design-audit.sh 2>&1 | grep -B1 -A2 "app/(app)/admin\|app/studio\|features/studio\|features/admin"`. Expected: no hits.
- [ ] **Step 3:** `npm run lint && npm run typecheck`.
- [ ] **Step 4:** Load `http://localhost:3000/admin`, `/admin/practitioners`, `/admin/studio`, `/studio/rasifal` (with `STUDIO_KEY` set, per `apps/web/.env.local`).
- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\(app\)/admin apps/web/src/app/studio apps/web/src/features/studio apps/web/src/features/admin
git commit -m "style(web): re-skin admin/studio to docs/design.md"
```

---

## Final gate

### Task 13: Whole-repo verification

**Files:** none.

- [ ] **Step 1:** Run `cd apps/web && npm run design && npm run lint && npm run typecheck && npm test`. Expected: **all clean** — this is the first point where `design-audit.sh` should report zero FAILs across the whole `src/` tree.
- [ ] **Step 2:** With `npm run dev` running, load every route listed in Phase 0 Task 9, Phase 1 Tasks 10a–10i, Phase 2 Task 11, and Phase 3 Task 12 — the full route list — once more, back to back, and confirm none regressed after later phases' commits.
- [ ] **Step 3:** Report the final `design-audit.sh` output and route list to the user as the completion evidence — not just "done".
