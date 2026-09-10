"""The patro: a day as a Nepali calendar prints it.

A panchang column is not a snapshot. It says which tithi is running *at
sunrise* — the Vedic day begins there, not at midnight — and then at what
clock time that tithi gives way to the next. This computes both: the element
at sunrise, and the moment its angle crosses the next boundary, found by
bisection against the ephemeris rather than by assuming the Moon moves at a
constant rate (it does not; it runs between about 11 and 15 degrees a day).

No calendar arithmetic lives here. Bikram Sambat is a published table, not
something the sky knows, and it stays with the client that already owns it.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta

from app.astrology_core import ephemeris
from app.astrology_core.constants import SIGNS
from app.astrology_core.nakshatra import nakshatra_at
from app.astrology_core.panchang import karana, nitya_yoga, tithi

KATHMANDU = (27.7172, 85.3240, "Asia/Kathmandu")

#: Widths of the four Moon-driven cycles, in degrees of their own angle.
_WIDTH = {"tithi": 12.0, "karana": 6.0, "nakshatra": 360.0 / 27.0, "yoga": 360.0 / 27.0}


@dataclass(frozen=True, slots=True)
class Element:
    """One panchang element: what is running, and when it ends."""

    name: str
    ends_at: datetime | None       # local time; None if it runs past the window
    next_name: str | None


@dataclass(frozen=True, slots=True)
class GrahaPlace:
    name: str
    sign: str
    degree_in_sign: float
    retrograde: bool


@dataclass(frozen=True, slots=True)
class PatroDay:
    """A single day of the calendar."""

    on: date
    weekday: str
    sunrise: datetime | None
    sunset: datetime | None
    moonrise: datetime | None
    moonset: datetime | None
    paksha: str
    tithi: Element
    nakshatra: Element
    yoga: Element
    karana: Element
    moon_sign: str
    sun_sign: str
    ayana: str
    ritu: str
    masa: str
    festivals: list[str]
    grahas: list[GrahaPlace]


def _last_amavasya(before: date, tz_name: str) -> date:
    """The date of the new moon at or before `before`.

    Walks back a day at a time: a lunation is under thirty-one days, so this
    terminates quickly and needs no root-finding.
    """
    for back in range(0, 32):
        d = before - timedelta(back)
        noon = datetime.combine(d, datetime.min.time()).replace(hour=12)
        jd = ephemeris.julian_day(noon, tz_name)
        sun, moon, _, _ = _angles(jd)
        elong = (moon - sun) % 360.0
        # Within one tithi of conjunction, on the waxing side.
        if elong < 12.0:
            return d
    return before


def lunar_month(on: date, paksha: str, tz_name: str, tithi_name: str = "") -> str:
    """The purnimanta lunar month a day belongs to.

    Festivals are fixed to lunar months, not solar ones. The amanta month is
    named for the solar month containing its new moon; Nepal and north India
    read purnimanta, where the dark fortnight already belongs to the *next*
    month's name — which is why Krishna Janmashtami falls in Bhadra's krishna
    paksha while the Sun is still in Shrawan's sign.
    """
    # A day still running Amavasya at sunrise closes the *previous* lunation;
    # the conjunction later that morning opens the next one. Naming it from
    # that morning's new moon pushed every amavasya festival a month forward.
    search_from = on - timedelta(1) if tithi_name == "Amavasya" else on
    amavasya = _last_amavasya(search_from, tz_name)
    noon = datetime.combine(amavasya, datetime.min.time()).replace(hour=12)
    jd = ephemeris.julian_day(noon, tz_name)
    sun, _, _, _ = _angles(jd)
    amanta = _MASA[int(sun // 30)]
    if paksha == "Shukla":
        return amanta
    return _MASA[(_MASA.index(amanta) + 1) % 12]


# --- festivals -------------------------------------------------------------
#
# Keyed by the lunar month, the paksha and the tithi, which is how a patro
# actually fixes them: Janai Purnima is not "a date in August", it is the full
# moon of Shrawan. Only the tithi-fixed observances are listed. The movable
# and regionally-set ones — Dashain's ghatasthapana varies by almanac, Losar
# follows a different calendar entirely — are deliberately absent rather than
# guessed at.
FESTIVALS: dict[tuple[str, str, str], str] = {
    ("Shrawan", "Shukla", "Panchami"): "नाग पञ्चमी",
    ("Shrawan", "Shukla", "Purnima"): "जनै पूर्णिमा",
    ("Bhadra", "Krishna", "Pratipada"): "गाई जात्रा",
    ("Bhadra", "Krishna", "Ashtami"): "कृष्ण जन्माष्टमी",
    ("Bhadra", "Krishna", "Amavasya"): "कुशे औंसी (गोकर्ण औंसी)",
    ("Bhadra", "Shukla", "Tritiya"): "हरितालिका तीज",
    ("Bhadra", "Shukla", "Panchami"): "ऋषि पञ्चमी",
    ("Ashwin", "Shukla", "Dashami"): "विजया दशमी",
    ("Kartik", "Krishna", "Trayodashi"): "धनतेरस",
    ("Kartik", "Krishna", "Amavasya"): "लक्ष्मी पूजा",
    ("Kartik", "Shukla", "Dwitiya"): "भाइटीका",
    ("Kartik", "Shukla", "Panchami"): "छठ पर्व",
    ("Magh", "Krishna", "Chaturdashi"): "महाशिवरात्रि",
    ("Falgun", "Shukla", "Purnima"): "होली",
    ("Chaitra", "Shukla", "Navami"): "रामनवमी",
    ("Baishakh", "Shukla", "Purnima"): "बुद्ध जयन्ती",
}


def _angles(jd: float) -> tuple[float, float, float, float]:
    """Sidereal Sun and Moon longitudes, and their speeds."""
    raw = ephemeris.planet_positions(jd)
    ayan = ephemeris.ayanamsa(jd)
    sun = (raw["Sun"].longitude - ayan) % 360.0
    moon = (raw["Moon"].longitude - ayan) % 360.0
    return sun, moon, raw["Sun"].speed, raw["Moon"].speed


def _angle_for(kind: str, sun: float, moon: float) -> float:
    if kind in ("tithi", "karana"):
        return (moon - sun) % 360.0
    if kind == "nakshatra":
        return moon % 360.0
    return (moon + sun) % 360.0  # yoga


def _ends_at(
    kind: str, start_local: datetime, tz_name: str, hours: float = 48.0
) -> datetime | None:
    """When the element running at `start_local` gives way to the next.

    Bisection on the ephemeris: the index of the element is a step function of
    time, so the boundary is the instant the step increments. Half a minute of
    tolerance, which is finer than a printed patro quotes.
    """
    start_jd = ephemeris.julian_day(start_local, tz_name)
    width = _WIDTH[kind]

    def index_at(jd: float) -> int:
        sun, moon, _, _ = _angles(jd)
        return int(_angle_for(kind, sun, moon) // width)

    here = index_at(start_jd)
    step = 1.0 / 24.0  # an hour
    lo = start_jd
    hi = start_jd
    limit = start_jd + hours / 24.0
    while hi < limit:
        hi = min(hi + step, limit)
        if index_at(hi) != here:
            break
        lo = hi
    else:
        return None
    if index_at(hi) == here:
        return None

    # Half a minute is plenty; a patro prints to the second but is not
    # meaningfully truer than that.
    while (hi - lo) * 1440.0 > 0.5:
        mid = (lo + hi) / 2.0
        if index_at(mid) == here:
            lo = mid
        else:
            hi = mid
    return ephemeris.to_local(ephemeris._from_julian_day(hi), tz_name).replace(tzinfo=None)


def _element(kind: str, at_local: datetime, tz_name: str) -> Element:
    jd = ephemeris.julian_day(at_local, tz_name)
    sun, moon, _, _ = _angles(jd)
    if kind == "tithi":
        now = tithi(sun, moon)[1]
    elif kind == "karana":
        now = karana(sun, moon)
    elif kind == "nakshatra":
        now = nakshatra_at(moon).name
    else:
        now = nitya_yoga(sun, moon)

    ends = _ends_at(kind, at_local, tz_name)
    nxt = None
    if ends is not None:
        after = ends + timedelta(minutes=1)
        jd2 = ephemeris.julian_day(after, tz_name)
        s2, m2, _, _ = _angles(jd2)
        if kind == "tithi":
            nxt = tithi(s2, m2)[1]
        elif kind == "karana":
            nxt = karana(s2, m2)
        elif kind == "nakshatra":
            nxt = nakshatra_at(m2).name
        else:
            nxt = nitya_yoga(s2, m2)
    return Element(name=now, ends_at=ends, next_name=nxt)


_RITU = ("Basanta", "Grishma", "Barsha", "Sharad", "Hemanta", "Shishir")
_MASA = (
    "Baishakh", "Jestha", "Ashar", "Shrawan", "Bhadra", "Ashwin",
    "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra",
)


def day(
    on: date,
    latitude: float = KATHMANDU[0],
    longitude: float = KATHMANDU[1],
    tz_name: str = KATHMANDU[2],
) -> PatroDay:
    """One day of the patro, read at its own sunrise."""
    midnight = datetime.combine(on, datetime.min.time())
    sr_utc, ss_utc = ephemeris.sun_rise_set(midnight, tz_name, latitude, longitude)
    mr_utc, ms_utc = ephemeris.body_rise_set(midnight, tz_name, latitude, longitude, "Moon")

    def to_local(utc: datetime | None) -> datetime | None:
        return ephemeris.to_local(utc, tz_name).replace(tzinfo=None) if utc else None
    sunrise = to_local(sr_utc)
    # A day above the arctic circle has no sunrise to read from; noon is the
    # honest fallback and this product's readers are not there anyway.
    reference = sunrise or datetime.combine(on, datetime.min.time()).replace(hour=12)

    jd = ephemeris.julian_day(reference, tz_name)
    sun, moon, _, _ = _angles(jd)
    raw = ephemeris.planet_positions(jd)
    ayan = ephemeris.ayanamsa(jd)

    sun_sign_index = int(sun // 30)
    elongation = (moon - sun) % 360.0

    return PatroDay(
        on=on,
        weekday=on.strftime("%A"),
        sunrise=sunrise,
        sunset=to_local(ss_utc),
        moonrise=to_local(mr_utc),
        moonset=to_local(ms_utc),
        paksha="Shukla" if elongation < 180.0 else "Krishna",
        tithi=_element("tithi", reference, tz_name),
        nakshatra=_element("nakshatra", reference, tz_name),
        yoga=_element("yoga", reference, tz_name),
        karana=_element("karana", reference, tz_name),
        moon_sign=SIGNS[int(moon // 30)],
        sun_sign=SIGNS[sun_sign_index],
        # Ayana is a tropical fact, so the ayanamsa goes back on.
        ayana="Uttarayana" if 270.0 <= (sun + ayan) % 360.0 or (sun + ayan) % 360.0 < 90.0 else "Dakshinayana",
        ritu=_RITU[sun_sign_index // 2],
        masa=_MASA[sun_sign_index],
        festivals=[],
        grahas=[
            GrahaPlace(
                name=name,
                sign=SIGNS[int(((p.longitude - ayan) % 360.0) // 30)],
                degree_in_sign=round(((p.longitude - ayan) % 360.0) % 30.0, 4),
                retrograde=p.speed < 0 and name not in ("Rahu", "Ketu"),
            )
            for name, p in raw.items()
        ],
    )


def month(
    start: date,
    days: int,
    latitude: float = KATHMANDU[0],
    longitude: float = KATHMANDU[1],
    tz_name: str = KATHMANDU[2],
) -> list[PatroDay]:
    """A run of consecutive days, with festivals filled in.

    Festivals are resolved here rather than per-day because the lunar month a
    tithi belongs to is only clear in the company of its neighbours.
    """
    out = [day(start + timedelta(n), latitude, longitude, tz_name) for n in range(days)]
    return [
        PatroDay(
            **{
                **{f: getattr(d, f) for f in PatroDay.__slots__ if f != "festivals"},
                "festivals": [
                    name
                    for key, name in FESTIVALS.items()
                    if key == (lunar_month(d.on, d.paksha, tz_name, d.tithi.name), d.paksha, d.tithi.name)
                ],
            }
        )
        for d in out
    ]
