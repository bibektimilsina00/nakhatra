/**
 * The twelve signs as URLs.
 *
 * The slug is the word a Nepali types — "mesh rashifal", "brish rashifal" —
 * not the Sanskrit transliteration and not the English zodiac name. Both of
 * those, and the common misspellings, are aliases that redirect to the one
 * canonical page, so a search for any spelling lands on a URL Google has one
 * copy of.
 */
export interface SignRoute {
  /** The API's name for it. */
  sign: string;
  /** The canonical URL segment. */
  slug: string;
  /** The Romanised name, for titles a Latin-script searcher will match. */
  roman: string;
  /** Other spellings people type. Each redirects to `slug`. */
  aliases: string[];
}

export const SIGN_ROUTES: SignRoute[] = [
  { sign: "Aries", slug: "mesh", roman: "Mesh", aliases: ["aries", "mesha"] },
  { sign: "Taurus", slug: "brish", roman: "Brish", aliases: ["taurus", "vrish", "vrishabha", "brishabha", "vrishabh"] },
  { sign: "Gemini", slug: "mithun", roman: "Mithun", aliases: ["gemini", "mithuna"] },
  { sign: "Cancer", slug: "karkat", roman: "Karkat", aliases: ["cancer", "karkata", "kark", "karka"] },
  { sign: "Leo", slug: "singha", roman: "Singha", aliases: ["leo", "simha", "sinha"] },
  { sign: "Virgo", slug: "kanya", roman: "Kanya", aliases: ["virgo"] },
  { sign: "Libra", slug: "tula", roman: "Tula", aliases: ["libra"] },
  { sign: "Scorpio", slug: "brishchik", roman: "Brishchik", aliases: ["scorpio", "vrishchik", "brischik", "vrischik", "brishchika"] },
  { sign: "Sagittarius", slug: "dhanu", roman: "Dhanu", aliases: ["sagittarius", "dhanus", "dhanush"] },
  { sign: "Capricorn", slug: "makar", roman: "Makar", aliases: ["capricorn", "makara"] },
  { sign: "Aquarius", slug: "kumbha", roman: "Kumbha", aliases: ["aquarius", "kumbh"] },
  { sign: "Pisces", slug: "meen", roman: "Meen", aliases: ["pisces", "meena", "min", "mina"] },
];

export const slugFor = (sign: string): string =>
  SIGN_ROUTES.find((r) => r.sign === sign)?.slug ?? sign.toLowerCase();

/** The route for a segment, whether canonical or an alias; null if neither. */
export function routeForSlug(slug: string): SignRoute | null {
  const s = slug.toLowerCase();
  return SIGN_ROUTES.find((r) => r.slug === s || r.aliases.includes(s)) ?? null;
}
