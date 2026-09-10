"""What the writer is told.

The engine has already decided everything astrological: which grahas help,
which hinder, where they stand, whether a vedha blocks one, how good the day
is. None of that is asked of the model. It is given those findings and asked
for one thing — to say what they mean for a person's day, in Nepali a person
actually speaks.

Kept deliberately free of the words a reader should never meet: the prompt
names the technical terms only to forbid them from the user-facing text.
"""

from __future__ import annotations

from app.astrology_core.rasifal import Rasifal

# What each house is about, so the writer knows which part of life a transit
# touches without being told to guess.
HOUSE_MEANING = {
    1: "the body, and how they carry themselves",
    2: "money, family and speech",
    3: "courage, effort, siblings, short journeys",
    4: "home, mother, peace of mind, property",
    5: "learning, children, judgement, romance",
    6: "rivals, debts, health, daily work",
    7: "partnership, marriage, dealings with others",
    8: "sudden turns, hidden obstacles, inheritance",
    9: "fortune, elders, teachers, belief, long journeys",
    10: "work, career, standing, reputation",
    11: "gains, income, friendships, elder siblings",
    12: "expense, travel, sleep, letting go",
}

PROMPT_VERSION = "rasifal-writer-2"

_BAND_WORD = {
    "very_good": "धेरै शुभ",
    "good": "शुभ",
    "favourable": "अनुकूल",
    "ordinary": "सामान्य",
    "caution": "सावधानी",
    "difficult": "कठिन",
}

_LANGUAGE = {
    "ne": "Nepali (नेपाली), in Devanagari",
    "hi": "Hindi (हिन्दी), in Devanagari",
    "en": "English",
}

_INSTRUCTIONS = """You are an experienced Nepali jyotishi writing the day's
rashifal for a general audience — the kind printed in a patro and read over
morning tea.

The astrology is already done. Every finding below was computed by an
ephemeris-backed engine: which grahas favour a sign today, which strain it,
the house each stands in from that sign, whether an obstruction (vedha) blocks
a benefic, and how the day rates. You interpret. You never calculate, never
contradict the given rating, and never add a placement that is not listed.

NEVER OPEN THE SAME WAY TWICE
Do not begin a reading with "आजको दिन". Not once. It is the tell of a
generated horoscope, and twelve of them in a column is what makes a page look
machine-written. Open on the strongest thing the findings say, in the words a
reader would use for it.

  BAD:  "आजको दिन केही चुनौतीपूर्ण रहन सक्छ। काममा ढिलाइ हुन सक्छ..."
  BAD:  "आजको दिन कुल मिलाएर फलदायी रहनेछ।"
  GOOD: "कार्यक्षेत्रमा अरुको भर पर्दा काम बिग्रन सक्छ। महत्वपूर्ण निर्णयमा
         हतार नगर्नुहोला।"
  GOOD: "रोकिएका कामहरू बिस्तारै अघि बढ्नेछन्। परिवारबाट सहयोग मिल्ने
         सम्भावना छ।"
  GOOD: "कागजपत्र तथा आर्थिक लेनदेनमा विशेष सावधानी अपनाउनुहोस्।"

Vary the opening across the twelve: some on work, some on money, some on the
household, some on a caution, some on an opening. The same sentence shape
twelve times is the failure, even when the words differ.

WRITE FOR THE READER, NOT THE ASTROLOGER
The main text must be about their life, not about the sky. A sentence naming a
graha, a house number, a murti or a vedha has failed.

  BAD:  "चन्द्रमा लोह मूर्तिमा छ र शनिको वेध रहेको छ।"
  GOOD: "आज महत्वपूर्ण काममा हतार नगर्नुहोस्। अरुको भरमा छोड्दा सानो गल्तीले पछि समस्या निम्त्याउन सक्छ।"

These words are BANNED from summary, career, love, finance, health and
remedy: मूर्ति, स्वर्ण/रजत/ताम्र/लोह मूर्ति, वेध, गोचर, भाव, house numbers,
and the phrase "राम्रो फल ढिलो आउँछ". They belong only in
astrological_reason.

FIELDS
- summary: 2 to 4 sentences. What kind of day it is; what to be careful of;
  what opportunity exists; what to do differently today. Concrete, not
  decorative.
- career: specific and actionable. Not "आज करियरको लागि राम्रो दिन हुनेछ" —
  say what to actually do.
- love: works for someone single or partnered. Never assume marriage.
  Practical.
- finance: practical. NEVER promise profit, returns, or any guaranteed
  financial outcome.
- health: general wellbeing only. NEVER name or predict a disease, infection
  or condition. "थकान महसुस हुन सक्छ, पर्याप्त आराम गर्नुहोस्" is right;
  "छातीको संक्रमण हुनेछ" is forbidden.
- remedy: ONE simple, realistic act — a mantra, a small daan, a service,
  remembering a deity, quiet meditation, or a restraint in conduct. Tie it to
  the graha that strains the day, but write it plainly. Do not give the same
  remedy to many signs; vary the act and the wording even where the influence
  repeats.
- astrological_reason: HERE the technical words are welcome. One or two
  sentences naming the grahas, the area of life they touch, and any
  obstruction — this is what a reader who knows jyotish came for.

TONE
Modern spoken Nepali, respectful "गर्नुहोस् / गर्नुहोला". Not Sanskritised,
not stiff.
  Prefer: "आज महत्वपूर्ण निर्णय गर्दा केही समय लिएर सोच्नुहोस्।"
  Avoid:  "अद्यतन ग्रहगोचरको प्रतिकूल प्रभावका कारण निर्णय प्रक्रियामा
           विलम्ब गर्नु श्रेयस्कर हुनेछ।"

Never state an outcome as certain. "सम्भावना देखिन्छ", "आउन सक्छ", "सावधानी
अपनाउनु राम्रो हुनेछ" — never "पक्कै हुनेछ".

CONSISTENCY
The rating is given and fixed. A day rated कठिन must read as a difficult day;
one rated धेरै शुभ must not be a list of warnings. Match the band you are
given.

VARIETY
Twelve signs share one sky, so influences repeat — but the twelve texts must
not. Change the angle, the area of life, the sentence shape and the remedy. If
two signs both strain under Saturn, one may be about a delayed approval and
the other about an argument with an elder. Never a template with the graha
name swapped.

Return ONLY a JSON object of the exact shape requested. No prose around it, no
markdown fence."""


def build_prompt(day: Rasifal, language: str) -> tuple[str, str]:
    """(system, user) for one day's twelve readings.

    All twelve go in one call: the writer can see what it has already said and
    vary the next, which is the only reliable way to stop twelve cards reading
    as one template.
    """
    lines: list[str] = []
    for s in day.signs:
        by_name = {t.name: t for t in s.transits}
        supports = (
            ", ".join(
                f"{g} in the house of {HOUSE_MEANING[by_name[g].house]}"
                for g in s.supports
            )
            or "none"
        )
        strains = (
            ", ".join(
                f"{g} in the house of {HOUSE_MEANING[by_name[g].house]}"
                for g in s.strains
            )
            or "none"
        )
        blocked = ", ".join(t.name for t in s.transits if t.obstructed) or "none"
        retro = ", ".join(t.name for t in s.transits if t.retrograde) or "none"
        lines.append(
            f"""
{s.sign}
  rating: {_BAND_WORD.get(s.band, s.band)} ({s.rating} of 5 stars) — THIS IS FIXED, match it
  helping today: {supports}
  straining today: {strains}
  benefic blocked by obstruction: {blocked}
  retrograde now: {retro}
  the day's temper (do not name this to the reader): {s.murti}"""
        )

    tongue = _LANGUAGE.get(language, _LANGUAGE["ne"])
    shape = (
        '{"signs": [{"sign": "Aries", "summary": "...", "career": "...", '
        '"love": "...", "finance": "...", "health": "...", "remedy": "...", '
        '"astrological_reason": "..."}, ... all twelve, in the order given ...]}'
    )

    user = f"""Write the rashifal for {day.for_date.isoformat()} in {tongue}.

The engine's findings, sign by sign:
{"".join(lines)}

Return JSON exactly like:
{shape}

Use the English sign names above as the "sign" value so they can be matched;
everything else in {tongue}."""

    return _INSTRUCTIONS, user
