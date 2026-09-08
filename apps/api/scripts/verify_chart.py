#!/usr/bin/env python
"""Print a chart for eyeball-diffing against a reference tool, or snapshot it
as a golden fixture.

Initial correctness cannot come from this engine — that would be circular.
It comes from a human comparing this output against Jagannatha Hora, AstroSage,
or an astrologer. Once confirmed, `--write` freezes it as a regression test.

    # look at a chart
    python scripts/verify_chart.py --date 1975-06-15 --time 08:30 \
        --tz Asia/Kathmandu --lat 27.7172 --lon 85.3240

    # replay a fixture's birth data (to compare before/after an engine change)
    python scripts/verify_chart.py --fixture nepal_pre_1986

    # freeze it, once a human has confirmed the values
    python scripts/verify_chart.py --fixture nepal_pre_1986 --write \
        --verified-against "Jagannatha Hora 8.0"
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from app.astrology_core import build_chart  # noqa: E402
from app.astrology_core.models import BirthMoment  # noqa: E402

FIXTURES = ROOT / "tests" / "astrology" / "fixtures"


def render(chart) -> str:
    L: list[str] = []
    b = chart.birth
    L.append(f"Birth    {b.local_datetime:%Y-%m-%d %H:%M} {b.tz_name} "
             f"({b.latitude:+.4f}, {b.longitude:+.4f})  accuracy={b.time_accuracy}")
    L.append(f"JD (UT)  {chart.julian_day:.6f}")
    L.append(f"Ayanamsa {chart.ayanamsa_name} = {chart.ayanamsa_value:.6f}")
    L.append(f"Lagna    {chart.lagna_sign} {_dms(chart.lagna_degree)}")
    L.append(f"Engine   v{chart.engine_version}")
    L.append("")
    L.append(f"{'Planet':<8} {'Sign':<12} {'Deg':>10}  {'Hs':>2}  "
             f"{'Nakshatra':<18} {'Pd':>2}  {'Lord':<8} {'Dignity':<12} Flags")
    L.append("-" * 100)
    for p in chart.planets:
        flags = " ".join(f for f, on in (("R", p.retrograde), ("C", p.combust)) if on)
        L.append(
            f"{p.name:<8} {p.sign:<12} {_dms(p.degree_in_sign):>10}  {p.house:>2}  "
            f"{p.nakshatra.name:<18} {p.nakshatra.pada:>2}  {p.nakshatra.lord:<8} "
            f"{(p.dignity or '-'):<12} {flags}"
        )
    L.append("")
    L.append("Houses (whole sign)")
    for h in chart.houses:
        occ = ", ".join(h.occupants) or "-"
        L.append(f"  {h.number:>2}  {h.sign:<12} lord {h.lord:<8}  {occ}")
    L.append("")
    d = chart.dasha
    L.append(f"Vimshottari  birth lord {d.birth_lord}, balance {d.balance_years:.4f} years")
    for maha in d.periods[:4]:
        L.append(f"  {maha.lord:<8} {maha.start}  ->  {maha.end}")
        for antar in maha.children[:3]:
            L.append(f"      {antar.lord:<8} {antar.start}  ->  {antar.end}")
    return "\n".join(L)


def _dms(deg: float) -> str:
    d = int(deg)
    m_full = (deg - d) * 60
    m = int(m_full)
    s = int(round((m_full - m) * 60))
    if s == 60:
        s, m = 0, m + 1
    if m == 60:
        m, d = 0, d + 1
    return f"{d:2d}°{m:02d}'{s:02d}\""


def load_fixture(name: str) -> dict:
    path = FIXTURES / f"{name}.json"
    if not path.exists():
        available = sorted(p.stem for p in FIXTURES.glob("*.json"))
        raise SystemExit(f"no fixture {name!r}. available: {', '.join(available)}")
    return json.loads(path.read_text())


def birth_from(spec: dict) -> BirthMoment:
    return BirthMoment(
        local_datetime=datetime.fromisoformat(f"{spec['date']}T{spec['time']}"),
        tz_name=spec["tz_name"],
        latitude=spec["latitude"],
        longitude=spec["longitude"],
        time_accuracy=spec.get("time_accuracy", "exact"),
    )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--fixture")
    ap.add_argument("--date")
    ap.add_argument("--time")
    ap.add_argument("--tz")
    ap.add_argument("--lat", type=float)
    ap.add_argument("--lon", type=float)
    ap.add_argument("--write", action="store_true",
                    help="freeze current output as this fixture's expected values")
    ap.add_argument("--verified-against",
                    help="reference tool a human used to confirm these values")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    if args.fixture:
        fixture = load_fixture(args.fixture)
        birth = birth_from(fixture["birth"])
    elif args.date and args.time and args.tz and args.lat is not None and args.lon is not None:
        fixture = None
        birth = birth_from({"date": args.date, "time": args.time, "tz_name": args.tz,
                            "latitude": args.lat, "longitude": args.lon})
    else:
        ap.error("give --fixture NAME, or all of --date --time --tz --lat --lon")

    # A fixture is verified against a specific system; keep printing and
    # freezing in that one, whatever the product default is.
    chart = build_chart(birth, fixture.get("siddhanta", "drik"))
    print(json.dumps(chart.to_dict(), indent=2, sort_keys=True) if args.json else render(chart))

    if args.write:
        if not args.fixture:
            raise SystemExit("--write needs --fixture")
        if not args.verified_against:
            raise SystemExit(
                "--write needs --verified-against.\n"
                "Freezing unverified output makes a regression test that locks in a bug.\n"
                "Compare the chart above against a reference tool first, then re-run with\n"
                '  --verified-against "Jagannatha Hora 8.0"'
            )
        fixture["expected"] = chart.to_dict()
        fixture["verified_against"] = args.verified_against
        path = FIXTURES / f"{args.fixture}.json"
        path.write_text(json.dumps(fixture, indent=2, sort_keys=True) + "\n")
        print(f"\nwrote {path.relative_to(ROOT)}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
