"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PractitionerDirectory } from "@/features/practitioners/components/directory";
import { useLatinTracking, useTranslation } from "@/lib/i18n/language-context";

/**
 * The astrologer marketplace, reading the real directory.
 *
 * Was five hardcoded profiles filtered in memory, labelled "preview" because a
 * fabricated professional with a rating and a price is something a visitor
 * would try to hire. The endpoint exists now, so the badge and the sample data
 * are gone; what is left is genuinely empty until someone is verified, and the
 * empty state says exactly that.
 */
export function JyotishSection() {
  const { t } = useTranslation();
  const label = useLatinTracking("uppercase tracking-[0.1em]");

  return (
    <section id="jyotish" className="mt-14 scroll-mt-24">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-white/[0.09] pb-3">
        <h2 className="text-[17px] font-bold text-paper">{t.dashJyotish}</h2>
        <Link
          href="/practitioners/apply"
          className={`inline-flex items-center gap-1.5 text-[11px] text-gold transition-colors hover:text-gold2 ${label}`}
        >
          {t.practApplyTitle}
          <ArrowRight className="size-3" />
        </Link>
      </div>

      <div className="mt-4">
        <PractitionerDirectory />
      </div>
    </section>
  );
}
