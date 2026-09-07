"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthHydrated, useSession } from "@/features/auth/hooks/use-auth";
import { MarketingPage } from "@/features/marketing/components/marketing-page";

/**
 * What `/` is, depending on who is asking.
 *
 * A signed-in visitor lands on their dashboard; everyone else gets the
 * marketing site. Someone who has already signed up does not need to be sold
 * the product again, and typing the bare domain is the most common way back
 * into an app.
 *
 * The first render is the marketing page for everybody — server and client
 * alike — because `persist` cannot hydrate before the first client render, and
 * a page whose first paint depends on localStorage either mismatches the
 * server's HTML or renders nothing for crawlers. So the redirect happens the
 * tick after hydration, and the marketing page is what a search engine sees.
 */
export function LandingRoute() {
  const hydrated = useAuthHydrated();
  const { isSignedIn } = useSession();
  const router = useRouter();

  const leaving = hydrated && isSignedIn;

  useEffect(() => {
    if (leaving) router.replace("/dashboard");
  }, [leaving, router]);

  // Not the marketing page, and not a blank white frame either: the ground the
  // dashboard is about to paint on, for the one tick the navigation takes.
  if (leaving) return <div className="min-h-dvh bg-ink" />;

  return <MarketingPage />;
}
