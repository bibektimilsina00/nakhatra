import { ReviewQueuePage } from "@/features/practitioners/components/review-queue-page";
import {
  MARKETPLACE_LIVE,
  MarketplaceComingSoon,
} from "@/features/practitioners/marketplace";

export default function Page() {
  if (!MARKETPLACE_LIVE) return <MarketplaceComingSoon />;
  return <ReviewQueuePage />;
}
