"""Vedic Matchmaking (Kundali Milan) Calculation Engine.

Implements 36-Guna Ashta Kuta matching and Manglik (Kuja) Dosha analysis.
Pure Python algorithm with zero external framework dependencies.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

# --- CONSTANTS & TABLES ---

# 1. VARNA (1 Point)
# Rashi Varna: 1=Brahmin, 2=Kshatriya, 3=Vaishya, 4=Shudra
# Cancer(4), Scorpio(8), Pisces(12) -> Brahmin (4)
# Aries(1), Leo(5), Sag(9) -> Kshatriya (3)
# Taurus(2), Virgo(6), Cap(10) -> Vaishya (2)
# Gemini(3), Libra(7), Aqua(11) -> Shudra (1)
RASHI_VARNA_GRADE: dict[int, int] = {
    4: 4, 8: 4, 12: 4,  # Brahmin
    1: 3, 5: 3, 9: 3,   # Kshatriya
    2: 2, 6: 2, 10: 2,  # Vaishya
    3: 1, 7: 1, 11: 1,  # Shudra
}

VARNA_NAMES = {4: "Brahmin", 3: "Kshatriya", 2: "Vaishya", 1: "Shudra"}


# 2. VASHYA (2 Points)
# Rashi Vashya classification
# 1: Chatushpada (Quadruped), 2: Manav (Human), 3: Jalachara (Water),
# 4: Vanchara (Wild), 5: Keeta (Insect)
def get_vashya_type(rashi: int) -> str:
    if rashi in (1, 2):  # Aries, Taurus
        return "Chatushpada"
    if rashi in (3, 6, 7, 11):  # Gemini, Virgo, Libra, Aquarius
        return "Manav"
    if rashi in (4, 12):  # Cancer, Pisces
        return "Jalachara"
    if rashi == 5:  # Leo
        return "Vanchara"
    if rashi == 8:  # Scorpio
        return "Keeta"
    if rashi in (9, 10):  # Sagittarius, Capricorn
        return "Chatushpada"
    return "Manav"


# 3. YONI (4 Points)
# 27 Nakshatras mapped to 14 Yonis (Animals)
# 1: Ashwini(Horse), 2: Bharani(Elephant), 3: Krittika(Sheep), 4: Rohini(Serpent),
# 5: Mrigashira(Snake), 6: Ardra(Dog), 7: Punarvasu(Cat), 8: Pushya(Ram/Sheep),
# 9: Ashlesha(Cat), 10: Magha(Rat), 11: Purva Phalguni(Rat), 12: Uttara Phalguni(Cow),
# 13: Hasta(Buffalo), 14: Chitra(Tiger), 15: Swati(Buffalo), 16: Vishakha(Tiger),
# 17: Anuradha(Deer), 18: Jyeshtha(Deer), 19: Moola(Dog), 20: Purva Ashadha(Monkey),
# 21: Uttara Ashadha(Mongoose), 22: Shravana(Monkey), 23: Dhanishta(Lion),
# 24: Shatabhisha(Horse), 25: Purva Bhadrapada(Lion),
# 26: Uttara Bhadrapada(Cow), 27: Revati(Elephant)
NAKSHATRA_YONI: dict[int, str] = {
    1: "Horse", 2: "Elephant", 3: "Sheep", 4: "Serpent", 5: "Serpent",
    6: "Dog", 7: "Cat", 8: "Sheep", 9: "Cat", 10: "Rat",
    11: "Rat", 12: "Cow", 13: "Buffalo", 14: "Tiger", 15: "Buffalo",
    16: "Tiger", 17: "Deer", 18: "Deer", 19: "Dog", 20: "Monkey",
    21: "Mongoose", 22: "Monkey", 23: "Lion", 24: "Horse", 25: "Lion",
    26: "Cow", 27: "Elephant",
}

# Enemy Yoni Pairs (0 Points)
YONI_ENEMIES = {
    ("Horse", "Buffalo"), ("Buffalo", "Horse"),
    ("Elephant", "Lion"), ("Lion", "Elephant"),
    ("Sheep", "Monkey"), ("Monkey", "Sheep"),
    ("Serpent", "Mongoose"), ("Mongoose", "Serpent"),
    ("Dog", "Deer"), ("Deer", "Dog"),
    ("Cat", "Rat"), ("Rat", "Cat"),
    ("Cow", "Tiger"), ("Tiger", "Cow"),
}

# Friendly Yoni Pairs (3 Points)
YONI_FRIENDS = {
    ("Horse", "Stallion"), ("Elephant", "Elephant"),
}


# 4. GRAHA MAITRI (5 Points)
# Moon Rashi Lords
RASHI_LORDS = {
    1: "Mars", 2: "Venus", 3: "Mercury", 4: "Moon", 5: "Sun", 6: "Mercury",
    7: "Venus", 8: "Mars", 9: "Jupiter", 10: "Saturn", 11: "Saturn", 12: "Jupiter",
}

# Planetary Friendship Table (Friend=1, Neutral=0, Enemy=-1)
PLANET_FRIENDS: dict[str, dict[str, int]] = {
    "Sun": {"Sun": 1, "Moon": 1, "Mars": 1, "Jupiter": 1, "Mercury": 0, "Venus": -1, "Saturn": -1},
    "Moon": {"Sun": 1, "Moon": 1, "Mercury": 1, "Mars": 0, "Jupiter": 0, "Venus": 0, "Saturn": 0},
    "Mars": {"Sun": 1, "Moon": 1, "Jupiter": 1, "Venus": 0, "Saturn": 0, "Mercury": -1},
    "Mercury": {"Sun": 1, "Venus": 1, "Mars": 0, "Jupiter": 0, "Saturn": 0, "Moon": -1},
    "Jupiter": {
        "Sun": 1, "Moon": 1, "Mars": 1, "Mercury": -1, "Venus": -1,
        "Saturn": 0, "Jupiter": 1,
    },
    "Venus": {
        "Mercury": 1, "Saturn": 1, "Mars": 0, "Jupiter": 0,
        "Sun": -1, "Moon": -1, "Venus": 1,
    },
    "Saturn": {
        "Mercury": 1, "Venus": 1, "Jupiter": 0, "Sun": -1,
        "Moon": -1, "Mars": -1, "Saturn": 1,
    },
}


# 5. GANA (6 Points)
# 27 Nakshatras mapped to 1: Deva, 2: Manushya, 3: Rakshasa
NAKSHATRA_GANA: dict[int, str] = {
    1: "Deva", 2: "Manushya", 3: "Rakshasa", 4: "Manushya", 5: "Deva",
    6: "Manushya", 7: "Deva", 8: "Deva", 9: "Rakshasa", 10: "Rakshasa",
    11: "Manushya", 12: "Manushya", 13: "Deva", 14: "Rakshasa", 15: "Deva",
    16: "Rakshasa", 17: "Deva", 18: "Rakshasa", 19: "Rakshasa", 20: "Manushya",
    21: "Manushya", 22: "Deva", 23: "Rakshasa", 24: "Rakshasa", 25: "Manushya",
    26: "Manushya", 27: "Deva",
}


# 6. NADI (8 Points)
# 1: Adi (Vata), 2: Madhya (Pitta), 3: Antya (Kapha)
NAKSHATRA_NADI: dict[int, str] = {
    1: "Adi", 2: "Madhya", 3: "Antya", 4: "Rohini-Antya", 5: "Madhya",
    6: "Adi", 7: "Adi", 8: "Madhya", 9: "Antya", 10: "Antya",
    11: "Madhya", 12: "Adi", 13: "Adi", 14: "Madhya", 15: "Antya",
    16: "Antya", 17: "Madhya", 18: "Adi", 19: "Adi", 20: "Madhya",
    21: "Antya", 22: "Antya", 23: "Madhya", 24: "Adi", 25: "Adi",
    26: "Madhya", 27: "Antya",
}


def get_nadi(nak_idx: int) -> str:
    # 27 nakshatras cycle in 1,2,3, 3,2,1 pattern or standard 3-nadi sequence:
    # Adi: 1, 6, 7, 12, 13, 18, 19, 24, 25
    # Madhya: 2, 5, 8, 11, 14, 17, 20, 23, 26
    # Antya: 3, 4, 9, 10, 15, 16, 21, 22, 27
    if nak_idx in (1, 6, 7, 12, 13, 18, 19, 24, 25):
        return "Adi"
    if nak_idx in (2, 5, 8, 11, 14, 17, 20, 23, 26):
        return "Madhya"
    return "Antya"


# --- MATCHING DATA MODELS ---

@dataclass
class KutaResult:
    name: str
    obtained: float
    max_points: float
    description: str
    # The koota's stable identifier and the two Sanskrit terms it compared.
    # `description` stays an English sentence for older clients; these let a
    # client render the same fact in Nepali or Hindi.
    key: str = ""
    groom_value: str = ""
    bride_value: str = ""


@dataclass
class ManglikAnalysis:
    is_manglik: bool
    manglik_houses: list[int]
    severity: str  # High, Moderate, Low, None
    is_canceled: bool
    cancellation_reason: str | None = None


# --- CALCULATION ENGINE ---

def calculate_varna(groom_rashi: int, bride_rashi: int) -> KutaResult:
    g_grade = RASHI_VARNA_GRADE.get(groom_rashi, 1)
    b_grade = RASHI_VARNA_GRADE.get(bride_rashi, 1)
    pts = 1.0 if g_grade >= b_grade else 0.0
    desc = f"Groom ({VARNA_NAMES[g_grade]}) & Bride ({VARNA_NAMES[b_grade]}). "
    desc += "Compatible Varna." if pts == 1.0 else "Incompatible Varna."
    return KutaResult("Varna", pts, 1.0, desc, "varna", VARNA_NAMES[g_grade], VARNA_NAMES[b_grade])


def calculate_vashya(groom_rashi: int, bride_rashi: int) -> KutaResult:
    g_v = get_vashya_type(groom_rashi)
    b_v = get_vashya_type(bride_rashi)
    if g_v == b_v:
        pts = 2.0
    elif (g_v, b_v) in [("Manav", "Chatushpada"), ("Chatushpada", "Manav")]:
        pts = 1.0
    else:
        pts = 0.5 if groom_rashi == bride_rashi else 0.0

    desc = f"Groom Vashya: {g_v}, Bride Vashya: {b_v}."
    return KutaResult("Vashya", pts, 2.0, desc, "vashya", g_v, b_v)


def calculate_tara(groom_nak_idx: int, bride_nak_idx: int) -> KutaResult:
    # Nakshatra distance calculation
    dist1 = (groom_nak_idx - bride_nak_idx) % 9
    dist2 = (bride_nak_idx - groom_nak_idx) % 9
    good_taras = (1, 2, 4, 6, 8, 0)
    is_g_good = dist1 in good_taras
    is_b_good = dist2 in good_taras

    if is_g_good and is_b_good:
        pts = 3.0
    elif is_g_good or is_b_good:
        pts = 1.5
    else:
        pts = 0.0

    desc = f"Tara Compatibility score: {pts}/3."
    return KutaResult("Tara", pts, 3.0, desc, "tara", "", "")


def calculate_yoni(groom_nak_idx: int, bride_nak_idx: int) -> KutaResult:
    g_y = NAKSHATRA_YONI.get(groom_nak_idx, "Horse")
    b_y = NAKSHATRA_YONI.get(bride_nak_idx, "Elephant")

    if g_y == b_y:
        pts = 4.0
    elif (g_y, b_y) in YONI_ENEMIES:
        pts = 0.0
    elif (g_y, b_y) in YONI_FRIENDS:
        pts = 3.0
    else:
        pts = 2.0

    desc = f"Groom Yoni: {g_y}, Bride Yoni: {b_y}."
    return KutaResult("Yoni", pts, 4.0, desc, "yoni", g_y, b_y)


def calculate_graha_maitri(groom_rashi: int, bride_rashi: int) -> KutaResult:
    g_lord = RASHI_LORDS.get(groom_rashi, "Mars")
    b_lord = RASHI_LORDS.get(bride_rashi, "Venus")

    if g_lord == b_lord:
        pts = 5.0
    else:
        rel1 = PLANET_FRIENDS.get(g_lord, {}).get(b_lord, 0)
        rel2 = PLANET_FRIENDS.get(b_lord, {}).get(g_lord, 0)

        if rel1 == 1 and rel2 == 1:
            pts = 5.0
        elif (rel1 == 1 and rel2 == 0) or (rel1 == 0 and rel2 == 1):
            pts = 4.0
        elif rel1 == 0 and rel2 == 0:
            pts = 3.0
        elif (rel1 == 1 and rel2 == -1) or (rel1 == -1 and rel2 == 1):
            pts = 1.0
        else:
            pts = 0.0

    desc = f"Groom Moon Lord: {g_lord}, Bride Moon Lord: {b_lord}."
    return KutaResult("Graha Maitri", pts, 5.0, desc, "graha_maitri", g_lord, b_lord)


def calculate_gana(groom_nak_idx: int, bride_nak_idx: int) -> KutaResult:
    g_g = NAKSHATRA_GANA.get(groom_nak_idx, "Deva")
    b_g = NAKSHATRA_GANA.get(bride_nak_idx, "Deva")

    if g_g == b_g or g_g == "Deva" and b_g == "Manushya":
        pts = 6.0
    elif g_g == "Manushya" and b_g == "Deva":
        pts = 5.0
    elif g_g == "Deva" and b_g == "Rakshasa":
        pts = 1.0
    elif g_g == "Rakshasa" and b_g == "Deva":
        pts = 0.0
    else:
        pts = 0.0

    desc = f"Groom Gana: {g_g}, Bride Gana: {b_g}."
    return KutaResult("Gana", pts, 6.0, desc, "gana", g_g, b_g)


def calculate_bhakoot(groom_rashi: int, bride_rashi: int) -> KutaResult:
    # Relative positions (1/1, 2/12, 3/11, 4/10, 5/9, 6/8, 7/7)
    rel = (groom_rashi - bride_rashi) % 12
    if rel == 0:
        rel = 12

    # Malefic Bhakoots: 2/12, 5/9, 6/8
    if rel in (2, 12, 5, 9, 6, 8):
        # Cancellation rule: if same Rashi Lord or friendly lords
        g_lord = RASHI_LORDS.get(groom_rashi)
        b_lord = RASHI_LORDS.get(bride_rashi)
        if g_lord == b_lord:
            pts = 7.0
            desc = "Bhakoot Dosha canceled due to identical Rashi lords."
        else:
            pts = 0.0
            desc = f"Bhakoot Dosha present ({rel}/{(14-rel)%12} relation)."
    else:
        pts = 7.0
        desc = "Favorable Bhakoot relation."

    return KutaResult("Bhakoot", pts, 7.0, desc, "bhakoot", str(rel), str((14 - rel) % 12))


def calculate_nadi(groom_nak_idx: int, bride_nak_idx: int) -> KutaResult:
    g_n = get_nadi(groom_nak_idx)
    b_n = get_nadi(bride_nak_idx)

    if g_n != b_n:
        pts = 8.0
        desc = f"Groom Nadi: {g_n}, Bride Nadi: {b_n}. No Nadi Dosha."
    else:
        pts = 0.0
        desc = f"Nadi Dosha present! Both Groom and Bride have {g_n} Nadi."

    return KutaResult("Nadi", pts, 8.0, desc, "nadi", g_n, b_n)


# --- MANGLIK DOSHA DETECTOR ---

def analyze_manglik_dosha(mars_house: int, moon_mars_house: int | None = None) -> ManglikAnalysis:
    """Analyze Manglik (Kuja) Dosha from Lagna and Moon."""
    dosha_houses = {1, 4, 7, 8, 12}
    houses = []
    if mars_house in dosha_houses:
        houses.append(mars_house)
    if moon_mars_house and moon_mars_house in dosha_houses and moon_mars_house not in houses:
        houses.append(moon_mars_house)

    is_manglik = len(houses) > 0
    if not is_manglik:
        return ManglikAnalysis(
            is_manglik=False, manglik_houses=[], severity="None", is_canceled=False
        )

    severity = "High" if 7 in houses or 8 in houses else "Moderate"
    return ManglikAnalysis(
        is_manglik=True,
        manglik_houses=houses,
        severity=severity,
        is_canceled=False,
    )


def match_kundalis(
    groom_rashi: int,
    groom_nak_idx: int,
    groom_mars_house: int,
    bride_rashi: int,
    bride_nak_idx: int,
    bride_mars_house: int,
) -> dict[str, Any]:
    """Execute complete 36-Guna Ashta Kuta & Manglik Dosha match synthesis."""
    varna = calculate_varna(groom_rashi, bride_rashi)
    vashya = calculate_vashya(groom_rashi, bride_rashi)
    tara = calculate_tara(groom_nak_idx, bride_nak_idx)
    yoni = calculate_yoni(groom_nak_idx, bride_nak_idx)
    graha_maitri = calculate_graha_maitri(groom_rashi, bride_rashi)
    gana = calculate_gana(groom_nak_idx, bride_nak_idx)
    bhakoot = calculate_bhakoot(groom_rashi, bride_rashi)
    nadi = calculate_nadi(groom_nak_idx, bride_nak_idx)

    kutas = [varna, vashya, tara, yoni, graha_maitri, gana, bhakoot, nadi]
    total_score = sum(k.obtained for k in kutas)

    groom_manglik = analyze_manglik_dosha(groom_mars_house)
    bride_manglik = analyze_manglik_dosha(bride_mars_house)

    # Manglik Cancellation rule: If BOTH groom and bride are Manglik, the dosha cancels out
    manglik_canceled = False
    cancellation_reason = None
    if groom_manglik.is_manglik and bride_manglik.is_manglik:
        manglik_canceled = True
        cancellation_reason = "Both partners are Manglik; Kuja Dosha is mutually neutralized."
        groom_manglik.is_canceled = True
        groom_manglik.cancellation_reason = cancellation_reason
        bride_manglik.is_canceled = True
        bride_manglik.cancellation_reason = cancellation_reason

    # Overall Recommendation
    if total_score >= 28:
        recommendation = "Excellent Match (Uttam)"
        verdict = "uttam"
    elif total_score >= 18:
        recommendation = "Good Match (Madhyam)"
        verdict = "madhyam"
    else:
        recommendation = "Low Guna Match (Varjya)"
        verdict = "varjya"

    return {
        "total_guna": total_score,
        "max_guna": 36.0,
        "percentage": round((total_score / 36.0) * 100, 1),
        "recommendation": recommendation,
        "verdict": verdict,
        "kutas": [
            {
                "name": k.name,
                "obtained": k.obtained,
                "max_points": k.max_points,
                "description": k.description,
                "key": k.key,
                "groom_value": k.groom_value,
                "bride_value": k.bride_value,
            }
            for k in kutas
        ],
        "groom_manglik": {
            "is_manglik": groom_manglik.is_manglik,
            "houses": groom_manglik.manglik_houses,
            "severity": groom_manglik.severity,
            "is_canceled": groom_manglik.is_canceled,
            "cancellation_reason": groom_manglik.cancellation_reason,
        },
        "bride_manglik": {
            "is_manglik": bride_manglik.is_manglik,
            "houses": bride_manglik.manglik_houses,
            "severity": bride_manglik.severity,
            "is_canceled": bride_manglik.is_canceled,
            "cancellation_reason": bride_manglik.cancellation_reason,
        },
        "manglik_compatibility": {
            "compatible": not (groom_manglik.is_manglik ^ bride_manglik.is_manglik)
            or manglik_canceled,
            "canceled": manglik_canceled,
            # Additive key for the same finding `reason` states in English.
            "reason_key": (
                "both_manglik"
                if manglik_canceled
                else "neither"
                if not groom_manglik.is_manglik and not bride_manglik.is_manglik
                else "one_sided"
            ),
            "reason": cancellation_reason
            or (
                "Both Non-Manglik"
                if not groom_manglik.is_manglik and not bride_manglik.is_manglik
                else "One partner is Manglik while the other is not."
            ),
        },
    }
