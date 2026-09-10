import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { PatroPage } from "@/features/patro/components/patro-page";
import { breadcrumbLd, graph } from "@/lib/seo/structured-data";

const TITLE = "नेपाली पात्रो · Nepali Patro · Nepali Calendar with Tithi";
const DESCRIPTION =
  "आजको नेपाली पात्रो — तिथि, चाडपर्व, सूर्योदय र पञ्चाङ्ग सहित। The Bikram Sambat month " +
  "with each day's tithi, festivals, sunrise and moonrise, and the full panchang — computed " +
  "sidereally, read at each day's own sunrise.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/patro" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/patro",
    type: "website",
    locale: "ne_NP",
  },
};

export default function Page() {
  return (
    <>
      <JsonLd json={graph([breadcrumbLd([{ name: "Nakhatra", path: "/" }, { name: "नेपाली पात्रो", path: "/patro" }])])} />
      <PatroPage />
    </>
  );
}
