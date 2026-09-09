/**
 * Bikram Sambat (BS) <-> Gregorian (AD) Date conversion utilities.
 * Powered by 'nepali-date-converter' (Subesh Bhandari) for exact official
 * Government of Nepal calendar table conversions (2000 BS to 2090 BS).
 */
import NepaliDate from "nepali-date-converter";

export const AD_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const AD_MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const BS_MONTHS = [
  "Baisakh (वैशाख)", "Jestha (जेठ)", "Asar (असार)", "Shrawan (श्रावण)",
  "Bhadra (भाद्र)", "Ashwin (आश्विन)", "Kartik (कार्तिक)", "Mangsir (मंसिर)",
  "Poush (पौष)", "Magh (माघ)", "Falgun (फागुन)", "Chaitra (चैत्र)",
];

export const BS_MONTH_SHORT = [
  "Baisakh", "Jestha", "Asar", "Shrawan",
  "Bhadra", "Ashwin", "Kartik", "Mangsir",
  "Poush", "Magh", "Falgun", "Chaitra",
];

/**
 * Returns exact number of days in a given BS month of a given BS year.
 */
export function getDaysInBsMonth(bsYear: number, bsMonth: number): number {
  try {
    const d = new NepaliDate(bsYear, bsMonth - 1, 1);
    let count = 28;
    d.setDate(28);
    while (d.getMonth() === bsMonth - 1) {
      count++;
      d.setDate(count);
    }
    return count - 1;
  } catch (err) {
    return 30;
  }
}

/**
 * Converts a BS Date (Year, Month 1-12, Day) into AD ISO String YYYY-MM-DD.
 */
export function convertBsToAd(
  bsYear: number,
  bsMonth: number,
  bsDay: number
): { year: number; month: number; day: number; iso: string } {
  try {
    // nepali-date-converter uses 0-indexed month (0 = Baisakh, 11 = Chaitra)
    const nepDate = new NepaliDate(bsYear, bsMonth - 1, bsDay);
    const jsDate = nepDate.toJsDate();

    const y = jsDate.getFullYear();
    const m = jsDate.getMonth() + 1;
    const d = jsDate.getDate();

    const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return { year: y, month: m, day: d, iso };
  } catch (err) {
    // Fallback standard offset approximation if year is out of 2000-2090 BS range
    const adYear = bsYear - 57;
    const iso = `${adYear}-${String(bsMonth).padStart(2, "0")}-${String(bsDay).padStart(2, "0")}`;
    return { year: adYear, month: bsMonth, day: bsDay, iso };
  }
}

/**
 * Converts AD Date (Year, Month 1-12, Day) into BS Date representation.
 */
export function convertAdToBs(
  adYear: number,
  adMonth: number,
  adDay: number
): { year: number; month: number; day: number; label: string } {
  try {
    const jsDate = new Date(adYear, adMonth - 1, adDay);
    const nepDate = new NepaliDate(jsDate);

    const y = nepDate.getYear();
    const m = nepDate.getMonth() + 1; // 1-indexed month (1 = Baisakh)
    const d = nepDate.getDate();

    const label = `${d} ${BS_MONTH_SHORT[m - 1] || "Baisakh"} ${y} BS`;
    return { year: y, month: m, day: d, label };
  } catch (err) {
    // Fallback standard offset approximation
    const bsYear = adYear + 57;
    const label = `${adDay} ${BS_MONTH_SHORT[adMonth - 1] || "Baisakh"} ${bsYear} BS`;
    return { year: bsYear, month: adMonth, day: adDay, label };
  }
}

/**
 * An ISO date as the reader counts years. Nepali and Hindi get Bikram
 * Sambat in Devanagari digits — a Nepali reader thinks in BS, and a dasha
 * that ends "2026-12-07" means little beside a patro that says २०८३.
 * English keeps the ISO date it was given.
 */
export function formatDateFor(iso: string, lang: "en" | "ne" | "hi"): string {
  if (lang === "en" || !iso) return iso;
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  try {
    const bs = convertAdToBs(y, m, d);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${bs.year}-${pad(bs.month)}-${pad(bs.day)}`.replace(
      /[0-9]/g,
      (c) => "०१२३४५६७८९"[Number(c)],
    );
  } catch {
    return iso;
  }
}
