import { marketing } from "@/lib/i18n/marketing";
import { SITE_ALT_NAMES, SITE_NAME, SITE_URL, SUPPORT_EMAIL, abs } from "@/lib/seo/site";

/**
 * JSON-LD for the landing page.
 *
 * Every claim here is one a person can verify on the page itself. There is no
 * `aggregateRating` and no review count: nobody has rated Nakhatra, and
 * inventing stars to win a rich result is the kind of thing a manual action is
 * for. The FAQ block is generated from the same copy the page renders, so the
 * markup and the visible answers can never drift apart — Google requires them
 * to match, and a hand-maintained second copy always eventually does not.
 */

type Json = Record<string, unknown>;

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

export function organizationLd(): Json {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    alternateName: SITE_ALT_NAMES,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: abs("/icon-512.png"),
      width: 512,
      height: 512,
    },
    email: SUPPORT_EMAIL,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: SUPPORT_EMAIL,
      availableLanguage: ["en", "ne", "hi"],
    },
  };
}

export function websiteLd(): Json {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    alternateName: SITE_ALT_NAMES,
    url: SITE_URL,
    inLanguage: ["en", "ne", "hi"],
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/**
 * What the thing actually is: a web application you can use without paying.
 *
 * `price: "0"` is the free tier and is true — casting a chart and reading it
 * needs no account and no card.
 */
export function applicationLd(): Json {
  const { hero } = marketing.en;
  return {
    "@type": "WebApplication",
    "@id": `${SITE_URL}/#app`,
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript.",
    description: `${hero.titleA} ${hero.titleB}. ${hero.sub}`,
    inLanguage: ["en", "ne", "hi"],
    publisher: { "@id": ORGANIZATION_ID },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "NPR",
      availability: "https://schema.org/InStock",
    },
    featureList: marketing.en.menu.features.map((f) => f.title),
  };
}

/**
 * The FAQ, from the copy the page renders.
 *
 * Answers carry a little markup for emphasis; the tags are stripped here
 * because the schema wants text and a crawler comparing markup to visible copy
 * compares the words, not the spans.
 */
export function faqLd(): Json {
  return {
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    mainEntity: marketing.en.faq.items.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: stripTags(answer) },
    })),
  };
}

/**
 * One day's rasifal for one sign, as an article.
 *
 * `datePublished` is the day the reading is for, not the moment the page was
 * rendered — the reading for the 25th is the same article however many
 * times the page is rebuilt. No `dateModified`: a claim that the text was
 * revised is a claim a crawler will compare against the text.
 */
export function rasifalArticleLd(opts: {
  path: string;
  headline: string;
  description: string;
  date: string;
  language: string;
}): Json {
  return {
    "@type": "Article",
    "@id": `${abs(opts.path)}#article`,
    headline: opts.headline,
    description: opts.description,
    datePublished: opts.date,
    inLanguage: opts.language,
    mainEntityOfPage: abs(opts.path),
    author: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    isPartOf: { "@id": WEBSITE_ID },
  };
}

export function breadcrumbLd(trail: { name: string; path: string }[]): Json {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: abs(crumb.path),
    })),
  };
}

/** One `@graph`, so the nodes can reference each other by `@id`. */
export function graph(nodes: Json[]): string {
  return JSON.stringify({ "@context": "https://schema.org", "@graph": nodes });
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
