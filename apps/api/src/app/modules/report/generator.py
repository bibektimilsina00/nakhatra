# ruff: noqa: E501 -- report copy is a verbatim port of report-generator.ts.
# Reflowing these strings would change what users read.
"""Deterministic report generator. Ported from `report-generator.ts`.

Pure formatting of values `astrology_core` already computed — no astrology is
performed here (CLAUDE.md rule 1). Output is byte-identical to the TypeScript it
replaces; `tests/modules/test_report_generator.py` asserts that against fixtures
captured from the original before the port.
"""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal
from typing import Any

from app.modules.kundali.schemas import BirthDetailsIn, ChartOut
from app.modules.report.schemas import ReportReason, ReportSection


def _fixed(value: float, digits: int = 2) -> str:
    """JavaScript `Number.prototype.toFixed`.

    Python's `format` rounds half to even; JS rounds half away from zero. On a
    degree ending in exactly .xx5 the two disagree, which would silently shift a
    printed ascendant. Degrees here are non-negative, so ROUND_HALF_UP matches.
    """
    quantum = Decimal(1).scaleb(-digits)
    return f"{Decimal(value).quantize(quantum, rounding=ROUND_HALF_UP):.{digits}f}"


def _context(chart: ChartOut, birth: BirthDetailsIn) -> dict[str, Any]:
    houses = {h.number: h for h in chart.houses}
    planets = {p.name: p for p in chart.planets}
    periods = chart.dasha.periods
    maha = periods[0] if periods else None
    antar = periods[1] if len(periods) > 1 else None
    venus = planets.get("Venus")

    planets_summary = "; ".join(
        f"{p.name} in {p.sign} (House {p.house}"
        + (", ℞ Retrograde" if p.retrograde else "")
        + (", Combust" if p.combust else "")
        + ")"
        for p in chart.planets
    )

    def house_field(number: int, field: str, fallback: Any = None) -> Any:
        house = houses.get(number)
        return getattr(house, field) if house else fallback

    return {
        "lagna": chart.lagna_sign,
        "lagna_deg": _fixed(chart.lagna_degree),
        "moon_sign": chart.avakhada.sign or chart.panchang.moon_sign or "Libra",
        "nakshatra": chart.avakhada.nakshatra or chart.panchang.nakshatra or "Vishakha",
        "pada": chart.avakhada.charan or 2,
        "gana": chart.avakhada.gana or "Deva",
        "nadi": chart.avakhada.nadi or "Madhya",
        "tatva": chart.avakhada.tatva or "Fire",
        "planets_70": planets_summary[:70],
        "h1_lord": house_field(1, "lord"),
        "h6_number": house_field(6, "number", 6),
        "h6_sign": house_field(6, "sign"),
        "h7_sign": house_field(7, "sign"),
        "h7_lord": house_field(7, "lord"),
        "h10_sign": house_field(10, "sign"),
        "h10_lord": house_field(10, "lord"),
        "h11_sign": house_field(11, "sign"),
        "h11_lord": house_field(11, "lord"),
        "h12_sign": house_field(12, "sign"),
        "h12_lord": house_field(12, "lord"),
        "venus_sign": venus.sign if venus else "Sign",
        "venus_house": venus.house if venus else 1,
        "maha": f"{maha.lord} Mahadasha" if maha else "Active Dasha",
        "antar": f"{antar.lord} Antardasha" if antar else "",
        "maha_start": str(maha.start)[:10] if maha else "",
        "maha_end": str(maha.end)[:10] if maha else "",
    }


def generate(chart: ChartOut, birth: BirthDetailsIn, language: str = "en") -> list[ReportSection]:
    """The seven sections, in the requested language."""
    c = _context(chart, birth)
    lang = language if language in _SECTIONS else "en"
    arrow = f" ➔ {c['antar']}" if c["antar"] else ""

    sections = []
    for spec in _SECTIONS[lang]:
        sections.append(
            ReportSection(
                id=spec["id"],
                icon=spec["icon"],
                title=spec["title"],
                subtitle=spec["subtitle"],
                summary=spec["summary"].format(**c, arrow=arrow),
                content=[p.format(**c, arrow=arrow) for p in spec["content"]],
                reasoning=[
                    ReportReason(
                        placement=r[0].format(**c, arrow=arrow),
                        explanation=r[1].format(**c, arrow=arrow),
                    )
                    for r in spec["reasoning"]
                ],
            )
        )
    return sections


# The dasha section's second content paragraph differs by whether an antardasha
# exists; in the source this was an inline ternary inside a template literal.
def _with_antar(lang: str) -> str:
    return {
        "en": "with **{antar}**",
        "ne": "र **{antar}**",
        "hi": "और **{antar}**",
    }[lang]


_SECTIONS: dict[str, list[dict[str, Any]]] = {
    "en": [
        {
            "id": "personality",
            "icon": "🌟",
            "title": "Personality & Intellect",
            "subtitle": "Core identity, mindset, and behavioral tendencies",
            "summary": "Distinctive {lagna} Ascendant mindset driven by {tatva} elemental focus and {nakshatra} Nakshatra lunar qualities.",
            "content": [
                "Your birth chart features a {lagna} Ascendant rising at {lagna_deg}°, shaping your fundamental approach to life with integrity, purpose, and strong personal principles.",
                "Your Moon is placed in {moon_sign} under {nakshatra} Nakshatra (Pada {pada}), granting high mental acuity, intuitive perception, and emotional depth in social and professional environments.",
                "Belonging to the {gana} Gana and {nadi} Nadi, your temperament balances high intellect with moral responsibility, allowing you to project calm authority under pressure.",
            ],
            "reasoning": [
                (
                    "{lagna} Ascendant ({lagna_deg}°)",
                    "Establishes core vitality, personal orientation, and physical demeanor.",
                ),
                (
                    "Moon in {moon_sign} ({nakshatra} Pada {pada})",
                    "Determines internal emotional processing, mental habits, and subconscious drives.",
                ),
                (
                    "{gana} Gana · {tatva} Tatva",
                    "Shapes social interactions, ethical boundaries, and elemental motivation.",
                ),
            ],
        },
        {
            "id": "strengths-weaknesses",
            "icon": "⚖️",
            "title": "Strengths & Growth Areas",
            "subtitle": "Innate talents and potential pitfalls to guard against",
            "summary": "Extraordinary capacity for deep focus and executive discipline balanced against periodic mental overthinking.",
            "content": [
                "💪 Key Strengths: Remarkable perseverance, strategic foresight, high integrity in negotiations, and natural aptitude for mastering complex technical or financial systems.",
                "⚠️ Growth Areas: With active energy in house {h6_number} ({h6_sign}), beware of over-analysing minor setbacks or absorbing unnecessary workplace friction.",
                "Cultivating structured routines and emotional detachment during high-stakes decisions will amplify your personal leadership effectiveness.",
            ],
            "reasoning": [
                (
                    "Ruler of House 1 ({lagna} Lord {h1_lord})",
                    "Provides core willpower, resilience, and personal endurance.",
                ),
                (
                    "Planetary Placements: {planets_70}...",
                    "Distribution of planetary energies across Kendras and Trikonas.",
                ),
            ],
        },
        {
            "id": "career-finance",
            "icon": "💼",
            "title": "Career & Financial Outlook",
            "subtitle": "Wealth potential, domain alignment, and career milestones",
            "summary": "Prominent career trajectory aligned with {h10_sign} leadership, strategic management, or independent consulting.",
            "content": [
                "Your 10th house of career falls in {h10_sign}, ruled by {h10_lord}. This configuration favors executive authority, technological innovation, finance, or analytical consulting.",
                "You perform at your highest potential when granted creative autonomy over strategic decisions rather than rigid micromanagement.",
                "Significant financial expansion and asset accumulation are highlighted during key Dasha transitions, particularly under {maha}.",
            ],
            "reasoning": [
                (
                    "10th House in {h10_sign} (Lord: {h10_lord})",
                    "Directly governs professional status, public reputation, and executive ambition.",
                ),
                (
                    "11th House in {h11_sign} (Lord: {h11_lord})",
                    "Influences income gains, professional networks, and recurring revenue streams.",
                ),
            ],
        },
        {
            "id": "love-marriage",
            "icon": "❤️",
            "title": "Love & Marriage",
            "subtitle": "Relationship dynamics, partner traits, and timing",
            "summary": "Intellectual partnership and shared life values under {h7_sign} relationship influence.",
            "content": [
                "Your 7th house of marriage and partnership is located in {h7_sign}, ruled by {h7_lord}.",
                "Your ideal life partner is communicative, accomplished, and emotionally balanced, met through professional networks, educational settings, or shared interests.",
                "Relationship harmony flourishes when grounded in open communication, mutual respect, and shared long-term goals.",
            ],
            "reasoning": [
                (
                    "7th House in {h7_sign} (Lord: {h7_lord})",
                    "Shapes partner character traits, marital bond, and relationship longevity.",
                ),
                (
                    "Venus in {venus_sign} (House {venus_house})",
                    "Signifies romantic harmony, affection, and personal marital satisfaction.",
                ),
            ],
        },
        {
            "id": "travel-spirituality",
            "icon": "✈️",
            "title": "Foreign Travel & Spirituality",
            "subtitle": "Overseas opportunities and inner awakening",
            "summary": "Active 12th house in {h12_sign} indicating foreign connections, international growth, and spiritual wisdom.",
            "content": [
                "With your 12th house in {h12_sign}, overseas travel, international business, or long-distance relocation plays a meaningful role in your destiny.",
                "Spiritually, you naturally lean toward introspective practices, meditation, and philosophy over ritualistic routine.",
            ],
            "reasoning": [
                (
                    "12th House in {h12_sign} (Lord: {h12_lord})",
                    "Governs international affairs, foreign residence, and spiritual liberation (Moksha).",
                ),
            ],
        },
        {
            "id": "current-dasha",
            "icon": "🕐",
            "title": "Current Dasha & Important Periods",
            "subtitle": "Vimshottari time lords shaping your current chapter",
            "summary": "Navigating {maha}{arrow}.",
            "content": [
                "You are currently experiencing **{maha}** "
                + _with_antar("en")
                + ", directing focus toward strategic growth and foundational life progress.",
                "This period favors disciplined execution, expanding key professional skills, and solidifying long-term personal commitments.",
            ],
            "reasoning": [
                (
                    "{maha} ({maha_start} to {maha_end})",
                    "Primary Vimshottari Mahadasha timeline calculated from your {nakshatra} Moon Nakshatra.",
                ),
            ],
        },
        {
            "id": "remedies",
            "icon": "🪔",
            "title": "Remedial Measures & Spiritual Guidance",
            "subtitle": "Custom Vedic remedies to balance planetary energies",
            "summary": "Tailored Vedic remedies for {lagna} Ascendant and {moon_sign} Moon placement.",
            "content": [
                "🪔 **Daily Practices**: Offer water to the morning sun and recite the Gayatri Mantra or Vishnu Sahasranama for mental clarity and peace.",
                "💎 **Auspicious Color & Focus**: Yellow/Gold and Deep Blue bring enhanced focus and protection for {lagna} Ascendant.",
                "🤝 **Charity & Service**: Supporting educational causes or feeding animals on Saturdays brings divine planetary grace.",
            ],
            "reasoning": [
                (
                    "Ascendant Ruler: {h1_lord}",
                    "Strengthens core vitality, immunity, and overall life success.",
                ),
            ],
        },
    ],
    "ne": [
        {
            "id": "personality",
            "icon": "🌟",
            "title": "व्यक्तित्व र बुद्धि",
            "subtitle": "मुख्य पहिचान, मानसिकता र व्यवहार",
            "summary": "{lagna} लग्न, {tatva} तत्व र {nakshatra} नक्षत्रको चन्द्र प्रभावद्वारा संचालित मानसिक स्थिति।",
            "content": [
                "तपाइँको जन्मकुण्डलीमा {lagna} लग्न {lagna_deg}° मा उदित छ, जसले तपाइँको जीवनप्रतिको दृष्टिकोणलाई निष्ठा, उद्देश्य र दृढ नैतिक सिद्धान्तका साथ आकार दिन्छ।",
                "तपाइँको चन्द्रमा {moon_sign} राशि र {nakshatra} नक्षत्र (चरण {pada}) मा स्थित छ, जसले सामाजिक र व्यावसायिक क्षेत्रमा उच्च तीक्ष्ण बुद्धि, अन्तर्ज्ञान र भावनात्मक गम्भीरता प्रदान गर्दछ।",
                "{gana} गण र {nadi} नाडीसँग सम्बन्धित भएकाले, तपाइँको स्वभावले उच्च बौद्धिकता र नैतिक जिम्मेवारीलाई सन्तुलनमा राख्छ, जसले दबाबमा पनि शान्त नेतृत्व लिन सहयोग पुर्याउँछ।",
            ],
            "reasoning": [
                (
                    "{lagna} लग्न ({lagna_deg}°)",
                    "मुख्य जीवन ऊर्जा, व्यक्तिगत दृष्टिकोण र शारीरिक स्वास्थ निर्धारण गर्दछ।",
                ),
                (
                    "चन्द्रमा {moon_sign} मा ({nakshatra} चरण {pada})",
                    "आन्तरिक भावनात्मक प्रक्रिया र मानसिक बानीहरू निर्धारण गर्दछ।",
                ),
                ("{gana} गण · {tatva} तत्व", "सामाजिक सम्बन्ध र नैतिक सीमाहरूलाई आकार दिन्छ।"),
            ],
        },
        {
            "id": "strengths-weaknesses",
            "icon": "⚖️",
            "title": "सबल पक्ष र सुधारका क्षेत्रहरू",
            "subtitle": "जन्मजात प्रतिभा र ध्यान दिनुपर्ने पक्षहरू",
            "summary": "गहिरो ध्यान र कार्यगत अनुशासनको क्षमता, जसलाई कहिलेकाहीँ मानसिक अति-सोचले प्रभावित पार्न सक्छ।",
            "content": [
                "💪 मुख्य सबल पक्ष: अद्भुत धैर्य, रणनीतिक दूरदर्शिता, वार्तामा उच्च इमानदारी, र जटिल प्राविधिक वा वित्तीय प्रणालीमा निपुणता।",
                "⚠️ सुधारका क्षेत्र: भाव {h6_number} ({h6_sign}) मा सक्रिय ऊर्जा भएकाले, सानातिना असफलताहरूको अत्यधिक विश्लेषण वा कार्यस्थलको तनावबाट बच्नुहोस्।",
                "संरचित दिनचर्या र महत्त्वपूर्ण निर्णयहरूको समयमा भावनात्मक सन्तुलन कायम राख्नाले तपाइँको नेतृत्व क्षमतालाई बढाउँछ।",
            ],
            "reasoning": [
                (
                    "प्रथम भावको स्वामी ({lagna} स्वामी {h1_lord})",
                    "मुख्य इच्छाशक्ति, सहनशीलता र आत्मबल प्रदान गर्दछ।",
                ),
                ("ग्रह स्थिति: {planets_70}...", "केन्द्र र त्रिकोण भावमा ग्रहहरूको ऊर्जा वितरण।"),
            ],
        },
        {
            "id": "career-finance",
            "icon": "💼",
            "title": "करियर र वित्तीय दृष्टिकोण",
            "subtitle": "धन सम्भावना, पेशागत क्षेत्र र करियरका उपलब्धिहरू",
            "summary": "{h10_sign} को नेतृत्व, रणनीतिक व्यवस्थापन वा स्वतन्त्र परामर्शमा केन्द्रित उच्च करियर सम्भावना।",
            "content": [
                "तपाइँको दशम (कर्म) भाव {h10_sign} मा छ, जसको स्वामी {h10_lord} हो। यो स्थितिले प्रशासनिक अधिकार, प्रविधि, वित्त वा विश्लेषणात्मक परामर्शमा सफलता दिन्छ।",
                "तपाइँ कठोर सूक्ष्म-व्यवस्थापनको सट्टा रणनीतिक निर्णयहरूमा स्वतन्त्रता पाउँदा उत्कृष्ट प्रदर्शन गर्नुहुन्छ।",
                "मुख्य दशा परिवर्तनको समयमा, विशेष गरी {maha} को अन्तर्गत महत्त्वपूर्ण आर्थिक वृद्धि र सम्पत्ति सञ्चय हुनेछ।",
            ],
            "reasoning": [
                (
                    "१० औं भाव {h10_sign} (स्वामी: {h10_lord})",
                    "पेशेवर प्रतिष्ठा, सामाजिक सम्मान र करियरको महत्वाकांक्षा निर्देशित गर्दछ।",
                ),
                (
                    "११ औं भाव {h11_sign} (स्वामी: {h11_lord})",
                    "आम्दानीको लाभ, व्यावसायिक सञ्जाल र नियमित धन प्रवाहलाई असर गर्छ।",
                ),
            ],
        },
        {
            "id": "love-marriage",
            "icon": "❤️",
            "title": "प्रेम र विवाह",
            "subtitle": "सम्बन्धको स्थिति, जीवनसाथीको लक्षण र समय",
            "summary": "{h7_sign} को प्रभाव अन्तर्गत बौद्धिक साझेदारी र साझा जीवन मूल्यहरू।",
            "content": [
                "तपाइँको सप्तम (विवाह) भाव {h7_sign} मा अवस्थित छ, जसको स्वामी {h7_lord} हो।",
                "तपाइँको आदर्श जीवनसाथी सुझबुझ भएको, सफल र भावनात्मक रूपमा सन्तुलित हुनेछ, जसलाई व्यावसायिक वा सामाजिक क्षेत्रमार्फत भेट्न सकिन्छ।",
                "सम्बन्धमा मधुरता खुला संवाद, आपसी सम्मान र साझा दीर्घकालीन लक्ष्यहरूमा आधारित हुँदा मौलाउँछ।",
            ],
            "reasoning": [
                (
                    "७ औं भाव {h7_sign} (स्वामी: {h7_lord})",
                    "जीवनसाथीको गुण, वैवाहिक सम्बन्ध र दिगोपन निर्धारण गर्दछ।",
                ),
                (
                    "शुक्र {venus_sign} मा (भाव {venus_house})",
                    "रोमान्टिक सद्भाव, स्नेह र व्यक्तिगत वैवाहिक सन्तुष्टिको प्रतीक हो।",
                ),
            ],
        },
        {
            "id": "travel-spirituality",
            "icon": "✈️",
            "title": "विदेश यात्रा र अध्यात्म",
            "subtitle": "विदेशी अवसर र आन्तरिक अध्यात्म",
            "summary": "{h12_sign} मा सक्रिय स्थितिले वैदेशिक सम्बन्ध, अन्तर्राष्ट्रिय प्रगति र आध्यात्मिक ज्ञान दर्साउँछ।",
            "content": [
                "तपाइँको १२ औं भाव {h12_sign} मा भएकाले, विदेश भ्रमण, अन्तर्राष्ट्रिय व्यापार वा दूरगामी स्थानान्तरणले तपाइँको भाग्यमा महत्त्वपूर्ण भूमिका खेल्छ।",
                "आध्यात्मिक रूपमा, तपाइँ परम्परागत कर्मकाण्डभन्दा ध्यान, आत्मचिन्तन र दर्शनतर्फ स्वाभाविक रूपमा आकर्षित हुनुहुन्छ।",
            ],
            "reasoning": [
                (
                    "१२ औं भाव {h12_sign} (स्वामी: {h12_lord})",
                    "अन्तर्राष्ट्रिय सम्बन्ध, वैदेशिक निवास र आध्यात्मिक मोक्ष निर्देशित गर्दछ।",
                ),
            ],
        },
        {
            "id": "current-dasha",
            "icon": "🕐",
            "title": "वर्तमान दशा र महत्त्वपूर्ण अवधिहरू",
            "subtitle": "विंशोत्तरी काल पुरुष जसले तपाइँको वर्तमान अध्याय निर्धारण गर्दैछन्",
            "summary": "{maha}{arrow} को यात्रामा।",
            "content": [
                "तपाइँ हाल **{maha}** "
                + _with_antar("ne")
                + " को प्रभावमा हुनुहुन्छ, जसले तपाइँको ध्यान रणनीतिक प्रगति र जीवनको आधारभूत विकासतर्फ निर्देशित गर्दछ।",
                "यो अवधिले अनुशासित कार्य, प्रमुख व्यावसायिक कौशलको विस्तार र दीर्घकालीन प्रतिबद्धताहरूलाई सुदृढ बनाउन मद्दत गर्दछ।",
            ],
            "reasoning": [
                (
                    "{maha} ({maha_start} देखि {maha_end})",
                    "तपाइँको {nakshatra} चन्द्र नक्षत्रबाट गणना गरिएको मुख्य विंशोत्तरी महादशा समयरेखा।",
                ),
            ],
        },
        {
            "id": "remedies",
            "icon": "🪔",
            "title": "ज्योतिषीय उपाय तथा आध्यात्मिक मार्गदर्शन",
            "subtitle": "ग्रहहरूको ऊर्जा सन्तुलन गर्न विशेष वैदिक उपायहरू",
            "summary": "{lagna} लग्न र {moon_sign} चन्द्र राशिका लागि विशेष वैदिक उपायहरू।",
            "content": [
                "🪔 **दैनिक साधना**: बिहानको सूर्यलाई जल चढाउनुहोस् र मानसिक शान्तिका लागि गायत्री मन्त्र वा विष्णु सहस्रनाम पाठ गर्नुहोस्।",
                "💎 **शुभ रङ्ग र ध्यान**: पहेँलो/सुनौलो र गाढा नीलो रङ्गले {lagna} लग्नका लागि एकाग्रता र रक्षा प्रदान गर्दछ।",
                "🤝 **दान तथा सेवा**: शनिबार शैक्षिक क्षेत्रमा सहयोग वा जनावरहरूलाई भोजन गराउनाले ग्रहहरूको शुभ फल प्राप्त हुन्छ।",
            ],
            "reasoning": [
                (
                    "लग्न स्वामी: {h1_lord}",
                    "मुख्य जीवन शक्ति, प्रतिरोधक क्षमता र जीवनको सफलतालाई बलियो बनाउँछ।",
                ),
            ],
        },
    ],
    "hi": [
        {
            "id": "personality",
            "icon": "🌟",
            "title": " व्यक्तित्व एवं बुद्धि",
            "subtitle": "मूल पहचान, मानसिकता और व्यवहार",
            "summary": "{lagna} लग्न, {tatva} तत्व और {nakshatra} नक्षत्र के चंद्र प्रभाव से संचालित मानसिक स्थिति।",
            "content": [
                "आपकी जन्मकुंडली में {lagna} लग्न {lagna_deg}° पर उदित है, जो आपके जीवन के दृष्टिकोण को सत्यनिष्ठा, उद्देश्य और मजबूत नैतिक सिद्धांतों के साथ आकार देता है।",
                "आपका चंद्रमा {moon_sign} राशि और {nakshatra} नक्षत्र (चरण {pada}) में स्थित है, जो सामाजिक और व्यावसायिक क्षेत्रों में उच्च तीक्ष्ण बुद्धि, अंतर्ज्ञान और भावनात्मक गहराई प्रदान करता है।",
                "{gana} गण और {nadi} नाड़ी से संबंधित होने के कारण, आपका स्वभाव उच्च बुद्धिमत्ता और नैतिक जिम्मेदारी को संतुलित करता है, जिससे आप दबाव में भी शांत नेतृत्व प्रदान करते हैं।",
            ],
            "reasoning": [
                (
                    "{lagna} लग्न ({lagna_deg}°)",
                    "मूल जीवन ऊर्जा, व्यक्तिगत दृष्टिकोण और शारीरिक स्वास्थ्य निर्धारित करता है।",
                ),
                (
                    "चंद्रमा {moon_sign} में ({nakshatra} चरण {pada})",
                    "आंतरिक भावनात्मक प्रक्रिया और मानसिक आदतों को निर्धारित करता है।",
                ),
                ("{gana} गण · {tatva} तत्व", "सामाजिक संबंधों और नैतिक सीमाओं को आकार देता है।"),
            ],
        },
        {
            "id": "strengths-weaknesses",
            "icon": "⚖️",
            "title": "शक्तियां एवं सुधार के क्षेत्र",
            "subtitle": "जन्मजात प्रतिभाएं और सावधान रहने योग्य पहलू",
            "summary": "गहरी एकाग्रता और कार्य अनुशासन की क्षमता, जो कभी-कभी अत्यधिक सोच से प्रभावित हो सकती है।",
            "content": [
                "💪 मुख्य शक्तियां: अद्भुत धैर्य, रणनीतिक दूरदर्शिता, बातचीत में उच्च ईमानदारी, और जटिल तकनीकी या वित्तीय प्रणालियों में महारत।",
                "⚠️ सुधार के क्षेत्र: भाव {h6_number} ({h6_sign}) में सक्रिय ऊर्जा होने से, छोटी असफलताओं का अत्यधिक विश्लेषण करने से बचें।",
                "संरचित दिनचर्या और महत्वपूर्ण निर्णयों के दौरान भावनात्मक संतुलन बनाए रखने से आपकी नेतृत्व क्षमता में वृद्धि होगी।",
            ],
            "reasoning": [
                (
                    "प्रथम भाव का स्वामी ({lagna} स्वामी {h1_lord})",
                    "मूल इच्छाशक्ति, सहनशीलता और आत्मबल प्रदान करता है।",
                ),
                ("ग्रह स्थिति: {planets_70}...", "केंद्र और त्रिकोण भावों में ग्रहों की ऊर्जा वितरण।"),
            ],
        },
        {
            "id": "career-finance",
            "icon": "💼",
            "title": "करियर एवं वित्तीय दृष्टिकोण",
            "subtitle": "धन संभावना, पेशेवर क्षेत्र और करियर के मील के पत्थर",
            "summary": "{h10_sign} के नेतृत्व, रणनीतिक प्रबंधन या स्वतंत्र परामर्श पर केंद्रित उच्च करियर संभावना।",
            "content": [
                "आपका दशम (कर्म) भाव {h10_sign} में है, जिसके स्वामी {h10_lord} हैं। यह स्थिति प्रशासनिक अधिकार, प्रौद्योगिकी, वित्त या विश्लेषणात्मक परामर्श में सफलता देती है।",
                "आप कठोर सूक्ष्म-प्रबंधन के बजाय रणनीतिक निर्णयों में स्वतंत्रता मिलने पर सर्वश्रेष्ठ प्रदर्शन करते हैं।",
                "मुख्य दशा परिवर्तनों के दौरान, विशेष रूप से {maha} के तहत महत्वपूर्ण वित्तीय वृद्धि और संपत्ति संचय होगा।",
            ],
            "reasoning": [
                (
                    "10वां भाव {h10_sign} (स्वामी: {h10_lord})",
                    "पेशेवर प्रतिष्ठा, सामाजिक सम्मान और करियर की महत्वाकांक्षा निर्देशित करता है।",
                ),
                (
                    "11वां भाव {h11_sign} (स्वामी: {h11_lord})",
                    "आय के लाभ, पेशेवर नेटवर्क और नियमित धन प्रवाह को प्रभावित करता है।",
                ),
            ],
        },
        {
            "id": "love-marriage",
            "icon": "❤️",
            "title": "प्रेम एवं विवाह",
            "subtitle": "संबंधों की स्थिति, जीवनसाथी के लक्षण एवं समय",
            "summary": "{h7_sign} के प्रभाव के तहत बौद्धिक साझेदारी और साझा जीवन मूल्य।",
            "content": [
                "आपका सप्तम (विवाह) भाव {h7_sign} में स्थित है, जिसके स्वामी {h7_lord} हैं।",
                "आपका आदर्श जीवनसाथी समझदार, सफल और भावनात्मक रूप से संतुलित होगा, जिससे पेशेवर या सामाजिक क्षेत्र के माध्यम से मुलाकात हो सकती है।",
                "संबंधों में मधुरता खुले संवाद, आपसी सम्मान और साझा दीर्घकालिक लक्ष्यों पर आधारित होने पर फलती-फूलती है।",
            ],
            "reasoning": [
                (
                    "7वां भाव {h7_sign} (स्वामी: {h7_lord})",
                    "जीवनसाथी के गुण, वैवाहिक संबंध और स्थायित्व निर्धारित करता है।",
                ),
                (
                    "शुक्र {venus_sign} में (भाव {venus_house})",
                    "रोमांटिक सद्भाव, स्नेह और व्यक्तिगत वैवाहिक संतुष्टि का प्रतीक है।",
                ),
            ],
        },
        {
            "id": "travel-spirituality",
            "icon": "✈️",
            "title": "विदेश यात्रा एवं अध्यात्म",
            "subtitle": "विदेशी अवसर और आंतरिक अध्यात्म",
            "summary": "{h12_sign} में सक्रिय स्थिति विदेशी संबंधों, अंतर्राष्ट्रीय प्रगति और आध्यात्मिक ज्ञान को दर्शाती है।",
            "content": [
                "आपका 12वां भाव {h12_sign} में होने से, विदेश यात्रा, अंतर्राष्ट्रीय व्यापार या दूरगामी स्थानांतरण आपके भाग्य में महत्वपूर्ण भूमिका निभाता है।",
                "आध्यात्मिक रूप से, आप पारंपरिक कर्मकांड के बजाय ध्यान, आत्मचिंतन और दर्शन की ओर स्वाभाविक रूप से आकर्षित होते हैं।",
            ],
            "reasoning": [
                (
                    "12वां भाव {h12_sign} (स्वामी: {h12_lord})",
                    "अंतर्राष्ट्रीय मामलों, विदेशी निवास और आध्यात्मिक मोक्ष को निर्देशित करता है।",
                ),
            ],
        },
        {
            "id": "current-dasha",
            "icon": "🕐",
            "title": "वर्तमान दशा एवं महत्वपूर्ण अवधियां",
            "subtitle": "विंशोत्तरी समय स्वामी जो आपके वर्तमान अध्याय को आकार दे रहे हैं",
            "summary": "{maha}{arrow} की यात्रा में।",
            "content": [
                "आप वर्तमान में **{maha}** "
                + _with_antar("hi")
                + " के प्रभाव में हैं, जो आपके ध्यान को रणनीतिक प्रगति और जीवन के बुनियादी विकास की ओर निर्देशित करता है।",
                "यह अवधि अनुशासित कार्य निष्पादन, प्रमुख पेशेवर कौशलों के विस्तार और दीर्घकालिक प्रतिबद्धताओं को मजबूत करने के लिए अनुकूल है।",
            ],
            "reasoning": [
                (
                    "{maha} ({maha_start} से {maha_end})",
                    "आपके {nakshatra} चंद्र नक्षत्र से परिकलित मुख्य विंशोत्तरी महादशा समयरेखा।",
                ),
            ],
        },
        {
            "id": "remedies",
            "icon": "🪔",
            "title": "ज्योतिषीय उपाय एवं आध्यात्मिक मार्गदर्शन",
            "subtitle": "ग्रहों की ऊर्जा को संतुलित करने के लिए विशेष वैदिक उपाय",
            "summary": "{lagna} लग्न और {moon_sign} चंद्र राशि के लिए विशेष वैदिक उपाय।",
            "content": [
                "🪔 **दैनिक साधना**: सुबह के सूर्य को अर्घ्य दें और मानसिक शांति के लिए गायत्री मंत्र या विष्णु सहस्रनाम का पाठ करें।",
                "💎 **शुभ रंग एवं ध्यान**: पीला/सुनहरा और गहरा नीला रंग {lagna} लग्न के लिए एकाग्रता और सुरक्षा प्रदान करता है।",
                "🤝 **दान एवं सेवा**: शनिवार को शैक्षणिक कार्यों में सहयोग या पशुओं को भोजन कराने से ग्रहों की कृपा प्राप्त होती है।",
            ],
            "reasoning": [
                (
                    "लग्न स्वामी: {h1_lord}",
                    "मूल जीवन शक्ति, प्रतिरोधक क्षमता और जीवन की सफलता को मजबूत करता है।",
                ),
            ],
        },
    ],
}
