import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo/site";

/**
 * What a crawler may read.
 *
 * The signed-in app is disallowed rather than merely uncanonicalised: those
 * routes render nothing without a session, and a few hundred empty pages in
 * the index is a quality signal working against the pages that do have
 * content. `/api/` is disallowed because it is not content at all.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/kundali",
          "/reading",
          "/milan",
          "/login",
          "/profile",
          "/settings",
          "/notifications",
          "/consultations",
          "/practitioners",
          "/admin",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
