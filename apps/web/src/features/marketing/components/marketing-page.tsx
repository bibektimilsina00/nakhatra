"use client";

import { AccuracySection } from "@/features/marketing/components/accuracy-section";
import { AskSection } from "@/features/marketing/components/ask-section";
import { AstrologersSection } from "@/features/marketing/components/astrologers-section";
import { CreateKundaliSection } from "@/features/marketing/components/create-kundali-section";
import { ChartSection } from "@/features/marketing/components/chart-section";
import { CloserSection } from "@/features/marketing/components/closer-section";
import { FaqSection } from "@/features/marketing/components/faq-section";
import { Hero } from "@/features/marketing/components/hero";
import { HowSection } from "@/features/marketing/components/how-section";
import { MilanSection } from "@/features/marketing/components/milan-section";
import { PlatformShowcase } from "@/features/marketing/components/platform-showcase";
import { ReadingSection } from "@/features/marketing/components/reading-section";
import { SiteFooter } from "@/features/marketing/components/site-footer";
import { SiteHeader } from "@/features/marketing/components/site-header";
import { useReveal } from "@/features/marketing/hooks/use-reveal";

/** The marketing site, in the order it is read. */
export function MarketingPage() {
  useReveal();

  return (
    <div className="bg-cream font-body text-ink antialiased">
      <SiteHeader />
      <Hero />
      <CreateKundaliSection />
      <PlatformShowcase />
      <ChartSection />
      <HowSection />
      <ReadingSection />
      <AskSection />
      <MilanSection />
      <AccuracySection />
      <AstrologersSection />
      <FaqSection />
      <CloserSection />
      <SiteFooter />
    </div>
  );
}
