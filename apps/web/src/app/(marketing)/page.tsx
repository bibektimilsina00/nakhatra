import { JsonLd } from "@/components/seo/json-ld";
import { LandingRoute } from "@/features/marketing/components/landing-route";
import {
  applicationLd,
  faqLd,
  graph,
  organizationLd,
  websiteLd,
} from "@/lib/seo/structured-data";

export default function Page() {
  return (
    <>
      {/* One graph rather than four script tags: the nodes reference each other
          by `@id`, so the publisher of the site and the publisher of the app
          are understood to be the same organisation. */}
      <JsonLd json={graph([organizationLd(), websiteLd(), applicationLd(), faqLd()])} />
      <LandingRoute />
    </>
  );
}
