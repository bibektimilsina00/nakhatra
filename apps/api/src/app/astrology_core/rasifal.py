"""Daily rasifal by gochara — the transit judged from each janma rashi.

This is a calculation, not a horoscope generator. For each of the twelve moon
signs it places today's grahas in houses counted from that sign, weights each
placement by the classical gochara table, applies Vedha (obstruction) and
grades the day's Moon by Murti Nirnaya. What comes out is a score and the
reasons behind it; turning that into a sentence is the caller's business.

Sources followed:
- Gochara phala: the standard benefic/malefic house table per graha
  (Brihat Samhita / Phaladeepika lineage), as used by Nepali panchangas.
- Vedha: a graha in a favourable house fails to deliver if another occupies
  its vedha house. Sun and Saturn do not obstruct each other.
- Murti Nirnaya: the transit Moon's house from janma rashi grades the day
  Swarna / Rajata / Tamra / Loha.

No text and no language lives here.
"""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta

from app.astrology_core import ephemeris
from app.astrology_core.constants import SIGN_LORDS, SIGNS

# Houses from the janma rashi in which each graha gives good results. The
# classical table; everything not listed is taken as unfavourable.
GOCHARA_GOOD: dict[str, tuple[int, ...]] = {
    "Sun": (3, 6, 10, 11),
    "Moon": (1, 3, 6, 7, 10, 11),
    "Mars": (3, 6, 11),
    "Mercury": (2, 4, 6, 8, 10, 11),
    "Jupiter": (2, 5, 7, 9, 11),
    "Venus": (1, 2, 3, 4, 5, 8, 9, 11, 12),
    "Saturn": (3, 6, 11),
    "Rahu": (3, 6, 10, 11),
    "Ketu": (3, 6, 10, 11),
}

# Vedha pairs: a graha in the first house of a pair is obstructed by any graha
# standing in the second. Symmetric, so both directions are stored.
_VEDHA_PAIRS: dict[str, tuple[tuple[int, int], ...]] = {
    "Sun": ((3, 9), (6, 12), (10, 4), (11, 5)),
    "Moon": ((1, 5), (3, 9), (6, 12), (7, 2), (10, 4), (11, 8)),
    "Mars": ((3, 12), (6, 9), (11, 5)),
    "Mercury": ((2, 5), (4, 3), (6, 9), (8, 1), (10, 7), (11, 12)),
    "Jupiter": ((2, 12), (5, 4), (7, 3), (9, 10), (11, 8)),
    "Venus": ((1, 8), (2, 7), (3, 1), (4, 10), (5, 9), (8, 5), (9, 11), (11, 6), (12, 3)),
    "Saturn": ((3, 12), (6, 9), (11, 5)),
    "Rahu": ((3, 9), (6, 12), (10, 4), (11, 5)),
    "Ketu": ((3, 9), (6, 12), (10, 4), (11, 5)),
}

# The slow grahas colour a whole season and the fast ones a day; weighting by
# speed is what stops Saturn and the Moon counting the same.
_WEIGHT: dict[str, float] = {
    "Sun": 1.0, "Moon": 1.5, "Mars": 1.0, "Mercury": 0.8, "Jupiter": 1.6,
    "Venus": 0.9, "Saturn": 1.6, "Rahu": 0.8, "Ketu": 0.8,
}

_MURTI: dict[int, str] = {
    1: "Swarna", 6: "Swarna", 11: "Swarna",
    2: "Rajata", 5: "Rajata", 9: "Rajata",
    3: "Tamra", 7: "Tamra", 10: "Tamra",
    4: "Loha", 8: "Loha", 12: "Loha",
}
_MURTI_BONUS: dict[str, float] = {"Swarna": 1.5, "Rajata": 0.75, "Tamra": 0.0, "Loha": -1.5}

# The weekday's ruler, used for the day's colour and number rather than
# invented per rashi. Monday is index 0 in `weekday()`.
_WEEKDAY_LORD: tuple[str, ...] = (
    "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Sun",
)
# Vedic numerology of the grahas, for the lucky number.
_GRAHA_NUMBER: dict[str, int] = {
    "Sun": 1, "Moon": 2, "Jupiter": 3, "Rahu": 4, "Mercury": 5,
    "Venus": 6, "Ketu": 7, "Saturn": 8, "Mars": 9,
}
# Colour keys, not words: the caller translates them.
_GRAHA_COLOUR: dict[str, str] = {
    "Sun": "copper", "Moon": "white", "Mars": "red", "Mercury": "green",
    "Jupiter": "yellow", "Venus": "white", "Saturn": "blue",
    "Rahu": "smoke", "Ketu": "grey",
}


@dataclass(frozen=True, slots=True)
class GrahaTransit:
    """One graha as it stands today, seen from one janma rashi."""

    name: str
    sign: str
    house: int          # 1..12 counted from the janma rashi
    favourable: bool
    obstructed: bool    # favourable, but blocked by vedha
    retrograde: bool


@dataclass(frozen=True, slots=True)
class RashiDay:
    """A day judged for one moon sign."""

    sign: str
    sign_index: int
    lord: str
    score: float                 # roughly -10..+10
    rating: int                  # 1..5 stars, derived from score
    #: A stable key for the verdict word. Language-free: the six bands a
    #: Nepali reader expects map onto the five stars, with the fourth split
    #: on where inside its band the score falls, so "good" and "favourable"
    #: are a real distinction rather than a writer's choice.
    band: str
    murti: str
    murti_house: int
    transits: list[GrahaTransit] = field(default_factory=list)
    supports: list[str] = field(default_factory=list)   # graha names helping
    strains: list[str] = field(default_factory=list)    # graha names hindering
    lucky_number: int = 1
    lucky_colour: str = "white"


@dataclass(frozen=True, slots=True)
class Rasifal:
    """The whole day: the sky once, then twelve readings of it."""

    for_date: date
    weekday_lord: str
    positions: dict[str, tuple[str, float, bool]]  # graha -> (sign, deg in sign, retro)
    signs: list[RashiDay]


def _house_from(sign_index: int, janma_index: int) -> int:
    """Houses are counted inclusively in Jyotisha: the sign itself is the 1st."""
    return ((sign_index - janma_index) % 12) + 1


# Star bands, cut at the real percentiles of this scoring function rather
# than at round numbers. The classical gochara table lists few favourable
# houses per graha, so raw scores sit well below zero — measured over 1,464
# sign-days across 2026 the median is -4.1, not 0. Bands at 0/1.5/-1/-3.5
# would have called almost every day of the year poor, which is a bug in the
# scale, not a fact about the sky. These are the p20/p40/p60/p85 cuts.
_BANDS: tuple[float, ...] = (-6.6, -4.9, -3.2, -0.7)


_BAND_KEYS = ("difficult", "caution", "ordinary", "favourable", "very_good")


def _band(score: float, stars: int) -> str:
    """The verdict word's key, decided here so nothing downstream invents one.

    A rating and a prediction that disagree is the failure this prevents: the
    writer is told the band and must match it, rather than choosing a mood.
    """
    if stars == 4:
        # The 4-star band runs from _BANDS[2] to _BANDS[3]; its upper half is
        # the stronger word.
        low, high = _BANDS[2], _BANDS[3]
        return "good" if score >= (low + high) / 2 else "favourable"
    return _BAND_KEYS[stars - 1]


def _rating(score: float) -> int:
    """1..5 stars. Comparative by construction: all twelve signs read the
    same sky, so what separates them is house placement, and the bands are
    calibrated so a normal day spreads across the scale."""
    for stars, cut in enumerate(_BANDS, start=1):
        if score < cut:
            return stars
    return 5


def compute(
    for_date: date,
    tz_name: str = "Asia/Kathmandu",
    at: time = time(6, 0),
) -> Rasifal:
    """Judge `for_date` for all twelve rashis.

    The sky is read once, at a fixed morning hour in the given zone, so the
    same date always produces the same reading — a horoscope that changed
    every time the page loaded would be worthless. Kathmandu by default,
    because +5:45 is the zone this is written for.
    """
    jd = ephemeris.julian_day(datetime.combine(for_date, at), tz_name)
    raw = ephemeris.planet_positions(jd)
    ayan = ephemeris.ayanamsa(jd)

    sidereal: dict[str, float] = {n: (p.longitude - ayan) % 360.0 for n, p in raw.items()}
    retro: dict[str, bool] = {n: p.speed < 0 for n, p in raw.items()}
    # Rahu and Ketu are always retrograde in the mean-node convention; saying
    # so on a daily card is noise rather than information.
    retro["Rahu"] = retro["Ketu"] = False

    positions = {
        n: (SIGNS[int(lon // 30)], lon % 30.0, retro[n]) for n, lon in sidereal.items()
    }
    sign_index_of = {n: int(lon // 30) for n, lon in sidereal.items()}

    weekday_lord = _WEEKDAY_LORD[for_date.weekday()]

    days: list[RashiDay] = []
    for janma in range(12):
        transits: list[GrahaTransit] = []
        occupied: dict[int, list[str]] = {}
        for name, idx in sign_index_of.items():
            occupied.setdefault(_house_from(idx, janma), []).append(name)

        score = 0.0
        supports: list[str] = []
        strains: list[str] = []

        for name, idx in sign_index_of.items():
            house = _house_from(idx, janma)
            good = house in GOCHARA_GOOD[name]

            # Vedha only ever cancels a benefic transit; a malefic one is not
            # rescued by an obstruction.
            obstructed = False
            if good:
                for src, blocker in _VEDHA_PAIRS.get(name, ()):
                    if src != house:
                        continue
                    for other in occupied.get(blocker, ()):
                        if other == name:
                            continue
                        # The classical exception: these two never obstruct
                        # each other.
                        if {name, other} == {"Sun", "Saturn"}:
                            continue
                        obstructed = True
                        break

            weight = _WEIGHT[name]
            if good and not obstructed:
                score += weight
                supports.append(name)
            elif not good:
                score -= weight
                strains.append(name)

            transits.append(
                GrahaTransit(
                    name=name,
                    sign=SIGNS[idx],
                    house=house,
                    favourable=good,
                    obstructed=obstructed,
                    retrograde=retro[name],
                )
            )

        murti_house = _house_from(sign_index_of["Moon"], janma)
        murti = _MURTI[murti_house]
        score += _MURTI_BONUS[murti]

        days.append(
            RashiDay(
                sign=SIGNS[janma],
                sign_index=janma,
                lord=SIGN_LORDS[janma],
                score=round(score, 2),
                rating=_rating(score),
                band=_band(score, _rating(score)),
                murti=murti,
                murti_house=murti_house,
                transits=transits,
                supports=supports,
                strains=strains,
                # The day's own lord decides the number and colour; the rashi
                # lord breaks the tie so twelve cards do not read identically.
                lucky_number=_GRAHA_NUMBER[
                    weekday_lord if murti in ("Swarna", "Rajata") else SIGN_LORDS[janma]
                ],
                lucky_colour=_GRAHA_COLOUR[SIGN_LORDS[janma]],
            )
        )

    return Rasifal(
        for_date=for_date,
        weekday_lord=weekday_lord,
        positions=positions,
        signs=days,
    )


# --- periods ---------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class RashiPeriod:
    """One sign across a span of days.

    A week or a month is not a longer day. The Moon crosses every house in a
    month and three or four in a week, so its daily murti averages out and
    what actually characterises the span is the slow grahas — which houses
    Saturn, Jupiter and the nodes hold from this rashi throughout. What a
    period reading can say that a daily cannot is *when*: the day inside the
    span that reads strongest, and the one to step carefully through.
    """

    sign: str
    sign_index: int
    lord: str
    score: float                  # mean of the daily scores
    rating: int
    band: str
    best_date: date
    best_rating: int
    hardest_date: date
    hardest_rating: int
    steady_supports: list[str]    # favourable on most days of the span
    steady_strains: list[str]
    golden_days: int              # days whose Moon murti is Swarna
    iron_days: int                # ... and Loha
    lucky_number: int
    lucky_colour: str


@dataclass(frozen=True, slots=True)
class PeriodRasifal:
    start: date
    end: date
    days: int
    signs: list[RashiPeriod]


# A graha counts as characterising the span when it holds the same verdict
# through most of it — anything less is a passing mood, not a theme.
_STEADY_SHARE = 0.6


def compute_period(
    start: date,
    days: int,
    tz_name: str = "Asia/Kathmandu",
    at: time = time(6, 0),
) -> PeriodRasifal:
    """Judge a span by computing every day in it and reading the aggregate.

    Every day is genuinely calculated rather than sampled: a week is seven
    swisseph runs, a month thirty, which is cheap next to being wrong about
    the day Saturn changes house.
    """
    if days < 1:
        raise ValueError("a period needs at least one day")

    dailies = [compute(start + timedelta(n), tz_name, at) for n in range(days)]
    end = start + timedelta(days - 1)

    signs: list[RashiPeriod] = []
    for i in range(12):
        per_day = [d.signs[i] for d in dailies]
        scores = [x.score for x in per_day]
        mean = sum(scores) / len(scores)

        best_at = max(range(len(per_day)), key=lambda n: per_day[n].score)
        worst_at = min(range(len(per_day)), key=lambda n: per_day[n].score)

        support_days: Counter[str] = Counter()
        strain_days: Counter[str] = Counter()
        for day in per_day:
            support_days.update(day.supports)
            strain_days.update(day.strains)

        threshold = len(per_day) * _STEADY_SHARE
        steady_supports = [g for g, n in support_days.most_common() if n >= threshold]
        steady_strains = [g for g, n in strain_days.most_common() if n >= threshold]

        signs.append(
            RashiPeriod(
                sign=SIGNS[i],
                sign_index=i,
                lord=SIGN_LORDS[i],
                score=round(mean, 2),
                rating=_rating(mean),
                band=_band(mean, _rating(mean)),
                best_date=dailies[best_at].for_date,
                best_rating=per_day[best_at].rating,
                hardest_date=dailies[worst_at].for_date,
                hardest_rating=per_day[worst_at].rating,
                steady_supports=steady_supports,
                steady_strains=steady_strains,
                golden_days=sum(1 for x in per_day if x.murti == "Swarna"),
                iron_days=sum(1 for x in per_day if x.murti == "Loha"),
                # The span's own first day sets these, so a week's card does
                # not contradict the daily card a reader saw this morning.
                lucky_number=per_day[0].lucky_number,
                lucky_colour=per_day[0].lucky_colour,
            )
        )

    return PeriodRasifal(start=start, end=end, days=days, signs=signs)
