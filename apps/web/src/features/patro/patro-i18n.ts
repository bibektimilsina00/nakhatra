import { TITHI_DEV, YOGA_DEV, KARANA_DEV, dev } from "@/lib/i18n/patro-sanskrit";
import type { Language } from "@/lib/i18n/translations";
import { getNakshatraName, getPlanetName, getSignName } from "@/lib/i18n/vedic-translations";

/**
 * The patro's own vocabulary.
 *
 * Most of it already exists — the sankalpa maps for tithi, yoga and karana,
 * and the graha and rashi tables. This adds what a calendar needs on top: the
 * weekday as a patro heads its columns, and the ritu, which a Nepali patro
 * takes from the Bikram Sambat month rather than from the Sun's sign.
 */

/** Column headings, as a patro abbreviates them. */
export const WEEKDAY_SHORT: Record<Language, string[]> = {
  ne: ["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"],
  hi: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

export const WEEKDAY_FULL: Record<string, Record<Language, string>> = {
  Sunday: { ne: "आइतबार", hi: "रविवार", en: "Sunday" },
  Monday: { ne: "सोमबार", hi: "सोमवार", en: "Monday" },
  Tuesday: { ne: "मंगलबार", hi: "मंगलवार", en: "Tuesday" },
  Wednesday: { ne: "बुधबार", hi: "बुधवार", en: "Wednesday" },
  Thursday: { ne: "बिहीबार", hi: "गुरुवार", en: "Thursday" },
  Friday: { ne: "शुक्रबार", hi: "शुक्रवार", en: "Friday" },
  Saturday: { ne: "शनिबार", hi: "शनिवार", en: "Saturday" },
};

/** Nepali ritu follows the calendar month, not the Sun's sidereal sign:
 *  Shrawan and Bhadra are वर्षा whatever the Sun is doing. */
const RITU_BY_BS_MONTH: Record<Language, string>[] = [
  { ne: "वसन्त", hi: "वसंत", en: "Basanta" },   // Baisakh
  { ne: "ग्रीष्म", hi: "ग्रीष्म", en: "Grishma" },  // Jestha
  { ne: "ग्रीष्म", hi: "ग्रीष्म", en: "Grishma" },  // Asar
  { ne: "वर्षा", hi: "वर्षा", en: "Barsha" },     // Shrawan
  { ne: "वर्षा", hi: "वर्षा", en: "Barsha" },     // Bhadra
  { ne: "शरद", hi: "शरद", en: "Sharad" },       // Ashwin
  { ne: "शरद", hi: "शरद", en: "Sharad" },       // Kartik
  { ne: "हेमन्त", hi: "हेमंत", en: "Hemanta" },   // Mangsir
  { ne: "हेमन्त", hi: "हेमंत", en: "Hemanta" },   // Poush
  { ne: "शिशिर", hi: "शिशिर", en: "Shishir" },   // Magh
  { ne: "शिशिर", hi: "शिशिर", en: "Shishir" },   // Falgun
  { ne: "वसन्त", hi: "वसंत", en: "Basanta" },    // Chaitra
];

export function rituForBsMonth(bsMonth: number, lang: Language): string {
  return RITU_BY_BS_MONTH[(bsMonth - 1) % 12][lang];
}

export const PAKSHA: Record<string, Record<Language, string>> = {
  Shukla: { ne: "शुक्ल", hi: "शुक्ल", en: "Shukla" },
  Krishna: { ne: "कृष्ण", hi: "कृष्ण", en: "Krishna" },
};

export const AYANA: Record<string, Record<Language, string>> = {
  Uttarayana: { ne: "उत्तरायण", hi: "उत्तरायण", en: "Uttarayana" },
  Dakshinayana: { ne: "दक्षिणायन", hi: "दक्षिणायन", en: "Dakshinayana" },
};

const dv = (n: number | string) => String(n).replace(/[0-9]/g, (c) => "०१२३४५६७८९"[Number(c)]);

/** A clock time as a patro prints it. */
export function clock(iso: string | null | undefined, lang: Language): string {
  if (!iso) return "—";
  const t = iso.slice(11, 19);
  return lang === "en" ? t : dv(t);
}

export function num(n: number | string, lang: Language): string {
  return lang === "en" ? String(n) : dv(n);
}

export function tithiName(name: string, lang: Language): string {
  return lang === "en" ? name : dev(TITHI_DEV, name);
}
export function yogaName(name: string, lang: Language): string {
  return lang === "en" ? name : dev(YOGA_DEV, name);
}
export function karanaName(name: string, lang: Language): string {
  return lang === "en" ? name : dev(KARANA_DEV, name);
}
export function nakName(name: string, lang: Language): string {
  return getNakshatraName(name, lang);
}
export function signName(name: string, lang: Language): string {
  return getSignName(name, lang);
}
export function grahaName(name: string, lang: Language): string {
  return getPlanetName(name, lang);
}

/** A degree as a patro column shows it: degrees, minutes, seconds. */
export function dms(deg: number, lang: Language): string {
  const d = Math.floor(deg);
  const mFull = (deg - d) * 60;
  const m = Math.floor(mFull);
  const s = Math.round((mFull - m) * 60);
  const raw = `${d}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return lang === "en" ? raw : dv(raw);
}

/** The Bikram Sambat months as a patro heads them. The converter's own list
 *  is romanised, which is not what a Nepali calendar prints. */
export const BS_MONTH_NAMES: Record<Language, string[]> = {
  ne: ["बैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज", "कात्तिक", "मंसिर", "पुस", "माघ", "फागुन", "चैत"],
  hi: ["वैशाख", "ज्येष्ठ", "आषाढ़", "श्रावण", "भाद्र", "आश्विन", "कार्तिक", "मार्गशीर्ष", "पौष", "माघ", "फाल्गुन", "चैत्र"],
  en: ["Baisakh", "Jestha", "Asar", "Shrawan", "Bhadra", "Ashwin", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"],
};

export function bsMonthName(month: number, lang: Language): string {
  return BS_MONTH_NAMES[lang][(month - 1) % 12];
}
