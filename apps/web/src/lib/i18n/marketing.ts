import { hi } from "./marketing-hi";
import { ne } from "./marketing-ne";
import type { Language } from "./translations";

/**
 * The marketing site's copy, in the three languages the product speaks.
 *
 * Separate from `translations.ts` (which is the app's own chrome) because this
 * is page prose, not UI labels — long-form, section-shaped, and only ever read
 * by `features/marketing`. Structural data that carries no language — house
 * geometry, kuta maxima — stays in `data/demo.ts`.
 */

export interface Step {
  title: string;
  body: string;
}

export interface ReadingEntry {
  title: string;
  summary: string;
  body: string;
  refs: string[];
}

export interface ChatLine {
  text: string;
  refs?: string[];
}

export interface MarketingCopy {
  /**
   * Chart vocabulary — signs, grahas, nakshatras — keyed by the English name
   * used in `data/demo.ts`. English leaves it empty and falls back to the key.
   */
  terms: Record<string, string>;
  nav: {
    features: string;
    learn: string;
    pricing: string;
    blog: string;
    forAstrologers: string;
    rasifal: string;
    consultation: string;
    kundali: string;
    patro: string;
    kundaliCreateTitle: string;
    kundaliCreateBody: string;
    kundaliMatchTitle: string;
    kundaliMatchBody: string;
    signIn: string;
    startFree: string;
    soon: string;
    language: string;
    dashboard: string;
  };
  menu: {
    features: Step[];
    featuresNote: string;
    startFreeArrow: string;
    learn: Step[];
    learnNote: string;
  };
  hero: {
    titleA: string;
    titleB: string;
    sub: string;
    ctaPrimary: string;
    ctaSecondary: string;
    scroll: string;
  };
  begin: {
    eyebrow: string;
    title: string;
    body: string;
    thenLabel: string;
    steps: Step[];
    checks: string[];
    zoneNoteA: string;
    zoneNoteB: string;
    zoneLink: string;
  };
  platform: {
    eyebrow: string;
    title: string;
    sub: string;
    items: Step[];
    soon: string;
  };
  preview: {
    lagna: string;
    nakshatra: string;
    vargas: string;
    ayanamsa: string;
    sectionOf: string;
    careerTitle: string;
    careerSummary: string;
    careerBody: string;
    basedOn: string;
    chatQuestion: string;
    chatAnswerA: string;
    chatAnswerEm: string;
    chatAnswerB: string;
    verified: string;
    guna: string;
    tenthHouse: string;
    tenthLord: string;
    illustrative: string;
  };
  chart: {
    eyebrow: string;
    title: string;
    sub: string;
    sample: string;
    stamp: string;
    stats: string[];
    statValues: string[];
    house: string;
    lord: string;
    empty: string;
  };
  how: {
    eyebrow: string;
    title: string;
    sub: string;
    ganitaLabel: string;
    ganitaTitle: string;
    ganitaBody: string;
    ganitaEm: string;
    phalitaLabel: string;
    phalitaTitle: string;
    phalitaBody: string;
    phalitaEm: string;
  };
  reading: {
    eyebrow: string;
    title: string;
    sub: string;
    contents: string;
    sectionCount: string;
    drawnFrom: string;
    sectionOf: string;
    prev: string;
    next: string;
    toc: string[];
    entries: ReadingEntry[];
  };
  ask: {
    eyebrow: string;
    title: string;
    sub: string;
    readingLabel: string;
    chips: string[];
    placeholder: string;
    chat: ChatLine[];
    readAloudTitle: string;
    readAloudBody: string;
    speakTitle: string;
    speakBody: string;
    listening: string;
    live: string;
    languagesTitle: string;
    languagesBody: string;
    limits: string;
  };
  milan: {
    eyebrow: string;
    title: string;
    sub: string;
    kutasLabel: string;
    kutasValue: string;
    doshaLabel: string;
    doshaValue: string;
    rulesLabel: string;
    rulesValue: string;
    bride: string;
    groom: string;
    brideChart: string[];
    groomChart: string[];
    verdict: string;
    kootaByKoota: string;
    barNote: string;
    manglik: string;
    cancelled: string;
    yes: string;
    manglikNote: string;
    kutaNames: string[];
    illustrative: string;
  };
  accuracy: {
    eyebrow: string;
    titleA: string;
    titleB: string;
    todayLabel: string;
    actualLabel: string;
    deltaLabel: string;
    bodyA: string;
    bodyEm: string;
    bodyB: string;
    bodyC: string;
  };
  astrologers: {
    badge: string;
    status: string;
    title: string;
    body: string;
    waitlistLabel: string;
    emailPlaceholder: string;
    submit: string;
    thanks: string;
    practising: string;
    apply: string;
    findLabel: string;
    preview: string;
    marriage: string;
    shareNote: string;
    cards: Step[];
  };
  faq: {
    eyebrow: string;
    title: string;
    sub: string;
    stuckTitle: string;
    stuckBody: string;
    items: [string, string][];
  };
  closer: {
    titleA: string;
    titleB: string;
    sub: string;
    cta: string;
  };
  footer: {
    rightNow: string;
    computing: string;
    tagline: string;
    ephemeris: string;
    ayanamsa: string;
    houses: string;
    nodes: string;
    wholeSign: string;
    mean: string;
    platform: string;
    createKundali: string;
    readAnalysis: string;
    askAstrologer: string;
    milan: string;
    consult: string;
    soon: string;
    learn: string;
    howItWorks: string;
    whyDisagree: string;
    questions: string;
    nakshatras: string;
    dasha: string;
    company: string;
    about: string;
    support: string;
    privacy: string;
    terms: string;
    applyAstrologer: string;
    copyright: string;
  };
}

const en: MarketingCopy = {
  terms: {},
  nav: {
    features: "Features",
    learn: "Learn",
    pricing: "Pricing",
    blog: "Blog",
    forAstrologers: "For astrologers",
    rasifal: "Rasifal",
    consultation: "Consultation",
    kundali: "Kundali",
    patro: "Patro",
    kundaliCreateTitle: "Create kundali",
    kundaliCreateBody: "Your janma patrika, cast the way a Nepali guru casts it.",
    kundaliMatchTitle: "Kundali milan",
    kundaliMatchBody: "Two charts against the 36 gunas, dosha checks included.",
    signIn: "Sign in",
    startFree: "Start free",
    soon: "Soon",
    language: "Language",
    dashboard: "My dashboard",
  },
  menu: {
    features: [
      { title: "Create a kundali", body: "Nine grahas, twelve bhavas, sixteen vargas." },
      { title: "Read the analysis", body: "Seven sections, each citing its placements." },
      { title: "Ask the astrologer", body: "By text or out loud, in three languages." },
      { title: "Kundali Milan", body: "Ashtakoota across all eight kutas." },
      { title: "Consult a jyotish", body: "A verified human, holding your chart." },
    ],
    featuresNote: "One chart, carried through all of it.",
    startFreeArrow: "Start free →",
    learn: [
      { title: "How it works", body: "Why the maths and the meaning stay apart." },
      { title: "Why charts disagree", body: "Time zones, and what they cost you." },
      { title: "The 27 nakshatras", body: "What each one governs, and its pada." },
      { title: "Vimshottari dasha", body: "How the 120-year cycle is reckoned." },
    ],
    learnNote: "Jyotish explained, one idea at a time.",
  },
  hero: {
    titleA: "The sky, at the minute you",
    titleB: "arrived",
    sub: "Swiss Ephemeris casts your chart to the arcsecond. An astrologer reads it back — and can only tell you what is actually there.",
    ctaPrimary: "Cast my kundali",
    ctaSecondary: "See a real reading",
    scroll: "Scroll",
  },
  begin: {
    eyebrow: "Begin",
    title: "Four fields, about a minute",
    body: "The closer your birth time, the better. The ascendant moves a degree every four minutes, so an hour of uncertainty can shift your lagna into the next sign — mark it approximate if you are unsure, and the reading leans on the Moon instead.",
    thenLabel: "Then, immediately",
    steps: [
      { title: "Your chart is cast", body: "Nine grahas, twelve bhavas, sixteen vargas — from the ephemeris, in about a second." },
      { title: "Seven sections are written", body: "Personality, career, relationships, dasha and remedies, each citing its placements." },
      { title: "You ask whatever is left", body: "By text or out loud, in English, नेपाली or हिन्दी." },
    ],
    checks: [
      "No account needed to see your chart",
      "Bikram Sambat dates supported",
      "Birth data never written to logs",
    ],
    zoneNoteA: "Your birthplace is stored by zone name — ",
    zoneNoteB: ", not an offset — then looked up for your date. ",
    zoneLink: "Why that matters",
  },
  platform: {
    eyebrow: "The platform",
    title: "One chart, carried all the way through",
    sub: "It is computed once — then read, questioned, matched, and eventually handed to the astrologer you sit with. Four of those work today.",
    items: [
      { title: "Create your kundali", body: "Nine grahas, twelve bhavas, twenty-seven nakshatras and sixteen divisional charts — computed, not estimated." },
      { title: "Read the analysis", body: "Seven written sections, each one citing the placements it rests on." },
      { title: "Talk to the AI astrologer", body: "Ask by text or out loud in three languages, and see what it read." },
      { title: "Match two charts", body: "Ashtakoota milan across eight kutas, with the reasoning shown." },
      { title: "Consult a real astrologer", body: "A verified jyotish, arriving already holding your chart." },
    ],
    soon: "Soon",
  },
  preview: {
    lagna: "Lagna",
    nakshatra: "Nakshatra",
    vargas: "Vargas",
    ayanamsa: "Ayanamsa",
    sectionOf: "Section 03 of 07",
    careerTitle: "Career & Financial Outlook",
    careerSummary: "Prominent trajectory aligned with Aries leadership, strategic management or independent consulting.",
    careerBody: "Your tenth house of career falls in Aries, ruled by Mars, with Saturn placed there retrograde. This configuration favours executive authority and rewards autonomy over rigid micromanagement.",
    basedOn: "Based on",
    chatQuestion: "Is this a good year to change jobs?",
    chatAnswerA: "You are running ",
    chatAnswerEm: "Mercury Mahadasha",
    chatAnswerB: ", and Saturn sits retrograde in your tenth. That favours a considered move rather than a sudden one — negotiate, do not leap.",
    verified: "Verified jyotish",
    guna: "Guna",
    tenthHouse: "10th House in Aries",
    tenthLord: "10th lord placement",
    illustrative: "Illustrative. They arrive already holding your chart, your questions and what the AI told you — so the hour is spent reading, not re-explaining.",
  },
  chart: {
    eyebrow: "A sample chart",
    title: "A real chart, not a picture of one",
    sub: "Not yours — this one is cast for a birth in Kathmandu on 14 June 1975, and every degree in it came out of the ephemeris. Hover a house to read what sits in it.",
    sample: "Sample",
    stamp: "Kathmandu · 14 June 1975 · 08:30 · +05:30",
    stats: ["Lagna", "Moon", "Nakshatra", "Tithi", "Yoga", "Ayanamsa"],
    statValues: ["Cancer 15.93°", "Cancer", "Ashlesha 2", "Panchami", "Shukla", "23.514°"],
    house: "House",
    lord: "Lord",
    empty: "No planets here. An empty house is read through its lord and the aspects reaching it, not treated as blank.",
  },
  how: {
    eyebrow: "How it works",
    title: "The maths and the meaning are kept apart",
    sub: "Most AI astrology asks one model to do both, and a model will happily invent a position that sounds right. Here it never gets the chance.",
    ganitaLabel: "Gaṇita — the reckoning",
    ganitaTitle: "The ephemeris calculates",
    ganitaBody: "Your birth moment becomes universal time using the zone your birthplace kept {em}. Swiss Ephemeris gives every longitude. Lahiri ayanamsa, whole-sign houses, mean nodes. The same inputs always give the same chart.",
    ganitaEm: "that year",
    phalitaLabel: "Phalita — the reading",
    phalitaTitle: "The astrologer reads it",
    phalitaBody: "The finished chart is handed over as data. It interprets, compares and explains — but is never asked to work out a degree or a date, so it {em} get one wrong.",
    phalitaEm: "cannot",
  },
  reading: {
    eyebrow: "A sample reading",
    title: "Seven sections, and every claim shows its working",
    sub: "Written from the sample chart above. Nothing here is a generic sun-sign paragraph — each section names the placements it was drawn from.",
    contents: "Contents",
    sectionCount: "07 sections",
    drawnFrom: "Drawn from",
    sectionOf: "Section {n} of 07",
    prev: "Previous",
    next: "Next",
    toc: [
      "Personality & Intellect", "Strengths & Growth", "Career & Finance",
      "Love & Marriage", "Travel & Spirituality", "Current Dasha", "Remedies",
    ],
    entries: [
      {
        title: "Personality & Intellect",
        summary: "Distinctive Cancer Ascendant mindset driven by Water elemental focus and Ashlesha Nakshatra lunar qualities.",
        body: "Your birth chart features a Cancer Ascendant rising at 15.93°, shaping your fundamental approach to life with integrity, purpose and strong personal principles. Your Moon is placed in Cancer under Ashlesha Nakshatra (Pada 2), granting high mental acuity and emotional depth in social and professional environments.",
        refs: ["Cancer Ascendant (15.93°)", "Moon in Cancer (Ashlesha Pada 2)", "Deva Gana · Water Tatva"],
      },
      {
        title: "Strengths & Growth Areas",
        summary: "Extraordinary capacity for deep focus balanced against periodic mental overthinking.",
        body: "Remarkable perseverance, strategic foresight and a natural aptitude for mastering complex technical or financial systems. With active energy in house 6 (Sagittarius), beware of over-analysing minor setbacks or absorbing unnecessary workplace friction.",
        refs: ["Ruler of House 1 (Moon)", "Planetary spread across Kendras"],
      },
      {
        title: "Career & Financial Outlook",
        summary: "Prominent trajectory aligned with Aries leadership, strategic management or independent consulting.",
        body: "Your tenth house of career falls in Aries, ruled by Mars, with Saturn placed there retrograde. This configuration favours executive authority and analytical consulting, and rewards autonomy over rigid micromanagement.",
        refs: ["10th House in Aries (Lord: Mars)", "Saturn ℞ in the 10th", "Mercury Mahadasha"],
      },
      {
        title: "Love & Marriage",
        summary: "Intellectual partnership and shared life values under Capricorn relationship influence.",
        body: "Your seventh house is located in Capricorn, ruled by Saturn, with the Sun and Mercury placed there. Your ideal partner is communicative and emotionally steady, likely met through professional or educational settings.",
        refs: ["7th House in Capricorn", "Venus in Gemini (House 12)"],
      },
      {
        title: "Foreign Travel & Spirituality",
        summary: "Active twelfth house in Gemini indicating foreign connections and international growth.",
        body: "With Venus, Mars and Rahu in your twelfth house, overseas travel or long-distance relocation plays a meaningful role in your destiny. Spiritually you lean toward introspection and philosophy over ritual.",
        refs: ["12th House in Gemini", "Rahu in the 12th"],
      },
      {
        title: "Current Dasha & Periods",
        summary: "Navigating Mercury Mahadasha ➔ Ketu Antardasha.",
        body: "You are currently under Mercury Mahadasha, directing focus toward strategic growth and foundational life progress. This period favours disciplined execution and expanding key professional skills.",
        refs: ["Mercury Mahadasha (1964 → 1981)", "Calculated from Ashlesha"],
      },
      {
        title: "Remedial Measures",
        summary: "Tailored Vedic remedies for Cancer Ascendant and Cancer Moon placement.",
        body: "Offer water to the morning sun and recite the Gayatri Mantra for mental clarity. Silver and pearl-white bring focus for a Cancer Ascendant. Supporting educational causes on Mondays brings planetary grace.",
        refs: ["Ascendant Ruler: Moon"],
      },
    ],
  },
  ask: {
    eyebrow: "Ask anything",
    title: "A conversation, not a horoscope",
    sub: "Follow-up questions, in your own words. It answers from the chart in front of it and shows you the placement behind every answer — so you can check it rather than take it.",
    readingLabel: "Reading Cancer lagna · 14 Jun 1975",
    chips: ["When does sade sati end?", "Is my Manglik dosha cancelled?", "Read my 7th house"],
    placeholder: "Ask about your chart…",
    chat: [
      { text: "Is this a good year to change jobs?" },
      {
        text: "You are running <strong class='text-paper'>Mercury Mahadasha</strong>, and Saturn sits retrograde in your tenth. That favours a considered move rather than a sudden one — negotiate, do not leap.",
        refs: ["Saturn ℞ in the 10th", "10th lord: Mars", "Mercury Mahadasha"],
      },
      { text: "What about the timing?" },
      {
        text: "Mercury runs to <strong class='text-paper'>January 1981</strong> in this cycle. The Ketu antardasha inside it is the restless stretch; act before it, or wait it out.",
        refs: ["Vimshottari dasha", "Ketu antardasha", "Moon in Ashlesha 2"],
      },
    ],
    readAloudTitle: "Read aloud",
    readAloudBody: "Play the whole reading as natural speech with speed control, or download it to keep.",
    speakTitle: "Speak to it",
    speakBody: "Hold a live spoken consultation. Ask out loud, hear the answer, hands free.",
    listening: "Listening",
    live: "Live",
    languagesTitle: "Three languages",
    languagesBody: "The whole reading and the whole conversation — not just the buttons.",
    limits: "It will not predict death or terminal illness, and it will not compute a degree or a date — those come from the ephemeris. Ask it to guess and it will tell you it cannot.",
  },
  milan: {
    eyebrow: "Kundali Milan",
    title: "Ashtakoota matching, with the reasoning shown",
    sub: "All eight kutas for the full 36 gunas, Manglik dosha checked on both sides with cancellation rules applied — and the score broken down koota by koota rather than handed over as one number.",
    kutasLabel: "Kutas computed",
    kutasValue: "8 of 8",
    doshaLabel: "Dosha checked",
    doshaValue: "Manglik, both sides",
    rulesLabel: "Cancellation rules",
    rulesValue: "Applied",
    bride: "Bride",
    groom: "Groom",
    brideChart: ["Taurus lagna", "Moon Rohini"],
    groomChart: ["Leo lagna", "Moon Magha"],
    verdict: "Good",
    kootaByKoota: "Koota by koota",
    barNote: "Bar length = what it is worth",
    manglik: "Manglik",
    cancelled: "Cancelled",
    yes: "yes",
    manglikNote: "Present on both sides, which cancels it — the classical rule, rather than flagging one chart and alarming the couple.",
    kutaNames: ["Varna", "Vashya", "Tara", "Yoni", "Graha Maitri", "Gana", "Bhakoot", "Nadi"],
    illustrative: "Illustrative. Bhakoot at zero is exactly the result worth reading the reasoning for, rather than reading the total — it costs seven of the eight points lost here.",
  },
  accuracy: {
    eyebrow: "Why charts disagree",
    titleA: "Kathmandu has not",
    titleB: " always been +5:45",
    todayLabel: "Today’s offset",
    actualLabel: "Actual, in 1975",
    deltaLabel: "Δ ascendant",
    bodyA: "Nepal kept +5:30 until 1986, and local mean time of +5:41:16 before that. A 1975 birth calculated with today’s offset lands fifteen minutes off — roughly ",
    bodyEm: "3.75° of ascendant",
    bodyB: ", which is enough to move a lagna into the wrong sign and quietly invalidate everything read from it.",
    bodyC: "So we store the zone by name and look up what it meant on your date, rather than storing a number that was only true this decade. A small thing that decides whether the rest of the chart is worth reading.",
  },
  astrologers: {
    badge: "Coming soon",
    status: "In development",
    title: "When you want a second opinion, talk to a real astrologer",
    body: "Verified jyotish taking consultations on the platform. Not another directory — they arrive already holding your chart, your questions and what the AI told you, so the hour is spent reading rather than re-explaining.",
    waitlistLabel: "Tell me when it opens",
    emailPlaceholder: "you@example.com",
    submit: "Join the waitlist",
    thanks: "thanks, you’re on the list",
    practising: "Practising astrologer? ",
    apply: "Apply to be verified",
    findLabel: "Find a jyotish",
    preview: "Preview",
    marriage: "Marriage",
    shareNote: "Your chart is shared only when you choose it, with one astrologer, and the grant is revocable.",
    cards: [
      { title: "Find a jyotish", body: "Search by tradition, language, speciality and price. Verified profiles only." },
      { title: "Chat first", body: "Start in writing, at your pace, with your chart already shared." },
      { title: "Then speak", body: "Audio or video when writing is not enough, scheduled across time zones." },
      { title: "Your data, your call", body: "Sharing a chart is an explicit grant to one person, and revocable." },
    ],
  },
  faq: {
    eyebrow: "Questions",
    title: "Before you start",
    sub: "The ones that come up most — about accuracy, about the calendar, about cost, and about what happens to your birth data.",
    stuckTitle: "Still stuck?",
    stuckBody: "Ask a person. We answer in English, नेपाली and हिन्दी.",
    items: [
      ["Do I need to know my exact birth time?", "The closer the better. The ascendant moves about one degree every four minutes, so an hour of uncertainty can shift your lagna into the next sign. Tick <em class='not-italic text-paper'>I do not know the exact time</em> if you are unsure, and the reading leans on the Moon rather than the ascendant."],
      ["Which system does this use?", "Sidereal, with the Lahiri (Chitrapaksha) ayanamsa, whole-sign houses and mean nodes — the standard combination in Indian and Nepali Jyotish. Divisional charts follow classical Parashari rules."],
      ["Can I enter a Bikram Sambat date?", "Yes. Switch the date field to <em class='not-italic text-paper'>BS</em> and it converts to the Gregorian date before anything is calculated."],
      ["Is it free?", "Casting a chart and reading it is free, with no account. Paid plans cover saved charts, longer conversations and — when it opens — consultations with human astrologers."],
      ["Is the AI making the astrology up?", "It cannot compute anything. Positions, houses, nakshatras and dasha dates come from the ephemeris and are handed to the model as finished data. Every section names the placements behind it, so you can check."],
      ["Is my birth data private?", "It is never written to logs, never put in error messages and never sent to analytics. It does go to the AI provider that writes your reading, because that is how the reading is written."],
      ["Do I need an account?", "Not to calculate a chart and read it. An account is for saving charts and keeping your conversations."],
    ],
  },
  closer: {
    titleA: "Your chart is waiting",
    titleB: " to be cast",
    sub: "Name, date, time, place. Free, and no account needed to see it.",
    cta: "Cast my kundali",
  },
  footer: {
    rightNow: "Right now",
    computing: "Computing…",
    tagline: "Vedic astrology where the ephemeris does the arithmetic and the astrologer does the reading — and never the other way round.",
    ephemeris: "Ephemeris",
    ayanamsa: "Ayanamsa",
    houses: "Houses",
    nodes: "Nodes",
    wholeSign: "Whole sign",
    mean: "Mean",
    platform: "Platform",
    createKundali: "Create a kundali",
    readAnalysis: "Read the analysis",
    askAstrologer: "Ask the astrologer",
    milan: "Kundali Milan",
    consult: "Consult an astrologer",
    soon: "Soon",
    learn: "Learn",
    howItWorks: "How it works",
    whyDisagree: "Why charts disagree",
    questions: "Questions",
    nakshatras: "The 27 nakshatras",
    dasha: "Vimshottari dasha",
    company: "Company",
    about: "About",
    support: "Support",
    privacy: "Privacy",
    terms: "Terms",
    applyAstrologer: "Apply as an astrologer",
    copyright: "© 2026 Nakhatra · Built in Kathmandu, 27.71° N 85.32° E",
  },
};

export const marketing: Record<Language, MarketingCopy> = { en, ne, hi };
