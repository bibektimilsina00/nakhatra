"""The ONLY module in the repo that imports swisseph.

Also owns local-time -> UTC -> Julian Day conversion, because getting that
wrong is the single largest source of silently-wrong charts.
"""

from __future__ import annotations

import os
import threading
from dataclasses import dataclass
from datetime import UTC, datetime
from zoneinfo import ZoneInfo

import swisseph as swe

from app.astrology_core.constants import PLANETS

AYANAMSA_NAME = "Lahiri (Chitrapaksha)"

#: Which siddhanta the positions come from.
#:
#: दृक् सिद्धान्त — the modern observational system. Positions are Swiss
#: Ephemeris, matched to where the bodies actually are.
#:
#: The other tradition is सूर्य सिद्धान्त, which most hand-cast Nepali
#: panchangas follow. Its Moon runs about a quarter of a degree ahead of this
#: one — measured at +18' and +14' against two kundalis cast in Parbat — which
#: matters only near a boundary, and there it decides the nakshatra. Naming
#: the system lets a reader square our answer with their jyotish's instead of
#: assuming one of them is broken.
SIDDHANTA = "Drik (दृक् सिद्धान्त) — modern observational"

_SWE_PLANET = {
    "Sun": swe.SUN,
    "Moon": swe.MOON,
    "Mars": swe.MARS,
    "Mercury": swe.MERCURY,
    "Jupiter": swe.JUPITER,
    "Venus": swe.VENUS,
    "Saturn": swe.SATURN,
    "Rahu": swe.MEAN_NODE,   # methodology decision: MEAN, not TRUE node
}

_init_lock = threading.Lock()
_initialised = False




def _ensure_init() -> None:
    """Idempotent global setup. swisseph keeps process-global state, so this
    must run before any calc and must be safe to call from multiple threads."""
    global _initialised
    if _initialised:
        return
    with _init_lock:
        if _initialised:
            return
        path = os.environ.get("EPHEMERIS_PATH")
        if path and os.path.isdir(path):
            swe.set_ephe_path(path)
        swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
        _initialised = True


def _flags() -> int:
    """Swiss Ephemeris files if we have them, Moshier analytical theory if not.

    Moshier needs no data files and is accurate to roughly 1 arcsecond over the
    range we care about — fine for house and nakshatra placement, and it means
    the engine runs on a fresh checkout with zero setup. Set EPHEMERIS_PATH in
    production for full precision.
    """
    _ensure_init()
    path = os.environ.get("EPHEMERIS_PATH")
    backend = swe.FLG_SWIEPH if (path and os.path.isdir(path)) else swe.FLG_MOSEPH
    return backend | swe.FLG_SIDEREAL | swe.FLG_SPEED


def to_utc(local_datetime: datetime, tz_name: str) -> datetime:
    """Resolve a naive local wall-clock time to UTC using the *historical* rules
    for that zone on that date.

    This is why we store an IANA zone name and never a UTC offset. Kathmandu ran
    local mean time (+5:41:16) until 1920, then +5:30 until 1986, then +5:45.
    A birth in 1975 stored as "+05:45" is fifteen minutes wrong — about 3.75
    degrees of ascendant motion, so roughly one birth in eight lands in the
    wrong sign and inherits a completely wrong house structure.

    Ambiguous times (the repeated hour at a DST fall-back) resolve to the first
    occurrence. Nonexistent times (the skipped hour at spring-forward) are
    resolved by zoneinfo's documented behaviour rather than rejected: birth
    records do contain impossible local times, and refusing to draw a chart is
    worse than drawing one an hour off with a flag.
    """
    if local_datetime.tzinfo is not None:
        raise ValueError("expected a naive local datetime; tz comes from tz_name")
    return local_datetime.replace(tzinfo=ZoneInfo(tz_name), fold=0).astimezone(UTC)


def julian_day(local_datetime: datetime, tz_name: str) -> float:
    """Julian Day (UT) for a local birth moment."""
    utc = to_utc(local_datetime, tz_name)
    hour = utc.hour + utc.minute / 60.0 + (utc.second + utc.microsecond / 1e6) / 3600.0
    return swe.julday(utc.year, utc.month, utc.day, hour, swe.GREG_CAL)


def ayanamsa(jd: float) -> float:
    _ensure_init()
    return swe.get_ayanamsa_ut(jd)


@dataclass(frozen=True, slots=True)
class RawPosition:
    longitude: float   # sidereal, 0-360
    speed: float       # degrees/day, negative = retrograde


def planet_positions(jd: float) -> dict[str, RawPosition]:
    """Sidereal longitude and speed for all nine grahas.

    **Geocentric.** Positions are as seen from the centre of the Earth, which
    is what AstroSage, AstroTalk and effectively every other Vedic
    implementation publishes.

    This was briefly topocentric — corrected for the observer's own position,
    which moves the apparent Moon by up to 57 arcminutes. It looked right on
    one hand-cast kundali and was wrong. Measured across three of them the two
    conventions score 16/27 and 17/27: parallax fixes one chart and breaks
    another, because it is not a constant. It ran +53', +54' and **-36'** on
    the three, changing sign.

    What those charts actually show is their own Moon running a steady +10 to
    +20 arcminutes ahead of a modern ephemeris — a traditional almanac's small
    systematic bias, not a coordinate convention. That is not something to
    reproduce: it would mean shipping a Moon we know to be wrong in order to
    agree with an almanac that is also wrong, and it would be fitted to three
    data points.

    The consequence is honest and unavoidable: on a chart whose Moon sits
    within ~20 arcminutes of a nakshatra boundary, we and a traditional
    panchanga will name different nakshatras. `Panchang` carries no warning for
    that yet; it should.

    Ketu is not computed: it is definitionally 180 degrees from Rahu and shares
    its speed. Computing it separately invites the two to disagree.
    """
    flags = _flags()
    out: dict[str, RawPosition] = {}
    for name, ipl in _SWE_PLANET.items():
        values, retflag = swe.calc_ut(jd, ipl, flags)
        if retflag < 0:
            raise EphemerisError(f"swisseph failed for {name} at jd={jd}: {retflag}")
        out[name] = RawPosition(longitude=values[0] % 360.0, speed=values[3])

    rahu = out["Rahu"]
    out["Ketu"] = RawPosition(longitude=(rahu.longitude + 180.0) % 360.0, speed=rahu.speed)

    missing = set(PLANETS) - set(out)
    if missing:
        raise EphemerisError(f"missing positions: {sorted(missing)}")
    return out


def ascendant(jd: float, latitude: float, longitude: float) -> float:
    """Sidereal ascendant in degrees.

    Computed as tropical-minus-ayanamsa rather than via the sidereal house flag.
    The two are equivalent by definition, but the explicit subtraction is one
    less API subtlety to get wrong across swisseph versions, and it makes the
    arithmetic visible in a stack trace.

    House system is 'W' (whole sign) for consistency, but the returned cusps are
    unused — whole-sign houses are derived from the ascendant's sign in chart.py.
    """
    _ensure_init()
    if not -90.0 <= latitude <= 90.0:
        raise ValueError(f"latitude out of range: {latitude}")
    if not -180.0 <= longitude <= 180.0:
        raise ValueError(f"longitude out of range: {longitude} (east positive)")
    _cusps, ascmc = swe.houses(jd, latitude, longitude, b"W")
    return (ascmc[0] - ayanamsa(jd)) % 360.0


def to_local(utc_dt: datetime, tz_name: str) -> datetime:
    """Render a UTC instant in the birthplace's local time."""
    return utc_dt.astimezone(ZoneInfo(tz_name))


def sun_rise_set(
    local_date_midnight: datetime, tz_name: str, latitude: float, longitude: float
) -> tuple[datetime | None, datetime | None]:
    """Sunrise and sunset (UTC) for the local day containing the birth.

    Returns (None, None) above the polar circles when the Sun neither rises nor
    sets — a real case for a Tromso or Reykjavik birth, not an error.

    Uses the Swiss Ephemeris default: upper limb with atmospheric refraction,
    which is the convention Indian and Nepali panchang follow.
    """
    _ensure_init()
    start = julian_day(local_date_midnight, tz_name)
    geopos = (longitude, latitude, 0.0)
    flags = _flags() & ~swe.FLG_SIDEREAL  # rise/set is a horizon event, not zodiacal

    def _event(rsmi: int) -> datetime | None:
        res, tret = swe.rise_trans(start, swe.SUN, rsmi, geopos, 0.0, 0.0, flags)
        if res != 0:
            return None
        return _from_julian_day(tret[0])

    return _event(swe.CALC_RISE), _event(swe.CALC_SET)


def _from_julian_day(jd: float) -> datetime:
    year, month, day, hour = swe.revjul(jd, swe.GREG_CAL)
    h = int(hour)
    minute_full = (hour - h) * 60
    m = int(minute_full)
    second_full = (minute_full - m) * 60
    s = int(second_full)
    micro = int(round((second_full - s) * 1e6))
    if micro >= 1_000_000:  # rounding can carry
        micro, s = 0, s + 1
    return datetime(year, month, day, h, m, min(s, 59), micro, tzinfo=UTC)


class EphemerisError(RuntimeError):
    """swisseph returned an error. Never swallow this — a wrong chart that looks
    right is worse than no chart."""
