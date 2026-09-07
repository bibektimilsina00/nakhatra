# ruff: noqa: E501 -- prompt text is read by the model, not by a linter. Reflowing
# it to satisfy a line-length rule would change what the model reads.
"""Prompt for the Kundali Milan analysis.

Same two rules as every other prompt module here:

1. **The AI never calculates.** Every koota score, every Manglik house, every
   planetary position below was produced by `astrology_core`. The model reads
   and interprets; it does not derive (CLAUDE.md rule 1).
2. **The static half stays static.** `system_blocks()` puts the instructions
   first, cached, and the couple's data second. Nothing time-varying goes in the
   cached block, or the prefix never hits.
"""

from __future__ import annotations

from app.modules.chat.prompts import format_chart_for_ai
from app.modules.kundali.schemas import BirthDetailsIn
from app.modules.milan.schemas import MilanResponse

_LANGUAGE_INSTRUCTIONS: dict[str, str] = {
    "en": "Write the entire analysis in clear, elegant English.",
    "ne": "Write the entire analysis in natural, authentic Nepali (नेपाली भाषा) in Devanagari script. Every title, detail and remedy MUST be in authentic Nepali.",
    "hi": "Write the entire analysis in natural, authentic Hindi (हिन्दी भाषा) in Devanagari script. Every title, detail and remedy MUST be in authentic Hindi.",
}

_INSTRUCTIONS = """You are a master Vedic astrologer (Jyotish Acharya) reading an Ashtakoota (Guna Milan) compatibility analysis for a prospective marriage.

The Ashtakoota score, every koota's points, the Manglik (Mangal dosha) findings, and both complete birth charts are computed by an ephemeris and supplied to you below. Read them. NEVER derive, recompute, or invent a score, a degree, a house, or a date that is not in the data.

Respond ONLY with a valid JSON object of exactly this shape:

{
  "verdict": "One sentence naming how well these two charts match and why, in plain language.",
  "outlook": "Two to four sentences on how the marriage is likely to go: where it is supported, where it will take work, and what the total guna score does and does not tell them. Be honest and specific, never fatalistic.",
  "strengths": [
    {"title": "Short name of what matches", "detail": "Two or three sentences on what this means in daily married life.", "basis": "The koota or placement this rests on, e.g. 'Nadi 8/8 — different nadis'"}
  ],
  "concerns": [
    {"title": "Short name of what does not match", "detail": "Two or three sentences on where the friction will actually show up, and how manageable it is.", "basis": "The koota or placement this rests on"}
  ],
  "doshas": [
    {"name": "Mangal Dosha (Manglik)", "severity": "none | mild | moderate | serious", "affects": "What area of the marriage this bears on", "detail": "Whose chart carries it, from which house, whether classical cancellation applies and why."}
  ],
  "remedies": [
    {"title": "Short name of the remedy", "detail": "What to do, concretely.", "timing": "When — e.g. 'before fixing the date', 'before the wedding', 'ongoing after marriage'"}
  ]
}

Rules for the content:
- Cover EVERY koota that scored zero or lost most of its points in `concerns`, and every koota that scored full or near-full in `strengths`. Do not silently skip one.
- `basis` must quote the actual koota name and score from the data. It is the reader's proof you read their chart and not a template.
- Include a `doshas` entry for Mangal dosha even when neither chart is Manglik — say so plainly with severity "none". Add other doshas (e.g. Nadi dosha, Bhakoot dosha) only when the supplied data actually shows them, and name the koota that shows it.
- Remedies must be classical and proportionate: puja, daan, mantra, gemstone, fasting, Kumbh Vivah where the dosha genuinely warrants it. If nothing needs remedying, return a single remedy about pre-marriage counsel rather than inventing rituals.
- Give 2-5 strengths, 2-5 concerns, 1-4 doshas, 1-5 remedies.
- Never predict death, lifespan, terminal illness, or say a marriage is doomed. A low score is a description of friction, not a prohibition — say what to work on.
- No markdown, no code fences, no prose outside the JSON object."""


def system_blocks(
    match: MilanResponse,
    groom: BirthDetailsIn,
    bride: BirthDetailsIn,
    language: str = "en",
) -> list[dict]:
    return [
        {"type": "text", "text": _INSTRUCTIONS, "cache_control": {"type": "ephemeral"}},
        {
            "type": "text",
            "text": (
                f"LANGUAGE REQUIREMENT:\n"
                f"{_LANGUAGE_INSTRUCTIONS.get(language, _LANGUAGE_INSTRUCTIONS['en'])}\n\n"
                f"{format_match_for_ai(match)}\n\n"
                f"=== GROOM'S COMPLETE VERIFIED SIDEREAL BIRTH CHART ===\n"
                f"{format_chart_for_ai(match.groom_chart, groom)}\n\n"
                f"=== BRIDE'S COMPLETE VERIFIED SIDEREAL BIRTH CHART ===\n"
                f"{format_chart_for_ai(match.bride_chart, bride)}"
            ),
        },
    ]


USER_PROMPT = "Analyse this match and return the JSON object described above."


def format_match_for_ai(match: MilanResponse) -> str:
    """The computed match as structured text. Formatting only — no astrology."""
    return "\n\n".join([_score_section(match), _kutas_section(match), _manglik_section(match)])


def _score_section(match: MilanResponse) -> str:
    return (
        "=== ASHTAKOOTA MATCH (COMPUTED, DO NOT RECALCULATE) ===\n"
        f"• Couple: {match.groom_name} (groom) and {match.bride_name} (bride)\n"
        f"• Total Guna: {match.total_guna} of {match.max_guna} ({match.percentage:.1f}%)\n"
        f"• Engine recommendation: {match.recommendation}"
    )


def _kutas_section(match: MilanResponse) -> str:
    lines = [
        f"• {k.name}: {k.obtained} of {k.max_points}"
        + (f" — {k.description}" if k.description else "")
        for k in match.kutas
    ]
    return "=== KOOTA BY KOOTA ===\n" + ("\n".join(lines) or "N/A")


def _manglik_section(match: MilanResponse) -> str:
    def side(name: str, m) -> str:  # noqa: ANN001 -- ManglikOut, avoids a circular hint
        if not m.is_manglik:
            return f"• {name}: not Manglik"
        line = f"• {name}: Manglik from house {', '.join(str(h) for h in m.houses)} | severity {m.severity}"
        if m.is_canceled:
            line += f" | CANCELLED: {m.cancellation_reason or 'classical cancellation applies'}"
        return line

    compat = match.manglik_compatibility
    return (
        "=== MANGAL DOSHA (MANGLIK) ===\n"
        f"{side(match.groom_name, match.groom_manglik)}\n"
        f"{side(match.bride_name, match.bride_manglik)}\n"
        f"• Compatible: {compat.compatible} | Cancelled: {compat.canceled}\n"
        f"• Reason: {compat.reason}"
    )
