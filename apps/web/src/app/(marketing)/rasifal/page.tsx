import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { RasifalPage } from "@/features/rasifal/components/rasifal-page";
import { breadcrumbLd, graph } from "@/lib/seo/structured-data";

const TITLE = "आजको राशिफल · Aajako Rashifal · Today's Rasifal";
const DESCRIPTION =
  "आजको राशिफल — बाह्रै राशिको दैनिक फल, नेपालकै समयमा गोचरबाट गणना गरिएको। Today's " +
  "rasifal for all twelve signs, computed by gochara from Nepal's own time: murti nirnaya, " +
  "vedha and the transit houses, not a generated horoscope.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/rasifal" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/rasifal",
    type: "website",
    locale: "ne_NP",
  },
};

export default function Page() {
  return (
    <>
      <JsonLd json={graph([breadcrumbLd([{ name: "Nakhatra", path: "/" }, { name: "आजको राशिफल", path: "/rasifal" }])])} />
      <RasifalPage />
    </>
  );
}
