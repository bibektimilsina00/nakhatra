"""Chart assembly: lagna, whole-sign houses, dignity, combustion, drishti.

`build_chart` is the engine's entire public surface. It is a pure function of a
BirthMoment: no database, no network, no clock beyond the `computed_at` stamp.
"""

from __future__ import annotations

from dataclasses import replace
from datetime import UTC, datetime

from app.astrology_core import ephemeris
from app.astrology_core.avakhada import build_avakhada
from app.astrology_core.constants import (
    COMBUSTION_ORB,
    COMBUSTION_ORB_RETROGRADE,
    DEBILITATION,
    DEGREES_PER_SIGN,
    ENGINE_VERSION,
    EXALTATION,
    MOOLATRIKONA,
    NATURAL_ENEMIES,
    NATURAL_FRIENDS,
    NODES,
    PLANETS,
    SIGN_LORDS,
    SIGNS,
    SPECIAL_ASPECTS,
)
from app.astrology_core.dasha import build_dasha, build_tribhagi
from app.astrology_core.models import BirthMoment, Chart, Dasha, Dignity, House, Planet
from app.astrology_core.nakshatra import nakshatra_at
from app.astrology_core.nakshatra import transit as nakshatra_transit
from app.astrology_core.panchang import build_panchang
from app.astrology_core.varga import build_all_vargas
from app.astrology_core.yogini import build_yogini


def build_chart(birth: BirthMoment, siddhanta: str = "surya") -> Chart:
    """Cast a chart.

    `siddhanta` picks which system the Sun and Moon come from, and defaults to
    सूर्य सिद्धान्त because that is what a Nepali kundali is written in. Against
    charts hand-cast in Parbat and Kaski it scores 39 of 42 checked values
    where the modern ephemeris scores 29, and reproduces one of them exactly.

    "drik" gives the modern ephemeris instead. It is the better astronomy — the
    Surya Siddhanta Moon is about 1.4 degrees out — and it is kept as a
    diagnostic: when a chart looks wrong, computing it both ways separates "the
    two siddhantas disagree here" from "we have a bug". It is not a second
    product mode, and Indian software agreeing with it proves nothing about
    whether a jyotish in Nepal would.
    """
    jd = ephemeris.julian_day(birth.local_datetime, birth.tz_name)
    ayan = ephemeris.ayanamsa(jd)
    raw = ephemeris.planet_positions(jd)
    # Surya Siddhanta replaces the two luminaries; the star-planets stay drik.
    raw.update(ephemeris.luminaries(jd, siddhanta))

    # भुक्त and भभोग: how much of the janma nakshatra had passed, in time
    # rather than in arc, because that is what a panchanga tabulates and what
    # the dasha balance is computed from.
    def moon_at(when: datetime) -> float:
        moment = ephemeris.julian_day(when, birth.tz_name)
        switched = ephemeris.luminaries(moment, siddhanta)
        if "Moon" in switched:
            return switched["Moon"].longitude
        return ephemeris.planet_positions(moment)["Moon"].longitude

    entered, leaves = nakshatra_transit(moon_at, birth.local_datetime)
    bhukta = (birth.local_datetime - entered).total_seconds() / GHATI_SECONDS
    bhabhoga = (leaves - entered).total_seconds() / GHATI_SECONDS
    elapsed = bhukta / bhabhoga if bhabhoga else 0.0

    asc = ephemeris.ascendant(jd, birth.latitude, birth.longitude)
    lagna_sign = int(asc // DEGREES_PER_SIGN)

    sun_longitude = raw["Sun"].longitude

    # Sunrise matters beyond display: the Vedic day turns at sunrise, so a 4am
    # birth belongs to the previous weekday. Above the polar circles the Sun
    # may neither rise nor set — a real case, not an error.
    sunrise, sunset = ephemeris.sun_rise_set(
        datetime(
            birth.local_datetime.year,
            birth.local_datetime.month,
            birth.local_datetime.day,
        ),
        birth.tz_name,
        birth.latitude,
        birth.longitude,
    )
    if sunrise is not None:
        sunrise = ephemeris.to_local(sunrise, birth.tz_name)
    if sunset is not None:
        sunset = ephemeris.to_local(sunset, birth.tz_name)

    planets: list[Planet] = []
    for name in PLANETS:
        pos = raw[name]
        sign_index = int(pos.longitude // DEGREES_PER_SIGN)
        degree_in_sign = pos.longitude - sign_index * DEGREES_PER_SIGN
        retrograde = pos.speed < 0
        house = whole_sign_house(sign_index, lagna_sign)
        planets.append(
            Planet(
                name=name,
                longitude=pos.longitude,
                sign_index=sign_index,
                sign=SIGNS[sign_index],
                degree_in_sign=degree_in_sign,
                house=house,
                nakshatra=nakshatra_at(pos.longitude),
                retrograde=retrograde,
                combust=is_combust(name, pos.longitude, sun_longitude, retrograde),
                dignity=dignity_of(name, sign_index, degree_in_sign),
                speed=pos.speed,
                aspects_houses=aspected_houses(name, house),
                avastha=baladi_avastha(sign_index, degree_in_sign),
            )
        )

    houses = tuple(
        House(
            number=n,
            sign_index=(sign := (lagna_sign + n - 1) % 12),
            sign=SIGNS[sign],
            lord=SIGN_LORDS[sign],
            occupants=tuple(p.name for p in planets if p.house == n),
        )
        for n in range(1, 13)
    )

    return Chart(
        engine_version=ENGINE_VERSION,
        computed_at=datetime.now(UTC),
        birth=birth,
        julian_day=jd,
        ayanamsa_name=ephemeris.AYANAMSA_NAME,
        siddhanta=ephemeris.SIDDHANTA_NAMES[siddhanta],
        ayanamsa_value=ayan,
        lagna_sign_index=lagna_sign,
        lagna_sign=SIGNS[lagna_sign],
        lagna_degree=asc - lagna_sign * DEGREES_PER_SIGN,
        planets=tuple(planets),
        houses=houses,
        vargas=build_all_vargas(
            asc, {p.name: raw[p.name].longitude for p in planets}
        ),
        dasha=_with_transit(
            build_dasha(raw["Moon"].longitude, birth.local_datetime, elapsed=elapsed),
            bhukta, bhabhoga,
        ),
        tribhagi=_with_transit(
            build_tribhagi(raw["Moon"].longitude, birth.local_datetime, elapsed=elapsed),
            bhukta, bhabhoga,
        ),
        yogini=_with_transit(
            build_yogini(raw["Moon"].longitude, birth.local_datetime, elapsed=elapsed),
            bhukta, bhabhoga,
        ),
        panchang=build_panchang(
            sun_longitude=sun_longitude,
            moon_longitude=raw["Moon"].longitude,
            ayanamsa=ayan,
            ascendant_sign_index=lagna_sign,
            sun_speed=raw["Sun"].speed,
            moon_speed=raw["Moon"].speed,
            local_datetime=birth.local_datetime,
            sunrise=sunrise,
            sunset=sunset,
        ),
        avakhada=build_avakhada(raw["Moon"].longitude),
    )


# --- rules -----------------------------------------------------------------


def baladi_avastha(sign_index: int, degree_in_sign: float) -> str:
    """Baladi avastha — the planet's 'age' within its sign, in five six-degree
    bands. Infant to dead, strongest in the middle.

    Odd signs run Bala -> Mrita; even signs run the same bands in reverse.
    Verified against AstroTalk's "State" column for all nine grahas.
    """
    band = min(int(degree_in_sign // 6.0), 4)
    order = ("Bala", "Kumara", "Yuva", "Vriddha", "Mrita")
    # sign_index 0 is Aries, the 1st (odd) sign.
    return order[band] if sign_index % 2 == 0 else order[4 - band]


def whole_sign_house(sign_index: int, lagna_sign_index: int) -> int:
    """Whole-sign: the house IS the sign. Lagna's sign is house 1, and every
    planet in that sign is in house 1 regardless of degree."""
    return ((sign_index - lagna_sign_index) % 12) + 1


def angular_separation(a: float, b: float) -> float:
    """Shortest arc between two longitudes, 0-180."""
    diff = abs(a - b) % 360.0
    return min(diff, 360.0 - diff)


def is_combust(name: str, longitude: float, sun_longitude: float, retrograde: bool) -> bool:
    if name == "Sun" or name in NODES:
        return False
    orb = COMBUSTION_ORB[name]
    if retrograde:
        orb = COMBUSTION_ORB_RETROGRADE.get(name, orb)
    return angular_separation(longitude, sun_longitude) <= orb


def dignity_of(name: str, sign_index: int, degree_in_sign: float) -> Dignity | None:
    """Strongest applicable dignity, or None for the nodes.

    Order matters: exaltation outranks moolatrikona outranks own sign. Testing
    them in the wrong order silently downgrades an exalted planet.
    """
    if name in NODES:
        return None   # classical sources disagree; we decline to invent one

    if (ex := EXALTATION.get(name)) and ex[0] == sign_index:
        return "exalted"
    if (deb := DEBILITATION.get(name)) and deb[0] == sign_index:
        return "debilitated"
    if (mt := MOOLATRIKONA.get(name)) and mt[0] == sign_index and mt[1] <= degree_in_sign < mt[2]:
        return "moolatrikona"

    lord = SIGN_LORDS[sign_index]
    if lord == name:
        return "own"
    if lord in NATURAL_FRIENDS.get(name, frozenset()):
        return "friend"
    if lord in NATURAL_ENEMIES.get(name, frozenset()):
        return "enemy"
    return "neutral"


def aspected_houses(name: str, house: int) -> tuple[int, ...]:
    """Graha drishti, whole-sign, counted inclusively from the planet's house.

    Every graha aspects the 7th. Mars adds 4th and 8th, Jupiter 5th and 9th,
    Saturn 3rd and 10th. Nodes are given 5/7/9 — a documented choice; see
    docs/astrology-methodology.md.
    """
    counts = (7, *SPECIAL_ASPECTS.get(name, ()))
    return tuple(sorted(((house - 1 + c - 1) % 12) + 1 for c in counts))


#: A ghati is a sixtieth of a day.
GHATI_SECONDS = 24 * 60 * 60 / 60


def _with_transit(tree: Dasha, bhukta: float, bhabhoga: float) -> Dasha:
    """Attach the two figures a kundali prints beside the balance."""
    return replace(tree, bhukta_ghati=round(bhukta, 3), bhabhoga_ghati=round(bhabhoga, 3))
