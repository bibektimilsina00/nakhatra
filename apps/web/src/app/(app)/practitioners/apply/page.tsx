import { ApplyPage } from "@/features/practitioners/components/apply-page";
import {
  MARKETPLACE_LIVE,
  MarketplaceComingSoon,
} from "@/features/practitioners/marketplace";

export default function Page() {
  if (!MARKETPLACE_LIVE) return <MarketplaceComingSoon />;
  return <ApplyPage />;
}
