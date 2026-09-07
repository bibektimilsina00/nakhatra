import { PractitionerDesk } from "@/features/practitioners/components/practitioner-desk";
import {
  MARKETPLACE_LIVE,
  MarketplaceComingSoon,
} from "@/features/practitioners/marketplace";

export default function Page() {
  if (!MARKETPLACE_LIVE) return <MarketplaceComingSoon />;
  return <PractitionerDesk />;
}
