# Golden chart fixtures

Each file is one birth moment plus the full chart this engine is expected to
produce for it. `pytest` asserts reproduction on every run.

**A fixture's `expected` block is only meaningful once a human has confirmed it
against an independent implementation.** Freezing this engine's own output
without that check produces a regression test that faithfully locks in a bug.
That is why `verified_against` exists and why `verify_chart.py --write` refuses
to run without it.

### What counts as independent, here

A **kundali cast by hand by a Nepali jyotish**. Nothing else really does.

AstroSage and AstroTalk compute **drik**; Nepali kundalis are cast in **सूर्य
सिद्धान्त**, and the two put the Moon about fifteen arcminutes apart — enough
to name a different nakshatra, and with it a different dasha lord and a
different naming syllable. So agreeing with Indian software tells you nothing
about whether a jyotish in Kathmandu would agree, which is the only question
this product has to answer. `nepal_hand_cast_2002` was verified against
AstroTalk once; it is now verified against the guru's chart for the same
birth, which is a stronger reference for a weaker-looking reason.

Each fixture declares its `siddhanta` and is built and frozen in that one,
whatever the engine default is. Verify a fixture in the system it was
confirmed in.

### The other kind, for the charts nobody will ever cast

That rule is right for a real birth and impossible for the rest of these
files. `high_latitude` is Reykjavik at 64N, `india_pre_ist` is a 1900 birth
predating IST, `india_wartime_dst` is 1942 — and `nepal_pre_1986` and
`nepal_post_1986` are the *same date and time* in two eras, which is the whole
point of them. None is a real birth. They are synthetic probes, each written
to exercise one path, and no jyotish will ever cast one. Demanding a hand-cast
kundali for them is demanding a reference that cannot exist, which leaves the
Phase 0 gate permanently red for a reason unrelated to whether the engine
works.

So they are confirmed the other way available: computed a second time by
`tests/astrology/independent.py`, which shares no code with the engine. It
takes the UTC offset from the IANA database via `zoneinfo`, the Julian Day
from Meeus ch. 7, and the ascendant from spherical trigonometry via ch. 12 and
22 — never calling `swe.houses_ex`. `test_independent.py` holds every fixture
to it on every run, and the two agree within a quarter of an arcminute.

Be exact about what that buys. It confirms the **frame**: the instant, the
meridian, the rising degree — which is the part that fails silently, since a
historical offset taken from memory rotates the whole chart while every
derived value stays perfectly self-consistent. It does **not** confirm
planetary longitudes; reproducing those means reimplementing an ephemeris,
which this project deliberately does not do. Those rest on `test_invariants.py`
and on the hand-cast graha sphuta table in `test_textbook.py`.

A fixture's `verified_against` says which of the two it got, and a synthetic
probe says so in as many words. Do not quietly promote one to the other.

## Verifying one

```bash
make chart FIXTURE=nepal_pre_1986          # print it
# compare against Jagannatha Hora / AstroSage / an astrologer
uv run python scripts/verify_chart.py --fixture nepal_pre_1986 \
    --write --verified-against "Jagannatha Hora 8.0"
```

Check the ascendant sign and degree first — if that is right, the house
structure is right, and most other errors become visible. Then Moon's
nakshatra and pada (the dasha depends entirely on it), then the mahadasha
start dates.

Reference tools must be set to **Lahiri ayanamsa, whole-sign houses, mean node**
or they will legitimately disagree with us. See `docs/astrology-methodology.md`.

## Still to add

These need a chart computed before their birth data can be pinned down — find
each with `make chart`, then add the fixture:

| Case | Catches | How to find one |
|---|---|---|
| Lagna within 2' of a sign cusp | Ascendant rounding | Bisect the birth time until `lagna_degree` is near 0° or 30° |
| Moon at 0°00' of a nakshatra | Dasha balance = full period | Bisect until `balance_years` ≈ the lord's full years |
| Moon at 13°19' of a nakshatra | Dasha balance ≈ 0 | Bisect until `balance_years` ≈ 0 |
| Known Kaal Sarp chart | Node-span logic (Phase 1) | All seven grahas between Rahu and Ketu |
| Known *partial* Kaal Sarp | The partial branch (Phase 1) | Exactly one graha outside the span |
| Mangal dosha with cancellation | Cancellation rules (Phase 1) | Mars in 1/2/4/7/8/12 *and* in Aries, Scorpio, or Capricorn |

## `textbook/` — a different kind of check

`textbook/kapoor_2011.json` is not a chart. It holds the worked examples
printed in Deepak Kapoor's *Astronomy and Mathematical Astrology* (8th English
edition, ISBN 81-901047-3-X), the Bharatiya Vidya Bhawan course text, and
`test_textbook.py` runs them against the derived quantities: nakshatra, tithi,
karana, yoga, the Vimshottari balance and its dates.

Two reasons it is kept apart from the chart fixtures.

**It does not need verifying.** These values were set in type by a published
author before this repository existed, and the fixture cites the page each one
is on. That is the independent implementation the files above are still
waiting for — which is why the `verified_against` gate does not apply here, and
why the `*.json` glob is deliberately not recursive.

**It does not rest on the ephemeris.** Every example takes a longitude and
returns a derived value, so a failure here is our arithmetic and nothing else.
A chart fixture that breaks could be either.

Nothing goes in this file that the page does not state. One example gives a
nakshatra and its lord and no pada, so no pada is asserted for it.
