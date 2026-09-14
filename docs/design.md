# Design System

The visual language for every surface: web (`apps/web`), mobile
(`apps/mobile`), and anything generated for print or PDF.

Derived from the product mockups — warm saffron on cream, rounded cards, 3D
category icons, a marigold primary action. **Every colour value below has been
measured against WCAG AA rather than sampled from a screenshot**, and where the
mockup value failed, the fix and the reason are recorded. See §2.1.

**Related:** [`architecture.md`](architecture.md) §8–9 for where components
live; [`mobile.md`](mobile.md) for Flutter layering.

---

## 1. Principles

**Warm, not mystical-kitsch.** Saffron and marigold are the colours of the
tradition, not purple gradients and starfields. The palette is drawn from
ritual, so it reads as respectful rather than fantastical.

**Calm surfaces, one loud action.** Cream and white carry the content; a single
saffron action tells you what to do next. If two things on a screen are
competing to be the primary action, one of them is wrong.

**Data must stay legible.** This product's core screen is a chart with 9 grahas,
12 houses, 16 vargas and a 120-year timeline. Decoration never wins against
scanability — see §7 on tables.

**Say less, confidently.** No exclamation marks, no "unlock your destiny". The
tone is a knowledgeable person being straight with you (spec §12–13).

---

## 2. Colour

### 2.1 Why these are not the mockup's raw values

The mockup palette is beautiful and, as drawn, **fails accessibility in three
places**. Measured:

| Mockup pairing | Ratio | AA needs | |
|---|---:|---:|---|
| White text on saffron `#E8931F` | **2.43** | 4.5 | ✗ |
| Saffron `#E8931F` as text on cream | **2.36** | 4.5 | ✗ |
| White on rating green `#4CAF50` | **2.78** | 4.5 | ✗ |
| White on red CTA `#E23A2E` | **4.30** | 4.5 | ✗ |
| Ink on saffron `#E8931F` | 6.90 | 4.5 | ✓ |

`#E8931F` sits in the mid-tone trap: too light to carry white text, too dark to
read as text on cream. The fix is not to abandon the hue — it is to keep the hue
and use a **different step of the same ramp** depending on the job. The bright
saffron survives exactly where the mockup uses it best: as a large fill behind
**dark** text and behind illustration.

### 2.2 Saffron ramp

Hue preserved from the mockup; lightness stepped. "on cream" is the ratio as
text; "white on it" is the ratio when used as a fill.

| Token | Hex | on cream | white on it | Use for |
|---|---|---:|---:|---|
| `saffron-50` | `#FDF4E7` | 1.06 | — | Tinted panel backgrounds |
| `saffron-100` | `#FAE6C9` | 1.18 | — | Category card fill, chips |
| `saffron-200` | `#F5D09A` | 1.42 | — | Hover on tinted surfaces |
| `saffron-300` | `#F0B866` | 1.73 | — | Illustration, decorative only |
| `saffron-400` | `#ECA23C` | 2.08 | — | Illustration, decorative only |
| **`saffron-500`** | **`#E8931F`** | 2.36 | 2.43 | **Brand fill — dark text only.** Hero banner, active nav icon, chart accents |
| `saffron-600` | `#C97A12` | 3.25 | 3.35 | Borders, focus rings, large text ≥24px |
| **`saffron-700`** | **`#A66916`** | 4.38 | **4.51** | **Primary button fill with white text.** Also link text |
| `saffron-800` | `#824F11` | 6.63 | 6.83 | Body text in saffron, pressed states |
| `saffron-900` | `#5C380C` | 10.06 | 10.37 | Headings in saffron |

**The two that matter:** `saffron-500` is the brand. `saffron-700` is the
button. Using 500 as a button with white text is the single easiest way to ship
an inaccessible screen.

### 2.3 Neutrals

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `cream` | `#FFFBF6` | App background | — |
| `surface` | `#FFFFFF` | Cards, sheets, list rows | — |
| `line` | `#F0EAE1` | Hairline dividers | — |
| `line-strong` | `#E3DACD` | Card borders, input borders | — |
| `ink` | `#1F1D1B` | Primary text | 16.3 on cream · 16.8 on white |
| `muted` | `#6E6862` | Secondary text, labels | 5.3 on cream · 5.5 on white |
| `dim` | `#7A736C` | Helper text, timestamps | 4.5 on cream · 4.7 on white |

`dim` is the **lightest permitted text colour**. Anything lighter — including
`muted` at reduced opacity — fails AA. Do not use opacity modifiers on text
tokens; add a token instead.

### 2.4 Status

| Token | Hex | Use | White on it |
|---|---|---|---:|
| `success` | `#3A863D` | Rating pills, verified badges | 4.51 |
| `success-tint` | `#EAF4EA` | Success panel background | — |
| `danger` | `#DC382D` | Destructive actions, errors | 4.52 |
| `danger-tint` | `#FDEDEC` | Error panel background | — |
| `star` | `#F5A623` | Rating stars **only** — never text | — |

The mockup's rating pill is `#4CAF50` with white text at 2.78. `success` above
is the same green darkened until white passes. The pill looks nearly identical
and is now readable.

### 2.5 Astrology semantics

Chart data needs meaning-bearing colour, and colour must never be the only
carrier (WCAG 1.4.1) — always pair with a letter or label.

| Token | Hex | Meaning | Always paired with |
|---|---|---|---|
| `benefic` | `#2F7D4F` | Exalted, own sign, moolatrikona | the dignity word |
| `malefic` | `#B4342A` | Debilitated, enemy sign | the dignity word |
| `neutral-dignity` | `#6E6862` | Friend, neutral | the dignity word |
| `retrograde` | `#8A5406` | Retrograde motion | the `℞` glyph |
| `combust` | `#7A736C` | Combust | the `C` badge |

---

## 3. Typography

**Display — Poppins.** Geometric, rounded, warm; matches the mockup's headings
and carries Devanagari companions well for the Nepali and Hindi releases.

**Body — Inter.** The clearest sans at 12–14px, which is what a chart table
lives at.

Both self-hosted through `next/font` (web) and bundled (Flutter). Never a CDN
link: it costs a third-party request and risks invisible text while loading.

### Scale

One ramp. Anything off it makes a data-dense page feel unconsidered.

| Token | px | Line height | Use |
|---|---:|---|---|
| `2xs` | 11 | 1.4 | Uppercase eyebrows, table headers. **Never body copy.** |
| `xs` | 12 | 1.5 | Helper text, captions, chart glyph labels |
| `sm` | 14 | 1.5 | Table cells, list-row secondary text |
| `base` | 16 | 1.6 | Body copy — the default |
| `lg` | 18 | 1.5 | Card titles, list-row names |
| `xl` | 24 | 1.3 | Section headings |
| `2xl` | 32 | 1.2 | Page titles |
| `3xl` | 44 | 1.1 | Landing hero only |

**12px is the body floor.** 11px is permitted only for uppercase labels with
letter-spacing, where the caps height keeps it legible.

Weights: 400 body · 500 emphasis · 600 headings · 700 hero. Never 300 —
it fails legibility at small sizes on light backgrounds.

Numerals in tables and charts use `tabular-nums` so degrees and dates align
column-to-column.

---

## 4. Space, radius, elevation

**Space** — a 4px base, used as 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 64 · 96.
Section padding is 24 on mobile, 48+ on desktop.

**Radius**

| Token | px | Use |
|---|---:|---|
| `sm` | 6 | Chips, badges, small inputs |
| `md` | 10 | Buttons, inputs, list thumbnails |
| `lg` | 14 | Cards, category tiles |
| `xl` | 20 | Hero banner, bottom sheets |
| `full` | 9999 | Rating pills, avatars, nav indicator |

**Corners are rounded and soft.** Warm, friendly curvature that feels approachable
and modern while keeping data legible. `full` survives where roundness carries
meaning (avatars, rating pills), not as the primary container geometry.

**Elevation.** The mockups are nearly flat — depth comes from the cream/white
contrast, not from shadows. Use sparingly:

- `flat` — no shadow. Default for cards on cream; a hairline `line-strong` border instead.
- `raised` — `0 1px 2px rgba(31,29,27,.04), 0 4px 12px rgba(31,29,27,.05)`. Sheets, popovers, the place dropdown.
- `overlay` — `0 8px 32px rgba(31,29,27,.12)`. Modals only.

Never a black shadow above 12% on cream — it turns muddy grey.

---

## 5. Components

### Buttons

| Variant | Fill | Text | Use |
|---|---|---|---|
| Primary | `saffron-700` | white | The one action on the screen |
| Secondary | `surface` + `line-strong` border | `ink` | Alternative actions |
| Ghost | transparent | `saffron-800` | Tertiary, inline |
| Danger | `danger` | white | Destructive, always confirmed |

Height 48 (mobile) / 44 (desktop), radius `md`, weight 500. Minimum touch
target **44×44** including padding. Disabled = `line-strong` fill, `dim`
text, plus removed pointer events — never opacity alone (still looks
tappable), and never a faded brand fill either: fading `accent-strong`
keeps its own text-vs-fill contrast but blends the whole button into the
page, which reads as illegible rather than disabled.

### Cards

`surface` fill, radius `lg`, `line-strong` hairline, `flat` elevation, 16–20
padding. Category tiles use `saffron-100` fill with `ink` text — the mockup's
peach — with a 3D icon above a centred label.

### List rows (astrologer / conversation)

64×64 thumbnail at radius `md` · name at `lg`/600 · discipline at `sm`/`muted`
· metadata at `xs`/`dim` · rating pill right-aligned · price with the amount in
`ink`/600 and the unit in `muted`. Rows separated by `line`, full-bleed
horizontally, 16 vertical padding. Whole row is one tap target.

### Rating pill

`success` fill, white text, radius `full`, star glyph then the number. Never a
bare colour — the number is always present.

### Tabs

Underline, not pills: 2px `saffron-500` under the active label, `ink`/500 for
active, `muted`/400 for inactive. Underline animates 200ms.

### Bottom navigation (mobile)

`surface` fill, `line` top border, 4–5 destinations maximum. Active is
`saffron-500` icon **and** label — never colour alone. Respects the safe area.

### Inputs

44 minimum height, radius `md`, `line-strong` border, `surface` fill. Label
always visible above the field — never placeholder-as-label. Errors sit
**below the field they belong to**, in `danger`, never collected at the top.

---

## 6. Iconography

Stroked SVG at 1.5–1.8px, 20/24px on a 24px grid — Lucide or Heroicons.
**Never emoji as icons**: they render differently per platform and read as
clip-art.

The 3D category illustrations in the mockups are a separate asset class — raster
or Lottie, used only in the category grid and hero. They are illustration, not
iconography, and must never be mixed into a control.

---

## 7. Data display

The chart page is the hardest surface in the product.

- Tables scroll horizontally inside their own `overflow-x-auto` container. The page never scrolls sideways.
- Header row at `2xs` uppercase, `dim`, letter-spaced.
- Row separators `line`, no zebra striping — it fights the warm ground.
- Row hover `saffron-50`.
- Degrees always `D°MM'SS"`, tabular figures. That is how every reference tool prints a chart, and it makes ours checkable against them.
- The North Indian chart is drawn from tokens, never hardcoded hex, so it follows the theme.
- Long lists (16 vargas, 9 mahadashas) render 4–6 rows and offer **View more** rather than hiding behind tabs.

---

## 8. Motion

150–250ms, `cubic-bezier(.2,.8,.2,1)`. Motion explains a spatial change; it
never decorates.

Transitions: colour and opacity freely, `transform` for movement. **Never
animate `width`/`height`** — it forces layout every frame.

`prefers-reduced-motion: reduce` collapses everything to 0.01ms. Non-negotiable.

---

## 9. Accessibility — the non-negotiables

1. **4.5:1** for body text, **3:1** for large text (≥24px or ≥18.66px bold) and for UI boundaries.
2. **Never colour alone.** Dignity carries its word; retrograde carries `℞`; active nav carries a label.
3. **Visible focus** on every interactive element — `2px saffron-600`, 2px offset. Removing focus rings is the most common regression there is.
4. **44×44** minimum touch target, 8px minimum between targets.
5. **Labels above inputs**, errors below the field.
6. **Sequential headings**, one `h1` per page.
7. **Respect reduced motion** and system text scaling; never truncate on scale-up.

Contrast is measured, not eyeballed. `apps/web` has a `pnpm/npm` check for this;
extend it rather than trusting a screenshot.

---

## 10. Tokens in code

Names are **semantic** — `surface`, `fg`, `accent` — not literal. A token named
`ink` holding white is a lie the next person has to decode, and semantic names
make a theme swap a value change rather than a rename across every file.

```css
/* apps/web/src/app/globals.css */
@theme {
  --color-cream: #fffbf6;
  --color-surface: #ffffff;
  --color-line: #f0eae1;
  --color-line-strong: #e3dacd;

  --color-fg: #1f1d1b;
  --color-muted: #6e6862;
  --color-dim: #7a736c;

  --color-accent: #e8931f;        /* saffron-500 — fill, dark text on top */
  --color-accent-strong: #a66916; /* saffron-700 — button fill, white text */
  --color-accent-wash: #fdf4e7;
  --color-accent-tint: #fae6c9;

  --color-success: #3a863d;
  --color-danger: #dc382d;
  --color-star: #f5a623;
}
```

Flutter mirrors these in `apps/mobile/lib/app/theme/`, generated from the same
values so the two clients cannot drift.

---

## 11. Changing this document

A palette or scale change ripples into every screen on two clients. Before
editing:

1. **Measure** the new pairing. Record the ratio in the table.
2. If a value fails, adjust the **step**, not the rule — the ramp exists so the
   hue survives.
3. Update `globals.css` and the Flutter theme together.
4. Note what changed and why, the way §2.1 records why the mockup's raw values
   were not used directly.
