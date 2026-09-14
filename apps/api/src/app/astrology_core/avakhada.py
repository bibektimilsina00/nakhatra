"""Avakhada Chakra — the traditional birth-attribute table.

Everything here derives from two facts already in the chart: the Moon's
nakshatra (with its pada) and the Moon's sign. Nothing is invented.

Verified against an independent implementation (AstroTalk) for a Mula/pada-2,
Sagittarius-Moon chart: Varna Kshatriya, Vashya Nara, Yoni Dog, Gana Rakshasa,
Nadi Adi, Sign Sagittarius, Sign Lord Jupiter, Charan 2, Tatva Fire,
Name syllable "Yo", Yunja Antya. All eleven reproduce.

**Paya is deliberately absent.** Reference implementations show it, but the
rules in circulation disagree — counted from the lagna, from the janma rashi,
or from the nakshatra — and they give different metals for the same chart. The
engine does not invent a value it cannot defend; see the same decision for the
nodes' dignity in chart.py.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.astrology_core.constants import DEGREES_PER_SIGN, NAKSHATRAS, SIGN_LORDS, SIGNS
from app.astrology_core.nakshatra import nakshatra_at

# Sign index -> element. Fire, Earth, Air, Water repeating from Aries.
TATVA = tuple(("Fire", "Earth", "Air", "Water")[i % 4] for i in range(12))

# Varna follows the element of the Moon sign.
_VARNA_BY_TATVA = {
    "Water": "Brahmin",
    "Fire": "Kshatriya",
    "Earth": "Vaishya",
    "Air": "Shudra",
}

# Vashya by Moon sign. Sagittarius and Capricorn split at 15 degrees, which is
# why this needs the degree and not just the sign.
_VASHYA = (
    "Chatushpad", "Chatushpad", "Nara", "Jalachar", "Vanchar", "Nara",
    "Nara", "Keeta", "Nara", "Chatushpad", "Nara", "Jalachar",
)
_VASHYA_SECOND_HALF = {8: "Chatushpad", 9: "Jalachar"}  # Sagittarius, Capricorn

_YONI = (
    "Horse", "Elephant", "Sheep", "Serpent", "Serpent", "Dog",
    "Cat", "Sheep", "Cat", "Rat", "Rat", "Cow",
    "Buffalo", "Tiger", "Buffalo", "Tiger", "Deer", "Deer",
    "Dog", "Monkey", "Mongoose", "Monkey", "Lion", "Horse",
    "Lion", "Cow", "Elephant",
)

_GANA = (
    "Deva", "Manushya", "Rakshasa", "Manushya", "Deva", "Manushya",
    "Deva", "Deva", "Rakshasa", "Rakshasa", "Manushya", "Manushya",
    "Deva", "Rakshasa", "Deva", "Rakshasa", "Deva", "Rakshasa",
    "Rakshasa", "Manushya", "Manushya", "Deva", "Rakshasa", "Rakshasa",
    "Manushya", "Manushya", "Deva",
)

_NADI = (
    "Adi", "Madhya", "Antya", "Antya", "Madhya", "Adi",
    "Adi", "Madhya", "Antya", "Antya", "Madhya", "Adi",
    "Adi", "Madhya", "Antya", "Antya", "Madhya", "Adi",
    "Adi", "Madhya", "Antya", "Antya", "Madhya", "Adi",
    "Adi", "Madhya", "Antya",
)

# The syllable traditionally used to name a child, one per nakshatra pada.
_NAME_SYLLABLES = (
    ("Chu", "Che", "Cho", "La"), ("Li", "Lu", "Le", "Lo"), ("A", "I", "U", "E"),
    ("O", "Va", "Vi", "Vu"), ("Ve", "Vo", "Ka", "Ki"), ("Ku", "Gha", "Ing", "Chha"),
    ("Ke", "Ko", "Ha", "Hi"), ("Hu", "He", "Ho", "Da"), ("Di", "Du", "De", "Do"),
    ("Ma", "Mi", "Mu", "Me"), ("Mo", "Ta", "Ti", "Tu"), ("Te", "To", "Pa", "Pi"),
    ("Pu", "Sha", "Na", "Tha"), ("Pe", "Po", "Ra", "Ri"), ("Ru", "Re", "Ro", "Ta"),
    ("Ti", "Tu", "Te", "To"), ("Na", "Ni", "Nu", "Ne"), ("No", "Ya", "Yi", "Yu"),
    ("Ye", "Yo", "Bha", "Bhi"), ("Bhu", "Dha", "Pha", "Dha"), ("Bhe", "Bho", "Ja", "Ji"),
    # Shravana follows the Nepali patro convention (खी खू खे खो). The
    # Ju/Je/Jo/Gha variant circulates in Indian software (AstroTalk among
    # them); Nakhatra's readers check against a patro, so the patro wins.
    # Decided 2026-09; the rasifal's RASHI_SYLLABLES table matches.
    ("Khi", "Khu", "Khe", "Kho"), ("Ga", "Gi", "Gu", "Ge"), ("Go", "Sa", "Si", "Su"),
    ("Se", "So", "Da", "Di"), ("Du", "Tha", "Jha", "Tra"), ("De", "Do", "Cha", "Chi"),
)


@dataclass(frozen=True, slots=True)
class Avakhada:
    varna: str
    vashya: str
    yoni: str
    gana: str
    nadi: str
    sign: str
    sign_lord: str
    charan: int          # the Moon's nakshatra pada, 1-4
    tatva: str
    nakshatra: str
    name_syllable: str
    yunja: str


def build_avakhada(moon_longitude: float) -> Avakhada:
    lon = moon_longitude % 360.0
    sign_index = int(lon // DEGREES_PER_SIGN)
    degree_in_sign = lon - sign_index * DEGREES_PER_SIGN
    nak = nakshatra_at(lon)
    tatva = TATVA[sign_index]

    vashya = _VASHYA[sign_index]
    if degree_in_sign >= 15.0 and sign_index in _VASHYA_SECOND_HALF:
        vashya = _VASHYA_SECOND_HALF[sign_index]

    return Avakhada(
        varna=_VARNA_BY_TATVA[tatva],
        vashya=vashya,
        yoni=_YONI[nak.index],
        gana=_GANA[nak.index],
        nadi=_NADI[nak.index],
        sign=SIGNS[sign_index],
        sign_lord=SIGN_LORDS[sign_index],
        charan=nak.pada,
        tatva=tatva,
        nakshatra=NAKSHATRAS[nak.index],
        name_syllable=_NAME_SYLLABLES[nak.index][nak.pada - 1],
        # Adya / Madhya / Antya by thirds of the nakshatra cycle.
        yunja=("Adya", "Madhya", "Antya")[nak.index // 9],
    )
