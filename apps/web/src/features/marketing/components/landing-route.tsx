"use client";

import { MarketingPage } from "@/features/marketing/components/marketing-page";

/**
 * What `/` renders — the marketing homepage.
 *
 * Both signed-in and signed-out visitors reach this page normally.
 * Auth-aware CTAs (header, hero, closer) are handled inside MarketingPage's
 * own components so the page content adapts without forcing a navigation away
 * from `/`.
 */
export function LandingRoute() {
  return <MarketingPage />;
}
