import type { MetadataRoute } from "next";

import { SIGN_ROUTES } from "@/features/rasifal/signs";
import { SITE_URL } from "@/lib/seo/site";

/**
 * The pages worth indexing, and nothing else.
 *
 * A sitemap listing auth-gated routes teaches a crawler that most of the site
 * is empty. When the practitioner directory opens, its profiles belong here —
 * they are the only other pages with content a stranger can read.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      // The rasifal changes every day and is the one page a stranger can read
      // in full without signing in.
      url: `${SITE_URL}/rasifal`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    // One page per sign: "mesh rashifal" is its own search, and it wants its
    // own URL to land on.
    ...SIGN_ROUTES.map((r) => ({
      url: `${SITE_URL}/rasifal/${r.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    {
      // The calendar people look up by habit.
      url: `${SITE_URL}/patro`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/privacy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
