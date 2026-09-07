import { PractitionerProfile } from "@/features/practitioners/components/practitioner-profile";
import {
  MARKETPLACE_LIVE,
  MarketplaceComingSoon,
} from "@/features/practitioners/marketplace";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!MARKETPLACE_LIVE) return <MarketplaceComingSoon />;
  return <PractitionerProfile id={id} />;
}
