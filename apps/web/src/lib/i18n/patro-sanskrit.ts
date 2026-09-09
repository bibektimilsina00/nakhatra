import type { Language } from "@/lib/i18n/translations";

/**
 * देवनागरी for every value the engine emits, so the patro can render the
 * sankalpa exactly as a hand-written janma patrika does. Keys are the
 * engine's own romanised strings — never translate by position, only by name.
 *
 * The wording follows the two family patros cast in Parbat (sample_kundali/),
 * which are the reference for the whole layout.
 */

export const TITHI_DEV: Record<string, string> = {
  Pratipada: "प्रतिपदा", Dwitiya: "द्वितीया", Tritiya: "तृतीया",
  Chaturthi: "चतुर्थी", Panchami: "पञ्चमी", Shashthi: "षष्ठी",
  Saptami: "सप्तमी", Ashtami: "अष्टमी", Navami: "नवमी", Dashami: "दशमी",
  Ekadashi: "एकादशी", Dwadashi: "द्वादशी", Trayodashi: "त्रयोदशी",
  Chaturdashi: "चतुर्दशी", Purnima: "पूर्णिमा", Amavasya: "अमावस्या",
};

export const YOGA_DEV: Record<string, string> = {
  Vishkambha: "विष्कम्भ", Priti: "प्रीति", Ayushman: "आयुष्मान्",
  Saubhagya: "सौभाग्य", Shobhana: "शोभन", Atiganda: "अतिगण्ड",
  Sukarma: "सुकर्मा", Dhriti: "धृति", Shula: "शूल", Ganda: "गण्ड",
  Vriddhi: "वृद्धि", Dhruva: "ध्रुव", Vyaghata: "व्याघात",
  Harshana: "हर्षण", Vajra: "वज्र", Siddhi: "सिद्धि",
  Vyatipata: "व्यतीपात", Variyana: "वरीयान्", Parigha: "परिघ",
  Shiva: "शिव", Siddha: "सिद्ध", Sadhya: "साध्य", Shubha: "शुभ",
  Shukla: "शुक्ल", Brahma: "ब्रह्म", Indra: "इन्द्र", Vaidhriti: "वैधृति",
};

export const KARANA_DEV: Record<string, string> = {
  Bava: "बव", Balava: "बालव", Kaulava: "कौलव", Taitila: "तैतिल",
  Gara: "गर", Vanija: "वणिज", Vishti: "विष्टि", Shakuni: "शकुनि",
  Chatushpada: "चतुष्पद", Naga: "नाग", Kimstughna: "किंस्तुघ्न",
};

/** The vara as a patro writes it — the graha's day, not the weekday. */
export const VARA_DEV: Record<string, string> = {
  Sunday: "आदित्य", Monday: "सोम", Tuesday: "भौम", Wednesday: "बुध",
  Thursday: "गुरु", Friday: "शुक्र", Saturday: "शनि",
};

export const MASA_DEV: Record<string, string> = {
  Baishakh: "वैशाख", Jestha: "ज्येष्ठ", Ashar: "आषाढ", Shrawan: "श्रावण",
  Bhadra: "भाद्र", Ashwin: "आश्विन", Kartik: "कार्तिक", Mangsir: "मार्ग",
  Poush: "पौष", Magh: "माघ", Falgun: "फाल्गुन", Chaitra: "चैत्र",
};

export const RITU_DEV: Record<string, string> = {
  Basant: "वसन्त", Grishma: "ग्रीष्म", Varsha: "वर्षा",
  Sharad: "शरद्", Hemant: "हेमन्त", Shishir: "शिशिर",
};

export const AYANA_DEV: Record<string, string> = {
  Uttarayana: "उत्तर", Dakshinayana: "दक्षिण",
};

export const PAKSHA_DEV: Record<string, string> = {
  Shukla: "शुक्ल", Krishna: "कृष्ण",
};

export const CHARAN_DEV = ["प्रथम", "द्वितीय", "तृतीय", "चतुर्थ"] as const;

export const AD_MONTH_DEV = [
  "जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन",
  "जुलाई", "अगस्त", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर",
] as const;

/** All sixty, in the engine's cycle order and spelling. */
export const SAMVATSARA_DEV: Record<string, string> = {
  Prabhava: "प्रभव", Vibhava: "विभव", Shukla: "शुक्ल", Pramoda: "प्रमोद",
  Prajapati: "प्रजापति", Angirasa: "अङ्गिरा", Shrimukha: "श्रीमुख",
  Bhava: "भाव", Yuva: "युवा", Dhata: "धाता", Ishvara: "ईश्वर",
  Bahudhanya: "बहुधान्य", Pramathi: "प्रमाथी", Vikrama: "विक्रम",
  Vrisha: "वृष", Chitrabhanu: "चित्रभानु", Svabhanu: "स्वभानु",
  Tarana: "तारण", Parthiva: "पार्थिव", Vyaya: "व्यय", Sarvajit: "सर्वजित्",
  Sarvadhari: "सर्वधारी", Virodhi: "विरोधी", Vikriti: "विकृति",
  Khara: "खर", Nandana: "नन्दन", Vijaya: "विजय", Jaya: "जय",
  Manmatha: "मन्मथ", Durmukha: "दुर्मुख", Hevilambi: "हेमलम्ब",
  Vilambi: "विलम्बी", Vikari: "विकारी", Sharvari: "शार्वरी", Plava: "प्लव",
  Shubhakrit: "शुभकृत्", Shobhakrit: "शोभकृत्", Krodhi: "क्रोधी",
  Vishvavasu: "विश्वावसु", Parabhava: "पराभव", Plavanga: "प्लवङ्ग",
  Kilaka: "कीलक", Saumya: "सौम्य", Sadharana: "साधारण",
  Virodhakrit: "विरोधकृत्", Paridhavi: "परिधावी", Pramadicha: "प्रमादी",
  Ananda: "आनन्द", Rakshasa: "राक्षस", Nala: "नल", Pingala: "पिङ्गल",
  Kalayukti: "कालयुक्त", Siddharthi: "सिद्धार्थी", Raudra: "रौद्र",
  Durmati: "दुर्मति", Dundubhi: "दुन्दुभि", Rudhirodgari: "रुधिरोद्गारी",
  Raktakshi: "रक्ताक्षी", Krodhana: "क्रोधन", Akshaya: "अक्षय",
};

export const YOGINI_DEV: Record<string, string> = {
  Mangala: "मंगला", Pingala: "पिंगला", Dhanya: "धान्या", Bhramari: "भ्रामरी",
  Bhadrika: "भद्रिका", Ulka: "उल्का", Siddha: "सिद्धा", Sankata: "संकटा",
};

/** e.g. AVAKHADA ne strings carry a gloss — "मूषक (मुसो)"; the sankalpa wants
 *  the bare Sanskrit head word. */
export function bareDev(glossed: string): string {
  return glossed.split(" (")[0];
}

export function dev<T extends Record<string, string>>(map: T, key: string): string {
  return map[key] ?? key;
}

/** Whether this language renders the patro in Sanskrit. */
export function isSanskrit(lang: Language): boolean {
  return lang === "ne" || lang === "hi";
}

/**
 * इष्टकाल — ghati and pala elapsed from sunrise to the birth moment. Display
 * arithmetic on two values the engine already computed, not astrology: one
 * ghati is 24 minutes, one pala 24 seconds. A birth before sunrise belongs to
 * the previous Vedic day, so a lunar day's worth is added.
 */
export function ishtaKaal(
  birthDate: string,
  birthTime: string,
  sunriseIso: string | null | undefined,
): { ghati: number; pala: number } | null {
  if (!sunriseIso) return null;
  const birth = new Date(`${birthDate}T${birthTime}`);
  const sunrise = new Date(sunriseIso.slice(0, 19)); // both as local wall clock
  let seconds = (birth.getTime() - sunrise.getTime()) / 1000;
  if (Number.isNaN(seconds)) return null;
  if (seconds < 0) seconds += 24 * 3600;
  const ghati = Math.floor(seconds / (24 * 60));
  const pala = Math.floor((seconds % (24 * 60)) / 24);
  return { ghati, pala };
}
