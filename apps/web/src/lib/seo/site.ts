/**
 * Facts about the site that search engines need, in one place.
 *
 * Canonical URLs, the sitemap, robots and every JSON-LD block have to agree on
 * the origin. Six copies of `https://nakhatra.com` is six chances for one of
 * them to point at a staging host and split the index.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://nakhatra.com"
).replace(/\/$/, "");

export const SITE_NAME = "Nakhatra";
/** The word the name comes from, and what people type when they mean it.
 *  A nakshatra is a lunar mansion; the site is named for it with the s
 *  dropped, which is not how anyone spells it into a search box. */
export const SITE_ALT_NAMES = ["Nakshatra", "नक्षत्र", "Nakshatra Jyotish"];
export const SUPPORT_EMAIL = "support@nakhatra.com";

/** Absolute URL for a path. Crawlers ignore relative `og:image` and canonicals. */
export function abs(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Pages a crawler may index.
 *
 * Everything else is behind the auth gate, which renders nothing until
 * localStorage has been read — so an indexed `/dashboard` would be a blank
 * page in Google's results, which costs more than it earns.
 */
export const PUBLIC_ROUTES = ["/", "/privacy", "/terms"] as const;
