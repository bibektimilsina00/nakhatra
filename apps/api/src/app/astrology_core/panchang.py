"""Panchang — the five limbs of the Vedic calendar, plus sunrise and sunset.

All five derive from the Sun and Moon longitudes the chart already has, so
this module takes numbers rather than recomputing anything.

Verified against an independent implementation (AstroTalk) for
2002-01-11 19:30 Asia/Kathmandu at 27.4823N 83.2778E:
Tithi Krishna Chaturdashi, Karana Vishti, Yoga Dhruva, Nakshatra Mula.
The golden fixtures pin this; see tests/astrology/test_panchang.py.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta

from app.astrology_core.constants import DEGREES_PER_NAKSHATRA, SIGN_LORDS, SIGNS
from app.astrology_core.nakshatra import nakshatra_at

# --- tithi -----------------------------------------------------------------

TITHI_NAMES = (
    "Pratipada",
    "Dwitiya",
    "Tritiya",
    "Chaturthi",
    "Panchami",
    "Shashthi",
    "Saptami",
    "Ashtami",
    "Navami",
    "Dashami",
    "Ekadashi",
    "Dwadashi",
    "Trayodashi",
    "Chaturdashi",
)

# --- karana ----------------------------------------------------------------
# Half a tithi. Sixty per lunar month: index 0 is the fixed Kimstughna, then
# seven movable karanas repeat eight times, then three more fixed ones close
# the month.
MOVABLE_KARANAS = ("Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti")
FIXED_TAIL_KARANAS = ("Shakuni", "Chatushpada", "Naga")

# --- nitya yoga ------------------------------------------------------------

YOGA_NAMES = (
    "Vishkambha",
    "Priti",
    "Ayushman",
    "Saubhagya",
    "Shobhana",
    "Atiganda",
    "Sukarma",
    "Dhriti",
    "Shula",
    "Ganda",
    "Vriddhi",
    "Dhruva",
    "Vyaghata",
    "Harshana",
    "Vajra",
    "Siddhi",
    "Vyatipata",
    "Variyana",
    "Parigha",
    "Shiva",
    "Siddha",
    "Sadhya",
    "Shubha",
    "Shukla",
    "Brahma",
    "Indra",
    "Vaidhriti",
)

# --- the almanac frame: ayana, ritu, masa, and the era years ---------------
#
# Every traditional Nepali kundali opens with these, and they are what a
# sankalpa is spoken from. All of them are the Sun's *sidereal* sign — which
# is why they belong here and not in a calendar library: Bhadra begins when
# the Sun enters sidereal Leo, not on a fixed date.
#
# Kapoor, "Astronomy and Mathematical Astrology", 8th edn, p.80:
#   "The period when the Sun is transiting the signs of Capricorn to Gemini
#    is known as the period of uttarayana Sun. The period in which the Sun is
#    transiting the signs of Cancer to Sagittarius is known as dakshinayana."
#
# Those signs are **sayana** — tropical. Uttarayana is the Sun turning north,
# which is the solstice, and the solstice is a tropical event: it happens
# around 22 December, not at Makar Sankranti three weeks later. Reading the
# rule sidereally puts every birth in that gap on the wrong side of the year.
# A kundali for 11 January 2002 says उत्तर अयने and is the case that settles
# it; the other three are Dakshinayana either way and cannot tell them apart.
UTTARAYANA_SIGNS = frozenset({9, 10, 11, 0, 1, 2})  # Capricorn through Gemini

#: Two solar months to a season. Unlike the ayana, the ritu follows the
#: **nirayana** Sun — that is, the solar month, which is what Nepali practice
#: names it alongside. Two hand-cast kundalis settle this in the other
#: direction from the ayana: 23 Nov 1975 and 3 Nov 1981 both read शरद, which
#: is the sidereal sign; the tropical sign would make them हेमन्त.
RITUS = (
    "Basant",
    "Basant",  # Aries, Taurus
    "Grishma",
    "Grishma",  # Gemini, Cancer
    "Varsha",
    "Varsha",  # Leo, Virgo
    "Sharad",
    "Sharad",  # Libra, Scorpio
    "Hemant",
    "Hemant",  # Sagittarius, Capricorn
    "Shishir",
    "Shishir",  # Aquarius, Pisces
)

#: The solar month, by the sign the Sun occupies. Nepali names, because these
#: are the Bikram Sambat months a Nepali reader already knows — Baishakh opens
#: at Mesha Sankranti.
SOLAR_MASA = (
    "Baishakh",
    "Jestha",
    "Ashar",
    "Shrawan",
    "Bhadra",
    "Ashwin",
    "Kartik",
    "Mangsir",
    "Poush",
    "Magh",
    "Falgun",
    "Chaitra",
)

#: The sixty-year Jovian cycle, in order.
#:
#: The offset is fitted to two hand-cast Nepali kundalis twenty-nine years
#: apart — Shaka 1897 reads विभव and Shaka 1926 reads हेमलम्ब (Hevilambi),
#: the 2nd and 31st names. Two anchors that far apart rule out a skip between
#: them, but this is a fit to two documents in one tradition rather than a
#: rule from a text: the southern Ugadi reckoning names a different year for
#: the same date, so do not carry this number into that system.
SAMVATSARAS = (
    "Prabhava",
    "Vibhava",
    "Shukla",
    "Pramoda",
    "Prajapati",
    "Angirasa",
    "Shrimukha",
    "Bhava",
    "Yuva",
    "Dhata",
    "Ishvara",
    "Bahudhanya",
    "Pramathi",
    "Vikrama",
    "Vrisha",
    "Chitrabhanu",
    "Svabhanu",
    "Tarana",
    "Parthiva",
    "Vyaya",
    "Sarvajit",
    "Sarvadhari",
    "Virodhi",
    "Vikriti",
    "Khara",
    "Nandana",
    "Vijaya",
    "Jaya",
    "Manmatha",
    "Durmukha",
    "Hevilambi",
    "Vilambi",
    "Vikari",
    "Sharvari",
    "Plava",
    "Shubhakrit",
    "Shobhakrit",
    "Krodhi",
    "Vishvavasu",
    "Parabhava",
    "Plavanga",
    "Kilaka",
    "Saumya",
    "Sadharana",
    "Virodhakrit",
    "Paridhavi",
    "Pramadicha",
    "Ananda",
    "Rakshasa",
    "Nala",
    "Pingala",
    "Kalayukti",
    "Siddharthi",
    "Raudra",
    "Durmati",
    "Dundubhi",
    "Rudhirodgari",
    "Raktakshi",
    "Krodhana",
    "Akshaya",
)
SAMVATSARA_OFFSET = 24

#: Offsets from the Christian era for the solar reckonings, both counted from
#: the Sun's ingress into sidereal Aries (Kapoor p.79, "Other Eras").
VIKRAM_OFFSET = 57
SHAKA_OFFSET = -78


# --- vara ------------------------------------------------------------------
# The Vedic day begins at sunrise, not midnight — a birth at 2am belongs to the
# previous weekday. `vara` below accounts for that.
VARA_NAMES = ("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
VARA_LORDS = ("Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn")


@dataclass(frozen=True, slots=True)
class BoundaryWarning:
    """A panchanga element close enough to changing that it is not settled.

    Every one of these five is a division of the Moon's motion, so each has a
    moment when it flips. Four hand-cast kundalis checked against this engine
    disagreed on exactly three values, and all three sat within 15 arcminutes
    of such a moment — the traditional almanacs those gurus used run their Moon
    about a sixth of a degree fast, which is nothing except at a boundary.

    Saying "Magha" flatly when the Moon is nine arcminutes from Purva Phalguni
    claims more than the arithmetic supports. This is what lets the reading say
    so instead.
    """

    element: str  # tithi | nakshatra | yoga | karana
    current: str
    upcoming: str
    minutes: float  # until it changes, at the Moon's speed right now


#: How close counts as close. An hour is roughly a third of a degree of Moon
#: motion, comfortably wider than the ~10-20 arcminute disagreement measured
#: against those kundalis, so a chart a traditional almanac would name
#: differently is nearly always flagged.
BOUNDARY_MINUTES = 60.0


@dataclass(frozen=True, slots=True)
class Panchang:
    tithi_index: int  # 0-29 across the lunar month
    tithi_name: str  # e.g. "Chaturdashi"
    paksha: str  # "Shukla" | "Krishna"
    karana: str
    yoga: str
    nakshatra: str
    nakshatra_lord: str
    nakshatra_pada: int
    vara: str
    vara_lord: str
    moon_sign: str
    moon_sign_lord: str
    ascendant_sign: str
    ascendant_lord: str
    sunrise: datetime | None  # local time at the birthplace
    sunset: datetime | None
    #: "Uttarayana" | "Dakshinayana" — the Sun's half of the year.
    ayana: str
    #: One of six seasons, two solar months each.
    ritu: str
    #: The solar month, by the Sun's sidereal sign. Bhadra when it is in Leo.
    masa: str
    #: Bikram Sambat and Shalivahana Shaka years for the solar reckoning.
    #: Both change at Mesha Sankranti, not on 1 January, so they are derived
    #: from the Sun rather than from the calendar year.
    vikram_samvat: int
    shaka_samvat: int
    #: The name of the year in the sixty-year Jovian cycle.
    samvatsara: str
    #: Elements within `BOUNDARY_MINUTES` of changing. Usually empty.
    near_boundary: tuple[BoundaryWarning, ...] = ()


def tithi(sun_longitude: float, moon_longitude: float) -> tuple[int, str, str]:
    """(index 0-29, name, paksha). The tithi is the Moon's elongation from the
    Sun in twelve-degree steps."""
    elongation = (moon_longitude - sun_longitude) % 360.0
    index = min(int(elongation // 12.0), 29)
    paksha = "Shukla" if index < 15 else "Krishna"
    within = index % 15
    if within == 14:
        name = "Purnima" if paksha == "Shukla" else "Amavasya"
    else:
        name = TITHI_NAMES[within]
    return index, name, paksha


def karana(sun_longitude: float, moon_longitude: float) -> str:
    elongation = (moon_longitude - sun_longitude) % 360.0
    index = min(int(elongation // 6.0), 59)
    if index == 0:
        return "Kimstughna"
    if index >= 57:
        return FIXED_TAIL_KARANAS[index - 57]
    return MOVABLE_KARANAS[(index - 1) % 7]


def nitya_yoga(sun_longitude: float, moon_longitude: float) -> str:
    total = (sun_longitude + moon_longitude) % 360.0
    return YOGA_NAMES[min(int(total // DEGREES_PER_NAKSHATRA), 26)]


def vara(local_datetime: datetime, sunrise: datetime | None) -> tuple[str, str]:
    """Weekday by the Vedic reckoning: the day turns at sunrise.

    A 4am birth belongs to the previous weekday, which is why this takes the
    sunrise rather than reading the calendar date.
    """
    day = local_datetime
    if sunrise is not None:
        # Both are local wall-clock at the birthplace; the birth moment is
        # naive and sunrise is zone-aware, so compare on the same footing.
        local_sunrise = sunrise.replace(tzinfo=None)
        if local_datetime < local_sunrise:
            day = local_datetime - timedelta(days=1)
    index = (day.weekday() + 1) % 7  # Python: Monday=0; Vedic list starts Sunday
    return VARA_NAMES[index], VARA_LORDS[index]


def solar_year(local_datetime: datetime, sun_sign_index: int, offset: int) -> int:
    """A samvat year, counted from the Sun's ingress into sidereal Aries.

    Before that ingress — the Sun still in Pisces, roughly January to mid-April
    — the calendar year has rolled over but the samvat has not, so it is one
    behind what a bare `year + offset` would give.
    """
    year = local_datetime.year
    # Capricorn, Aquarius and Pisces only ever hold the Sun between January
    # and mid-April, so they are always before the ingress. Sagittarius spans
    # the new year, so it needs the month to disambiguate December from
    # January.
    before_ingress = sun_sign_index in (9, 10, 11) or (
        sun_sign_index == 8 and local_datetime.month == 1
    )
    return year - 1 + offset if before_ingress else year + offset


def _boundaries(
    sun: float, moon: float, sun_speed: float, moon_speed: float
) -> tuple[BoundaryWarning, ...]:
    """Which of the four Moon-driven elements are about to change, and when.

    Each divides a different angle at a different rate: the tithi and karana
    divide the Moon's lead on the Sun, the nakshatra divides the Moon alone,
    the yoga divides their sum. Advancing the Moon just past each boundary
    names what comes next, which is cheaper and less error-prone than
    reimplementing "the one after this" for four different cycles.
    """
    if moon_speed <= 0.0:
        return ()

    # (name, angle now, width, how fast that angle grows, how to name it)
    elongation = (moon - sun) % 360.0
    checks = (
        ("tithi", elongation, 12.0, moon_speed - sun_speed, lambda m: tithi(sun, m)[1]),
        ("karana", elongation, 6.0, moon_speed - sun_speed, lambda m: karana(sun, m)),
        (
            "nakshatra",
            moon % 360.0,
            DEGREES_PER_NAKSHATRA,
            moon_speed,
            lambda m: nakshatra_at(m).name,
        ),
        (
            "yoga",
            (moon + sun) % 360.0,
            DEGREES_PER_NAKSHATRA,
            moon_speed + sun_speed,
            lambda m: nitya_yoga(sun, m),
        ),
    )

    out: list[BoundaryWarning] = []
    for name, angle, width, speed, label in checks:
        if speed <= 0.0:
            continue
        remaining = width - (angle % width)
        minutes = remaining / speed * 1440.0
        if minutes > BOUNDARY_MINUTES:
            continue
        # A hair past the boundary, so `label` reports the next value.
        just_past = (moon + remaining + 1e-6) % 360.0
        out.append(
            BoundaryWarning(
                element=name,
                current=label(moon % 360.0),
                upcoming=label(just_past),
                minutes=round(minutes, 1),
            )
        )
    return tuple(out)


def build_panchang(
    *,
    sun_longitude: float,
    moon_longitude: float,
    #: Needed to recover the tropical Sun for the ayana.
    ayanamsa: float,
    ascendant_sign_index: int,
    #: Degrees per day. Needed only to say how close a boundary is.
    sun_speed: float = 0.0,
    moon_speed: float = 0.0,
    local_datetime: datetime = None,  # type: ignore[assignment]
    sunrise: datetime | None,
    sunset: datetime | None,
) -> Panchang:
    index, name, paksha = tithi(sun_longitude, moon_longitude)
    nak = nakshatra_at(moon_longitude)
    moon_sign_index = int((moon_longitude % 360.0) // 30.0)
    sun_sign_index = int((sun_longitude % 360.0) // 30.0)
    # The ayana needs the tropical Sun; everything else here is sidereal.
    tropical_sign_index = int(((sun_longitude + ayanamsa) % 360.0) // 30.0)
    vara_name, vara_lord = vara(local_datetime, sunrise)
    shaka = solar_year(local_datetime, sun_sign_index, SHAKA_OFFSET)

    return Panchang(
        tithi_index=index,
        tithi_name=name,
        paksha=paksha,
        karana=karana(sun_longitude, moon_longitude),
        yoga=nitya_yoga(sun_longitude, moon_longitude),
        nakshatra=nak.name,
        nakshatra_lord=nak.lord,
        nakshatra_pada=nak.pada,
        vara=vara_name,
        vara_lord=vara_lord,
        moon_sign=SIGNS[moon_sign_index],
        moon_sign_lord=SIGN_LORDS[moon_sign_index],
        ascendant_sign=SIGNS[ascendant_sign_index],
        ascendant_lord=SIGN_LORDS[ascendant_sign_index],
        sunrise=sunrise,
        sunset=sunset,
        ayana="Uttarayana" if tropical_sign_index in UTTARAYANA_SIGNS else "Dakshinayana",
        ritu=RITUS[sun_sign_index],
        masa=SOLAR_MASA[sun_sign_index],
        vikram_samvat=solar_year(local_datetime, sun_sign_index, VIKRAM_OFFSET),
        shaka_samvat=shaka,
        samvatsara=SAMVATSARAS[(shaka + SAMVATSARA_OFFSET) % 60],
        near_boundary=_boundaries(sun_longitude, moon_longitude, sun_speed, moon_speed),
    )
