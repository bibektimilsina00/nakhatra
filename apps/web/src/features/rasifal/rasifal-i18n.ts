import type { RashiDay, RashiPeriod, Span } from "@/features/rasifal/types";
import type { Language } from "@/lib/i18n/translations";
import { getPlanetName, getSignName } from "@/lib/i18n/vedic-translations";

/**
 * The day, said out loud.
 *
 * The engine judges; this speaks. Every sentence is assembled from a fact it
 * computed — the murti, the house a graha stands in, whether a vedha blocked
 * it — so nothing here is invented and nothing is random. Two signs read
 * differently because their houses differ, which is the actual reason.
 *
 * Kept in the client for the same reason the koota text is: the wire carries
 * findings, and each language renders them itself.
 */

type Tri = Record<Language, string>;

/** What a house is about, which is what makes a transit mean something. */
const HOUSE_DOMAIN: Record<number, Tri> = {
  1: { en: "your body and how you carry yourself", ne: "शरीर र आफ्नै प्रस्तुति", hi: "शरीर और अपनी प्रस्तुति" },
  2: { en: "money, family and speech", ne: "धन, परिवार र वाणी", hi: "धन, परिवार और वाणी" },
  3: { en: "courage, effort and siblings", ne: "साहस, प्रयास र भाइबहिनी", hi: "साहस, प्रयास और भाई-बहन" },
  4: { en: "home, mother and peace of mind", ne: "घर, आमा र मनको शान्ति", hi: "घर, माता और मन की शांति" },
  5: { en: "learning, children and judgement", ne: "विद्या, सन्तान र विवेक", hi: "विद्या, संतान और विवेक" },
  6: { en: "rivals, debts and health", ne: "शत्रु, ऋण र स्वास्थ्य", hi: "शत्रु, ऋण और स्वास्थ्य" },
  7: { en: "partnership and dealings with others", ne: "साझेदारी र अरूसँगको व्यवहार", hi: "साझेदारी और दूसरों से व्यवहार" },
  8: { en: "sudden turns and hidden obstacles", ne: "अकस्मात् मोड र लुकेका अवरोध", hi: "अचानक मोड़ और छिपी बाधाएँ" },
  9: { en: "fortune, elders and belief", ne: "भाग्य, गुरुजन र आस्था", hi: "भाग्य, गुरुजन और आस्था" },
  10: { en: "work and standing", ne: "कार्यक्षेत्र र प्रतिष्ठा", hi: "कार्यक्षेत्र और प्रतिष्ठा" },
  11: { en: "gains and friendships", ne: "लाभ र मित्रता", hi: "लाभ और मित्रता" },
  12: { en: "expense, travel and rest", ne: "खर्च, यात्रा र विश्राम", hi: "व्यय, यात्रा और विश्राम" },
};

/** The Moon's murti sets the day's temper before any other graha speaks. */
const MURTI_LINE: Record<string, Tri> = {
  Swarna: {
    en: "The Moon stands in a golden house from your sign — the day carries you rather than resists you.",
    ne: "चन्द्रमा तपाईंको राशिबाट स्वर्ण मूर्तिमा छ — दिनले साथ दिन्छ, अल्झाउँदैन।",
    hi: "चंद्रमा आपकी राशि से स्वर्ण मूर्ति में है — दिन साथ देगा, अटकाएगा नहीं।",
  },
  Rajata: {
    en: "The Moon is in a silver house — steady, workable, nothing forced.",
    ne: "चन्द्रमा रजत मूर्तिमा छ — स्थिर र सहज, जोडबल गर्नु पर्दैन।",
    hi: "चंद्रमा रजत मूर्ति में है — स्थिर और सहज, ज़ोर लगाने की ज़रूरत नहीं।",
  },
  Tamra: {
    en: "The Moon is in a copper house — an ordinary day that rewards patience.",
    ne: "चन्द्रमा ताम्र मूर्तिमा छ — सामान्य दिन, धैर्यले फल दिन्छ।",
    hi: "चंद्रमा ताम्र मूर्ति में है — सामान्य दिन, धैर्य से फल मिलेगा।",
  },
  Loha: {
    en: "The Moon is in an iron house — hold plans lightly and let the day pass without a fight.",
    ne: "चन्द्रमा लोह मूर्तिमा छ — योजनालाई खुकुलो राख्नुहोस्, दिनसँग नलड्नुहोस्।",
    hi: "चंद्रमा लोह मूर्ति में है — योजनाओं को ढीला रखें, दिन से न लड़ें।",
  },
};

/** What each graha does when it is helping. */
const SUPPORT_LINE: Record<string, Tri> = {
  Sun: { en: "The Sun backs your standing", ne: "सूर्यले प्रतिष्ठामा साथ दिन्छ", hi: "सूर्य प्रतिष्ठा में साथ देता है" },
  Moon: { en: "The Moon keeps the mind clear", ne: "चन्द्रमाले मन सफा राख्छ", hi: "चंद्रमा मन को स्वच्छ रखता है" },
  Mars: { en: "Mars lends push and nerve", ne: "मङ्गलले जोश र आँट दिन्छ", hi: "मंगल जोश और साहस देता है" },
  Mercury: { en: "Mercury sharpens words and dealings", ne: "बुधले वाणी र व्यवहार तिखो बनाउँछ", hi: "बुध वाणी और व्यवहार तेज़ करता है" },
  Jupiter: { en: "Jupiter opens a door", ne: "बृहस्पतिले ढोका खोल्छ", hi: "बृहस्पति द्वार खोलता है" },
  Venus: { en: "Venus eases relations and comfort", ne: "शुक्रले सम्बन्ध र सुख सहज बनाउँछ", hi: "शुक्र संबंध और सुख सहज करता है" },
  Saturn: { en: "Saturn rewards steady work", ne: "शनिले लगातार श्रमको फल दिन्छ", hi: "शनि निरंतर श्रम का फल देता है" },
  Rahu: { en: "Rahu favours the unconventional move", ne: "राहुले नौलो चालमा साथ दिन्छ", hi: "राहु अनोखे कदम में साथ देता है" },
  Ketu: { en: "Ketu favours withdrawal and insight", ne: "केतुले एकान्त र अन्तर्दृष्टि दिन्छ", hi: "केतु एकांत और अंतर्दृष्टि देता है" },
};

/** And what it does when it is not. */
const STRAIN_LINE: Record<string, Tri> = {
  Sun: { en: "the Sun can bring friction with authority", ne: "सूर्यले अधिकारसँग टकराव ल्याउन सक्छ", hi: "सूर्य अधिकार से टकराव ला सकता है" },
  Moon: { en: "the Moon can unsettle the mood", ne: "चन्द्रमाले मन अस्थिर बनाउन सक्छ", hi: "चंद्रमा मन अस्थिर कर सकता है" },
  Mars: { en: "Mars can turn haste into a quarrel", ne: "मङ्गलले हतारलाई झगडा बनाउन सक्छ", hi: "मंगल जल्दबाज़ी को झगड़ा बना सकता है" },
  Mercury: { en: "Mercury can scatter attention", ne: "बुधले ध्यान बटार्न सक्छ", hi: "बुध ध्यान बिखेर सकता है" },
  Jupiter: { en: "Jupiter can tempt you to over-commit", ne: "बृहस्पतिले बढी जिम्मा लिन उक्साउन सक्छ", hi: "बृहस्पति अधिक जिम्मा लेने को उकसा सकता है" },
  Venus: { en: "Venus can pull toward comfort and expense", ne: "शुक्रले सुख र खर्चतर्फ तान्न सक्छ", hi: "शुक्र सुख और व्यय की ओर खींच सकता है" },
  Saturn: { en: "Saturn slows things and asks for patience", ne: "शनिले काम ढिलो बनाउँछ, धैर्य माग्छ", hi: "शनि काम धीमा करता है, धैर्य माँगता है" },
  Rahu: { en: "Rahu can cloud judgement", ne: "राहुले विवेक धमिलो बनाउन सक्छ", hi: "राहु विवेक धुँधला कर सकता है" },
  Ketu: { en: "Ketu can leave things feeling unfinished", ne: "केतुले काम अधुरो जस्तो बनाउन सक्छ", hi: "केतु काम अधूरा-सा बना सकता है" },
};

/** One classical remedy per graha. Named, not invented. */
const REMEDY: Record<string, Tri> = {
  Sun: { en: "Offer water to the rising sun.", ne: "उदाउँदो सूर्यलाई जल अर्पण गर्नुहोस्।", hi: "उगते सूर्य को जल अर्पित करें।" },
  Moon: { en: "Offer something white, or drink milk from a silver vessel.", ne: "सेतो वस्तु दान गर्नुहोस् वा चाँदीको भाँडामा दूध पिउनुहोस्।", hi: "श्वेत वस्तु दान करें या चाँदी के पात्र में दूध पिएँ।" },
  Mars: { en: "Read the Hanuman Chalisa and avoid a red-hot argument.", ne: "हनुमान चालीसा पाठ गर्नुहोस्, रिसको बहसबाट टाढै बस्नुहोस्।", hi: "हनुमान चालीसा पढ़ें, क्रोध के विवाद से दूर रहें।" },
  Mercury: { en: "Give green lentils or stationery to a student.", ne: "विद्यार्थीलाई हरियो दाल वा शैक्षिक सामग्री दान गर्नुहोस्।", hi: "विद्यार्थी को हरी दाल या शैक्षिक सामग्री दें।" },
  Jupiter: { en: "Offer something yellow and honour a teacher.", ne: "पहेँलो वस्तु दान गरी गुरुको सम्मान गर्नुहोस्।", hi: "पीली वस्तु दान कर गुरु का सम्मान करें।" },
  Venus: { en: "Keep the home clean and give white sweets.", ne: "घर सफा राख्नुहोस् र सेतो मिठाइ दान गर्नुहोस्।", hi: "घर स्वच्छ रखें और सफेद मिठाई दान करें।" },
  Saturn: { en: "Feed a crow or a labourer, and light a mustard-oil lamp.", ne: "काग वा श्रमिकलाई खुवाउनुहोस्, तोरीको तेलको बत्ती बाल्नुहोस्।", hi: "कौए या श्रमिक को खिलाएँ, सरसों तेल का दीपक जलाएँ।" },
  Rahu: { en: "Chant to Bhairava and avoid a decision made in a hurry.", ne: "भैरवको स्मरण गर्नुहोस्, हतारमा निर्णय नगर्नुहोस्।", hi: "भैरव का स्मरण करें, जल्दबाज़ी में निर्णय न लें।" },
  Ketu: { en: "Sit quietly for a while; give a blanket to someone who needs one.", ne: "केही बेर मौन बस्नुहोस्; खाँचो भएकालाई ओढ्ने दिनुहोस्।", hi: "कुछ देर मौन बैठें; ज़रूरतमंद को कंबल दें।" },
};

export const COLOURS: Record<string, Tri> = {
  white: { en: "White", ne: "सेतो", hi: "सफेद" },
  red: { en: "Red", ne: "रातो", hi: "लाल" },
  green: { en: "Green", ne: "हरियो", hi: "हरा" },
  yellow: { en: "Yellow", ne: "पहेँलो", hi: "पीला" },
  blue: { en: "Blue", ne: "निलो", hi: "नीला" },
  copper: { en: "Copper", ne: "तामाको रङ", hi: "ताम्र" },
  smoke: { en: "Smoke grey", ne: "धुवाँ रङ", hi: "धूम्र" },
  grey: { en: "Grey", ne: "खरानी रङ", hi: "धूसर" },
};

export const MURTI_NAMES: Record<string, Tri> = {
  Swarna: { en: "Swarna (gold)", ne: "स्वर्ण", hi: "स्वर्ण" },
  Rajata: { en: "Rajata (silver)", ne: "रजत", hi: "रजत" },
  Tamra: { en: "Tamra (copper)", ne: "ताम्र", hi: "ताम्र" },
  Loha: { en: "Loha (iron)", ne: "लोह", hi: "लोह" },
};

/** The naming syllables that belong to each rashi, as a panchanga prints
 *  them under the sign's name. */
export const RASHI_SYLLABLES: string[][] = [
  ["चु", "चे", "चो", "ला", "ली", "लू", "ले", "लो", "अ"],
  ["इ", "उ", "ए", "ओ", "वा", "वी", "वू", "वे", "वो"],
  ["का", "की", "कु", "घ", "ङ", "छ", "के", "को", "हा"],
  ["ही", "हु", "हे", "हो", "डा", "डी", "डू", "डे", "डो"],
  ["मा", "मी", "मू", "मे", "मो", "टा", "टी", "टू", "टे"],
  ["टो", "पा", "पी", "पू", "ष", "ण", "ठ", "पे", "पो"],
  ["रा", "री", "रु", "रे", "रो", "ता", "ती", "तू", "ते"],
  ["तो", "ना", "नी", "नू", "ने", "नो", "या", "यी", "यू"],
  ["ये", "यो", "भा", "भी", "भू", "धा", "फा", "ढा", "भे"],
  ["भो", "जा", "जी", "जु", "जे", "जो", "खी", "खू", "खे"],
  ["गु", "गे", "गो", "सा", "सी", "सू", "से", "सो", "दा"],
  ["दी", "दू", "थ", "झ", "ञ", "दे", "दो", "चा", "ची"],
];

/** How loudly each graha speaks in a daily reading. */
const VOICE: Record<string, number> = {
  Saturn: 1.6, Jupiter: 1.5, Rahu: 1.1, Ketu: 1.0, Mars: 1.2,
  Sun: 1.1, Venus: 0.9, Mercury: 0.85, Moon: 1.3,
};

/** And how much the house it stands in matters. Kendras and trikonas carry a
 *  transit; the dusthanas are where a difficult one is actually felt. */
const HOUSE_WEIGHT: Record<number, number> = {
  1: 1.4, 4: 1.2, 7: 1.3, 10: 1.4,   // kendra
  5: 1.2, 9: 1.2,                     // trikona
  6: 1.1, 8: 1.3, 12: 1.1,            // dusthana
  2: 1.0, 3: 0.9, 11: 1.0,
};

function houseOf(day: RashiDay, graha: string): number | null {
  return day.transits.find((t) => t.name === graha)?.house ?? null;
}

/**
 * The graha worth naming, weighed by where it stands for *this* sign.
 *
 * A global order made Saturn the headline for all twelve cards, which is true
 * of the sky and useless as a reading — the twelve differ precisely because
 * the same graha falls in a different house from each rashi. Weighting the
 * house is what lets that difference reach the sentence.
 */
function strongest(day: RashiDay, names: string[]): string | null {
  let best: string | null = null;
  let bestScore = -Infinity;
  for (const name of names) {
    const h = houseOf(day, name);
    const score = (VOICE[name] ?? 1) * (h ? (HOUSE_WEIGHT[h] ?? 1) : 1);
    if (score > bestScore) {
      bestScore = score;
      best = name;
    }
  }
  return best;
}

/**
 * The reading, in three or four sentences.
 *
 * Order matters: the murti sets the temper, the strongest strain names what to
 * watch and where, the strongest support names what carries, and the remedy
 * answers the strain rather than being decoration.
 */
export function readingFor(day: RashiDay, lang: Language): string {
  const out: string[] = [MURTI_LINE[day.murti]?.[lang] ?? ""];

  const strain = strongest(day, day.strains);
  if (strain) {
    const h = houseOf(day, strain);
    const where = h ? HOUSE_DOMAIN[h]?.[lang] : null;
    const what = STRAIN_LINE[strain]?.[lang] ?? "";
    if (where) {
      out.push(
        lang === "en"
          ? `In ${where}, ${what}.`
          : `${where}मा ${what}।`,
      );
    } else {
      out.push(lang === "en" ? `Today, ${what}.` : `आज ${what}।`);
    }
  }

  const support = strongest(day, day.supports);
  if (support) {
    const h = houseOf(day, support);
    const where = h ? HOUSE_DOMAIN[h]?.[lang] : null;
    const what = SUPPORT_LINE[support]?.[lang] ?? "";
    if (where) {
      out.push(
        lang === "en"
          ? `${what} in ${where}.`
          : `${where}मा ${what}।`,
      );
    } else {
      out.push(`${what}${lang === "en" ? "." : "।"}`);
    }
  }

  // A blocked benefic is the one thing a bare score cannot show, and it is
  // exactly what a reader who knows gochara looks for.
  // Only the loudest blocked graha is worth a sentence; listing four of them
  // turned every card into the same paragraph.
  const blockedAll = day.transits.filter((t) => t.obstructed).map((t) => t.name);
  const blocked = strongest(day, blockedAll);
  if (blocked) {
    const names = getPlanetName(blocked, lang);
    out.push(
      lang === "en"
        ? `${names} would have helped but is obstructed — expect the good result to arrive late rather than not at all.`
        : lang === "ne"
          ? `${names} अनुकूल भए पनि वेधले रोकेको छ — राम्रो फल ढिलो आउँछ, नआउने होइन।`
          : `${names} अनुकूल होकर भी वेध से रुका है — शुभ फल देर से आएगा, बिलकुल नहीं ऐसा नहीं।`,
    );
  }

  if (strain) out.push(REMEDY[strain]?.[lang] ?? "");
  return out.filter(Boolean).join(" ");
}

/** A one-line verdict for the card's header. */
export function verdictFor(rating: number, lang: Language): string {
  const bands: Tri[] = [
    { en: "Difficult day", ne: "कठिन दिन", hi: "कठिन दिन" },
    { en: "Go carefully", ne: "सतर्क रहनुहोस्", hi: "सतर्क रहें" },
    { en: "Ordinary day", ne: "सामान्य दिन", hi: "सामान्य दिन" },
    { en: "Favourable", ne: "अनुकूल", hi: "अनुकूल" },
    { en: "Strongly favourable", ne: "धेरै शुभ", hi: "अत्यंत शुभ" },
  ];
  return bands[Math.min(4, Math.max(0, rating - 1))][lang];
}

export function colourName(key: string, lang: Language): string {
  return COLOURS[key]?.[lang] ?? key;
}

export function murtiName(key: string, lang: Language): string {
  return MURTI_NAMES[key]?.[lang] ?? key;
}

export function rashiLabel(signIndex: number, sign: string, lang: Language): string {
  return getSignName(sign, lang);
}

// --- periods ---------------------------------------------------------------

/**
 * A week or a month, said out loud.
 *
 * Deliberately not the daily sentence with a different date. What a span can
 * say and a day cannot is which grahas hold their position throughout — the
 * theme — and which dates inside it stand out. The Moon's murti is left out
 * entirely: it crosses every house within a month, so quoting it would be
 * quoting noise.
 */
export function periodReadingFor(period: RashiPeriod, span: "weekly" | "monthly", lang: Language): string {
  const out: string[] = [];
  const unit: Tri =
    span === "weekly"
      ? { en: "week", ne: "हप्ता", hi: "सप्ताह" }
      : { en: "month", ne: "महिना", hi: "महीना" };

  const strain = period.steady_strains[0];
  const support = period.steady_supports[0];

  if (support) {
    const what = SUPPORT_LINE[support]?.[lang] ?? "";
    out.push(
      lang === "en"
        ? `Through the ${unit.en}, ${what}.`
        : `यो ${unit[lang]}भरि ${what}।`,
    );
  }
  if (strain) {
    const what = STRAIN_LINE[strain]?.[lang] ?? "";
    out.push(
      lang === "en"
        ? `Running against that, ${what}.`
        : `अर्कोतर्फ, ${what}।`,
    );
  }
  if (!support && !strain) {
    out.push(
      lang === "en"
        ? `No graha holds one position through the ${unit.en} — it moves in stretches rather than as one stretch.`
        : `कुनै ग्रहले पूरै ${unit[lang]} एउटै स्थिति राख्दैन — यो खण्ड-खण्डमा चल्छ।`,
    );
  }

  // Golden and iron days are the one place the Moon still says something
  // across a span: how many of the days it grades well.
  if (period.golden_days || period.iron_days) {
    out.push(
      lang === "en"
        ? `${period.golden_days} golden ${period.golden_days === 1 ? "day" : "days"} and ${period.iron_days} iron.`
        : `${toDev(period.golden_days)} दिन स्वर्ण, ${toDev(period.iron_days)} दिन लोह मूर्तिमा।`,
    );
  }

  if (strain) out.push(REMEDY[strain]?.[lang] ?? "");
  return out.filter(Boolean).join(" ");
}

function toDev(n: number): string {
  return String(n).replace(/[0-9]/g, (c) => "०१२३४५६७८९"[Number(c)]);
}

export function spanLabel(span: Span, lang: Language): string {
  const labels: Record<Span, Tri> = {
    daily: { en: "Daily", ne: "दैनिक", hi: "दैनिक" },
    weekly: { en: "Weekly", ne: "साप्ताहिक", hi: "साप्ताहिक" },
    monthly: { en: "Monthly", ne: "मासिक", hi: "मासिक" },
  };
  return labels[span][lang];
}

/** The verdict word. Keyed on the engine's band so the label and the written
 *  reading can never disagree — both are told the same thing. */
export const BAND_LABELS: Record<string, Tri> = {
  very_good: { en: "Strongly favourable", ne: "धेरै शुभ", hi: "अत्यंत शुभ" },
  good: { en: "Favourable", ne: "शुभ", hi: "शुभ" },
  favourable: { en: "Mostly favourable", ne: "अनुकूल", hi: "अनुकूल" },
  ordinary: { en: "Ordinary day", ne: "सामान्य", hi: "सामान्य" },
  caution: { en: "Go carefully", ne: "सावधानी", hi: "सावधानी" },
  difficult: { en: "Difficult day", ne: "कठिन", hi: "कठिन" },
};

export function bandLabel(band: string, rating: number, lang: Language): string {
  return BAND_LABELS[band]?.[lang] ?? verdictFor(rating, lang);
}

export const SECTION_LABELS: Record<string, Tri> = {
  career: { en: "Work", ne: "कार्यक्षेत्र", hi: "कार्यक्षेत्र" },
  love: { en: "Relationships", ne: "सम्बन्ध", hi: "संबंध" },
  finance: { en: "Money", ne: "आर्थिक", hi: "आर्थिक" },
  health: { en: "Health", ne: "स्वास्थ्य", hi: "स्वास्थ्य" },
  remedy: { en: "Remedy", ne: "उपाय", hi: "उपाय" },
  astrological_reason: { en: "The astrology behind it", ne: "ज्योतिषीय कारण", hi: "ज्योतिषीय कारण" },
};
