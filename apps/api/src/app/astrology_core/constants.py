"""Classical constants. Every value here is a methodology decision.

Changing anything in this file changes chart output for every user.
Bump ENGINE_VERSION and update golden fixtures deliberately.

See docs/astrology-methodology.md for the rationale behind each choice.
"""

from __future__ import annotations

from typing import Final

# Bump on ANY change to this file or to a calculation rule. Cached charts with
# an older version are recomputed, never migrated in place.
#: 0.6.0 — सूर्य सिद्धान्त is now the default for the Sun and Moon, which is
#: what a Nepali kundali is cast from. Against four hand-cast charts it scores
#: 39/42 where the modern ephemeris scores 29/42. `build_chart(..., "drik")`
#: still gives the modern positions, and every fixture states which system it
#: was verified against.
ENGINE_VERSION: Final = "0.6.0"

DEGREES_PER_SIGN: Final = 30.0
DEGREES_PER_NAKSHATRA: Final = 360.0 / 27.0      # 13°20'
DEGREES_PER_PADA: Final = DEGREES_PER_NAKSHATRA / 4.0   # 3°20'

# Vimshottari arithmetic. Different software uses different year lengths and
# dates therefore differ by days; we state ours.
DAYS_PER_YEAR: Final = 365.25

SIGNS: Final = (
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
)

NAKSHATRAS: Final = (
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
)

# The nine grahas. Order is display order, not calculation order.
PLANETS: Final = (
    "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu",
)

# Uranus, Neptune, Pluto are not classical Vedic. Deliberately absent.

NODES: Final = frozenset({"Rahu", "Ketu"})

# --- rulership -------------------------------------------------------------
# Index into SIGNS -> ruling graha.
SIGN_LORDS: Final = (
    "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
    "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter",
)

# --- dignity ---------------------------------------------------------------
# (sign_index, exact degree). Deep exaltation / debilitation points.
EXALTATION: Final = {
    "Sun": (0, 10.0),       # Aries 10
    "Moon": (1, 3.0),       # Taurus 3
    "Mars": (9, 28.0),      # Capricorn 28
    "Mercury": (5, 15.0),   # Virgo 15
    "Jupiter": (3, 5.0),    # Cancer 5
    "Venus": (11, 27.0),    # Pisces 27
    "Saturn": (6, 20.0),    # Libra 20
}
# Debilitation is the opposite sign at the same degree.
DEBILITATION: Final = {p: ((s + 6) % 12, d) for p, (s, d) in EXALTATION.items()}

# (sign_index, start_degree, end_degree)
MOOLATRIKONA: Final = {
    "Sun": (4, 0.0, 20.0),        # Leo 0-20
    "Moon": (1, 4.0, 30.0),       # Taurus 4-30
    "Mars": (0, 0.0, 12.0),       # Aries 0-12
    "Mercury": (5, 16.0, 20.0),   # Virgo 16-20
    "Jupiter": (8, 0.0, 10.0),    # Sagittarius 0-10
    "Venus": (6, 0.0, 15.0),      # Libra 0-15
    "Saturn": (10, 0.0, 20.0),    # Aquarius 0-20
}

# Natural relationships (BPHS). Anything unlisted is neutral.
# Nodes are omitted: classical sources disagree, so we report no dignity for
# them rather than inventing one.
NATURAL_FRIENDS: Final = {
    "Sun": frozenset({"Moon", "Mars", "Jupiter"}),
    "Moon": frozenset({"Sun", "Mercury"}),
    "Mars": frozenset({"Sun", "Moon", "Jupiter"}),
    "Mercury": frozenset({"Sun", "Venus"}),
    "Jupiter": frozenset({"Sun", "Moon", "Mars"}),
    "Venus": frozenset({"Mercury", "Saturn"}),
    "Saturn": frozenset({"Mercury", "Venus"}),
}
NATURAL_ENEMIES: Final = {
    "Sun": frozenset({"Venus", "Saturn"}),
    "Moon": frozenset(),
    "Mars": frozenset({"Mercury"}),
    "Mercury": frozenset({"Moon"}),
    "Jupiter": frozenset({"Mercury", "Venus"}),
    "Venus": frozenset({"Sun", "Moon"}),
    "Saturn": frozenset({"Sun", "Moon", "Mars"}),
}

# --- combustion (asta) -----------------------------------------------------
# Degrees from the Sun. Retrograde orbs differ for Mercury and Venus.
COMBUSTION_ORB: Final = {
    "Moon": 12.0, "Mars": 17.0, "Mercury": 14.0,
    "Jupiter": 11.0, "Venus": 10.0, "Saturn": 15.0,
}
COMBUSTION_ORB_RETROGRADE: Final = {"Mercury": 12.0, "Venus": 8.0}

# --- aspects (graha drishti) -----------------------------------------------
# Houses aspected, counted inclusively from the planet's own house.
# Everything aspects the 7th; these are the additional special aspects.
SPECIAL_ASPECTS: Final = {
    "Mars": (4, 8),
    "Jupiter": (5, 9),
    "Saturn": (3, 10),
    # Documented choice: some schools give the nodes no drishti at all.
    "Rahu": (5, 9),
    "Ketu": (5, 9),
}

# --- vimshottari dasha -----------------------------------------------------
# Sequence starting from Ketu; nakshatra index mod 9 selects the starting lord.
VIMSHOTTARI_ORDER: Final = (
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
)
VIMSHOTTARI_YEARS: Final = {
    "Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7,
    "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17,
}
assert sum(VIMSHOTTARI_YEARS.values()) == 120
