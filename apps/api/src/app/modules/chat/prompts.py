# ruff: noqa: E501 -- prompt text is a verbatim port of astrologer-prompt.ts.
# Reflowing it to satisfy a line-length rule would change what the model reads,
# which is a behaviour change disguised as formatting.
"""Astrologer prompt construction. Ported from the frontend TypeScript.

Two rules govern the shape of what this module returns:

1. **The AI never calculates.** Everything here is formatting of values already
   computed by `astrology_core` (CLAUDE.md rule 1). If a degree or a date is not
   in `chart`, it does not go in the prompt.
2. **The static half must stay static.** `system_blocks()` returns the
   instructions first and the chart second so the instruction prefix can be
   cached across every request. Nothing time-varying — no `datetime.now()`, no
   request id — may appear in the static block, or the cache never hits.
"""

from __future__ import annotations

from datetime import date
from typing import Literal

from app.modules.chat.schemas import MilanContextIn
from app.modules.kundali.schemas import BirthDetailsIn, ChartOut

Language = Literal["en", "ne", "hi"]

_LANGUAGE_INSTRUCTIONS: dict[str, str] = {
    "en": "Respond ENTIRELY in clear, authentic, elegant English.",
    "ne": (
        "Respond ENTIRELY in fluent, authentic Nepali (नेपाली भाषा) using standard "
        "Devanagari script (देवनागरी लिपि). Use polite, respectful Nepali terms "
        "appropriate for a Master Astrologer (e.g., तपाईं/तपाईंको, हजुरको कुण्डली "
        "अनुसार...). Use natural Nepali astrological terms."
    ),
    "hi": (
        "Respond ENTIRELY in fluent, authentic Hindi (हिन्दी भाषा) using standard "
        "Devanagari script (देवनागरी लिपि). Use respectful Hindi terms appropriate "
        "for a Master Astrologer (e.g., आप/आपकी कुंडली, आपके लग्न भाव अनुसार...). "
        "Use natural Hindi astrological terms."
    ),
}

# Everything the model is told that does not depend on whose chart it is. Kept
# verbatim from astrologer-prompt.ts so behaviour does not shift with the port.
_INSTRUCTIONS = """You are Nakhatra's Master Astrologer (Jyotish Acharya), conducting an authoritative, compassionate, and precise 1-on-1 Vedic consultation.

RESPONSE FORMAT & MARKDOWN STYLING GUIDELINES (CRITICAL):
1. USE RICH MARKDOWN FORMATTING IN YOUR RESPONSE:
   - Use bold markdown text (`**term**`) for key astrological terms, planets, house lords, and dasha periods.
   - Use Markdown Headings (`### Heading Title`) to break long answers into clear sections.
   - Use Bulleted lists (`- Item`) or Numbered lists (`1. Step`) for remedies, key points, and timelines.
   - Use inline code or quotes (`> quote`) when specifying exact degrees or classical shloka insights.

2. DYNAMIC STRUCTURE BASED ON USER INTENT:
   - For detailed questions, career shift inquiries, relationship analysis, or comprehensive readings, structure your response with clear Markdown sections:
     ### Executive Astrological Insight
     (Summary of the overall planetary theme and current timing)

     ### Planetary Placements & House Dynamics
     (Detailed analysis of house lords, planetary dignities, aspects, retrogrades, and yogas)

     ### Dasha Timeline & Life Timing
     (Specific breakdown of active Mahadasha & Antardasha influences)

     ### Actionable Vedic Remedies & Guidance
     (Specific recommended gemstones, mantras, fasting/donations, and lifestyle advice)

   - For quick or simple conversational questions, provide a clear, warm, 2-4 sentence explanation using bold terms for readability.

3. ASTROLOGICAL GROUNDING:
   - Ground every observation strictly in the actual D1 Lagna, Moon sign, Nakshatra, House Lords, and Vimshottari Dasha periods supplied in the chart block.
   - Do NOT invent or guess planetary positions, transits, or dates outside the verified chart payload. The chart is computed by an ephemeris; you are reading it, not deriving it.

4. ETHICAL ASTROLOGER CONDUCT:
   - Maintain a serene, wise, reassuring tone. Frame challenging dasha periods or malefic transits constructively as learning phases requiring patience, remedies, and spiritual grounding.
   - NEVER make fatalistic predictions about death, lifespan, or terminal illness.

Respond ONLY in valid JSON, with no prose before or after it:
{
  "text": "Your complete markdown-formatted astrological response string here...",
  "astrologicalBasis": "Concise summary tag (e.g., 10th House Virgo · Exalted Mercury in D1)",
  "highlightHouse": 10
}"""


def system_blocks(
    chart: ChartOut,
    birth: BirthDetailsIn,
    language: Language = "en",
    milan: MilanContextIn | None = None,
) -> list[dict]:
    """System prompt as cacheable blocks: stable instructions, then this chart.

    The `cache_control` marker ends the cacheable prefix. Everything before it is
    identical for every user, so it is billed at the cache rate from the second
    request onwards; the chart after it is not.
    """
    return [
        {
            "type": "text",
            "text": _INSTRUCTIONS,
            "cache_control": {"type": "ephemeral"},
        },
        {
            "type": "text",
            "text": (
                f"LANGUAGE REQUIREMENT (CRITICAL):\n"
                f"{_LANGUAGE_INSTRUCTIONS.get(language, _LANGUAGE_INSTRUCTIONS['en'])}\n\n"
                f"=== COMPLETE VERIFIED SIDEREAL ASTRONOMICAL BIRTH CHART & DASHA DATA ===\n"
                f"{format_chart_for_ai(chart, birth)}\n"
                f"{_milan_section(milan)}"
                f"========================================================================"
            ),
        },
    ]


def format_chart_for_ai(chart: ChartOut, birth: BirthDetailsIn, today: date | None = None) -> str:
    """The computed chart as structured text. Formatting only — no astrology.

    `today` is a parameter rather than a `date.today()` call inside, so the
    output is a function of its inputs and the golden tests can pin it.
    """
    sections = [
        _birth_section(birth),
        _lagna_section(chart),
        _planets_section(chart),
        _panchang_section(chart),
        _avakhada_section(chart),
        _vargas_section(chart),
        _dasha_section(chart, today or date.today()),
    ]
    return "\n\n".join(s for s in sections if s)


def _birth_section(birth: BirthDetailsIn) -> str:
    return (
        "=== SEEKER VERIFIED BIRTH DATA ===\n"
        f"• Full Name: {birth.name}\n"
        f"• Moment of Birth: {birth.date} at {birth.time} ({birth.time_accuracy})\n"
        f"• Birthplace: {birth.place_label} "
        f"(Lat: {birth.latitude}°, Lng: {birth.longitude}°, Timezone: {birth.tz_name})"
    )


def _lagna_section(chart: ChartOut) -> str:
    houses = "\n".join(
        f"  - House {h.number}: {h.sign} (Lord: {h.lord}"
        + (f", Occupants: {', '.join(h.occupants)}" if h.occupants else "")
        + ")"
        for h in chart.houses
    )
    return (
        "=== D1 RASHI ASCENDANT (LAGNA) ===\n"
        f"• Lagna Ascendant Sign: {chart.lagna_sign} ({chart.lagna_degree:.3f}°)\n"
        "• House Cusps:\n"
        f"{houses or '  N/A'}"
    )


def _planets_section(chart: ChartOut) -> str:
    lines = []
    for p in chart.planets:
        line = (
            f"• {p.name}: {p.sign} at {p.degree_in_sign:.3f}° | House {p.house} "
            f"| Sign Index {p.sign_index}"
        )
        if p.retrograde:
            line += " | [RETROGRADE ℞]"
        if p.combust:
            line += " | [COMBUST]"
        # Null dignity is meaningful — the engine declines to invent one for Rahu
        # and Ketu — so omit the field rather than printing "None".
        if p.dignity:
            line += f" | Dignity: {p.dignity}"
        if p.avastha:
            line += f" | Avastha: {p.avastha}"
        lines.append(line)
    return "=== ALL PLANETARY COORDINATES & STATES ===\n" + ("\n".join(lines) or "N/A")


def _panchang_section(chart: ChartOut) -> str:
    p = chart.panchang
    return (
        "=== PANCHANG ASTRONOMICAL METRICS ===\n"
        f"• Tithi: {p.tithi_name} (Index {p.tithi_index}, {p.paksha} Paksha)\n"
        f"• Nakshatra: {p.nakshatra} (Pada {p.nakshatra_pada}, Lord: {p.nakshatra_lord})\n"
        f"• Yoga: {p.yoga} | Karana: {p.karana}\n"
        f"• Vara: {p.vara} (Lord: {p.vara_lord})\n"
        f"• Moon Sign: {p.moon_sign} (Lord: {p.moon_sign_lord})"
    )


def _avakhada_section(chart: ChartOut) -> str:
    a = chart.avakhada
    return (
        "=== AVAKHADA CHAKRA & ATMA QUALITIES ===\n"
        f"• Varna: {a.varna}\n"
        f"• Vashya: {a.vashya}\n"
        f"• Yoni: {a.yoni}\n"
        f"• Gana: {a.gana}\n"
        f"• Nadi: {a.nadi}\n"
        f"• Sign: {a.sign}\n"
        f"• Nakshatra: {a.nakshatra} (Charan {a.charan})"
    )


def _vargas_section(chart: ChartOut) -> str:
    if not chart.vargas:
        return ""
    lines = "\n".join(
        f"• {v.code} ({v.name}): Lagna in {v.lagna_sign} | Placements: "
        + ", ".join(f"{p.planet} in H{p.house}" for p in v.placements)
        for v in chart.vargas
    )
    return f"=== DIVISIONAL VARGA CHARTS ===\n{lines}"


def _dasha_section(chart: ChartOut, today: date) -> str:
    """The timeline, with the running periods named.

    Without this the model was asked which dasha is current while being told
    neither today's date nor which period contains it — so it answered with the
    first row in the list, and a chart could be reported as sitting in a
    mahadasha that ended in 2013. The engine knows; it just was not saying.
    """
    if not chart.dasha.periods:
        return ""

    lines = []
    for d in chart.dasha.periods:
        running = d.start <= today <= d.end
        line = f"• {d.lord} Level {d.level} Dasha: {d.start} ➔ {d.end}"
        if running:
            line += "   <<< RUNNING NOW"
        lines.append(line)
        # Only the running mahadasha's children are worth the tokens; the
        # antardashas of a period that ended in 1997 are noise.
        if running:
            for c in d.children:
                sub_running = c.start <= today <= c.end
                lines.append(
                    f"    - {c.lord} Level {c.level} Antardasha: {c.start} ➔ {c.end}"
                    + ("   <<< RUNNING NOW" if sub_running else "")
                )

    current = _running_names(chart, today)
    return (
        "=== VIMSHOTTARI DASHA TIME LORDS TIMELINE ===\n"
        f"• Today: {today.isoformat()}\n"
        f"• Birth Lord: {chart.dasha.birth_lord} "
        f"(balance {chart.dasha.balance_years:.2f} years)\n"
        f"• RUNNING NOW: {current}\n" + "\n".join(lines)
    )


def _running_names(chart: ChartOut, today: date) -> str:
    """`Saturn Mahadasha ➔ Mercury Antardasha`, or a plain statement of absence.

    Stated once, in words, at the top. Leaving the model to scan the timeline
    for the row whose range contains today is exactly the arithmetic it should
    never be doing (CLAUDE.md rule 1).
    """
    maha = next((d for d in chart.dasha.periods if d.start <= today <= d.end), None)
    if maha is None:
        return "none — today falls outside the computed timeline"
    antar = next((c for c in maha.children if c.start <= today <= c.end), None)
    if antar is None:
        return f"{maha.lord} Mahadasha"
    return f"{maha.lord} Mahadasha ➔ {antar.lord} Antardasha"


def _milan_section(milan: MilanContextIn | None) -> str:
    """The finished match, when the conversation came from one.

    Appended after the chart rather than woven into it, so a single-chart
    conversation produces byte-identical text and keeps its cache hit.
    Every figure was computed by `astrology_core.milan`.
    """
    if milan is None:
        return ""

    lines = [
        "",
        "=== ASHTAKOOTA MARRIAGE MATCH (ALREADY CALCULATED — READ, NEVER RECOMPUTE) ===",
        f"• Partner: {milan.partner_name or 'the partner'}",
    ]
    if milan.total_guna is not None and milan.max_guna:
        lines.append(
            f"• Total: {milan.total_guna:g} of {milan.max_guna:g} gunas"
            + (f" ({milan.verdict})" if milan.verdict else "")
        )
    lines += [f"• {k.name}: {k.obtained:g}/{k.max_points:g}" for k in milan.kutas]
    if milan.manglik_note:
        lines.append(f"• Mangal dosha: {milan.manglik_note}")

    if milan.partner_chart is not None:
        pc = milan.partner_chart
        lines += [
            "",
            f"=== PARTNER'S CHART ({milan.partner_name or 'partner'}) ===",
            f"• Lagna: {pc.lagna_sign} ({pc.lagna_degree:.3f}°)",
        ]
        lines += [
            f"• {p.name}: {p.sign} at {p.degree_in_sign:.3f}° | House {p.house}"
            + (" | [RETROGRADE]" if p.retrograde else "")
            for p in pc.planets
        ]
    lines.append("")
    return "\n".join(lines)
