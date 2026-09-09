"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import { AppShell } from "@/features/dashboard/components/app-shell";
import { useLatinTracking, useTranslation } from "@/lib/i18n/language-context";

/**
 * Whether the human marketplace is open.
 *
 * The whole of it — directory, applications, the desk, consultations, calls —
 * is built and passing its tests, but it is not something to put in front of
 * people until there are practitioners on it and a payment rail behind it. One
 * constant, read at every entrance, so turning it on is one edit rather than a
 * hunt through six files for the links that were commented out.
 *
 * The API keeps serving these routes: this hides the doors, it is not a
 * permission. Nothing here decides who may do what.
 */
export const MARKETPLACE_LIVE = false;

/** What stands where a marketplace page would be while it is closed. */
export function MarketplaceComingSoon() {
  const { t } = useTranslation();
  const eyebrow = useLatinTracking("uppercase tracking-[0.2em]");

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[560px] px-5 pb-24 pt-24 sm:px-8">
        <div className="rounded-[14px] border border-white/[0.09] bg-panel p-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full border border-acc/25 text-acc">
            <Sparkles className="size-5" />
          </span>
          <span className={`mt-5 block text-[11px] text-acc ${eyebrow}`}>{t.practComingSoon}</span>
          <h1 className="mt-3 text-[22px] font-bold leading-tight text-fg">{t.dashJyotish}</h1>
          <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-[1.8] text-mut">
            {t.soonNote}
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-[9px] bg-acc px-5 py-2.5 text-[13px] font-semibold text-ink transition-colors hover:bg-acc2"
          >
            {t.dashNavHome}
          </Link>
        </div>
      </main>
    </AppShell>
  );
}
